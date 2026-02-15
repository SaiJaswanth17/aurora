export declare const WS_EVENTS: {
    readonly AUTH: "auth";
    readonly MESSAGE: "message";
    readonly DM_MESSAGE: "dm_message";
    readonly TYPING_START: "typing_start";
    readonly TYPING_STOP: "typing_stop";
    readonly PRESENCE_UPDATE: "presence_update";
    readonly JOIN_CHANNEL: "join_channel";
    readonly LEAVE_CHANNEL: "leave_channel";
    readonly AUTH_SUCCESS: "auth_success";
    readonly AUTH_ERROR: "auth_error";
    readonly NEW_MESSAGE: "new_message";
    readonly NEW_DM_MESSAGE: "new_dm_message";
    readonly USER_TYPING: "user_typing";
    readonly PRESENCE_UPDATE_BROADCAST: "presence_update_broadcast";
    readonly USER_JOINED_CHANNEL: "user_joined_channel";
    readonly USER_LEFT_CHANNEL: "user_left_channel";
    readonly ERROR: "error";
};
export declare const USER_STATUSES: {
    readonly ONLINE: "online";
    readonly IDLE: "idle";
    readonly DND: "dnd";
    readonly OFFLINE: "offline";
};
export declare const SERVER_ROLES: {
    readonly OWNER: "owner";
    readonly ADMIN: "admin";
    readonly MODERATOR: "moderator";
    readonly MEMBER: "member";
};
export declare const CHANNEL_TYPES: {
    readonly TEXT: "text";
    readonly VOICE: "voice";
};
export declare const CONVERSATION_TYPES: {
    readonly DM: "dm";
    readonly GROUP: "group";
};
export declare const FRIEND_STATUSES: {
    readonly PENDING: "pending";
    readonly ACCEPTED: "accepted";
    readonly BLOCKED: "blocked";
};
export declare const MAX_FILE_SIZE: number;
export declare const UPLOAD_CHUNK_SIZE: number;
export declare const DEFAULT_PAGE_SIZE = 50;
export declare const MAX_PAGE_SIZE = 100;
export declare const PORT_RANGES: {
    readonly WEB: readonly [3000, 3001, 3002, 3003];
    readonly WEBSOCKET: readonly [3001, 3002, 3003, 3004];
};
export declare const WS_CONFIG: {
    readonly HEARTBEAT_INTERVAL: 30000;
    readonly RECONNECT_INTERVAL: 3000;
    readonly MAX_RECONNECT_ATTEMPTS: 5;
};
//# sourceMappingURL=index.d.ts.map