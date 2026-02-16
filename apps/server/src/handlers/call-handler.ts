
import { ServerWebSocket } from 'bun';
import { IConnectionManager } from '../services/connection-manager';
import { WebSocketData } from '../types';

export class CallHandler {
    constructor(
        private connectionManager: IConnectionManager
    ) { }

    async handleCallSignal(
        ws: ServerWebSocket<WebSocketData>,
        payload: {
            type: 'offer' | 'answer' | 'candidate' | 'start' | 'end' | 'reject';
            targetUserId: string;
            data?: any
        }
    ): Promise<void> {
        const { type, targetUserId, data } = payload;

        if (!targetUserId) {
            console.error('Call signal missing targetUserId');
            return;
        }

        // Get connections for target user
        const connections = this.connectionManager.getConnectionsInScope({ userIds: [targetUserId] });

        if (connections.length === 0) {
            // User is offline or not connected
            if (type === 'start') {
                ws.send(JSON.stringify({
                    type: 'call:error',
                    payload: { message: 'User is offline' }
                }));
            }
            return;
        }

        // Forward the signal to the target user
        const signalMsg = {
            type: `call:${type}`,
            payload: {
                senderId: ws.data.userId,
                senderName: ws.data.user?.username,
                senderAvatar: ws.data.user?.avatarUrl,
                data
            }
        };

        connections.forEach(connId => {
            this.connectionManager.sendToConnection(connId, signalMsg);
        });

        console.log(`📡 Forwarded call:${type} from ${ws.data.userId} to ${targetUserId}`);
    }
}
