import { ServerWebSocket } from 'bun';
import { SupabaseClient } from '@supabase/supabase-js';
import { WebSocketServer } from '../websocket/server';
interface WebSocketData {
    userId?: string;
    user?: any;
    channels: Set<string>;
    conversations: Set<string>;
    isAuthenticated: boolean;
    lastPing: number;
}
export declare class MessageHandler {
    private supabase;
    private server;
    constructor(supabase: SupabaseClient, server: WebSocketServer);
    handleChannelMessage(ws: ServerWebSocket<WebSocketData>, payload: {
        channelId: string;
        content: string;
        attachments?: string[];
    }): Promise<void>;
    handleDirectMessage(ws: ServerWebSocket<WebSocketData>, payload: {
        conversationId: string;
        content: string;
        attachments?: string[];
    }): Promise<void>;
}
export {};
//# sourceMappingURL=message-handler.d.ts.map