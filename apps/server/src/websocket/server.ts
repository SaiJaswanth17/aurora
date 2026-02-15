
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Server } from 'bun';
import { AuthenticationLayer } from '../services/authentication-layer';
import { ConnectionManager } from '../services/connection-manager';
import { PresenceManager } from '../services/presence-manager';
import { RateLimiter } from '../services/rate-limiter';
import { WebSocketService } from '../services/websocket-service';
import { MessageHandler } from '../handlers/message-handler';
import { WebSocketData } from '../types';

// Fix for Timer type not being globally visible in Bun/TS setup
type Timer = ReturnType<typeof setInterval>;

export class WebSocketServer {
  private supabase: SupabaseClient;
  private wsService: WebSocketService;
  private serverInstance?: Server<WebSocketData>;
  private heartbeatInterval: Timer;

  constructor() {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    // Initialize Services
    const connectionManager = new ConnectionManager();
    const rateLimiter = new RateLimiter();
    const authLayer = new AuthenticationLayer(this.supabase);
    const presenceManager = new PresenceManager(connectionManager, this.supabase);
    const messageHandler = new MessageHandler(this.supabase, connectionManager);

    this.wsService = new WebSocketService(
      authLayer,
      connectionManager,
      presenceManager,
      rateLimiter,
      messageHandler,
      this.supabase
    );

    // Setup periodic tasks
    this.heartbeatInterval = setInterval(() => {
      presenceManager.checkHeartbeats();
    }, 30000);
  }

  public start(port: number = 3002) {
    console.log(`Starting WebSocket server on port ${port}...`);

    this.serverInstance = Bun.serve<WebSocketData>({
      port,
      fetch(req, server) {
        const url = new URL(req.url);
        if (url.pathname === '/ws') {
          const success = server.upgrade(req, {
            data: {
              connectionId: '', // Will be replaced in handleOpen
              channels: new Set(),
              conversations: new Set(),
              isAuthenticated: false,
              lastPing: Date.now()
            }
          });
          return success ? undefined : new Response('Upgrade failed', { status: 500 });
        }
        return new Response('Aurora WebSocket Server Running', { status: 200 });
      },
      websocket: {
        open: (ws) => this.wsService.handleOpen(ws),
        message: (ws, message) => this.wsService.handleMessage(ws, message),
        close: (ws) => this.wsService.handleClose(ws),
        drain: (_ws) => { /* Handle backpressure if needed */ }
      }
    });

    console.log(`WebSocket server listening on ws://localhost:${this.serverInstance.port}/ws`);
  }

  public stop() {
    console.log('Stopping WebSocket server...');
    if (this.serverInstance) {
      this.serverInstance.stop();
    }
    clearInterval(this.heartbeatInterval);
  }
}
