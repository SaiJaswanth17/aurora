'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
// import { useDebounce } from '@/lib/hooks/use-debounce'; // Assuming this exists or I will just use setTimeout

// Simple debounce hook if not exists
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

interface SearchModalProps {
    onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{
        users: any[];
        servers: any[];
        channels: any[];
    }>({ users: [], servers: [], channels: [] });
    const [loading, setLoading] = useState(false);

    const debouncedQuery = useDebounceValue(query, 300);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedQuery.trim()) {
                setResults({ users: [], servers: [], channels: [] });
                return;
            }

            setLoading(true);
            try {
                // Search Users
                const { data: users } = await supabase
                    .from('profiles')
                    .select('*')
                    .ilike('username', `%${debouncedQuery}%`)
                    .limit(5);

                // Search Servers (public ones or ones user is in? For now simple search on servers table)
                // Assuming RLS allows viewing servers
                const { data: servers } = await supabase
                    .from('servers')
                    .select('*')
                    .ilike('name', `%${debouncedQuery}%`)
                    .limit(5);

                // Channels (maybe too complex for now, stick to Users/Servers)

                setResults({
                    users: users || [],
                    servers: servers || [],
                    channels: []
                });
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [debouncedQuery]);

    const handleNavigate = (type: 'user' | 'server', id: string) => {
        if (type === 'user') {
            // Start DM logic - usually handled by creating a conversation
            // For now, let's just create conversation and route
            // We can use the existing API or just route to /channels/me and let UI handle it, 
            // but ideally we should have a `startConversation` function available.
            // I'll leave this as a TODO or basic redirect to a "loading" state that creates DM.

            // Simpler: Redirect to a URL that handles this or call API
            fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantId: id })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.conversationId) {
                        router.push(`/channels/me/${data.conversationId}`);
                        onClose();
                    }
                });
        } else {
            router.push(`/channels/${id}`);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-discord-background-secondary w-full max-w-lg rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[600px]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-discord-background-tertiary">
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search users or servers..."
                        className="w-full bg-transparent text-xl text-discord-text placeholder-discord-text-muted outline-none"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading && <div className="p-4 text-center text-discord-text-muted">Searching...</div>}

                    {!loading && !results.users.length && !results.servers.length && query && (
                        <div className="p-4 text-center text-discord-text-muted">No results found</div>
                    )}

                    {results.users.length > 0 && (
                        <div className="mb-4">
                            <h3 className="px-2 mb-2 text-xs font-bold text-discord-text-muted uppercase">Users</h3>
                            {results.users.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => handleNavigate('user', user.id)}
                                    className="flex items-center px-2 py-2 rounded hover:bg-discord-background-modifier-hover cursor-pointer text-discord-text-normal group"
                                >
                                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}`} className="w-6 h-6 rounded-full mr-3" />
                                    <span>{user.username}</span>
                                    <span className="ml-auto text-xs text-discord-text-muted opacity-0 group-hover:opacity-100">Jump to DM</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {results.servers.length > 0 && (
                        <div className="mb-4">
                            <h3 className="px-2 mb-2 text-xs font-bold text-discord-text-muted uppercase">Servers</h3>
                            {results.servers.map(server => (
                                <div
                                    key={server.id}
                                    onClick={() => handleNavigate('server', server.id)}
                                    className="flex items-center px-2 py-2 rounded hover:bg-discord-background-modifier-hover cursor-pointer text-discord-text-normal group"
                                >
                                    <div className="w-6 h-6 rounded-full bg-discord-background-tertiary flex items-center justify-center mr-3 text-xs overflow-hidden">
                                        {server.icon_url ? <img src={server.icon_url} className="w-full h-full object-cover" /> : server.name[0]}
                                    </div>
                                    <span>{server.name}</span>
                                    <span className="ml-auto text-xs text-discord-text-muted opacity-0 group-hover:opacity-100">Jump to Server</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-2 bg-discord-background-tertiary text-xs text-discord-text-muted flex justify-between">
                    <span><strong>Enter</strong> to select</span>
                    <span><strong>Esc</strong> to close</span>
                </div>
            </div>
        </div>
    );
}
