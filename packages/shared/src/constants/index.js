// WebSocket Events
export const WS_EVENTS = {
    // Client -> Server
    AUTH: 'auth',
    MESSAGE: 'message',
    DM_MESSAGE: 'dm_message',
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',
    PRESENCE_UPDATE: 'presence_update',
    JOIN_CHANNEL: 'join_channel',
    LEAVE_CHANNEL: 'leave_channel',
    // Server -> Client
    AUTH_SUCCESS: 'auth_success',
    AUTH_ERROR: 'auth_error',
    NEW_MESSAGE: 'new_message',
    NEW_DM_MESSAGE: 'new_dm_message',
    USER_TYPING: 'user_typing',
    PRESENCE_UPDATE_BROADCAST: 'presence_update_broadcast',
    USER_JOINED_CHANNEL: 'user_joined_channel',
    USER_LEFT_CHANNEL: 'user_left_channel',
    ERROR: 'error'
};
// User Statuses
export const USER_STATUSES = {
    ONLINE: 'online',
    IDLE: 'idle',
    DND: 'dnd',
    OFFLINE: 'offline'
};
// Server Roles
export const SERVER_ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    MEMBER: 'member'
};
// Channel Types
export const CHANNEL_TYPES = {
    TEXT: 'text',
    VOICE: 'voice'
};
// Conversation Types
export const CONVERSATION_TYPES = {
    DM: 'dm',
    GROUP: 'group'
};
// Friend Statuses
export const FRIEND_STATUSES = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    BLOCKED: 'blocked'
};
// File Upload Limits (5GB = 5 * 1024 * 1024 * 1024 bytes)
export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;
export const UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;
// Ports Configuration
export const PORT_RANGES = {
    WEB: [3000, 3001, 3002, 3003],
    WEBSOCKET: [3001, 3002, 3003, 3004]
};
// WebSocket Config
export const WS_CONFIG = {
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
    RECONNECT_INTERVAL: 3000, // 3 seconds
    MAX_RECONNECT_ATTEMPTS: 5
};
//# sourceMappingURL=index.js.map