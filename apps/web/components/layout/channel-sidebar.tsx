'use client';

import { useServerStore } from '@/stores/server-store';
import { useAuth } from '@/lib/auth/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useChatStore } from '@/stores/chat-store';
import { useChannels } from '@/hooks/use-servers';
import { useChatWebSocket } from '@/lib/websocket/websocket-hooks';

export function ChannelSidebar() {
  const { activeServer, activeChannel: serverActiveChannel, setActiveChannel: setServerActiveChannel, servers } = useServerStore();
  const { setActiveChannel: setChatActiveChannel, activeChannel: chatActiveChannel } = useChatStore();
  const { channels } = useChannels(activeServer);
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isConvoLoading, setIsConvoLoading] = useState(false);
  const supabase = createClient();
  const { onPresenceUpdate } = useChatWebSocket();

  const currentServer = activeServer ? servers[activeServer] : null;

  useEffect(() => {
    async function fetchConversations() {
      if (activeServer) return;
      setIsConvoLoading(true);
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
                avatar_url,
                status
              )
            )
          `)
          .eq('type', 'dm');

        if (error) throw error;

        const formatted = data?.map(convo => {
          const members = convo.conversation_members as any[];
          const otherMember = members.find(m => m.user_id !== user?.id) || members[0];
          return {
            id: convo.id,
            userId: otherMember?.user_id || 'unknown',
            username: otherMember?.profiles?.username || 'Unknown User',
            avatarUrl: otherMember?.profiles?.avatar_url,
            status: otherMember?.profiles?.status || 'offline'
          };
        }) || [];

        // Deduplicate conversations
        const uniqueConversations = formatted.filter((convo, index, self) =>
          index === self.findIndex((t) => (
            t.username === convo.username
          ))
        );

        setConversations(uniqueConversations);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setIsConvoLoading(false);
      }
    }

    fetchConversations();
  }, [activeServer, user?.id, supabase]);

  // Listen for presence updates
  useEffect(() => {
    const unsubscribe = onPresenceUpdate(({ userId, status }) => {
      setConversations(prev => prev.map(convo => {
        if (convo.userId === userId) {
          return { ...convo, status };
        }
        return convo;
      }));
    });
    return unsubscribe;
  }, [onPresenceUpdate]);

  const handleFriendsClick = () => {
    setChatActiveChannel(null);
    setServerActiveChannel(null);
    router.push('/channels/me');
  };

  const handleConvoClick = (convoId: string) => {
    setChatActiveChannel(convoId);
    setServerActiveChannel(null);
  };

  const handleChannelClick = (channelId: string) => {
    setServerActiveChannel(channelId);
    setChatActiveChannel(channelId);
    router.push(`/channels/${channelId}`);
  };

  if (!activeServer) {
    return (
      <div className="h-full flex flex-col bg-discord-secondary px-2">
        <div className="h-12 flex items-center mb-2 px-2 border-b border-discord-background-tertiary shadow-sm">
          <button
            onClick={handleFriendsClick}
            className={`w-full flex items-center space-x-2 p-2 rounded-[4px] transition-colors ${!chatActiveChannel ? 'bg-discord-background-tertiary text-discord-text' : 'text-discord-text-muted hover:text-discord-text hover:bg-discord-background-modifier-hover'}`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <span className="font-medium">Friends</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-2 mt-4">
            <div className="flex items-center justify-between px-2 text-xs font-semibold text-discord-text-muted uppercase tracking-wider mb-2 group cursor-pointer hover:text-discord-text">
              <span>Direct Messages</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('open-user-search'));
                }}
                className="hover:text-discord-text transition-colors opacity-0 group-hover:opacity-100"
                title="Create DM"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {isConvoLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin w-4 h-4 border-2 border-discord-accent border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-0.5">
                {conversations.map(convo => (
                  <Link key={convo.id} href={`/channels/me/${convo.id}`} onClick={() => handleConvoClick(convo.id)}>
                    <div
                      className={`
                        flex items-center px-2 py-2 rounded-[4px] cursor-pointer transition-colors group
                        ${chatActiveChannel === convo.id
                          ? 'bg-discord-background-tertiary text-discord-text'
                          : 'text-discord-text-muted hover:bg-discord-background-modifier-hover hover:text-discord-text'
                        }
                      `}
                    >
                      <div className="relative mr-3">
                        <div className="w-8 h-8 rounded-full bg-discord-accent flex items-center justify-center text-white font-bold overflow-hidden">
                          {convo.avatarUrl ? (
                            <img src={convo.avatarUrl} alt={convo.username} className="w-full h-full object-cover" />
                          ) : (
                            convo.username?.replace(/[^a-zA-Z0-9]/g, '')?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        {convo.status === 'online' && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-discord-secondary" />
                        )}
                      </div>
                      <span className="text-sm font-medium truncate">{convo.username}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    );
  }

  const textChannels = channels.filter(ch => ch.type === 'text');
  const voiceChannels = channels.filter(ch => ch.type === 'voice');

  return (
    <div className="h-full flex flex-col bg-discord-secondary">
      {/* Server Header */}
      <div
        className="h-12 px-4 flex items-center shadow-md border-b border-discord-background-tertiary cursor-pointer hover:bg-discord-background-tertiary transition-colors"
      >
        <h2 className="font-bold text-discord-text truncate">
          {currentServer?.name || 'Loading...'}
        </h2>
        <svg className="w-4 h-4 ml-auto text-discord-interactive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 px-2">
        {/* Text Channels */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-discord-text-muted uppercase tracking-wider mb-2">
            <span>Text Channels</span>
          </div>
          <div className="space-y-0.5">
            {textChannels.map(channel => (
              <div
                key={channel.id}
                onClick={() => handleChannelClick(channel.id)}
                className={`
                  flex items-center px-2 py-1.5 rounded cursor-pointer transition-colors group
                  ${(serverActiveChannel === channel.id || chatActiveChannel === channel.id)
                    ? 'bg-discord-background-tertiary text-discord-text'
                    : 'text-discord-text-muted hover:bg-discord-background-tertiary hover:text-discord-text'
                  }
                `}
              >
                <span className="text-discord-text-muted mr-1.5 group-hover:text-discord-text">#</span>
                <span className="text-sm font-medium truncate">{channel.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Channels */}
        <div>
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-discord-text-muted uppercase tracking-wider mb-2">
            <span>Voice Channels</span>
          </div>
          <div className="space-y-0.5">
            {voiceChannels.map(channel => (
              <div
                key={channel.id}
                onClick={() => handleChannelClick(channel.id)}
                className={`
                  flex items-center px-2 py-1.5 rounded cursor-pointer transition-colors group
                  ${(serverActiveChannel === channel.id || chatActiveChannel === channel.id)
                    ? 'bg-discord-background-tertiary text-discord-text'
                    : 'text-discord-text-muted hover:bg-discord-background-tertiary hover:text-discord-text'
                  }
                `}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-sm font-medium truncate">{channel.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
