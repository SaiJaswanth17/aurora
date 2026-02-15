'use client';

import { useEffect, useRef, useState } from 'react';
import { WS_EVENTS, WS_CONFIG, WebSocketEvent } from '@aurora/shared';
import { useAuth } from '@/lib/auth/auth-context';

interface WebSocketClientOptions {
  url: string;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private isDestroyed = false;
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();

  constructor(private options: WebSocketClientOptions) {}

  async connect(): Promise<void> {
    if (this.isConnecting || this.isDestroyed) return;

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.options.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.ws!.onopen = event => {
          clearTimeout(timeout);
          this.handleOpen(event);
          resolve();
        };

        this.ws!.onerror = error => {
          clearTimeout(timeout);
          reject(error);
        };
      });
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  private handleOpen(event: Event): void {
    console.log('🔌 WebSocket connected');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.emit('connected', null);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'ping') {
        this.send('pong');
        return;
      }

      this.emit(data.type, data.payload);
    } catch (error) {
      console.error('WebSocket message parsing error:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('🔌 WebSocket disconnected:', event.code, event.reason);
    this.ws = null;
    this.isConnecting = false;
    this.emit('disconnected', { code: event.code, reason: event.reason });

    if (!this.isDestroyed && this.reconnectAttempts < WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      this.scheduleReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('🔌 WebSocket error:', event);
    this.emit('error', { event });
  }

  private scheduleReconnect(): void {
    const delay = WS_CONFIG.RECONNECT_INTERVAL * Math.pow(2, this.reconnectAttempts);
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  send(type: string, payload?: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    const message = { type, payload };
    this.ws.send(JSON.stringify(message));
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const callbacks = this.listeners.get(event)!;
    callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  private emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  disconnect(): void {
    this.isDestroyed = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}
