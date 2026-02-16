
import { ServerWebSocket } from 'bun';
import { SupabaseClient } from '@supabase/supabase-js';
import { WS_EVENTS } from '@aurora/shared';
import { randomUUID } from 'crypto';

import { IAuthenticationLayer } from './authentication-layer';
import { IConnectionManager } from './connection-manager';
import { IPresenceManager } from './presence-manager';
import { IRateLimiter } from './rate-limiter';
import { MessageHandler } from '../handlers/message-handler';
import { WebSocketData } from '../types';

import {
    authSchema,
    messageSchema,
    typingSchema,
    joinLeaveSchema,
    socketMessageSchema
} from '../validation/schemas';

export class WebSocketService {
    constructor(
        private authLayer: IAuthenticationLayer,
        private connectionManager: IConnectionManager,
        private presenceManager: IPresenceManager,
        private rateLimiter: IRateLimiter,
        private messageHandler: MessageHandler,
        private supabase: SupabaseClient
    ) { }

    handleOpen(ws: ServerWebSocket<WebSocketData>) {
        ws.data = {
            userId: undefined,
            user: undefined,
            channels: new Set(),
            conversations: new Set(),
            isAuthenticated: false,
            lastPing: Date.now(),
            connectionId: randomUUID()
        };

        this.connectionManager.registerConnection(ws as any);
        console.log(`🔌 Connection opened: ${ws.data.connectionId}`);
    }

    async handleMessage(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
        this.presenceManager.updateHeartbeat(ws.data.connectionId);

        try {
            const raw = typeof message === 'string' ? message : message.toString();
            let data: any;
            try {
                data = JSON.parse(raw);
            } catch (e) { return; }

            if (data.type === 'ping') {
                try { ws.send(JSON.stringify({ type: 'pong' })); } catch (e) { }
                return;
            }

            const parsed = socketMessageSchema.safeParse(data);
            if (!parsed.success) return;

            const { type, payload } = parsed.data;

            if (type === WS_EVENTS.AUTH) {
                await this.handleAuth(ws, payload);
                return;
            }

            // Require Auth
            try {
                this.authLayer.requireAuth(ws.data);
            } catch (e) {
                ws.send(JSON.stringify({
                    type: WS_EVENTS.AUTH_ERROR,
                    payload: { message: 'Authentication required' }
                }));
                return;
            }

            // Rate Limiting
            const allowed = await this.rateLimiter.checkLimit(ws.data.userId!);
            if (!allowed) {
                const retryAfter = await this.rateLimiter.getRetryAfter(ws.data.userId!);
                ws.send(JSON.stringify({
                    type: WS_EVENTS.ERROR,
                    payload: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many messages', retryAfter }
                }));
                return;
            }
            await this.rateLimiter.recordMessage(ws.data.userId!);

            // Dispatch
            switch (type) {
                case WS_EVENTS.MESSAGE:
                    if (messageSchema.safeParse(payload).success) {
                        await this.messageHandler.handleChannelMessage(ws, payload);
                    }
                    break;

                case WS_EVENTS.DM_MESSAGE:
                    if (messageSchema.safeParse(payload).success) {
                        await this.messageHandler.handleDirectMessage(ws, payload);
                    }
                    break;

                case WS_EVENTS.JOIN_CHANNEL:
                    if (joinLeaveSchema.safeParse(payload).success) {
                        await this.handleJoinChannel(ws, payload);
                    }
                    break;

                case WS_EVENTS.LEAVE_CHANNEL:
                    if (joinLeaveSchema.safeParse(payload).success) {
                        await this.handleLeaveChannel(ws, payload);
                    }
                    break;

                case WS_EVENTS.JOIN_CONVERSATION:
                    if (joinLeaveSchema.safeParse(payload).success) {
                        await this.handleJoinConversation(ws, payload);
                    }
                    break;

                case WS_EVENTS.LEAVE_CONVERSATION:
                    if (joinLeaveSchema.safeParse(payload).success) {
                        await this.handleLeaveConversation(ws, payload);
                    }
                    break;

                case WS_EVENTS.TYPING_START:
                    {
                        const typingPayload = { ...payload, isTyping: true };
                        if (typingSchema.safeParse(typingPayload).success) {
                            await this.handleTyping(ws, typingPayload);
                        }
                        break;
                    }

                case WS_EVENTS.TYPING_STOP:
                    {
                        const typingPayload = { ...payload, isTyping: false };
                        if (typingSchema.safeParse(typingPayload).success) {
                            await this.handleTyping(ws, typingPayload);
                        }
                        break;
                    }
            }

        } catch (error) {
            console.error('WebSocket Error:', error);
        }
    }

    async handleClose(ws: ServerWebSocket<WebSocketData>) {
        const { connectionId, userId } = ws.data;
        this.connectionManager.removeConnection(connectionId);
        this.presenceManager.removeConnection(connectionId);

        if (userId) {
            const active = this.connectionManager.getConnectionsInScope({ userIds: [userId] });
            if (active.length === 0) {
                await this.presenceManager.updateUserStatus(userId, 'offline');
                console.log(`User ${userId} went offline`);
                this.broadcastPresence(userId, 'offline');
            }
        }
        console.log(`🔌 Connection closed: ${connectionId}`);
    }

    // --- Private Handlers ---

    private async handleAuth(ws: ServerWebSocket<WebSocketData>, payload: any) {
        console.log('🔐 Auth attempt received, payload:', payload);

        const parsed = authSchema.safeParse(payload);
        if (!parsed.success) {
            console.error('❌ Auth validation failed:', parsed.error);
            ws.send(JSON.stringify({ type: WS_EVENTS.AUTH_ERROR, payload: { message: 'Invalid payload' } }));
            return;
        }

        console.log('✅ Auth payload validated, token length:', parsed.data.token?.length);

        try {
            const user = await this.authLayer.validateToken(parsed.data.token);
            console.log('✅ User authenticated:', user.id, user.username);

            ws.data.user = user;
            ws.data.userId = user.id;
            ws.data.isAuthenticated = true;

            this.connectionManager.setAuthenticatedUser(ws.data.connectionId, user.id);
            await this.presenceManager.updateUserStatus(user.id, 'online');
            this.broadcastPresence(user.id, 'online');

            ws.send(JSON.stringify({ type: WS_EVENTS.AUTH_SUCCESS, payload: { user } }));
            console.log('✅ Auth success sent to client');
        } catch (e: any) {
            console.error('❌ Auth error:', e.message, e.code);
            ws.send(JSON.stringify({
                type: WS_EVENTS.AUTH_ERROR,
                payload: { message: e.message || 'Authentication failed', code: e.code }
            }));
        }
    }

    private broadcastPresence(userId: string, status: string) {
        // Broadcast to all connected users
        this.connectionManager.broadcastToAll({
            type: WS_EVENTS.PRESENCE_UPDATE_BROADCAST,
            payload: { userId, status }
        });
    }

    private async handleJoinChannel(ws: ServerWebSocket<WebSocketData>, payload: { channelId?: string }) {
        if (!payload.channelId) return;

        try {
            const { data: channel } = await this.supabase
                .from('channels')
                .select('server_id')
                .eq('id', payload.channelId)
                .single();

            if (!channel) return;

            const { data: member } = await this.supabase
                .from('server_members')
                .select('id')
                .eq('server_id', channel.server_id)
                .eq('user_id', ws.data.userId!)
                .single();

            if (!member) {
                ws.send(JSON.stringify({ type: WS_EVENTS.ERROR, payload: { message: 'Not authorized' } }));
                return;
            }

            this.connectionManager.joinChannel(ws.data.userId!, payload.channelId);
            ws.data.channels.add(payload.channelId);
        } catch (e) {
            console.error('Join Channel error', e);
        }
    }

    private async handleLeaveChannel(ws: ServerWebSocket<WebSocketData>, payload: { channelId?: string }) {
        if (!payload.channelId) return;
        this.connectionManager.leaveChannel(ws.data.userId!, payload.channelId);
        ws.data.channels.delete(payload.channelId);
    }

    private async handleJoinConversation(ws: ServerWebSocket<WebSocketData>, payload: { conversationId?: string }) {
        if (!payload.conversationId) return;

        try {
            const { data: participation } = await this.supabase
                .from('conversation_members')
                .select('conversation_id')
                .eq('conversation_id', payload.conversationId)
                .eq('user_id', ws.data.userId!)
                .single();

            if (!participation) {
                ws.send(JSON.stringify({ type: WS_EVENTS.ERROR, payload: { message: 'Not authorized to join conversation' } }));
                return;
            }

            this.connectionManager.joinConversation(ws.data.userId!, payload.conversationId);
            ws.data.conversations.add(payload.conversationId);
        } catch (e) {
            console.error('Join Conversation error', e);
        }
    }

    private async handleLeaveConversation(ws: ServerWebSocket<WebSocketData>, payload: { conversationId?: string }) {
        if (!payload.conversationId) return;
        this.connectionManager.leaveConversation(ws.data.userId!, payload.conversationId);
        ws.data.conversations.delete(payload.conversationId);
    }

    private async handleTyping(ws: ServerWebSocket<WebSocketData>, payload: { channelId?: string, conversationId?: string, isTyping: boolean }) {
        const { channelId, conversationId, isTyping } = payload;

        if (channelId && !ws.data.channels.has(channelId)) return;
        if (conversationId && !ws.data.conversations.has(conversationId)) return;

        const connections = this.connectionManager.getConnectionsInScope({ channelId, conversationId });

        const broadcastMsg = {
            type: WS_EVENTS.USER_TYPING,
            payload: {
                userId: ws.data.userId,
                channelId,
                conversationId,
                isTyping
            }
        };

        connections.forEach(connId => {
            if (connId !== ws.data.connectionId) {
                this.connectionManager.sendToConnection(connId, broadcastMsg);
            }
        });
    }
}
