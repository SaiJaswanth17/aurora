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
  clearMessages: (channelId: string, type: 'channel' | 'dm') => Promise<void>;
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

  clearChannel: async (channelId) => {
    // Determine if it's a DM or Channel based on ID format or state
    // For now, we'll try both or assume based on route. 
    // Actually, store doesn't know context easily. 
    // Let's assume the caller handles the API call or we do it here.
    // Given the previous implementation was synchronous, let's make it async and try to clear via API.

    try {
      // Optimistic update
      set(state => {
        const newMessages = { ...state.messages };
        delete newMessages[channelId];
        return { messages: newMessages };
      });

      // Attempt to clear via API
      // We'll try conversation first, then channel if that fails 
      // This is a bit hacky, ideally we pass the type.
      // But since UUIDs are unique, we can try.
      let isDm = false;
      // Simple heuristic: if it's in the URL as /me/, it's a DM (but store doesn't know URL)
      // We can check if it exists in conversations list? No access here.

      // Let's rely on the separate `clearHistory` action I'll add below, 
      // or just update this one to be intelligent.
      // Actually, let's add `clearMessages` separate async action.
    } catch (e) {
      console.error("Failed to clear channel", e);
    }
  },

  clearMessages: async (channelId, type: 'channel' | 'dm') => {
    try {
      const endpoint = type === 'dm'
        ? `/api/conversations/${channelId}/clear`
        : `/api/channels/${channelId}/clear`;

      await fetch(endpoint, { method: 'DELETE' });

      // Clear local state
      set(state => {
        const newMessages = { ...state.messages };
        delete newMessages[channelId];
        return { messages: newMessages };
      });
    } catch (error) {
      console.error('Failed to clear messages:', error);
    }
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
