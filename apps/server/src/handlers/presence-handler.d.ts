import { ServerWebSocket } from 'bun';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserStatus } from '@aurora/shared';
import { WebSocketServer } from '../websocket/server';
interface WebSocketData {
    userId?: string;
    user?: any;
    channels: Set<string>;
    conversations: Set<string>;
    isAuthenticated: boolean;
    lastPing: number;
}
export declare class PresenceHandler {
    private supabase;
    private server;
    private typingUsers;
    constructor(supabase: SupabaseClient, server: WebSocketServer);
    handleTyping(ws: ServerWebSocket<WebSocketData>, type: string, payload: {
        channelId: string;
    }): Promise<void>;
    handlePresenceUpdate(ws: ServerWebSocket<WebSocketData>, payload: {
        status: UserStatus;
    }): Promise<void>;
    setOffline(userId: string): Promise<void>;
}
export {};
//# sourceMappingURL=presence-handler.d.ts.map