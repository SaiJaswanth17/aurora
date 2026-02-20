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
import { useServerStore } from '@/stores/server-store';

export function AppShell({ children }: Readonly<{ children?: React.ReactNode }>) {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const router = useRouter();
  const { updatePresence } = useChatWebSocket();
  const supabase = createClient();
  const activeServer = useServerStore((state) => state.activeServer);

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
    globalThis.addEventListener('open-user-search', handleOpenSearch);
    return () => globalThis.removeEventListener('open-user-search', handleOpenSearch);
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
    <div className="flex h-screen bg-discord-background overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-discord-tertiary rounded-lg text-discord-text hover:bg-discord-background-tertiary"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsMobileSidebarOpen(false);
            }
          }}
          aria-label="Close menu"
        />
      )}

      {/* Server Sidebar - desktop: static flex item; hidden on mobile */}
      <div className="hidden md:block w-[72px] bg-discord-tertiary flex-shrink-0">
        <ServerSidebar />
      </div>

      {/* Channel Sidebar - desktop: static flex item; mobile: fixed overlay */}
      <div className="hidden md:flex w-60 bg-discord-secondary flex-shrink-0 flex-col">
        <ChannelSidebar />
      </div>
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-y-0 left-0 z-40 flex">
          <div className="w-[72px] bg-discord-tertiary flex-shrink-0">
            <ServerSidebar />
          </div>
          <div className="w-60 bg-discord-secondary flex-shrink-0">
            <ChannelSidebar />
          </div>
        </div>
      )}

      {/* Main Content - fills all remaining width */}
      <div className="flex-1 min-w-0 flex flex-col bg-discord-background">
        {children || <MainContent />}
      </div>

      {/* Member Sidebar - only shown in servers, not DMs */}
      {!!activeServer && (
        <div className="hidden lg:block w-60 bg-discord-secondary flex-shrink-0">
          <MemberSidebar />
        </div>
      )}

      <UserSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
}
