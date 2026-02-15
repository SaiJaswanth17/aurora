'use client';

import { useRequireAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { ServerSidebar } from './server-sidebar';
import { ChannelSidebar } from './channel-sidebar';
import { MainContent } from './main-content';
import { MemberSidebar } from './member-sidebar';
import { UserSearchModal } from '../modals/user-search-modal';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatWebSocket } from '@/lib/websocket/websocket-hooks';

export function AppShell() {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();
  const { updatePresence } = useChatWebSocket();
  const supabase = createClient();

  // Update presence on mount/auth
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Update database status
      const updateStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({ status: 'online' }).eq('id', user.id);
        }
      };
      updateStatus();
      updatePresence('online');
    }
  }, [isAuthenticated, isLoading, updatePresence, supabase]);

  // Listen for custom event to open search
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener('open-user-search', handleOpenSearch);
    return () => window.removeEventListener('open-user-search', handleOpenSearch);
  }, []);

  const handleSelectUser = async (selectedUser: any) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: selectedUser.id })
      });
      const data = await res.json();

      if (!res.ok) {
        console.error('API Error:', data);
        alert(`Error: ${data.details || data.error || 'Unknown error'}`);
        return;
      }

      if (data.conversationId) {
        setIsSearchOpen(false);
        router.push(`/channels/me/${data.conversationId}`);
      }
    } catch (error) {
      console.error('Failed to select user:', error);
      alert('Error starting conversation: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-discord-background">
        <div className="text-discord-text">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-discord-background overflow-hidden relative">
      {/* Server Sidebar - 72px wide */}
      <div className="w-[72px] bg-discord-tertiary flex-shrink-0 z-20">
        <ServerSidebar />
      </div>

      {/* Channel Sidebar - 240px wide */}
      <div className={`
        fixed inset-y-0 left-[72px] w-60 bg-discord-secondary flex-shrink-0 z-10 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 md:left-0
        ${false ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <ChannelSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-discord-background min-w-0">
        <MainContent />
      </div>

      {/* Member Sidebar - 240px wide, hidden on smaller screens */}
      <div className="hidden lg:block w-60 bg-discord-secondary flex-shrink-0">
        <MemberSidebar />
      </div>

      <UserSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
}
