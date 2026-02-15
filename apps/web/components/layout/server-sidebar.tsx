'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useServerStore } from '@/stores/server-store';
import Link from 'next/link';
import { useState } from 'react';
import { CreateServerModal } from '@/components/modals/create-server-modal';
import { SearchModal } from '@/components/modals/search-modal';
import { UserSettingsModal } from '@/components/modals/user-settings-modal';

export function ServerSidebar() {
  const { user } = useAuth();
  const { activeServer, setActiveServer } = useServerStore();
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);

  return (
    <>
      <div className="w-full h-full flex flex-col items-center py-3 space-y-2 overflow-y-auto no-scrollbar">
        {/* Direct Messages Button */}
        <Link href="/channels/me">
          <div
            className={`w-12 h-12 flex items-center justify-center rounded-[24px] transition-all duration-200 cursor-pointer overflow-hidden ${!activeServer
              ? 'bg-discord-accent text-white rounded-[16px]'
              : 'bg-discord-background-secondary text-discord-text-green hover:bg-discord-green hover:text-white hover:rounded-[16px]'
              }`}
            onClick={() => setActiveServer(null)}
            title="Direct Messages"
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
          </div>
        </Link>

        {/* Separator */}
        <div className="w-8 h-[2px] bg-discord-background-modifier-accent rounded-lg mx-auto" />

        {/* Add Server Button */}
        <div
          onClick={() => setShowCreateServer(true)}
          className="w-12 h-12 flex items-center justify-center rounded-[24px] bg-discord-background-secondary text-discord-text-green hover:bg-discord-green hover:text-white hover:rounded-[16px] transition-all duration-200 cursor-pointer"
          title="Add a Server"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>

        {/* Search / Explore */}
        <div
          onClick={() => setShowSearch(true)}
          className="w-12 h-12 flex items-center justify-center rounded-[24px] bg-discord-background-secondary text-discord-text-green hover:bg-discord-green hover:text-white hover:rounded-[16px] transition-all duration-200 cursor-pointer"
          title="Search"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Separator */}
        <div className="w-8 h-[2px] bg-discord-background-modifier-accent rounded-lg mx-auto" />

        {/* Lower Section */}
        <div className="mt-auto flex flex-col items-center space-y-2 pb-2">
          {/* User Profile / Logout */}
          <div
            onClick={() => setShowUserSettings(true)}
            className="w-12 h-12 flex items-center justify-center rounded-[24px] bg-discord-background-tertiary text-discord-text cursor-pointer hover:bg-discord-brand-experiment hover:text-white hover:rounded-[16px] transition-all duration-200 group"
            title={`User Settings (${user?.username || 'User'})`}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all bg-discord-background-secondary flex items-center justify-center text-discord-text-muted group-hover:text-white group-hover:bg-discord-brand-experiment">
                <span className="text-sm font-bold">{user?.username?.replace(/[^a-zA-Z0-9]/g, '')?.[0]?.toUpperCase() || 'U'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateServer && <CreateServerModal onClose={() => setShowCreateServer(false)} />}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      {showUserSettings && <UserSettingsModal onClose={() => setShowUserSettings(false)} />}
    </>
  );
}
