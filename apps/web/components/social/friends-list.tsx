'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useChatWebSocket } from '@/lib/websocket/websocket-hooks';

type FriendStatus = 'online' | 'all' | 'pending' | 'blocked' | 'discover';

interface Friend {
    id: string;
    username: string;
    avatar_url?: string | null;
    status: string;
    friend_status: 'pending' | 'accepted' | 'blocked' | 'none';
}

export function FriendsList() {
    const { user } = useAuth();
    const [activeTab, _setActiveTab] = useState<FriendStatus>('online');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchFriends = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // Simplified friend fetching for now - fetching all profiles as potential friends
                // In a real app, this would join with the 'friends' table
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url, status')
                    .neq('id', user.id);

                if (error) throw error;
                if (data) {
                    setFriends(data.map(f => ({
                        ...f,
                        friend_status: 'accepted' // Default for demonstration
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch friends:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFriends();
    }, [user, supabase]);

    // Listen for presence updates
    const { onPresenceUpdate } = useChatWebSocket();

    useEffect(() => {
        const unsubscribe = onPresenceUpdate(({ userId, status }) => {
            setFriends(prevFriends =>
                prevFriends.map(friend =>
                    friend.id === userId ? { ...friend, status } : friend
                )
            );
        });
        return unsubscribe;
    }, [onPresenceUpdate]);

    const handleMessage = async (friendId: string) => {
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantId: friendId })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(`Error: ${data.details || data.error || 'Unknown error'}`);
                return;
            }
            if (data.conversationId) {
                router.push(`/channels/me/${data.conversationId}`);
            }
        } catch (error) {
            console.error('Failed to start conversation:', error);
            alert('Error starting conversation: ' + (error instanceof Error ? error.message : String(error)));
        }
    };

    const filteredFriends = friends.filter(friend => {
        if (activeTab === 'online') return friend.status !== 'offline';
        if (activeTab === 'all') return true;
        if (activeTab === 'pending') return friend.friend_status === 'pending';
        if (activeTab === 'blocked') return friend.friend_status === 'blocked';
        if (activeTab === 'discover') return true; // Show everyone in discover
        return true;
    });

    return (
        <div className="flex-1 flex flex-col bg-discord-background">


            <div className="flex-1 overflow-y-auto p-4">
                <div className="text-xs font-semibold text-discord-text-muted uppercase tracking-wider mb-4">
                    {activeTab} — {filteredFriends.length}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="animate-spin w-8 h-8 border-4 border-discord-accent border-t-transparent rounded-full" />
                    </div>
                ) : filteredFriends.length > 0 ? (
                    <div className="space-y-1">
                        {filteredFriends.map(friend => (
                            <div
                                key={friend.id}
                                className="group flex items-center justify-between p-2 rounded hover:bg-discord-background-tertiary transition-colors cursor-pointer border-t border-discord-background-tertiary first:border-t-0"
                            >
                                <div className="flex items-center">
                                    <div className="relative mr-3">
                                        <div className="w-10 h-10 rounded-full bg-discord-accent flex items-center justify-center text-white font-bold">
                                            {friend.avatar_url ? (
                                                <img src={friend.avatar_url} alt={friend.username} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                friend.username?.[0]?.toUpperCase()
                                            )}
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-discord-background ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                                    </div>
                                    <div>
                                        <div className="text-discord-text font-bold">{friend.username}</div>
                                        <div className="text-xs text-discord-text-muted">{friend.status}</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMessage(friend.id); }}
                                        className="p-2 bg-discord-background-secondary text-discord-text-muted hover:text-discord-text rounded-full transition-colors"
                                        title="Message"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                        </svg>
                                    </button>
                                    <button
                                        className="p-2 bg-discord-background-secondary text-discord-text-muted hover:text-discord-text rounded-full transition-colors"
                                        title="More"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full opacity-60">
                        <img src="https://discord.com/assets/f473062366547199419b.svg" alt="No friends" className="w-80 mb-8" />
                        <p className="text-discord-text-muted mb-4">Wumpus is waiting for friends. You don't have to though!</p>
                        <button className="bg-discord-accent text-white px-6 py-2 rounded font-medium hover:bg-discord-accent-hover transition-colors">
                            Add Friend
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
