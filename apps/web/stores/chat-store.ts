import { create } from 'zustand';
import { Message } from '@aurora/shared';

interface ChatState {
  // Messages by channel
  messages: Record<string, Message[]>;
  typingUsers: Record<string, Set<string>>; // channelId -> Set of userIds
  activeChannel: string | null;
  isLoading: boolean;
  hasMore: Record<string, boolean>;
  nextCursors: Record<string, string | null>;

  // Actions
  setActiveChannel: (channelId: string | null) => void;
  addMessage: (channelId: string, message: Message) => void;
  addMessages: (channelId: string, messages: Message[], prepend?: boolean) => void;
  setTyping: (channelId: string, userId: string) => void;
  removeTyping: (channelId: string, userId: string) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (channelId: string, hasMore: boolean) => void;
  setNextCursor: (channelId: string, cursor: string | null) => void;
  clearChannel: (channelId: string) => void;
  updateMessage: (channelId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (channelId: string, messageId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Initial state
  messages: {},
  typingUsers: {},
  activeChannel: null,
  isLoading: false,
  hasMore: {},
  nextCursors: {},

  // Actions
  setActiveChannel: channelId => {
    set({ activeChannel: channelId });
  },

  addMessage: (channelId, message) => {
    set(state => {
      const currentMessages = state.messages[channelId] || [];
      if (currentMessages.some(m => m.id === message.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [channelId]: [...currentMessages, message],
        },
      };
    });
  },

  addMessages: (channelId, messages, prepend = false) => {
    set(state => {
      const existingMessages = state.messages[channelId] || [];
      // Filter out messages that already exist
      const uniqueNewMessages = messages.filter(
        newMsg => !existingMessages.some(existingMsg => existingMsg.id === newMsg.id)
      );

      if (uniqueNewMessages.length === 0) return state;

      const newMessages = prepend
        ? [...uniqueNewMessages, ...existingMessages]
        : [...existingMessages, ...uniqueNewMessages];

      return {
        messages: {
          ...state.messages,
          [channelId]: newMessages,
        },
      };
    });
  },

  setTyping: (channelId, userId) => {
    set(state => ({
      typingUsers: {
        ...state.typingUsers,
        [channelId]: new Set([...(state.typingUsers[channelId] || []), userId]),
      },
    }));
  },

  removeTyping: (channelId, userId) => {
    set(state => {
      const typingSet = state.typingUsers[channelId];
      if (!typingSet) return state;

      const newSet = new Set(typingSet);
      newSet.delete(userId);

      return {
        typingUsers: {
          ...state.typingUsers,
          [channelId]: newSet,
        },
      };
    });
  },

  setLoading: loading => {
    set({ isLoading: loading });
  },

  setHasMore: (channelId, hasMore) => {
    set(state => ({
      hasMore: {
        ...state.hasMore,
        [channelId]: hasMore,
      },
    }));
  },

  setNextCursor: (channelId, cursor) => {
    set(state => ({
      nextCursors: {
        ...state.nextCursors,
        [channelId]: cursor,
      },
    }));
  },

  clearChannel: channelId => {
    set(state => {
      const newMessages = { ...state.messages };
      delete newMessages[channelId];

      const newTypingUsers = { ...state.typingUsers };
      delete newTypingUsers[channelId];

      const newHasMore = { ...state.hasMore };
      delete newHasMore[channelId];

      const newNextCursors = { ...state.nextCursors };
      delete newNextCursors[channelId];

      return {
        messages: newMessages,
        typingUsers: newTypingUsers,
        hasMore: newHasMore,
        nextCursors: newNextCursors,
      };
    });
  },

  updateMessage: (channelId, messageId, updates) => {
    set(state => {
      const messages = state.messages[channelId] || [];
      const updatedMessages = messages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      );

      return {
        messages: {
          ...state.messages,
          [channelId]: updatedMessages,
        },
      };
    });
  },

  deleteMessage: (channelId, messageId) => {
    set(state => {
      const messages = state.messages[channelId] || [];
      const filteredMessages = messages.filter(msg => msg.id !== messageId);

      return {
        messages: {
          ...state.messages,
          [channelId]: filteredMessages,
        },
      };
    });
  },
}));

// Selectors for better performance
export const useActiveChannel = () => useChatStore(state => state.activeChannel);
export const useChannelMessages = (channelId: string) =>
  useChatStore(state => state.messages[channelId] || []);
export const useTypingUsers = (channelId: string) =>
  useChatStore(state => Array.from(state.typingUsers[channelId] || []));
export const useChannelHasMore = (channelId: string) =>
  useChatStore(state => state.hasMore[channelId] !== false);
export const useIsLoading = () => useChatStore(state => state.isLoading);
