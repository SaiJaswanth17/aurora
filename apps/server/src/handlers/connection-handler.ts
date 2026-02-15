import { ServerWebSocket } from 'bun';
import { SupabaseClient } from '@supabase/supabase-js';
import { WS_EVENTS, User } from '@aurora/shared';
import { WebSocketServer } from '../websocket/server';

interface WebSocketData {
  userId?: string;
  user?: User;
  channels: Set<string>;
  conversations: Set<string>;
  isAuthenticated: boolean;
  lastPing: number;
}

export class ConnectionHandler {
  constructor(
    private supabase: SupabaseClient,
    private server: WebSocketServer
  ) { }

  async handleAuth(
    ws: ServerWebSocket<WebSocketData>,
    payload: { token: string }
  ): Promise<void> {
    try {
      // Verify token with Supabase
      const { data: { user: authUser }, error: authError } = await this.supabase.auth.getUser(payload.token);

      if (authError || !authUser) {
        throw new Error(authError?.message || 'Unauthorized');
      }

      const userId = authUser.id;

      // Fetch user profile from Supabase
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('id, username, avatar_url, status, custom_status, created_at')
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

      const formattedUser: User = {
        id: profile.id,
        username: profile.username || 'Unknown',
        avatarUrl: profile.avatar_url,
        status: 'online',
        customStatus: profile.custom_status,
        createdAt: profile.created_at,
      };

      // Store user data
      ws.data.userId = userId;
      ws.data.user = formattedUser;
      ws.data.isAuthenticated = true;

      // Add to connections
      this.server.addConnection(userId, ws);

      ws.send(JSON.stringify({
        type: WS_EVENTS.AUTH_SUCCESS,
        payload: { user: formattedUser }
      }));

      console.log(`✅ User authenticated: ${profile.username} (${userId})`);
    } catch (error) {
      console.error('Auth error:', error);
      ws.send(JSON.stringify({
        type: WS_EVENTS.AUTH_ERROR,
        payload: { message: 'Invalid token' }
      }));
    }
  }

  async handleJoinChannel(
    ws: ServerWebSocket<WebSocketData>,
    payload: { channelId: string }
  ): Promise<void> {
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
        .eq('user_id', ws.data.userId!)
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
    } catch (error) {
      console.error('Join channel error:', error);
      ws.send(JSON.stringify({
        type: WS_EVENTS.ERROR,
        payload: { message: 'Failed to join channel' }
      }));
    }
  }

  async handleLeaveChannel(
    ws: ServerWebSocket<WebSocketData>,
    payload: { channelId: string }
  ): Promise<void> {
    this.server.leaveChannel(ws, payload.channelId);

    ws.send(JSON.stringify({
      type: WS_EVENTS.USER_LEFT_CHANNEL,
      payload: { channelId: payload.channelId }
    }));

    console.log(`👋 User ${ws.data.userId} left channel ${payload.channelId}`);
  }
}
