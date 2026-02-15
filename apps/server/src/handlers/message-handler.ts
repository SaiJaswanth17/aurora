import { ServerWebSocket } from 'bun';
import { SupabaseClient } from '@supabase/supabase-js';
import { WS_EVENTS } from '@aurora/shared';
import { IConnectionManager } from '../services/connection-manager';
import { WebSocketData } from '../types';

export class MessageHandler {
  constructor(
    private supabase: SupabaseClient,
    private connectionManager: IConnectionManager
  ) { }

  async handleChannelMessage(
    ws: ServerWebSocket<WebSocketData>,
    payload: { channelId: string; content: string; attachments?: string[] }
  ): Promise<void> {
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
        .eq('user_id', ws.data.userId!)
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
          author_id: ws.data.userId!,
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

      // Broadcast to all users in the channel via ConnectionManager
      const connections = this.connectionManager.getConnectionsInScope({ channelId });
      const broadcastMsg = {
        type: WS_EVENTS.NEW_MESSAGE,
        payload: message
      };

      connections.forEach(connId => {
        this.connectionManager.sendToConnection(connId, broadcastMsg);
      });

      console.log(`💬 New message in channel ${channelId} from ${ws.data.userId}. Broadcast to ${connections.length} connections.`);
    } catch (error) {
      console.error('Message handler error:', error);
      ws.send(JSON.stringify({
        type: WS_EVENTS.ERROR,
        payload: { message: 'Failed to send message' }
      }));
    }
  }

  async handleDirectMessage(
    ws: ServerWebSocket<WebSocketData>,
    payload: { conversationId: string; content: string; attachments?: string[] }
  ): Promise<void> {
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
        .eq('user_id', ws.data.userId!)
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
          author_id: ws.data.userId!,
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

      const targetUserIds = members?.map(m => m.user_id) || [];

      // Use ConnectionManager to find connections for these users
      const connections = this.connectionManager.getConnectionsInScope({ userIds: targetUserIds });
      const broadcastMsg = {
        type: WS_EVENTS.NEW_DM_MESSAGE,
        payload: message
      };

      connections.forEach(connId => {
        this.connectionManager.sendToConnection(connId, broadcastMsg);
      });

      console.log(`📩 New DM in conversation ${conversationId} from ${ws.data.userId}. Broadcast to ${connections.length} connections.`);
    } catch (error) {
      console.error('DM handler error:', error);
      ws.send(JSON.stringify({
        type: WS_EVENTS.ERROR,
        payload: { message: 'Failed to send direct message' }
      }));
    }
  }
}
