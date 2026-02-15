'use client';

import { useEffect } from 'react';
import { useChatWebSocket } from '@/lib/websocket/websocket-hooks';
import { useChatStore } from '@/stores/chat-store';
import { Message, DirectMessage } from '@aurora/shared';

export function ChatEventsProvider({ children }: { children: React.ReactNode }) {
    const { onNewMessage, onNewDirectMessage, onUserTyping } = useChatWebSocket();
    const { addMessage, setTyping, removeTyping } = useChatStore();

    useEffect(() => {
        // Listen for channel messages
        const unsubscribeNewMessage = onNewMessage((message: Message) => {
            console.log('Global listener: New Channel Message', message);
            addMessage(message.channelId, message);
        });

        // Listen for direct messages
        const unsubscribeNewDirectMessage = onNewDirectMessage((message: DirectMessage) => {
            console.log('Global listener: New DM', message);
            // For DMs, we store them under the conversationId
            // Adapt DirectMessage to Message type
            const adaptedMessage: Message = {
                ...message,
                channelId: message.conversationId,
                replyToId: null,
                replyTo: null,
                editedAt: null,
                type: 'default'
            };
            addMessage(message.conversationId, adaptedMessage);
        });

        // Listen for typing indicators
        const unsubscribeTyping = onUserTyping(({ channelId, userId }) => {
            setTyping(channelId, userId);

            // Clear typing after 5 seconds
            setTimeout(() => {
                removeTyping(channelId, userId);
            }, 5000);
        });

        return () => {
            unsubscribeNewMessage();
            unsubscribeNewDirectMessage();
            unsubscribeTyping();
        };
    }, [onNewMessage, onNewDirectMessage, onUserTyping, addMessage, setTyping, removeTyping]);

    return <>{children}</>;
}
