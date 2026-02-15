import { Message, DirectMessage, UserStatus } from '@aurora/shared';
export declare function useChatWebSocket(): {
    sendMessage: (channelId: string, content: string, attachments?: string[]) => void;
    sendDirectMessage: (conversationId: string, content: string, attachments?: string[]) => void;
    startTyping: (channelId: string) => void;
    stopTyping: (channelId: string) => void;
    joinChannel: (channelId: string) => void;
    leaveChannel: (channelId: string) => void;
    updatePresence: (status: UserStatus) => void;
    onNewMessage: (callback: (message: Message) => void) => () => void;
    onNewDirectMessage: (callback: (message: DirectMessage) => void) => () => void;
    onUserTyping: (callback: (data: {
        channelId: string;
        userId: string;
        username: string;
    }) => void) => () => void;
    onPresenceUpdate: (callback: (data: {
        userId: string;
        status: UserStatus;
    }) => void) => () => void;
};
//# sourceMappingURL=websocket-hooks.d.ts.map