'use client';

import { useState, useEffect } from 'react';

interface UserSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectUser: (user: any) => void;
}

export function UserSearchModal({ isOpen, onClose, onSelectUser }: UserSearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const searchUsers = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data.profiles || []);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(searchUsers, 300);
        return () => clearTimeout(timer);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 bg-whatsapp-header-bg border-b border-whatsapp-border flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-whatsapp-text">New Chat</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-whatsapp-text-muted hover:text-whatsapp-teal transition-colors"
                        aria-label="Close dialog"
                        title="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-whatsapp-text-muted group-focus-within:text-whatsapp-teal transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search by username..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-whatsapp-sidebar-bg text-whatsapp-text pl-10 pr-4 py-2.5 rounded-lg border border-transparent focus:border-whatsapp-teal focus:bg-white focus:ring-1 focus:ring-whatsapp-teal outline-none transition-all shadow-sm"
                        />
                        {isLoading && (
                            <div className="absolute right-3 top-2.5">
                                <div className="animate-spin h-5 w-5 border-2 border-whatsapp-teal border-t-transparent rounded-full" />
                            </div>
                        )}
                    </div>

                    <div className="mt-6 max-h-80 overflow-y-auto space-y-1 custom-scrollbar">
                        {results.length > 0 ? (
                            results.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => onSelectUser(user)}
                                    className="flex items-center p-3 rounded-xl hover:bg-whatsapp-active-item cursor-pointer group transition-all"
                                >
                                    <div className="w-12 h-12 rounded-full bg-whatsapp-teal flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0 shadow-sm">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            user.username?.[0]?.toUpperCase()
                                        )}
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <div className="text-whatsapp-text font-semibold">{user.username}</div>
                                        <div className="text-xs text-whatsapp-text-muted">Hey there! I am using Aurora.</div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-whatsapp-teal text-sm font-medium">Start chat</span>
                                    </div>
                                </div>
                            ))
                        ) : query.length >= 2 && !isLoading ? (
                            <div className="text-center py-12">
                                <div className="text-whatsapp-text-muted font-light mb-2">No users found for "{query}"</div>
                                <div className="text-xs text-whatsapp-text-muted">Check the spelling or try another name.</div>
                            </div>
                        ) : query.length < 2 ? (
                            <div className="text-center py-12 text-whatsapp-text-muted font-light text-sm">
                                Type at least 2 characters to search for contacts
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
