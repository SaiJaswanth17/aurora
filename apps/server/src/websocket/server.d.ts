import { ServerWebSocket } from 'bun';
import { User } from '@aurora/shared';
interface WebSocketData {
    userId?: string;
    user?: User;
    channels: Set<string>;
    conversations: Set<string>;
    isAuthenticated: boolean;
    lastPing: number;
}
export declare class WebSocketServer {
    private server;
    private port;
    private supabase;
    private connections;
    private channels;
    private heartbeatInterval;
    private messageHandler;
    private connectionHandler;
    private presenceHandler;
    constructor(options: {
        port: number;
    });
    start(): Promise<void>;
    private handleOpen;
    private handleMessage;
    private handleClose;
    private startHeartbeat;
    stop(): void;
    addConnection(userId: string, ws: ServerWebSocket<WebSocketData>): void;
    getConnection(userId: string): ServerWebSocket<WebSocketData> | undefined;
    joinChannel(ws: ServerWebSocket<WebSocketData>, channelId: string): void;
    leaveChannel(ws: ServerWebSocket<WebSocketData>, channelId: string): void;
    broadcastToChannel(channelId: string, message: unknown, excludeUserId?: string): void;
    broadcastToUser(userId: string, message: unknown): void;
    broadcastToAll(message: unknown, excludeUserId?: string): void;
}
export {};
//# sourceMappingURL=server.d.ts.map