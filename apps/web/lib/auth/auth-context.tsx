'use client';

import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '../supabase/client';
import { useAuthStore, type AuthState, type AuthActions } from './auth-store';

type AuthContextType = AuthState & Omit<AuthActions, 'setLoading' | 'setUser'>;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    lastSignupAttempt,
    signIn,
    signUp,
    signOut,
    clearError,
    setUser,
  } = useAuthStore();

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: onAuthStateChange event:', event);

      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
          // 1. Set fallback user immediately to unblock navigation
          const fallbackUser = {
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'User',
            avatarUrl: null,
            status: 'online' as const,
            customStatus: null,
            createdAt: session.user.created_at,
            email: session.user.email,
            phone: session.user.phone,
          };

          setUser(fallbackUser);

          // 2. Fetch full profile in background
          (async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, status, custom_status, created_at')
                .eq('id', session.user.id)
                .single();

              if (profile) {
                setUser({
                  id: profile.id,
                  username: profile.username || 'Unknown',
                  avatarUrl: profile.avatar_url,
                  status: 'online',
                  customStatus: profile.custom_status,
                  createdAt: profile.created_at,
                  email: session.user.email,
                  phone: session.user.phone,
                });

                // Ensure status is updated in DB
                await supabase
                  .from('profiles')
                  .update({ status: 'online' })
                  .eq('id', session.user.id);
              }
            } catch (err) {
              console.warn('AuthContext: Profile fetch failed (background):', err);
            }
          })();
        }
      } else {
        // No session found - clear auth state if we were thought to be authenticated
        console.log('AuthContext: No session found, clearing state. Event:', event);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    lastSignupAttempt,
    signIn,
    signUp,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
