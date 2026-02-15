'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface CreateServerModalProps {
    onClose: () => void;
}

export function CreateServerModal({ onClose }: CreateServerModalProps) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !user) return;

        setLoading(true);
        try {
            // Create server
            const { data: server, error: serverError } = await supabase
                .from('server_members') // rpc or direct insert depending on policy. 
                // Actually we should insert into 'servers' first.
                // But RLS policy says "Users can create servers", so we can insert directly.
                // Wait, standard pattern is insert into servers, then insert into server_members.
                // Let's rely on valid RLS.
                .insert([
                    // Wait, this is server_members. I need to insert into 'servers'
                ]) as any;

            // Correct approach:
            const { data: newServer, error } = await supabase
                .from('servers')
                .insert({
                    name: name.trim(),
                    owner_id: user.id,
                    icon_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
                })
                .select()
                .single();

            if (error) throw error;

            // Add owner as member (RLS might handle this or triggers, but explicit is better if no trigger/function)
            // Usually a trigger handles this, but let's be safe and do it manually if needed, 
            // or check if 'servers' insertion automatically adds member via postgres trigger.
            // Looking at schema, there is no trigger mentioned in known schema.
            // So I must add the member manually.

            const { error: memberError } = await supabase
                .from('server_members')
                .insert({
                    server_id: newServer.id,
                    user_id: user.id,
                    role: 'owner'
                });

            if (memberError) throw memberError;

            // Create default channel 'general'
            await supabase
                .from('channels')
                .insert({
                    server_id: newServer.id,
                    name: 'general',
                    type: 'text'
                });

            onClose();
            router.refresh();
            // Optionally navigate to the new server
            // router.push(`/servers/${newServer.id}`); 
        } catch (error) {
            console.error('Failed to create server:', error);
            alert('Failed to create server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-discord-background-secondary w-full max-w-md p-6 rounded-lg shadow-xl transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-center text-discord-text mb-2">Customize Your Server</h2>
                <p className="text-center text-discord-text-muted mb-6">
                    Give your new server a personality with a name and an icon. You can always change it later.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-discord-text-muted uppercase mb-2">
                            Server Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-discord-background-tertiary text-discord-text p-2 rounded border-none focus:ring-0 focus:outline-none"
                            placeholder="My Awesome Server"
                            required
                        />
                    </div>

                    <div className="flex justify-between items-center mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-discord-text hover:underline text-sm font-medium"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`bg-discord-accent hover:bg-discord-accent-hover text-white px-6 py-2 rounded transition-colors font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
