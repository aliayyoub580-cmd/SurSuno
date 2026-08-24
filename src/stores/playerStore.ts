import { create } from 'zustand';
import type { PlayerTrack, Song } from '@/types';
import { getRelatedSongs, getPersonalizedRecommendations } from '@/services/recommendationService';

export type QueueSource =
  | 'search'
  | 'album'
  | 'playlist'
  | 'artist'
  | 'genre'
  | 'trending'
  | 'recommendation'
  | 'radio';

type RepeatMode = 'none' | 'one' | 'all';

const QUEUE_THRESHOLD = 2;

interface PlayerState {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  queueIndex: number;
  queueSource: QueueSource;
  isLoadingMoreRecommendations: boolean;
  sessionQueueHistory: string[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  isFullPlayerOpen: boolean;
  showMiniPlayer: boolean;

  setTrack: (track: PlayerTrack, source?: QueueSource) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setQueue: (tracks: PlayerTrack[], startIndex?: number, source?: QueueSource) => void;
  extendQueue: (newTracks: Song[]) => void;
  fetchMoreRecommendations: () => Promise<void>;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  queueSource: 'search',
  isLoadingMoreRecommendations: false,
  sessionQueueHistory: [],
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  shuffle: false,
  repeat: 'none',
  isFullPlayerOpen: false,
  showMiniPlayer: false,

  setTrack: (track, source = 'search') => {
    const history = get().sessionQueueHistory;
    const newHistory = track?.id ? [track.id, ...history.filter((id) => id !== track.id)].slice(0, 50) : history;

    set({
      currentTrack: track,
      showMiniPlayer: true,
      isPlaying: true,
      progress: 0,
      queueSource: source,
      sessionQueueHistory: newHistory,
    });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  next: () => {
    const { queue, queueIndex, shuffle, repeat, sessionQueueHistory, fetchMoreRecommendations } = get();
    if (queue.length === 0) return;

    let nextIndex: number;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (repeat === 'one') {
      nextIndex = queueIndex;
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === 'all') {
          nextIndex = 0;
        } else {
          fetchMoreRecommendations().then(() => {
            const updatedState = get();
            if (updatedState.queue.length > queue.length) {
              set({
                queueIndex: nextIndex,
                currentTrack: updatedState.queue[nextIndex],
                isPlaying: true,
                progress: 0,
              });
            } else {
              set({ isPlaying: false });
            }
          });
          return;
        }
      }
    }

    const nextTrack = queue[nextIndex];
    if (nextTrack?.id) {
      const newHistory = [nextTrack.id, ...sessionQueueHistory.filter((id) => id !== nextTrack.id)].slice(0, 50);
      set({
        queueIndex: nextIndex,
        currentTrack: nextTrack,
        isPlaying: true,
        progress: 0,
        sessionQueueHistory: newHistory,
      });

      const remaining = queue.length - 1 - nextIndex;
      if (remaining <= QUEUE_THRESHOLD && repeat !== 'one') {
        fetchMoreRecommendations();
      }
    }
  },

  prev: () => {
    const { queue, queueIndex } = get();
    if (queue.length === 0) return;
    if (get().progress > 3) {
      set({ progress: 0 });
      return;
    }
    const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
    set({ queueIndex: prevIndex, currentTrack: queue[prevIndex], isPlaying: true, progress: 0 });
  },

  seek: (time) => set({ progress: time }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  toggleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === 'none' ? 'one' : s.repeat === 'one' ? 'all' : 'none',
    })),

  setQueue: (tracks, startIndex = 0, source = 'search') => {
    const current = tracks[startIndex] ?? null;
    const history = get().sessionQueueHistory;
    const newHistory = current?.id ? [current.id, ...history.filter((id) => id !== current.id)].slice(0, 50) : history;

    set({
      queue: tracks,
      queueIndex: startIndex,
      currentTrack: current,
      queueSource: source,
      isPlaying: true,
      progress: 0,
      showMiniPlayer: Boolean(current),
      sessionQueueHistory: newHistory,
    });

    const remaining = tracks.length - 1 - startIndex;
    if (remaining <= QUEUE_THRESHOLD) {
      get().fetchMoreRecommendations();
    }
  },

  extendQueue: (newTracks) => {
    if (!newTracks || newTracks.length === 0) return;
    set((state) => {
      const existingIds = new Set(state.queue.map((t) => t.id));
      const filtered = newTracks.filter((t) => t && t.id && !existingIds.has(t.id));
      if (filtered.length === 0) return state;
      return { queue: [...state.queue, ...filtered] };
    });
  },

  fetchMoreRecommendations: async () => {
    const { isLoadingMoreRecommendations, queue, currentTrack, sessionQueueHistory, extendQueue } = get();
    if (isLoadingMoreRecommendations) return;

    set({ isLoadingMoreRecommendations: true });

    try {
      const existingQueueIds = new Set(queue.map((t) => t.id));
      let newTracks: Song[] = [];

      if (currentTrack) {
        newTracks = await getRelatedSongs(currentTrack, existingQueueIds, sessionQueueHistory, 8);
      }

      if (newTracks.length < 4) {
        const extra = await getPersonalizedRecommendations(existingQueueIds, sessionQueueHistory, 8);
        newTracks = [...newTracks, ...extra];
      }

      extendQueue(newTracks);
    } catch (err) {
      console.warn('Failed to fetch recommendations:', err);
    } finally {
      set({ isLoadingMoreRecommendations: false });
    }
  },

  openFullPlayer: () => set({ isFullPlayerOpen: true }),
  closeFullPlayer: () => set({ isFullPlayerOpen: false }),
}));
