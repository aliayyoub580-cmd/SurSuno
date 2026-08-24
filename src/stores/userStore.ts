import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song } from '@/types';

export interface UserPreferences {
  languages: Record<string, number>;
  artists: Record<string, number>;
  genres: Record<string, number>;
}

interface UserState {
  favorites: string[];
  favoriteSongs: Song[];
  recentlyPlayed: Song[];
  searchHistory: string[];
  userPreferences: UserPreferences;
  skippedTrackIds: string[];

  toggleFavorite: (song: Song) => void;
  addFavorite: (song: Song | string) => void;
  removeFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
  addToRecentlyPlayed: (song: Song) => void;
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  clearRecentlyPlayed: () => void;
  recordMusicInteraction: (params: { song: Song; eventType: string; completionRate?: number }) => void;
  getTopPreferences: () => { topLanguages: string[]; topArtists: string[]; topGenres: string[] };
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      favorites: [],
      favoriteSongs: [],
      recentlyPlayed: [],
      searchHistory: [],
      userPreferences: {
        languages: {},
        artists: {},
        genres: {},
      },
      skippedTrackIds: [],

      toggleFavorite: (song) => {
        const { favorites, favoriteSongs } = get();
        if (favorites.includes(song.id)) {
          set({
            favorites: favorites.filter((id) => id !== song.id),
            favoriteSongs: favoriteSongs.filter((s) => s.id !== song.id),
          });
        } else {
          set({
            favorites: [song.id, ...favorites],
            favoriteSongs: [song, ...favoriteSongs.filter((s) => s.id !== song.id)],
          });
        }
      },

      addFavorite: (songOrId) => {
        if (typeof songOrId === 'string') {
          const songId = songOrId;
          set((s) => ({
            favorites: s.favorites.includes(songId) ? s.favorites : [songId, ...s.favorites],
          }));
        } else {
          const song = songOrId;
          set((s) => ({
            favorites: s.favorites.includes(song.id) ? s.favorites : [song.id, ...s.favorites],
            favoriteSongs: s.favoriteSongs.some((f) => f.id === song.id) ? s.favoriteSongs : [song, ...s.favoriteSongs],
          }));
        }
      },

      removeFavorite: (songId) =>
        set((s) => ({
          favorites: s.favorites.filter((id) => id !== songId),
          favoriteSongs: s.favoriteSongs.filter((sng) => sng.id !== songId),
        })),

      isFavorite: (songId) => get().favorites.includes(songId),

      addToRecentlyPlayed: (song) =>
        set((s) => {
          const updated = [song, ...s.recentlyPlayed.filter((r) => r.id !== song.id)].slice(0, 50);
          return { recentlyPlayed: updated };
        }),

      addToSearchHistory: (query) =>
        set((s) => {
          const trimmed = query.trim().toLowerCase();
          if (!trimmed) return s;
          const updated = [trimmed, ...s.searchHistory.filter((q) => q !== trimmed)].slice(0, 20);
          return { searchHistory: updated };
        }),

      clearSearchHistory: () => set({ searchHistory: [] }),
      clearRecentlyPlayed: () => set({ recentlyPlayed: [] }),

      recordMusicInteraction: ({ song, eventType, completionRate = 0 }) => {
        if (!song) return;
        set((state) => {
          const prefs = {
            languages: { ...state.userPreferences.languages },
            artists: { ...state.userPreferences.artists },
            genres: { ...state.userPreferences.genres },
          };
          let scoreDelta = 0;

          if (eventType === 'play') scoreDelta = 5;
          else if (eventType === 'complete' || completionRate >= 0.8) scoreDelta = 15;
          else if (eventType === 'skip' || completionRate < 0.2) scoreDelta = -10;
          else if (eventType === 'favorite') scoreDelta = 25;
          else if (eventType === 'unfavorite') scoreDelta = -15;

          const lang = (song.language || 'hindi').toLowerCase();
          prefs.languages[lang] = Math.max(0, (prefs.languages[lang] || 0) + scoreDelta);

          const artistName = (song.primary_artists || song.singers || '').split(',')[0]?.trim().toLowerCase();
          if (artistName) {
            prefs.artists[artistName] = Math.max(0, (prefs.artists[artistName] || 0) + scoreDelta);
          }

          let newSkipped = state.skippedTrackIds;
          if (eventType === 'skip' || completionRate < 0.2) {
            newSkipped = [song.id, ...state.skippedTrackIds.filter((id) => id !== song.id)].slice(0, 30);
          }

          return { userPreferences: prefs, skippedTrackIds: newSkipped };
        });
      },

      getTopPreferences: () => {
        const { userPreferences } = get();
        const getTop = (map: Record<string, number>, limit = 3) =>
          Object.entries(map || {})
            .sort((a, b) => b[1] - a[1])
            .map((entry) => entry[0])
            .slice(0, limit);

        return {
          topLanguages: getTop(userPreferences.languages),
          topArtists: getTop(userPreferences.artists),
          topGenres: getTop(userPreferences.genres),
        };
      },
    }),
    { name: 'sursuno-user' }
  )
);
