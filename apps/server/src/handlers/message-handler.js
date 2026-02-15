import { WS_EVENTS } from '@aurora/shared';
export class MessageHandler {
    supabase;
    server;
    constructor(supabase, server) {
        this.supabase = supabase;
        this.server = server;
    }
    async handleChannelMessage(ws, payload) {
        try {
            const { channelId, content, attachments = [] } = payload;
            // Validate message
            if (!content || content.trim().length === 0) {
                ws.send(JSON.stringify({
                    type: WS_EVENTS.ERROR,
                    payload: { message: 'Message content cannot be empty' }
                }));
                return;
            }
            if (content.length > 2000) {
                ws.send(JSON.stringify({
                    type: WS_EVENTS.ERROR,
                    payload: { message: 'Message too long (max 2000 characters)' }
                }));
                return;
            }
            // Verify user is member of the channel's server
            const { data: channel } = await this.supabase
                .from('channels')
                .select('server_id')
                .eq('id', channelId)
                .single();
            if (!channel) {
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
                    payload: { message: 'Not authorized to post in this channel' }
                }));
                return;
            }
            // Save message to database
            const { data: message, error } = await this.supabase
                .from('messages')
                .insert({
                channel_id: channelId,
                author_id: ws.data.userId,
                content: content.trim(),
                attachments: attachments
            })
                .select('*, author:profiles(*)')
                .single();
            if (error) {
                console.error('Database error:', error);
                ws.send(JSON.stringify({
                    type: WS_EVENTS.ERROR,
                    payload: { message: 'Failed to save message' }
                }));
                return;
            }
            // Broadcast to all users in the channel
            this.server.broadcastToChannel(channelId, {
                type: WS_EVENTS.NEW_MESSAGE,
                payload: message
            });
            console.log(`💬 New message in channel ${channelId} from ${ws.data.userId}`);
        }
        catch (error) {
            console.error('Message handler error:', error);
            ws.send(JSON.stringify({
                type: WS_EVENTS.ERROR,
                payload: { message: 'Failed to send message' }
            }));
        }
    }
    async handleDirectMessage(ws, payload) {
        try {
            const { conversationId, content, attachments = [] } = payload;
            // Validate message
            if (!content || content.trim().length === 0) {
                ws.send(JSON.stringify({
                    type: WS_EVENTS.ERROR,
                    payload: { message: 'Message content cannot be empty' }
                }));
                return;
            }
            // Verify user is member of the conversation
            const { data: membership } = await this.supabase
                .from('conversation_members')
                .select('id')
                .eq('conversation_id', conversationId)
                .eq('user_id', ws.data.userId)
                .single();
            if (!membership) {
                ws.send(JSON.stringify({
                    type: WS_EVENTS.ERROR,
                    payload: { message: 'Not a member of this conversation' }
                }));
                return;
            }
            // Save message to database
            const { data: message, error } = await this.supabase
                .from('dm_messages')
                .insert({
                conversation_id: conversationId,
                author_id: ws.data.userId,
                content: content.trim(),
                attachments: attachments
            })
                .select('*, author:profiles(*)')
                .single();
            if (error) {
                console.error('Database error:', error);
                ws.send(JSON.stringify({
                    type: WS_EVENTS.ERROR,
                    payload: { message: 'Failed to save message' }
                }));
                return;
            }
            // Get all members of the conversation to notify
            const { data: members } = await this.supabase
                .from('conversation_members')
                .select('user_id')
                .eq('conversation_id', conversationId);
            // Broadcast to all conversation members
            members?.forEach(member => {
                this.server.broadcastToUser(member.user_id, {
                    type: WS_EVENTS.NEW_DM_MESSAGE,
                    payload: message
                });
            });
            console.log(`📩 New DM in conversation ${conversationId} from ${ws.data.userId}`);
        }
        catch (error) {
            console.error('DM handler error:', error);
            ws.send(JSON.stringify({
                type: WS_EVENTS.ERROR,
                payload: { message: 'Failed to send direct message' }
            }));
        }
    }
}
//# sourceMappingURL=message-handler.js.map