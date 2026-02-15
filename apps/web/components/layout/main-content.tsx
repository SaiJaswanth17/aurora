'use client';

import { useEffect, useState } from 'react';
import { MessageList } from '../chat/message-list';
import { MessageInput } from '../chat/message-input';
import { useActiveChannel, useChatStore } from '@/stores/chat-store';
import { useChannelById } from '@/stores/server-store';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';


interface ConversationDetails {
  id: string;
  name: string;
  avatarUrl?: string;
  type: 'dm';
}

export function MainContent() {
  const activeChannelId = useActiveChannel();
  const activeChannel = useChannelById(activeChannelId || '');
  const [dmDetails, setDmDetails] = useState<ConversationDetails | null>(null);
  const supabase = createClient();
  const { user } = useAuth();
  const [showOptions, setShowOptions] = useState(false);
  const useStore = useChatStore; // Access for clearing

  useEffect(() => {
    async function fetchDmDetails() {
      // If we have an active channel ID but no server channel, it might be a DM
      if (activeChannelId && !activeChannel) {
        try {
          const { data, error } = await supabase
            .from('conversations')
            .select(`
              id,
              type,
              conversation_members (
                user_id,
                profiles (
                  username,
                  avatar_url
                )
              )
            `)
            .eq('id', activeChannelId)
            .single();

          if (error || !data) return;

          const members = data.conversation_members as any[];
          const otherMember = members.find(m => m.user_id !== user?.id) || members[0];

          setDmDetails({
            id: data.id,
            name: otherMember?.profiles?.username || 'Unknown User',
            avatarUrl: otherMember?.profiles?.avatar_url,
            type: 'dm'
          });
        } catch (err) {
          console.error('Failed to fetch DM details:', err);
        }
      } else {
        setDmDetails(null);
      }
    }

    fetchDmDetails();
  }, [activeChannelId, activeChannel, supabase, user?.id]);

  // Click outside to close options
  useEffect(() => {
    const handleClickOutside = () => setShowOptions(false);
    if (showOptions) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showOptions]);

  const channelName = activeChannel ? activeChannel.name : (dmDetails?.name || '');
  const isDm = !!dmDetails;

  return (
    <div className="h-full flex flex-col bg-discord-background">
      {/* Channel Header */}
      <div className="h-12 px-4 flex items-center bg-discord-background shadow-md border-b border-discord-tertiary">
        <div className="flex items-center">
          <div className="mr-3">
            {isDm && dmDetails?.avatarUrl ? (
              <div className="relative">
                <img src={dmDetails.avatarUrl} alt={channelName} className="w-8 h-8 rounded-full object-cover" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-discord-background"></div>
              </div>
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold overflow-hidden ${isDm ? 'bg-discord-accent text-white' : 'bg-discord-background-secondary text-discord-text-muted'}`}>
                {/* Channel Hash Icon or DM Initial */}
                {!isDm && (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5.88 4.12L13.76 12l-7.88 7.88L8 22l10-10L8 2z" style={{ display: 'none' }} /><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V8h2v4z" /></svg>
                    <span className="text-xl">#</span>
                  </>
                )}
                {isDm && <span className="text-sm">{channelName?.replace(/[^a-zA-Z0-9]/g, '')?.[0]?.toUpperCase()}</span>}
              </div>
            )}
          </div>
          <h1 className="font-bold text-discord-text flex items-center">
            {channelName || 'Select Chat'}
          </h1>
        </div>

        <div className="ml-auto flex items-center space-x-5 text-discord-interactive">
          {/* Voice Call */}
          <button className="hover:text-discord-text" title="Start Voice Call">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.26-.27.36-.66.25-1.01-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3.3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" /></svg>
          </button>

          {/* Video Call */}
          <button className="hover:text-discord-text" title="Start Video Call">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" /></svg>
          </button>

          {/* Pinned Messages */}
          <button className="hover:text-discord-text" title="Pinned Messages">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 9V4l1 1c.55 0 1-.45 1-1V2H6v2c0 .55.45 1 1 1l1-1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" /></svg>
          </button>

          {/* Add Friends to DM (if DM) */}
          <button className="hover:text-discord-text" title="Add Friends to DM">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
          </button>

          {/* Three Dots / More Options */}
          <div className="relative">
            <button
              className="hover:text-discord-text"
              title="More Options"
              onClick={() => setShowOptions(!showOptions)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>

            {showOptions && (
              <div className="absolute right-0 top-8 w-48 bg-discord-background-floating rounded shadow-xl py-2 z-50 border border-discord-background-tertiary">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-discord-brand-experiment hover:text-white text-discord-text-normal text-sm transition-colors"
                  onClick={() => {
                    alert('Edit functionality coming soon!');
                    setShowOptions(false);
                  }}
                >
                  Edit
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-discord-brand-experiment hover:text-white text-discord-text-normal text-sm transition-colors"
                  onClick={() => {
                    // Copying channel ID or Link logic
                    navigator.clipboard.writeText(activeChannelId || '');
                    alert('ID copied to clipboard');
                    setShowOptions(false);
                  }}
                >
                  Copy
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-discord-brand-experiment hover:text-white text-discord-text-normal text-sm transition-colors"
                  onClick={() => {
                    alert('Forwarding functionality coming soon!');
                    setShowOptions(false);
                  }}
                >
                  Forward
                </button>
                <div className="h-[1px] bg-discord-background-modifier-accent my-1 mx-2"></div>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-discord-red hover:text-white text-discord-red text-sm transition-colors"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear the chat? This is a local action for now.')) {
                      useChatStore.getState().clearChannel(activeChannelId || '');
                    }
                    setShowOptions(false);
                  }}
                >
                  Clear Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {activeChannelId ? (
          <>
            <MessageList channelId={activeChannelId} />
            <MessageInput isDm={isDm} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-discord-background">
            <div className="max-w-md text-center">
              <h3 className="text-2xl font-bold text-discord-text mb-2">Welcome to Aurora</h3>
              <p className="text-discord-text-muted">Select a conversation from the sidebar to start chatting.</p>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
