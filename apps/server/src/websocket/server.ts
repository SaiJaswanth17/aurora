import { Server, ServerWebSocket } from 'bun';
import { WS_EVENTS, WS_CONFIG, User } from '@aurora/shared';
import { SupabaseClient } from '@supabase/supabase-js';
// jwt imported for future use
// import jwt from 'jsonwebtoken';
import { MessageHandler } from '../handlers/message-handler';
import { ConnectionHandler } from '../handlers/connection-handler';
import { PresenceHandler } from '../handlers/presence-handler';

interface WebSocketData {
  userId?: string;
  user?: User;
  channels: Set<string>;
  conversations: Set<string>;
  isAuthenticated: boolean;
  lastPing: number;
}

export class WebSocketServer {
  private server: Server<WebSocketData> | null = null;
  private port: number;
  private supabase: SupabaseClient;
  private connections: Map<string, ServerWebSocket<WebSocketData>> = new Map();
  private channels: Map<string, Set<ServerWebSocket<WebSocketData>>> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  
  private messageHandler: MessageHandler;
  private connectionHandler: ConnectionHandler;
  private presenceHandler: PresenceHandler;

  constructor(options: { port: number }) {
    this.port = options.port;
    
    this.supabase = new SupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.messageHandler = new MessageHandler(this.supabase, this);
    this.connectionHandler = new ConnectionHandler(this.supabase, this);
    this.presenceHandler = new PresenceHandler(this.supabase, this);
  }

  async start(): Promise<void> {
    this.server = Bun.serve<WebSocketData>({
      port: this.port,
      websocket: {
        open: (ws) => this.handleOpen(ws),
        message: (ws, message) => this.handleMessage(ws, message),
        close: (ws, code, reason) => this.handleClose(ws, code, reason),
        perMessageDeflate: true,
        idleTimeout: 60,
      },
      fetch: (req, server) => {
        if (server.upgrade(req, { data: { channels: new Set(), conversations: new Set(), isAuthenticated: false, lastPing: Date.now() } })) {
          return new Response('Upgraded', { status: 101 });
        }
        return new Response('WebSocket server', { status: 200 });
      },
    });

    this.startHeartbeat();
    
    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());
  }

  private handleOpen(ws: ServerWebSocket<WebSocketData>): void {
    console.log(`🔌 New connection: ${ws.remoteAddress}`);
    
    ws.data = {
      channels: new Set(),
      conversations: new Set(),
      isAuthenticated: false,
      lastPing: Date.now(),
    };

    // Send initial connection message
    ws.send(JSON.stringify({
      type: WS_EVENTS.AUTH_SUCCESS,
      payload: { message: 'Connected. Please authenticate.' }
    }));
  }

  private async handleMessage(
    ws: ServerWebSocket<WebSocketData>,
    message: string | Buffer
  ): Promise<void> {
    try {
      const data = JSON.parse(message.toString());
      
      if (!data.type) {
        ws.send(JSON.stringify({
          type: WS_EVENTS.ERROR,
          payload: { message: 'Message type is required' }
        }));
        return;
      }

      // Handle authentication
      if (data.type === WS_EVENTS.AUTH) {
        await this.connectionHandler.handleAuth(ws, data.payload);
        return;
      }

      // Require authentication for all other messages
      if (!ws.data.isAuthenticated) {
        ws.send(JSON.stringify({
          type: WS_EVENTS.ERROR,
          payload: { message: 'Authentication required' }
        }));
        return;
      }

      // Route message to appropriate handler
      switch (data.type) {
        case WS_EVENTS.MESSAGE:
          await this.messageHandler.handleChannelMessage(ws, data.payload);
          break;
        case WS_EVENTS.DM_MESSAGE:
          await this.messageHandler.handleDirectMessage(ws, data.payload);
          break;
        case WS_EVENTS.TYPING_START:
        case WS_EVENTS.TYPING_STOP:
          await this.presenceHandler.handleTyping(ws, data.type, data.payload);
          break;
        case WS_EVENTS.PRESENCE_UPDATE:
          await this.presenceHandler.handlePresenceUpdate(ws, data.payload);
          break;
        case WS_EVENTS.JOIN_CHANNEL:
          await this.connectionHandler.handleJoinChannel(ws, data.payload);
          break;
        case WS_EVENTS.LEAVE_CHANNEL:
          await this.connectionHandler.handleLeaveChannel(ws, data.payload);
          break;
        default:
          ws.send(JSON.stringify({
            type: WS_EVENTS.ERROR,
            payload: { message: `Unknown message type: ${data.type}` }
          }));
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({
        type: WS_EVENTS.ERROR,
        payload: { message: 'Internal server error' }
      }));
    }
  }

  private async handleClose(
    ws: ServerWebSocket<WebSocketData>,
    code: number,
    _reason: string
  ): Promise<void> {
    console.log(`🔌 Connection closed: ${ws.remoteAddress} (code: ${code})`);
    
    if (ws.data.userId) {
      // Update user status to offline
      await this.presenceHandler.setOffline(ws.data.userId);
      
      // Remove from connections
      this.connections.delete(ws.data.userId);
      
      // Remove from all channels
      ws.data.channels.forEach(channelId => {
        this.leaveChannel(ws, channelId);
      });
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      this.connections.forEach((ws, userId) => {
        if (now - ws.data.lastPing > WS_CONFIG.HEARTBEAT_INTERVAL * 2) {
          console.log(`💔 Connection timed out: ${userId}`);
          ws.close(1001, 'Heartbeat timeout');
        } else {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      });
    }, WS_CONFIG.HEARTBEAT_INTERVAL);
  }

  stop(): void {
    console.log('🛑 Stopping WebSocket server...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Close all connections gracefully
    this.connections.forEach((ws) => {
      ws.close(1000, 'Server shutting down');
    });
    
    this.server?.stop();
  }

  // Public methods for handlers
  addConnection(userId: string, ws: ServerWebSocket<WebSocketData>): void {
    this.connections.set(userId, ws);
  }

  getConnection(userId: string): ServerWebSocket<WebSocketData> | undefined {
    return this.connections.get(userId);
  }

  joinChannel(ws: ServerWebSocket<WebSocketData>, channelId: string): void {
    if (!this.channels.has(channelId)) {
      this.channels.set(channelId, new Set());
    }
    this.channels.get(channelId)!.add(ws);
    ws.data.channels.add(channelId);
  }

  leaveChannel(ws: ServerWebSocket<WebSocketData>, channelId: string): void {
    this.channels.get(channelId)?.delete(ws);
    ws.data.channels.delete(channelId);
  }

  broadcastToChannel(channelId: string, message: unknown, excludeUserId?: string): void {
    const channelConnections = this.channels.get(channelId);
    if (!channelConnections) return;

    const messageStr = JSON.stringify(message);
    channelConnections.forEach(ws => {
      if (!excludeUserId || ws.data.userId !== excludeUserId) {
        ws.send(messageStr);
      }
    });
  }

  broadcastToUser(userId: string, message: unknown): void {
    const ws = this.connections.get(userId);
    if (ws) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcastToAll(message: unknown, excludeUserId?: string): void {
    const messageStr = JSON.stringify(message);
    this.connections.forEach((ws, userId) => {
      if (!excludeUserId || userId !== excludeUserId) {
        ws.send(messageStr);
      }
    });
  }
}
