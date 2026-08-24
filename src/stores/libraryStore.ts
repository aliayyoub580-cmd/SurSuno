import { create } from 'zustand';

interface LibraryState {
  playlists: {
    id: string;
    name: string;
    coverImage?: string;
    songIds: string[];
    createdAt: number;
  }[];
  createPlaylist: (name: string, coverImage?: string) => void;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  reorderPlaylist: (playlistId: string, songIds: string[]) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  playlists: [],

  createPlaylist: (name, coverImage) =>
    set((s) => ({
      playlists: [
        ...s.playlists,
        { id: `pl_${Date.now()}`, name, coverImage, songIds: [], createdAt: Date.now() },
      ],
    })),

  deletePlaylist: (id) =>
    set((s) => ({
      playlists: s.playlists.filter((p) => p.id !== id),
    })),

  renamePlaylist: (id, name) =>
    set((s) => ({
      playlists: s.playlists.map((p) => (p.id === id ? { ...p, name } : p)),
    })),

  addSongToPlaylist: (playlistId, songId) =>
    set((s) => ({
      playlists: s.playlists.map((p) =>
        p.id === playlistId && !p.songIds.includes(songId)
          ? { ...p, songIds: [...p.songIds, songId] }
          : p
      ),
    })),

  removeSongFromPlaylist: (playlistId, songId) =>
    set((s) => ({
      playlists: s.playlists.map((p) =>
        p.id === playlistId ? { ...p, songIds: p.songIds.filter((id) => id !== songId) } : p
      ),
    })),

  reorderPlaylist: (playlistId, songIds) =>
    set((s) => ({
      playlists: s.playlists.map((p) =>
        p.id === playlistId ? { ...p, songIds } : p
      ),
    })),
}));
