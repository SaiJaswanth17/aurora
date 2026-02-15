'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useChatWebSocket } from '../../lib/websocket/websocket-hooks';
import { UserStatus } from '@aurora/shared';

interface Member {
  id: string;
  username: string;
  status: UserStatus;
  avatarUrl?: string | null;
}

import { useRouter } from 'next/navigation';

export function MemberSidebar() {
  const [members, setMembers] = useState<Member[]>([]);
  const { onPresenceUpdate } = useChatWebSocket();
  const supabase = createClient();
  const router = useRouter();

  const handleSelectUser = async (selectedUser: Member) => {
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
        router.push(`/channels/me/${data.conversationId}`);
      }
    } catch (error) {
      console.error('Failed to select user:', error);
      alert('Error starting conversation: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  useEffect(() => {
    // 1. Initial fetch of all profiles
    async function fetchMembers() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, status');

        if (error) throw error;
        if (data) {
          setMembers(data.map(profile => ({
            id: profile.id,
            username: profile.username || 'Unknown',
            avatarUrl: profile.avatar_url,
            status: profile.status as UserStatus,
          })));
        }
      } catch (err) {
        console.error('MemberSidebar: Failed to fetch members:', err);
      }
    }

    fetchMembers();

    // 2. Listen for presence updates via WebSocket
    const unsubscribe = onPresenceUpdate(({ userId, status }) => {
      console.log('MemberSidebar: Presence update received:', { userId, status });
      setMembers(prevMembers =>
        prevMembers.map(member =>
          member.id === userId ? { ...member, status } : member
        )
      );
    });

    return () => {
      unsubscribe();
    };
  }, [onPresenceUpdate, supabase]);

  const onlineMembers = members.filter(m => m.status !== 'offline');


  const getStatusColor = (status: Member['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'dnd':
        return 'bg-red-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full flex flex-col bg-discord-secondary">
      {/* Header */}
      <div className="h-12 px-4 flex items-center shadow-md border-b border-discord-background-tertiary">
        <h3 className="font-semibold text-discord-text text-sm uppercase tracking-wider">
          Online — {onlineMembers.length}
        </h3>
      </div>

      {/* Online Members List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="py-2">
          {onlineMembers.map(member => (
            <div
              key={member.id}
              onClick={() => handleSelectUser(member)}
              className="flex items-center px-2 py-1 mx-2 rounded hover:bg-discord-background-secondary transition-colors cursor-pointer group"
            >
              {/* Avatar with Status Indicator */}
              <div className="relative mr-3">
                <div className="w-8 h-8 rounded-full bg-discord-accent flex items-center justify-center">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {member.username?.replace(/[^a-zA-Z0-9]/g, '')?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Status Indicator */}
                <div
                  className={`
                  absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-discord-secondary
                  ${getStatusColor(member.status)}
                `}
                />
              </div>

              {/* Username */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-discord-text truncate">
                  {member.username}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Offline Section Removed as per user request */}
      </div>
    </div>
  );
}
