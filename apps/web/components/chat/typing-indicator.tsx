'use client';

import { useState, useEffect } from 'react';
import { useTypingUsers } from '@/stores/chat-store';

interface TypingIndicatorProps {
  channelId: string;
}

export function TypingIndicator({ channelId }: TypingIndicatorProps) {
  const typingUserIds = useTypingUsers(channelId);
  const [typingUsers, setTypingUsers] = useState<Array<{ id: string; username: string }>>([]);

  // Fetch user details for typing users
  useEffect(() => {
    const users = typingUserIds
      .map(userId => ({ id: userId, username: `User${userId}` }))
      .slice(0, 3); // Limit to 3 users
    setTypingUsers(users);
  }, [typingUserIds]);

  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0].username}, ${typingUsers[1].username}, and ${typingUsers[2].username} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  };

  return (
    <div className="px-4 py-2 flex items-center space-x-2 bg-discord-background-secondary">
      {/* Typing dots animation */}
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

      {/* Typing text */}
      <span className="text-discord-text-muted text-sm italic">{getTypingText()}</span>
    </div>
  );
}
