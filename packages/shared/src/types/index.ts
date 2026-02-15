// User Types
export interface User {
  id: string;
  username: string;
  avatarUrl: string | null;
  status: UserStatus;
  customStatus: string | null;
  createdAt: string;
  email?: string;
  phone?: string;
}

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

// Server Types
export interface Server {
  id: string;
  name: string;
  iconUrl: string | null;
  ownerId: string;
  createdAt: string;
}

export interface ServerMember {
  id: string;
  serverId: string;
  userId: string;
  user: User;
  role: ServerRole;
  joinedAt: string;
}

export type ServerRole = 'owner' | 'admin' | 'moderator' | 'member';

// Channel Types
export interface Channel {
  id: string;
  serverId: string;
  name: string;
  type: ChannelType;
  position: number;
  createdAt: string;
}

export type ChannelType = 'text' | 'voice';

// Message Types
export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  author: User;
  content: string;
  attachments: Attachment[];
  replyToId: string | null;
  replyTo: Message | null;
  editedAt: string | null;
  createdAt: string;
  type?: 'default' | 'system' | 'reply';
}

export interface Attachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
}

// Direct Message Types
export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  members: ConversationMember[];
  createdAt: string;
}

export type ConversationType = 'dm' | 'group';

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  user: User;
  joinedAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  authorId: string;
  author: User;
  content: string;
  attachments: Attachment[];
  createdAt: string;
}

// Friend Types
export interface Friend {
  id: string;
  requesterId: string;
  requester: User;
  addresseeId: string;
  addressee: User;
  status: FriendStatus;
  createdAt: string;
}

export type FriendStatus = 'pending' | 'accepted' | 'blocked';

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: unknown;
}

export interface AuthMessage {
  type: 'auth';
  payload: {
    token: string;
  };
}

export interface ChatMessagePayload {
  type: 'message';
  payload: {
    channelId: string;
    content: string;
    attachments?: string[];
  };
}

export interface DirectMessagePayload {
  type: 'dm_message';
  payload: {
    conversationId: string;
    content: string;
    attachments?: string[];
  };
}

export interface TypingPayload {
  type: 'typing_start' | 'typing_stop';
  payload: {
    channelId: string;
  };
}

export interface PresencePayload {
  type: 'presence_update';
  payload: {
    status: UserStatus;
  };
}

export type WebSocketEvent =
  | AuthMessage
  | ChatMessagePayload
  | DirectMessagePayload
  | TypingPayload
  | PresencePayload;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
