
import { User } from '@aurora/shared';

export interface WebSocketData {
    connectionId: string;
    userId?: string;
    user?: User;
    channels: Set<string>;
    conversations: Set<string>;
    isAuthenticated: boolean;
    lastPing: number;
}
