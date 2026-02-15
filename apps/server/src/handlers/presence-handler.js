import { WS_EVENTS } from '@aurora/shared';
export class PresenceHandler {
    supabase;
    server;
    typingUsers = new Map(); // channelId -> Set of userIds
    constructor(supabase, server) {
        this.supabase = supabase;
        this.server = server;
    }
    async handleTyping(ws, type, payload) {
        try {
            const { channelId } = payload;
            const userId = ws.data.userId;
            // Verify user is in the channel
            if (!ws.data.channels.has(channelId)) {
                return;
            }
            if (type === WS_EVENTS.TYPING_START) {
                if (!this.typingUsers.has(channelId)) {
                    this.typingUsers.set(channelId, new Set());
                }
                this.typingUsers.get(channelId).add(userId);
                // Broadcast typing to other users in channel
                this.server.broadcastToChannel(channelId, {
                    type: WS_EVENTS.USER_TYPING,
                    payload: {
                        channelId,
                        userId,
                        username: ws.data.user?.username
                    }
                }, userId);
                // Auto-stop typing after 5 seconds
                setTimeout(() => {
                    this.handleTyping(ws, WS_EVENTS.TYPING_STOP, payload);
                }, 5000);
            }
            else {
                this.typingUsers.get(channelId)?.delete(userId);
            }
        }
        catch (error) {
            console.error('Typing handler error:', error);
        }
    }
    async handlePresenceUpdate(ws, payload) {
        try {
            const { status } = payload;
            const userId = ws.data.userId;
            // Update in database
            await this.supabase
                .from('profiles')
                .update({ status })
                .eq('id', userId);
            // Broadcast to relevant users (friends, server members)
            // For now, broadcast to all (can be optimized)
            this.server.broadcastToAll({
                type: WS_EVENTS.PRESENCE_UPDATE_BROADCAST,
                payload: {
                    userId,
                    status
                }
            }, userId);
            console.log(`🟢 User ${userId} status updated to ${status}`);
        }
        catch (error) {
            console.error('Presence update error:', error);
        }
    }
    async setOffline(userId) {
        try {
            await this.supabase
                .from('profiles')
                .update({ status: 'offline' })
                .eq('id', userId);
            this.server.broadcastToAll({
                type: WS_EVENTS.PRESENCE_UPDATE_BROADCAST,
                payload: {
                    userId,
                    status: 'offline'
                }
            });
            console.log(`⚫ User ${userId} is now offline`);
        }
        catch (error) {
            console.error('Set offline error:', error);
        }
    }
}
//# sourceMappingURL=presence-handler.js.map