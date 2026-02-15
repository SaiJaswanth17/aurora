
import { SupabaseClient } from '@supabase/supabase-js';
import { ConnectionId, UserId } from './authentication-layer';
import { IConnectionManager } from './connection-manager';

export interface IPresenceManager {
    updateHeartbeat(connectionId: ConnectionId): void;
    checkHeartbeats(): Promise<void>;
    updateUserStatus(userId: UserId, status: 'online' | 'offline' | 'away'): Promise<void>;
    removeConnection(connectionId: ConnectionId): void; // Cleanup heartbeat map
}

export class PresenceManager implements IPresenceManager {
    private lastHeartbeat = new Map<ConnectionId, number>();

    constructor(
        private connectionManager: IConnectionManager,
        private supabase: SupabaseClient,
        private timeoutMs: number = 30000,
        private getTime: () => number = Date.now
    ) { }

    updateHeartbeat(connectionId: ConnectionId): void {
        this.lastHeartbeat.set(connectionId, this.getTime());
    }

    removeConnection(connectionId: ConnectionId): void {
        this.lastHeartbeat.delete(connectionId);
    }

    async checkHeartbeats(): Promise<void> {
        const now = this.getTime();
        const staleConnections: ConnectionId[] = [];

        for (const [connId, last] of this.lastHeartbeat) {
            if (now - last > this.timeoutMs) {
                staleConnections.push(connId);
            }
        }

        // Process stale connections
        for (const connId of staleConnections) {
            const conn = this.connectionManager.getConnection(connId);
            if (conn) {
                try {
                    conn.close(4008, 'Heartbeat timeout'); // 4008: Policy Violation (or similar)
                } catch (e) {
                    // Ignore close errors
                }
            }
            this.lastHeartbeat.delete(connId);

            // ConnectionManager.removeConnection should be called by ws.on('close') handler somewhere else.
            // But we can force it here?
            // Ideally, we rely on event listener.
            // But if close() is sync/async, we might want to ensure cleanup.
            // For now, rely on standard close flow.
        }
    }

    async updateUserStatus(userId: UserId, status: 'online' | 'offline' | 'away'): Promise<void> {
        try {
            await this.supabase
                .from('profiles')
                .update({ status, last_seen: new Date().toISOString() }) // Use real date for DB
                .eq('id', userId);
        } catch (error) {
            console.error(`Failed to update status for ${userId}:`, error);
        }
    }
}
