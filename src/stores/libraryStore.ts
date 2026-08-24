import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song } from '@/types';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  songs: Song[];
  createdAt: number;
}

interface LibraryState {
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string, coverImage?: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      playlists: [],

      createPlaylist: (name, description = '', coverImage = '') => {
        const newPl: Playlist = {
          id: `pl_${Date.now()}`,
          name: name.trim(),
          description: description.trim(),
          coverImage,
          songs: [],
          createdAt: Date.now(),
        };
        set((s) => ({ playlists: [newPl, ...s.playlists] }));
        return newPl;
      },

      deletePlaylist: (id) =>
        set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),

      renamePlaylist: (id, name) =>
        set((s) => ({
          playlists: s.playlists.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      addSongToPlaylist: (playlistId, song) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId && !p.songs.some((sng) => sng.id === song.id)
              ? { ...p, songs: [song, ...p.songs] }
              : p
          ),
        })),

      removeSongFromPlaylist: (playlistId, songId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, songs: p.songs.filter((sng) => sng.id !== songId) }
              : p
          ),
        })),
    }),
    {
      name: 'sursuno-playlists',
    }
  )
);
