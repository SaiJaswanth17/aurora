
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WebSocketClient } from './websocket-client';
import { useAuth } from '@/lib/auth/auth-context';

interface WebSocketContextType {
  client: WebSocketClient | null;
  isConnected: boolean;
  send: (type: string, payload?: unknown) => void;
  on: (event: string, callback: (data: unknown) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (client) {
        client.disconnect();
        setClient(null);
        setIsConnected(false);
      }
      return;
    }

    let wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002';

    // Ensure /ws path is appended
    if (!wsUrl.endsWith('/ws')) {
      wsUrl = wsUrl.replace(/\/$/, '') + '/ws';
    }

    // Handle relative URLs for proxying (e.g. /api/socket)
    if (wsUrl.startsWith('/')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}${wsUrl}`;
    }

    const newClient = new WebSocketClient({ url: wsUrl });

    // Set up event listeners
    const unsubscribeConnected = newClient.on('connected', () => {
      console.log('WebSocket connected to server');
      setIsConnected(true);
    });

    const unsubscribeDisconnected = newClient.on('disconnected', () => {
      console.log('WebSocket disconnected from server');
      setIsConnected(false);
    });

    const unsubscribeError = newClient.on('error', data => {
      console.error('WebSocket error:', data);
      setIsConnected(false);
    });

    const unsubscribeAuthSuccess = newClient.on('auth_success', () => {
      console.log('WebSocket authentication successful');
    });

    const unsubscribeAuthError = newClient.on('auth_error', data => {
      console.error('WebSocket authentication error:', data);
    });

    // Initialize connection with token
    (async () => {
      try {
        const { createClient } = await import('../supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
          await newClient.connect(session.access_token);
        } else {
          console.warn('No session token found, connecting without auth');
          await newClient.connect();
        }
      } catch (err) {
        console.error('Failed to initialize WebSocket connection:', err);
      }
    })();

    setClient(newClient);

    // Cleanup
    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeError();
      unsubscribeAuthSuccess();
      unsubscribeAuthError();
      newClient.disconnect();
    };
  }, [isAuthenticated, user]);

  const send = (type: string, payload?: unknown) => {
    if (client) {
      client.send(type, payload);
    }
  };

  const on = (event: string, callback: (data: unknown) => void) => {
    if (client) {
      return client.on(event, callback);
    }
    return () => { };
  };

  const value: WebSocketContextType = {
    client,
    isConnected,
    send,
    on,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export { WebSocketClient };
