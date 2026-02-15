
'use client';

import { useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useWebSocket } from './websocket-context';
import { WS_EVENTS, Message, DirectMessage, UserStatus } from '@aurora/shared';
import { encryptMessage, decryptMessage } from '../crypto/encryption';

const E2EE_SECRET = 'aurora-secure-shared-secret'; // Temporary demo secret

export function useChatWebSocket() {
  const { send, on } = useWebSocket();

  // Send message to channel
  const sendMessage = useCallback(
    async (channelId: string, content: string, attachments?: string[]) => {
      const encryptedContent = await encryptMessage(content, E2EE_SECRET);
      send('message', { channelId, content: encryptedContent, attachments });
    },
    [send]
  );

  // Send direct message
  const sendDirectMessage = useCallback(
    async (conversationId: string, content: string, attachments?: string[]) => {
      const encryptedContent = await encryptMessage(content, E2EE_SECRET);
      send('dm_message', { conversationId, content: encryptedContent, attachments });
    },
    [send]
  );

  // Start typing in channel
  const startTyping = useCallback(
    (channelId: string) => {
      send('typing_start', { channelId });
    },
    [send]
  );

  // Stop typing in channel
  const stopTyping = useCallback(
    (channelId: string) => {
      send('typing_stop', { channelId });
    },
    [send]
  );

  // Start typing in conversation (DM)
  const startTypingConversation = useCallback(
    (conversationId: string) => {
      send('typing_start', { conversationId });
    },
    [send]
  );

  // Stop typing in conversation (DM)
  const stopTypingConversation = useCallback(
    (conversationId: string) => {
      send('typing_stop', { conversationId });
    },
    [send]
  );

  // Join channel
  const joinChannel = useCallback(
    (channelId: string) => {
      send('join_channel', { channelId });
    },
    [send]
  );

  // Leave channel
  const leaveChannel = useCallback(
    (channelId: string) => {
      send('leave_channel', { channelId });
    },
    [send]
  );

  // Join conversation
  const joinConversation = useCallback(
    (conversationId: string) => {
      send(WS_EVENTS.JOIN_CONVERSATION || 'join_conversation', { conversationId });
    },
    [send]
  );

  // Leave conversation
  const leaveConversation = useCallback(
    (conversationId: string) => {
      send(WS_EVENTS.LEAVE_CONVERSATION || 'leave_conversation', { conversationId });
    },
    [send]
  );

  // Update presence
  const updatePresence = useCallback(
    (status: UserStatus) => {
      send('presence_update', { status });
    },
    [send]
  );

  // Listen to new messages
  const onNewMessage = useCallback(
    (callback: (message: Message) => Promise<void> | void) => {
      const wrappedCallback = async (data: unknown) => {
        const message = data as Message;
        const decryptedContent = await decryptMessage(message.content, E2EE_SECRET);
        callback({ ...message, content: decryptedContent });
      };
      return on(WS_EVENTS.NEW_MESSAGE, wrappedCallback);
    },
    [on]
  );

  // Listen to new direct messages
  const onNewDirectMessage = useCallback(
    (callback: (message: DirectMessage) => Promise<void> | void) => {
      const wrappedCallback = async (data: unknown) => {
        const message = data as DirectMessage;
        const decryptedContent = await decryptMessage(message.content, E2EE_SECRET);
        callback({ ...message, content: decryptedContent });
      };
      return on(WS_EVENTS.NEW_DM_MESSAGE, wrappedCallback);
    },
    [on]
  );

  // Listen to typing indicators
  const onUserTyping = useCallback(
    (callback: (data: { channelId?: string; conversationId?: string; userId: string; username: string }) => void) => {
      const wrappedCallback = (data: unknown) => {
        callback(data as { channelId?: string; conversationId?: string; userId: string; username: string });
      };
      return on(WS_EVENTS.USER_TYPING, wrappedCallback);
    },
    [on]
  );

  // Listen to presence updates
  const onPresenceUpdate = useCallback(
    (callback: (data: { userId: string; status: UserStatus }) => void) => {
      const wrappedCallback = (data: unknown) => {
        callback(data as { userId: string; status: UserStatus });
      };
      return on(WS_EVENTS.PRESENCE_UPDATE_BROADCAST, wrappedCallback);
    },
    [on]
  );

  return {
    // Actions
    sendMessage,
    sendDirectMessage,
    startTyping,
    stopTyping,
    startTypingConversation,
    stopTypingConversation,
    joinChannel,
    leaveChannel,
    joinConversation,
    leaveConversation,
    updatePresence,

    // Event listeners
    onNewMessage,
    onNewDirectMessage,
    onUserTyping,
    onPresenceUpdate,
  };
}
