import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserStatus } from '@aurora/shared';
import { createClient } from '../supabase/client';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  lastSignupAttempt: number | null;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      lastSignupAttempt: null,

      // Actions
      signIn: async (email: string, password: string) => {
        console.log('AuthStore: signIn attempt for:', email);
        set({ isLoading: true, error: null });

        try {
          const supabase = createClient();

          console.log('AuthStore: Calling Supabase signInWithPassword...');
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('AuthStore: Supabase signIn error:', error);
            throw error;
          }

          console.log('AuthStore: Supabase signIn successful for:', data.user?.id);

          // Set authenticated immediately after successful auth
          if (data.user) {
            // Create basic user object from auth data as fallback
            const basicUser: User = {
              id: data.user.id,
              username: data.user.email?.split('@')[0] || 'User',
              avatarUrl: null,
              status: 'online',
              customStatus: null,
              createdAt: data.user.created_at,
              email: data.user.email,
              phone: data.user.phone,
            };

            console.log('AuthStore: Setting initial authenticated state');
            // Set authenticated state immediately with basic user data
            set({
              user: basicUser,
              isAuthenticated: true,
              isLoading: false,
            });

            // Try to fetch full profile in background, but don't block on it
            (async () => {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('id, username, avatar_url, status, custom_status, created_at')
                  .eq('id', data.user.id)
                  .single();

                if (profile) {
                  console.log('AuthStore: Profile fetched and updated');
                  set({
                    user: {
                      id: profile.id,
                      username: profile.username || 'Unknown',
                      avatarUrl: profile.avatar_url,
                      status: profile.status as UserStatus,
                      customStatus: profile.custom_status,
                      createdAt: profile.created_at,
                      email: data.user.email,
                      phone: data.user.phone,
                    }
                  });
                }
              } catch (profileError) {
                console.warn('AuthStore: Profile fetch failed (background):', profileError);
              }
            })();
          }
        } catch (error) {
          console.error('AuthStore: Catching sign in error:', error);
          set({
            error: error instanceof Error ? error.message : 'Sign in failed',
            isLoading: false,
            isAuthenticated: false,
          });
        }
      },

      signUp: async (email: string, password: string, username: string) => {
        const { lastSignupAttempt } = useAuthStore.getState();
        const now = Date.now();
        const COOLDOWN = 60000; // 60 seconds

        if (lastSignupAttempt && now - lastSignupAttempt < COOLDOWN) {
          const remaining = Math.ceil((COOLDOWN - (now - lastSignupAttempt)) / 1000);
          set({ error: `Please wait ${remaining} seconds before trying again.` });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const supabase = createClient();

          // Check if username is taken
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .maybeSingle();

          if (existingUser) {
            throw new Error('Username is already taken');
          }

          // Sign up user with profile data
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
              data: {
                username,
              },
            },
          });

          if (error) {
            // Check for rate limit error
            if (error.message.includes('rate limit exceeded')) {
              throw new Error('Email rate limit exceeded. Please try again in an hour or increase your limits in the Supabase Dashboard (Authentication -> Settings -> Rate Limits).');
            }
            throw error;
          }

          set({ lastSignupAttempt: Date.now() });

          if (data.user) {
            // Wait a moment for the trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 500));

            // Fetch the created profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, username, avatar_url, status, custom_status, created_at')
              .eq('id', data.user.id)
              .single();

            if (profileError || !profile) {
              // If profile doesn't exist yet, create it via API (bypassing RLS)
              try {
                const response = await fetch('/api/auth/create-profile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: data.user.id, username }),
                });

                if (!response.ok) {
                  const errorDat = await response.json();
                  console.error('Profile creation API failed:', errorDat);
                  // Don't throw here to avoid blocking client state, but log it
                }
              } catch (apiError) {
                console.error('Profile creation API call failed:', apiError);
              }

              // No need to insert manually anymore
              const insertError = null;

              set({
                user: {
                  id: data.user.id,
                  username,
                  avatarUrl: null,
                  status: 'online',
                  customStatus: null,
                  createdAt: data.user.created_at,
                  email: data.user.email,
                  phone: data.user.phone,
                },
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              set({
                user: {
                  id: profile.id,
                  username: profile.username || 'Unknown',
                  avatarUrl: profile.avatar_url,
                  status: profile.status as UserStatus,
                  customStatus: profile.custom_status,
                  createdAt: profile.created_at,
                  email: data.user.email,
                  phone: data.user.phone,
                },
                isAuthenticated: true,
                isLoading: false,
              });
            }
          }
        } catch (error: any) {
          console.error('Signup error:', error);
          set({
            error: error instanceof Error ? error.message : 'Sign up failed',
            isLoading: false,
          });
        }
      },

      signOut: async () => {
        try {
          const supabase = createClient();

          await supabase.auth.signOut();

          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        } catch (error) {
          console.error('Sign out error:', error);
          // Still clear state even if sign out fails
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
    }),
    {
      name: 'aurora-auth-storage',
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastSignupAttempt: state.lastSignupAttempt,
      }),
    }
  )
);
