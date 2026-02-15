
import { WebSocketData } from '../types';
import { UserId, ConnectionId } from './authentication-layer';

export type ChannelId = string;
export type ConversationId = string;

export interface WebSocketConnection {
    data: WebSocketData;
    send(data: string): void;
    close(code?: number, reason?: string): void;
}

export interface IConnectionManager {
    registerConnection(conn: WebSocketConnection): void;
    removeConnection(connectionId: ConnectionId): void;
    setAuthenticatedUser(connectionId: ConnectionId, userId: UserId): void;

    joinChannel(userId: UserId, channelId: ChannelId): void;
    leaveChannel(userId: UserId, channelId: ChannelId): void;

    joinConversation(userId: UserId, conversationId: ConversationId): void;
    leaveConversation(userId: UserId, conversationId: ConversationId): void;

    getConnectionsInScope(scope: { channelId?: ChannelId, conversationId?: ConversationId, userIds?: UserId[] }): ConnectionId[];

    // Access methods for testing/sending
    getConnection(connectionId: ConnectionId): WebSocketConnection | undefined;
    sendToConnection(connectionId: ConnectionId, message: any): void;
}

export class ConnectionManager implements IConnectionManager {
    // Indices
    private userChannels = new Map<UserId, Set<ChannelId>>();
    private channelUsers = new Map<ChannelId, Set<UserId>>();

    private userConversations = new Map<UserId, Set<ConversationId>>();
    private conversationUsers = new Map<ConversationId, Set<UserId>>();

    private connectionUser = new Map<ConnectionId, UserId>();
    private userConnections = new Map<UserId, Set<ConnectionId>>();

    // Connections storage
    private activeConnections = new Map<ConnectionId, WebSocketConnection>();

    registerConnection(conn: WebSocketConnection): void {
        const { connectionId } = conn.data;
        this.activeConnections.set(connectionId, conn);
    }

    setAuthenticatedUser(connectionId: ConnectionId, userId: UserId): void {
        const conn = this.activeConnections.get(connectionId);
        if (!conn) return; // Or throw?

        // Update mappings
        this.connectionUser.set(connectionId, userId);

        let userConns = this.userConnections.get(userId);
        if (!userConns) {
            userConns = new Set();
            this.userConnections.set(userId, userConns);
        }
        userConns.add(connectionId);
    }

    removeConnection(connectionId: ConnectionId): void {
        const userId = this.connectionUser.get(connectionId);

        // Remove from active connections
        this.activeConnections.delete(connectionId);
        this.connectionUser.delete(connectionId);

        if (userId) {
            // Remove from user connections
            const userConns = this.userConnections.get(userId);
            if (userConns) {
                userConns.delete(connectionId);
                if (userConns.size === 0) {
                    this.userConnections.delete(userId);

                    // Cleanup subscriptions since user has no active connections?
                    // Design requirement: "WHEN a user's connection closes ... remove them from all conversation subscriber lists"
                    // Wait. If user has multiple devices, closing one shouldn't unsubscribe user from channels on other device?
                    // But subscription maps user -> channels.
                    // If one connection closes, user is still online on other.
                    // Subscriptions are per session usually? Or per user?
                    // Design Doc: "Maps userId to set of channelIds".
                    // This implies per-User subscription.
                    // If shared across devices.
                    // Req 5.4: "WHEN a user's connection closes, THEN THE WebSocket_Server SHALL automatically remove them from all conversation subscriber lists"
                    // If it means "When LAST connection closes"?
                    // Or implies subscription is per connection actually?
                    // If per connection, then map should be ConnectionId -> Set<ChannelId>.
                    // But design says UserId -> Set<ChannelId>.

                    // Let's assume subscriptions persist as long as User has at least one connection?
                    // Or strictly follow req 5.4 which might imply immediate removal.
                    // "remove THE USER".
                    // If user has other connection, typically we want synchronization.
                    // But typical chat app (Discord): subscriptions are per-socket (Gateway connection).
                    // If I open 2 tabs, each tab subscribes to current channel.
                    // If I close tab 1, tab 2 stays subscribed to its channel.
                    // They might differ.

                    // Design doc defines: `userChannels: Map<UserId, Set<ChannelId>>`.
                    // This implies ALL user's connections execute concurrently viewing same channels?
                    // Or logic flaw in design?
                    // If I assume "Connection = User Session", then User -> Channels means for THIS session.
                    // But multiple connections per user is explicitly supported (Req 3.5 support multiple connections).

                    // If I use UserId -> Channels, then closing one connection of many:
                    // Should I unsubscribe?
                    // Only if no connections left.

                    this.cleanupUserSubscriptions(userId);
                }
            }
        }
    }

    // Private cleanup method
    private cleanupUserSubscriptions(userId: UserId) {
        // Only run if user has no connections left?
        if (this.userConnections.has(userId)) return;

        // Remove from channels
        const channels = this.userChannels.get(userId);
        if (channels) {
            channels.forEach(channelId => {
                const users = this.channelUsers.get(channelId);
                if (users) {
                    users.delete(userId);
                    if (users.size === 0) this.channelUsers.delete(channelId);
                }
            });
            this.userChannels.delete(userId);
        }

        // Remove from conversations
        const conversations = this.userConversations.get(userId);
        if (conversations) {
            conversations.forEach(conversationId => {
                const users = this.conversationUsers.get(conversationId);
                if (users) {
                    users.delete(userId);
                    if (users.size === 0) this.conversationUsers.delete(conversationId);
                }
            });
            this.userConversations.delete(userId);
        }
    }

    joinChannel(userId: UserId, channelId: ChannelId): void {
        // User -> Channels
        let channels = this.userChannels.get(userId);
        if (!channels) {
            channels = new Set();
            this.userChannels.set(userId, channels);
        }
        channels.add(channelId);

        // Channel -> Users
        let users = this.channelUsers.get(channelId);
        if (!users) {
            users = new Set();
            this.channelUsers.set(channelId, users);
        }
        users.add(userId);
    }

    leaveChannel(userId: UserId, channelId: ChannelId): void {
        const channels = this.userChannels.get(userId);
        if (channels) {
            channels.delete(channelId);
            if (channels.size === 0) this.userChannels.delete(userId);
        }

        const users = this.channelUsers.get(channelId);
        if (users) {
            users.delete(userId);
            if (users.size === 0) this.channelUsers.delete(channelId);
        }
    }

    joinConversation(userId: UserId, conversationId: ConversationId): void {
        let conversations = this.userConversations.get(userId);
        if (!conversations) {
            conversations = new Set();
            this.userConversations.set(userId, conversations);
        }
        conversations.add(conversationId);

        let users = this.conversationUsers.get(conversationId);
        if (!users) {
            users = new Set();
            this.conversationUsers.set(conversationId, users);
        }
        users.add(userId);
    }

    leaveConversation(userId: UserId, conversationId: ConversationId): void {
        const conversations = this.userConversations.get(userId);
        if (conversations) {
            conversations.delete(conversationId);
            if (conversations.size === 0) this.userConversations.delete(userId);
        }

        const users = this.conversationUsers.get(conversationId);
        if (users) {
            users.delete(userId);
            if (users.size === 0) this.conversationUsers.delete(conversationId);
        }
    }

    getConnectionsInScope(scope: { channelId?: ChannelId, conversationId?: ConversationId, userIds?: UserId[] }): ConnectionId[] {
        const targetUserIds = new Set<UserId>();

        if (scope.channelId) {
            const users = this.channelUsers.get(scope.channelId);
            if (users) users.forEach(u => targetUserIds.add(u));
        }

        if (scope.conversationId) {
            const users = this.conversationUsers.get(scope.conversationId);
            if (users) users.forEach(u => targetUserIds.add(u));
        }

        if (scope.userIds) {
            scope.userIds.forEach(u => targetUserIds.add(u));
        }

        // Resolve to connections
        const connections: ConnectionId[] = [];
        targetUserIds.forEach(userId => {
            const conns = this.userConnections.get(userId);
            if (conns) {
                conns.forEach(c => connections.push(c));
            }
        });

        return connections;
    }

    getConnection(connectionId: ConnectionId): WebSocketConnection | undefined {
        return this.activeConnections.get(connectionId);
    }

    sendToConnection(connectionId: ConnectionId, message: any): void {
        const conn = this.activeConnections.get(connectionId);
        if (conn) {
            const data = typeof message === 'string' ? message : JSON.stringify(message);
            conn.send(data);
        }
    }
}
