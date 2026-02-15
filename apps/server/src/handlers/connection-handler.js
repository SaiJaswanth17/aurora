import jwt from 'jsonwebtoken';
import { WS_EVENTS } from '@aurora/shared';
export class ConnectionHandler {
    supabase;
    server;
    constructor(supabase, server) {
        this.supabase = supabase;
        this.server = server;
    }
    async handleAuth(ws, payload) {
        try {
            // Verify JWT token
            const decoded = jwt.verify(payload.token, process.env.JWT_SECRET);
            const userId = decoded.sub;
            // Fetch user profile from Supabase
            const { data: profile, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error || !profile) {
                ws.send(JSON.stringify({
                    type: WS_EVENTS.AUTH_ERROR,
                    payload: { message: 'User not found' }
                }));
                return;
            }
            // Update user status to online
            await this.supabase
                .from('profiles')
                .update({ status: 'online' })
                .eq('id', userId);
            // Store user data
            ws.data.userId = userId;
            ws.data.user = profile;
            ws.data.isAuthenticated = true;
            // Add to connections
            this.server.addConnection(userId, ws);
            ws.send(JSON.stringify({
                type: WS_EVENTS.AUTH_SUCCESS,
                payload: { user: profile }
            }));
            console.log(`✅ User authenticated: ${profile.username} (${userId})`);
        }
        catch (error) {
            console.error('Auth error:', error);
            ws.send(JSON.stringify({
                type: WS_EVENTS.AUTH_ERROR,
                payload: { message: 'Invalid token' }
            }));
        }
    }
    async handleJoinChannel(ws, payload) {
        try {
            // Verify user is member of the server containing this channel
            const { data: channel, error } = await this.supabase
                .from('channels')
                .select('server_id')
                .eq('id', payload.channelId)
                .single();
            if (error || !channel) {
                ws.send(JSON.stringify({
                    type: WS_EVENTS.ERROR,
                    payload: { message: 'Channel not found' }
                }));
                return;
            }
            const { data: membership } = await this.supabase
                .from('server_members')
                .select('id')
                .eq('server_id', channel.server_id)
                .eq('user_id', ws.data.userId)
                .single();
            if (!membership) {
                ws.send(JSON.stringify({
                    type: WS_EVENTS.ERROR,
                    payload: { message: 'Not a member of this server' }
                }));
                return;
            }
            this.server.joinChannel(ws, payload.channelId);
            ws.send(JSON.stringify({
                type: WS_EVENTS.USER_JOINED_CHANNEL,
                payload: { channelId: payload.channelId }
            }));
            console.log(`📢 User ${ws.data.userId} joined channel ${payload.channelId}`);
        }
        catch (error) {
            console.error('Join channel error:', error);
            ws.send(JSON.stringify({
                type: WS_EVENTS.ERROR,
                payload: { message: 'Failed to join channel' }
            }));
        }
    }
    async handleLeaveChannel(ws, payload) {
        this.server.leaveChannel(ws, payload.channelId);
        ws.send(JSON.stringify({
            type: WS_EVENTS.USER_LEFT_CHANNEL,
            payload: { channelId: payload.channelId }
        }));
        console.log(`👋 User ${ws.data.userId} left channel ${payload.channelId}`);
    }
}
//# sourceMappingURL=connection-handler.js.map