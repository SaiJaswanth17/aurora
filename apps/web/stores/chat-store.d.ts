import { Message } from '@aurora/shared';
interface ChatState {
    messages: Record<string, Message[]>;
    typingUsers: Record<string, Set<string>>;
    activeChannel: string | null;
    isLoading: boolean;
    hasMore: Record<string, boolean>;
    nextCursors: Record<string, string | null>;
    setActiveChannel: (channelId: string | null) => void;
    addMessage: (channelId: string, message: Message) => void;
    addMessages: (channelId: string, messages: Message[], prepend?: boolean) => void;
    setTyping: (channelId: string, userId: string, username: string) => void;
    removeTyping: (channelId: string, userId: string) => void;
    setLoading: (loading: boolean) => void;
    setHasMore: (channelId: string, hasMore: boolean) => void;
    setNextCursor: (channelId: string, cursor: string | null) => void;
    clearChannel: (channelId: string) => void;
    updateMessage: (channelId: string, messageId: string, updates: Partial<Message>) => void;
    deleteMessage: (channelId: string, messageId: string) => void;
}
export declare const useChatStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ChatState>>;
export declare const useActiveChannel: () => string | null;
export declare const useChannelMessages: (channelId: string) => Message[];
export declare const useTypingUsers: (channelId: string) => string[];
export declare const useChannelHasMore: (channelId: string) => boolean;
export declare const useIsLoading: () => boolean;
export {};
//# sourceMappingURL=chat-store.d.ts.map