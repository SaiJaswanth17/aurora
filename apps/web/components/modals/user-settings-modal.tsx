'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useState } from 'react';

interface UserSettingsModalProps {
    onClose: () => void;
}

export function UserSettingsModal({ onClose }: UserSettingsModalProps) {
    const { user, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState('My Account');

    // Hardcoded handlers for now
    const handleEdit = (field: string) => alert(`Edit ${field} coming soon!`);
    const handleDelete = () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            alert('Account deletion request submitted.');
        }
    };

    const handleLogout = async () => {
        if (confirm('Are you sure you want to log out?')) {
            await signOut();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in duration-200">
            <div className="flex w-full h-full max-w-[1000px] max-h-[700px] bg-discord-background rounded lg:flex-row flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Sidebar */}
                <div className="w-[280px] bg-discord-background-secondary flex flex-col pt-10 pb-4 px-2">
                    <div className="px-4 mb-2">
                        <h2 className="text-xs font-bold text-discord-text-muted uppercase mb-2">User Settings</h2>
                    </div>

                    <div className="space-y-0.5">
                        {['My Account'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full text-left px-4 py-1.5 rounded text-base font-medium transition-colors ${activeTab === tab ? 'bg-discord-background-modifier-selected text-discord-text' : 'text-discord-text-muted hover:bg-discord-background-modifier-hover hover:text-discord-text'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="h-[1px] bg-discord-background-modifier-accent my-4 mx-4" />

                    {/* <div className="px-4 mb-2">
                        <h2 className="text-xs font-bold text-discord-text-muted uppercase mb-2">App Settings</h2>
                    </div>
                    <div className="space-y-0.5">
                        {['Appearance', 'Accessibility', 'Voice & Video', 'Notifications', 'Keybinds', 'Language'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full text-left px-4 py-1.5 rounded text-base font-medium transition-colors ${activeTab === tab ? 'bg-discord-background-modifier-selected text-discord-text' : 'text-discord-text-muted hover:bg-discord-background-modifier-hover hover:text-discord-text'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div> */}

                    <div className="h-[1px] bg-discord-background-modifier-accent my-4 mx-4" />

                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-1.5 rounded text-base font-medium text-discord-red hover:bg-discord-background-modifier-hover transition-colors flex items-center justify-between group"
                    >
                        Log Out
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-discord-background flex flex-col relative">
                    {/* Close Button */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col items-center">
                        <button
                            onClick={onClose}
                            className="flex flex-col items-center justify-center w-9 h-9 border-2 border-discord-text-muted rounded-full text-discord-text-muted hover:bg-discord-background-tertiary transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <span className="text-discord-text-muted text-xs font-bold mt-1 uppercase">ESC</span>
                    </div>

                    <div className="flex-1 overflow-y-auto px-10 py-14 no-scrollbar">
                        {activeTab === 'My Account' ? (
                            <div className="max-w-[660px]">
                                <h1 className="text-xl font-bold text-discord-text mb-6">My Account</h1>

                                {/* Profile Banner Card */}
                                <div className="bg-discord-background-secondary rounded-lg overflow-hidden mb-8">
                                    {/* Banner */}
                                    <div className="h-[100px] bg-discord-brand-experiment" style={{ backgroundColor: user?.username ? stringToColor(user.username) : '#5865F2' }}>
                                    </div>

                                    {/* User Info Stripe */}
                                    <div className="px-4 pb-4 relative">
                                        {/* Avatar */}
                                        <div className="absolute -top-[40px] left-4 p-1.5 bg-discord-background-secondary rounded-full">
                                            {user?.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="Avatar" className="w-[80px] h-[80px] rounded-full object-cover" />
                                            ) : (
                                                <div className="w-[80px] h-[80px] rounded-full bg-discord-brand-experiment flex items-center justify-center text-4xl font-bold text-white">
                                                    {user?.username?.replace(/[^a-zA-Z0-9]/g, '')?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-discord-background-secondary rounded-full"></div>
                                        </div>

                                        {/* Names and Badges */}
                                        <div className="ml-[100px] flex justify-between items-end pt-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-discord-text text-left">{user?.username || 'User'}</h3>
                                                {/* Tag Removed as requested */}
                                                <div className="text-discord-text-muted text-sm text-left"></div>
                                            </div>
                                            <button
                                                onClick={() => handleEdit('Profile')}
                                                className="bg-discord-brand-experiment hover:bg-discord-brand-experiment-hover text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
                                            >
                                                Edit User Profile
                                            </button>
                                        </div>

                                        {/* User Details Card inside the Card */}
                                        <div className="mt-6 bg-discord-background-tertiary rounded-lg p-4 space-y-4">
                                            <div className="flex justify-between items-center text-left">
                                                <div>
                                                    <div className="text-xs font-bold text-discord-text-muted uppercase mb-1">Display Name</div>
                                                    <div className="text-discord-text">{user?.username || 'User'}</div>
                                                </div>
                                                <button onClick={() => handleEdit('Display Name')} className="bg-discord-background-secondary hover:bg-discord-background-modifier-hover text-discord-text px-4 py-1.5 rounded text-sm font-medium">Edit</button>
                                            </div>
                                            <div className="flex justify-between items-center text-left">
                                                <div>
                                                    <div className="text-xs font-bold text-discord-text-muted uppercase mb-1">Username</div>
                                                    <div className="text-discord-text">{user?.username?.toLowerCase() || 'user'}</div>
                                                </div>
                                                <button onClick={() => handleEdit('Username')} className="bg-discord-background-secondary hover:bg-discord-background-modifier-hover text-discord-text px-4 py-1.5 rounded text-sm font-medium">Edit</button>
                                            </div>
                                            <div className="flex justify-between items-center text-left">
                                                <div>
                                                    <div className="text-xs font-bold text-discord-text-muted uppercase mb-1">Email</div>
                                                    <div className="text-discord-text">{user?.email || '************@gmail.com'} <span className="text-discord-link cursor-pointer ml-1 text-sm">Reveal</span></div>
                                                </div>
                                                <button onClick={() => handleEdit('Email')} className="bg-discord-background-secondary hover:bg-discord-background-modifier-hover text-discord-text px-4 py-1.5 rounded text-sm font-medium">Edit</button>
                                            </div>
                                            <div className="flex justify-between items-center text-left">
                                                <div>
                                                    <div className="text-xs font-bold text-discord-text-muted uppercase mb-1">Phone Number</div>
                                                    <div className="text-discord-text">{user?.phone || '**********999'} <span className="text-discord-link cursor-pointer ml-1 text-sm">Reveal</span></div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button onClick={() => handleEdit('Phone Number')} className="text-discord-text-muted hover:underline text-sm mr-2">Remove</button>
                                                    <button onClick={() => handleEdit('Phone Number')} className="bg-discord-background-secondary hover:bg-discord-background-modifier-hover text-discord-text px-4 py-1.5 rounded text-sm font-medium">Edit</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-discord-background-modifier-accent my-8" />

                                <div className="mb-8 text-left">
                                    <h2 className="text-lg font-bold text-discord-text mb-4">Password and Authentication</h2>
                                    <button
                                        onClick={() => handleEdit('Password')}
                                        className="bg-discord-brand-experiment hover:bg-discord-brand-experiment-hover text-white px-4 py-2 rounded text-sm font-medium transition-colors mb-4"
                                    >
                                        Change Password
                                    </button>

                                    <h3 className="text-xs font-bold text-discord-text-muted uppercase mb-2 mt-4">Authenticator App</h3>
                                    <div className="text-discord-text-muted text-sm mb-3">
                                        Protect your Discord account with an extra layer of security. Once configured, you'll be required to enter your password and complete one additional step in order to sign in.
                                    </div>
                                    <button
                                        onClick={() => handleEdit('MFA')}
                                        className="bg-discord-brand-experiment hover:bg-discord-brand-experiment-hover text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                    >
                                        Enable Authenticator App
                                    </button>

                                    <h3 className="text-xs font-bold text-discord-text-muted uppercase mb-2 mt-6">Security Keys</h3>
                                    <div className="text-discord-text-muted text-sm mb-3">
                                        Add an additional layer of protection to your account with a Security Key.
                                    </div>
                                    <button
                                        onClick={() => handleEdit('Security Key')}
                                        className="bg-discord-brand-experiment hover:bg-discord-brand-experiment-hover text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                    >
                                        Register a Security Key
                                    </button>
                                </div>

                                <div className="h-[1px] bg-discord-background-modifier-accent my-8" />

                                <div className="mb-8 text-left">
                                    <h2 className="text-lg font-bold text-discord-text mb-2">Account Removal</h2>
                                    <div className="text-discord-text-muted text-sm mb-4">
                                        Disabling your account means you can recover it at any time after taking this action.
                                    </div>
                                    <div className="flex space-x-4">
                                        <button
                                            onClick={() => handleDelete()}
                                            className="bg-discord-red hover:bg-discord-red-hover text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                        >
                                            Disable Account
                                        </button>
                                        <button
                                            onClick={() => handleDelete()}
                                            className="border border-discord-red text-discord-red hover:bg-discord-red hover:text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                        >
                                            Delete Account
                                        </button>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-discord-text-muted">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-discord-text mb-2">{activeTab}</h2>
                                    <p>Settings for {activeTab} are coming soon.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper for banner color
function stringToColor(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}
