import { ServerWebSocket } from 'bun';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@aurora/shared';
import { WebSocketServer } from '../websocket/server';
interface WebSocketData {
    userId?: string;
    user?: User;
    channels: Set<string>;
    conversations: Set<string>;
    isAuthenticated: boolean;
    lastPing: number;
}
export declare class ConnectionHandler {
    private supabase;
    private server;
    constructor(supabase: SupabaseClient, server: WebSocketServer);
    handleAuth(ws: ServerWebSocket<WebSocketData>, payload: {
        token: string;
    }): Promise<void>;
    handleJoinChannel(ws: ServerWebSocket<WebSocketData>, payload: {
        channelId: string;
    }): Promise<void>;
    handleLeaveChannel(ws: ServerWebSocket<WebSocketData>, payload: {
        channelId: string;
    }): Promise<void>;
}
export {};
//# sourceMappingURL=connection-handler.d.ts.map