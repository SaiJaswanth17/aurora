'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './message-bubble';
import { useChannelMessages, useTypingUsers, useActiveChannel, useChatStore } from '@/stores/chat-store';
import { useChatWebSocket } from '@/lib/websocket/websocket-hooks';
import { Message } from '@aurora/shared';
import { useAuth } from '@/lib/auth/auth-context';
import { decryptMessage } from '@/lib/crypto/encryption';
import { normalizeMessage } from '@/lib/message-utils';

interface MessageListProps {
  channelId: string;
}

export function MessageList({ channelId }: MessageListProps) {
  // Real chat hooks
  const messages = useChannelMessages(channelId);
  const realTypingUsers = useTypingUsers(channelId);
  const showTyping = realTypingUsers.length > 0;

  const activeChannel = useActiveChannel();
  const { user } = useAuth();
  const { onNewMessage, onNewDirectMessage, onUserTyping } = useChatWebSocket();
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesEndRef.current && autoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Detect scroll position to disable auto-scroll when user scrolls up
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setAutoScroll(isAtBottom);
    }
  };

  // Listen for new messages
  useEffect(() => {
    // We listen to all messages, but only add them if they match the current channel/conversation
    // This allows background updates if we wanted, but for now strict checking

    const unsubscribeNewMessage = onNewMessage((rawMessage: any) => {
      const message = normalizeMessage(rawMessage);
      if (message.channelId === channelId) {
        useChatStore.getState().addMessage(channelId, message);
        scrollToBottom();
      }
    });

    const unsubscribeNewDM = onNewDirectMessage((rawMessage: any) => {
      // In DM context, channelId passed to MessageList IS the conversationId
      const message = normalizeMessage(rawMessage);
      if (message.conversationId === channelId) {
        useChatStore.getState().addMessage(channelId, message);
        scrollToBottom();
      }
    });

    return () => {
      unsubscribeNewMessage();
      unsubscribeNewDM();
    };
  }, [channelId, onNewMessage, onNewDirectMessage, scrollToBottom]);

  // Listen for typing indicators
  useEffect(() => {
    if (activeChannel !== channelId) return;

    const unsubscribeTyping = onUserTyping(({ channelId: typingChannelId, userId }) => {
      if (typingChannelId === channelId && userId !== user?.id) {
        // Typing indicator handled by store
      }
    });

    return unsubscribeTyping;
  }, [activeChannel, channelId, onUserTyping, user?.id]);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const url = channelId.includes('-') && channelId.length > 20
          ? `/api/messages?conversationId=${channelId}`
          : `/api/messages?channelId=${channelId}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.messages) {
          // Decrypt historical messages
          const decryptedMessages = await Promise.all(
            data.messages.map(async (msg: any) => {
              const decryptedContent = await decryptMessage(msg.content, 'aurora-secure-shared-secret');
              const normalized = normalizeMessage({ ...msg, content: decryptedContent });
              return normalized;
            })
          );
          useChatStore.getState().addMessages(channelId, decryptedMessages);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      loadMessages();
    }
  }, [channelId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-discord-text-muted">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" ref={scrollContainerRef} onScroll={handleScroll}>
      <div className="flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-discord-text mb-2">
                No messages yet
              </div>
              <div className="text-discord-text-muted">
                Be the first to say hello!
              </div>
            </div>
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.authorId === user?.id}
            />
          ))
        )}

        {/* Typing Indicators */}
        {showTyping && (
          <div className="px-4 py-2 flex items-center space-x-2">
            <div className="flex space-x-1">
              <div
                className="w-2 h-2 bg-discord-text-muted rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-2 h-2 bg-discord-text-muted rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-2 h-2 bg-discord-text-muted rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
            <span className="text-discord-text-muted text-sm">
              {realTypingUsers.length === 1
                ? 'Someone is typing...'
                : `${realTypingUsers.length} people are typing...`
              }
            </span>
          </div>
        )}
      </div>

      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} />
    </div>
  );
}
