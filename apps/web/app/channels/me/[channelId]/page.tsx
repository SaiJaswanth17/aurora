'use client';

import { AppShell } from '@/components/layout/app-shell';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useChatStore } from '@/stores/chat-store';

export default function DMChannelPage() {
    const { channelId } = useParams();
    const { setActiveChannel } = useChatStore();

    useEffect(() => {
        if (channelId && typeof channelId === 'string') {
            setActiveChannel(channelId);
        }

        return () => {
            setActiveChannel(null);
        };
    }, [channelId, setActiveChannel]);

    return (
        <AppShell>
            {/* 
          MainContent (inside AppShell) will automatically render 
          the MessageList because setActiveChannel was called.
      */}
            <div className="flex-1" />
        </AppShell>
    );
}
