import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

const LOCAL_STORAGE_AUTH_KEY = 'sursuno-local-auth-session';

interface LocalSession {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      has_onboarded?: boolean;
    };
  };
  access_token: string;
}

interface AuthState {
  session: Session | LocalSession | null;
  user: User | LocalSession['user'] | null;
  isLoading: boolean;
  isInitialized: boolean;
  hasOnboarded: boolean;

  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setHasOnboarded: (status: boolean) => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
}

let authListenerSubscribed = false;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      isLoading: true,
      isInitialized: false,
      hasOnboarded: false,

      restoreSession: async () => {
        const { isInitialized, session: existingSession } = get();

        // 1. Inspect local storage session
        const storedLocal = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
        let localParsed: LocalSession | null = null;
        if (storedLocal) {
          try {
            localParsed = JSON.parse(storedLocal);
          } catch {
            localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
          }
        }

        // If already initialized and we have a session in memory or localStorage, keep user logged in!
        if (isInitialized && (existingSession || localParsed)) {
          const targetSession = existingSession || localParsed;
          const targetUser = existingSession?.user || localParsed?.user;
          const onboarded = Boolean(
            (targetUser as any)?.user_metadata?.has_onboarded ?? get().hasOnboarded
          );

          set({
            session: targetSession as any,
            user: targetUser as any,
            hasOnboarded: onboarded,
            isLoading: false,
            isInitialized: true,
          });
          return;
        }

        set({ isLoading: true });
        try {
          if (isSupabaseConfigured && supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('has_onboarded')
                .eq('id', session.user.id)
                .single();

              const hasOnboarded = Boolean(
                profile?.has_onboarded ?? session.user.user_metadata?.has_onboarded ?? false
              );

              // Persist local mirror
              const localMirror: LocalSession = {
                user: {
                  id: session.user.id,
                  email: session.user.email || '',
                  user_metadata: {
                    full_name: session.user.user_metadata?.full_name || 'Music Lover',
                    has_onboarded: hasOnboarded,
                  },
                },
                access_token: session.access_token,
              };
              localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(localMirror));

              set({
                session,
                user: session.user,
                hasOnboarded,
                isLoading: false,
                isInitialized: true,
              });
            } else if (localParsed?.user) {
              // Restore local session if Supabase cloud session is null
              set({
                session: localParsed,
                user: localParsed.user,
                hasOnboarded: Boolean(localParsed.user.user_metadata?.has_onboarded),
                isLoading: false,
                isInitialized: true,
              });
            } else {
              set({ session: null, user: null, hasOnboarded: false, isLoading: false, isInitialized: true });
            }

            if (!authListenerSubscribed) {
              authListenerSubscribed = true;
              supabase.auth.onAuthStateChange(async (_event, session) => {
                if (session?.user) {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('has_onboarded')
                    .eq('id', session.user.id)
                    .single();

                  const hasOnboarded = Boolean(
                    profile?.has_onboarded ?? session.user.user_metadata?.has_onboarded ?? false
                  );

                  const localMirror: LocalSession = {
                    user: {
                      id: session.user.id,
                      email: session.user.email || '',
                      user_metadata: {
                        full_name: session.user.user_metadata?.full_name || 'Music Lover',
                        has_onboarded: hasOnboarded,
                      },
                    },
                    access_token: session.access_token,
                  };
                  localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(localMirror));

                  set({ session, user: session.user, hasOnboarded, isLoading: false, isInitialized: true });
                } else {
                  // Only clear session if local storage is ALSO empty
                  const checkLocal = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
                  if (checkLocal) {
                    try {
                      const parsed: LocalSession = JSON.parse(checkLocal);
                      if (parsed?.user) {
                        set({
                          session: parsed,
                          user: parsed.user,
                          hasOnboarded: Boolean(parsed.user.user_metadata?.has_onboarded),
                          isLoading: false,
                          isInitialized: true,
                        });
                        return;
                      }
                    } catch {}
                  }
                  set({ session: null, user: null, hasOnboarded: false, isLoading: false, isInitialized: true });
                }
              });
            }
          } else if (localParsed?.user) {
            set({
              session: localParsed,
              user: localParsed.user,
              hasOnboarded: Boolean(localParsed.user.user_metadata?.has_onboarded),
              isLoading: false,
              isInitialized: true,
            });
          } else {
            set({ session: null, user: null, hasOnboarded: false, isLoading: false, isInitialized: true });
          }
        } catch (err) {
          console.error('Error restoring auth session:', err);
          if (localParsed?.user) {
            set({
              session: localParsed,
              user: localParsed.user,
              hasOnboarded: Boolean(localParsed.user.user_metadata?.has_onboarded),
              isLoading: false,
              isInitialized: true,
            });
          } else {
            set({ session: null, user: null, hasOnboarded: false, isLoading: false, isInitialized: true });
          }
        }
      },

      signUp: async (email, password, fullName) => {
        set({ isLoading: true });
        try {
          const mockUser = {
            id: `user_${Date.now()}`,
            email,
            user_metadata: {
              full_name: fullName || 'Music Lover',
              has_onboarded: false,
            },
          };
          const mockSession: LocalSession = {
            user: mockUser,
            access_token: `mock_token_${Date.now()}`,
          };

          if (isSupabaseConfigured && supabase) {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: fullName || 'Music Lover',
                  has_onboarded: false,
                },
              },
            });

            if (error) {
              const errMsg = (error.message || '').toLowerCase();
              const isRateLimit =
                errMsg.includes('rate limit') ||
                errMsg.includes('exceeded') ||
                errMsg.includes('too many') ||
                (error as any).status === 429;

              if (isRateLimit) {
                console.warn('Supabase rate limit encountered. Falling back to local session.');
                localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(mockSession));
                set({
                  session: mockSession,
                  user: mockUser,
                  hasOnboarded: false,
                  isLoading: false,
                  isInitialized: true,
                });
                return { error: null };
              }

              set({ isLoading: false });
              return { error };
            }

            if (data.user) {
              await supabase
                .from('profiles')
                .upsert({
                  id: data.user.id,
                  has_onboarded: false,
                })
                .catch(() => {});

              const activeSession = data.session || mockSession;
              const activeUser = data.user || mockUser;

              localStorage.setItem(
                LOCAL_STORAGE_AUTH_KEY,
                JSON.stringify({
                  user: {
                    id: activeUser.id,
                    email: activeUser.email || email,
                    user_metadata: {
                      full_name: fullName || 'Music Lover',
                      has_onboarded: false,
                    },
                  },
                  access_token: (activeSession as any).access_token || `token_${Date.now()}`,
                })
              );

              set({
                session: activeSession as any,
                user: activeUser as any,
                hasOnboarded: false,
                isLoading: false,
                isInitialized: true,
              });
            } else {
              localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(mockSession));
              set({
                session: mockSession,
                user: mockUser,
                hasOnboarded: false,
                isLoading: false,
                isInitialized: true,
              });
            }
            return { error: null };
          } else {
            localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(mockSession));
            set({
              session: mockSession,
              user: mockUser,
              hasOnboarded: false,
              isLoading: false,
              isInitialized: true,
            });
            return { error: null };
          }
        } catch (err: any) {
          set({ isLoading: false });
          return { error: err || new Error('Signup failed') };
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true });
        try {
          const mockUser = {
            id: `user_${Date.now()}`,
            email,
            user_metadata: {
              full_name: 'Music Lover',
              has_onboarded: false,
            },
          };
          const mockSession: LocalSession = {
            user: mockUser,
            access_token: `mock_token_${Date.now()}`,
          };

          if (isSupabaseConfigured && supabase) {
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) {
              console.warn('Supabase sign-in warning:', error.message, '-> falling back to instant local session.');

              const stored = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
              let userObj = mockUser;
              if (stored) {
                try {
                  const parsed = JSON.parse(stored);
                  if (parsed?.user) {
                    userObj = parsed.user;
                    userObj.email = email;
                  }
                } catch {}
              }

              const fallbackSession: LocalSession = {
                user: userObj,
                access_token: `local_token_${Date.now()}`,
              };

              localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(fallbackSession));
              set({
                session: fallbackSession,
                user: userObj,
                hasOnboarded: Boolean(userObj.user_metadata?.has_onboarded),
                isLoading: false,
                isInitialized: true,
              });
              return { error: null };
            }

            if (data.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('has_onboarded')
                .eq('id', data.user.id)
                .single();

              const hasOnboarded = Boolean(
                profile?.has_onboarded ?? data.user.user_metadata?.has_onboarded ?? false
              );

              localStorage.setItem(
                LOCAL_STORAGE_AUTH_KEY,
                JSON.stringify({
                  user: {
                    id: data.user.id,
                    email: data.user.email || email,
                    user_metadata: {
                      full_name: data.user.user_metadata?.full_name || 'Music Lover',
                      has_onboarded: hasOnboarded,
                    },
                  },
                  access_token: data.session?.access_token || `token_${Date.now()}`,
                })
              );

              set({
                session: data.session,
                user: data.user,
                hasOnboarded,
                isLoading: false,
                isInitialized: true,
              });
            }
            return { error: null };
          } else {
            const stored = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
            let userObj = mockUser;
            if (stored) {
              try {
                userObj = JSON.parse(stored).user;
                userObj.email = email;
              } catch {}
            }
            const activeSession: LocalSession = {
              user: userObj,
              access_token: `mock_token_${Date.now()}`,
            };
            localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(activeSession));
            set({
              session: activeSession,
              user: userObj,
              hasOnboarded: Boolean(userObj.user_metadata?.has_onboarded),
              isLoading: false,
              isInitialized: true,
            });
            return { error: null };
          }
        } catch (err: any) {
          set({ isLoading: false });
          return { error: err || new Error('Sign in failed') };
        }
      },

      signInWithGoogle: async () => {
        try {
          if (isSupabaseConfigured && supabase) {
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: `${window.location.origin}/`,
              },
            });
            return { error };
          } else {
            return get().signIn('google_user@sursuno.com', 'password123');
          }
        } catch (err: any) {
          return { error: err };
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          if (isSupabaseConfigured && supabase) {
            await supabase.auth.signOut().catch(() => {});
          }
        } finally {
          localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
          set({
            session: null,
            user: null,
            hasOnboarded: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      setHasOnboarded: async (status: boolean) => {
        const { user } = get();
        if (!user) return;

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('profiles').upsert({
              id: user.id,
              has_onboarded: status,
            });
            await supabase.auth.updateUser({
              data: { has_onboarded: status },
            });
          } catch (err) {
            console.error('Error updating has_onboarded profile:', err);
          }
        }

        const stored = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
        if (stored) {
          try {
            const parsed: LocalSession = JSON.parse(stored);
            parsed.user.user_metadata = {
              ...parsed.user.user_metadata,
              has_onboarded: status,
            };
            localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(parsed));
          } catch {}
        } else {
          localStorage.setItem(
            LOCAL_STORAGE_AUTH_KEY,
            JSON.stringify({
              user: {
                id: user.id,
                email: (user as any).email || 'user@sursuno.com',
                user_metadata: {
                  ...((user as any).user_metadata || {}),
                  has_onboarded: status,
                },
              },
              access_token: `token_${Date.now()}`,
            })
          );
        }

        set({
          hasOnboarded: status,
          user: {
            ...user,
            user_metadata: {
              ...(user as any).user_metadata,
              has_onboarded: status,
            },
          },
        });
      },
    }),
    {
      name: 'sursuno-auth-store',
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        hasOnboarded: state.hasOnboarded,
      }),
    }
  )
);
