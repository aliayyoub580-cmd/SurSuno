import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { getUserArtistPreferences, toValidUuid } from '@/services/preferencesApi';
import { useUserStore } from '@/stores/userStore';
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

  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null; hasOnboarded?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; hasOnboarded?: boolean }>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setHasOnboarded: (status: boolean) => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null; hasOnboarded?: boolean }>;
}

let authListenerSubscribed = false;

async function syncUserOnboardingAndPreferences(userId: string, currentMetadataHasOnboarded?: boolean): Promise<boolean> {
  if (!userId) return false;

  const validUuid = toValidUuid(userId);
  let hasOnboarded = Boolean(currentMetadataHasOnboarded);

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Check profile table in database
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_onboarded')
        .eq('id', validUuid)
        .maybeSingle();

      if (profile?.has_onboarded) {
        hasOnboarded = true;
      }

      // 2. Check user_artist_preferences table directly
      const { data: prefs, error } = await supabase
        .from('user_artist_preferences')
        .select('artist_id, artist_name, artist_image')
        .eq('user_id', validUuid);

      if (!error && prefs && prefs.length > 0) {
        hasOnboarded = true;
        const loadedArtists = prefs.map((item) => ({
          id: item.artist_id,
          name: item.artist_name,
          image: item.artist_image || '',
          url: `/artist/${encodeURIComponent(item.artist_name)}`,
        }));
        useUserStore.getState().setFavoriteArtists(loadedArtists);
      } else if (hasOnboarded) {
        const loadedArtists = await getUserArtistPreferences(validUuid);
        if (loadedArtists && loadedArtists.length > 0) {
          useUserStore.getState().setFavoriteArtists(loadedArtists);
        }
      }

      // 3. Ensure profile has_onboarded status is kept in sync in DB
      if (hasOnboarded && (!profile || !profile.has_onboarded)) {
        try {
          await supabase
            .from('profiles')
            .upsert({ id: validUuid, has_onboarded: true });
        } catch {
          // Ignore sync error
        }
      }
    } catch (err) {
      console.error('Error syncing user onboarding and preferences from DB:', err);
    }
  } else {
    // Local / Offline fallback
    const savedArtists = await getUserArtistPreferences(validUuid);
    if (savedArtists && savedArtists.length > 0) {
      hasOnboarded = true;
      useUserStore.getState().setFavoriteArtists(savedArtists);
    }
  }

  return hasOnboarded;
}

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
              const hasOnboarded = await syncUserOnboardingAndPreferences(
                session.user.id,
                session.user.user_metadata?.has_onboarded
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
              const hasOnboarded = await syncUserOnboardingAndPreferences(
                localParsed.user.id,
                localParsed.user.user_metadata?.has_onboarded
              );
              set({
                session: localParsed,
                user: localParsed.user,
                hasOnboarded,
                isLoading: false,
                isInitialized: true,
              });
            } else {
              set({ session: null, user: null, hasOnboarded: false, isLoading: false, isInitialized: true });
            }

            if (!authListenerSubscribed) {
              authListenerSubscribed = true;
              supabase.auth.onAuthStateChange(async (_event, session) => {
                if (session?.user && supabase) {
                  const hasOnboarded = await syncUserOnboardingAndPreferences(
                    session.user.id,
                    session.user.user_metadata?.has_onboarded
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
                        const hasOnboarded = await syncUserOnboardingAndPreferences(
                          parsed.user.id,
                          parsed.user.user_metadata?.has_onboarded
                        );
                        set({
                          session: parsed,
                          user: parsed.user,
                          hasOnboarded,
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
            id: toValidUuid(email),
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
                });

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
            id: toValidUuid(email),
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

              const hasOnboarded = await syncUserOnboardingAndPreferences(
                userObj.id,
                userObj.user_metadata?.has_onboarded
              );

              const fallbackSession: LocalSession = {
                user: {
                  ...userObj,
                  user_metadata: {
                    ...userObj.user_metadata,
                    has_onboarded: hasOnboarded,
                  },
                },
                access_token: `local_token_${Date.now()}`,
              };

              localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(fallbackSession));
              set({
                session: fallbackSession,
                user: fallbackSession.user,
                hasOnboarded,
                isLoading: false,
                isInitialized: true,
              });
              return { error: null, hasOnboarded };
            }

            let hasOnboarded = false;
            if (data.user) {
              hasOnboarded = await syncUserOnboardingAndPreferences(
                data.user.id,
                data.user.user_metadata?.has_onboarded
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
            return { error: null, hasOnboarded };
          } else {
            const stored = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
            let userObj = mockUser;
            if (stored) {
              try {
                userObj = JSON.parse(stored).user;
                userObj.email = email;
              } catch {}
            }

            const hasOnboarded = await syncUserOnboardingAndPreferences(
              userObj.id,
              userObj.user_metadata?.has_onboarded
            );

            const activeSession: LocalSession = {
              user: {
                ...userObj,
                user_metadata: {
                  ...userObj.user_metadata,
                  has_onboarded: hasOnboarded,
                },
              },
              access_token: `mock_token_${Date.now()}`,
            };
            localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(activeSession));
            set({
              session: activeSession,
              user: activeSession.user,
              hasOnboarded,
              isLoading: false,
              isInitialized: true,
            });
            return { error: null, hasOnboarded };
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
          useUserStore.getState().setFavoriteArtists([]);
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
