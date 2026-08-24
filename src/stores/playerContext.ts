import type { PlayerTrack } from '@/types';

let currentTrack: PlayerTrack | null = null;
let isPlaying = false;
let volume = 0.8;
let progress = 0;
let duration = 0;
let isMuted = false;
let shuffle = false;
let repeat = 'none' as 'none' | 'one' | 'all';
let queue: PlayerTrack[] = [];
let queueIndex = -1;
let isFullPlayerOpen = false;
let showMiniPlayer = false;

const listeners = new Set<(state: PlayerState) => void>();

export interface PlayerState {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  queue: PlayerTrack[];
  queueIndex: number;
  isFullPlayerOpen: boolean;
  showMiniPlayer: boolean;
}

export function getPlayerState(): PlayerState {
  return {
    currentTrack, isPlaying, progress, duration, volume,
    isMuted, shuffle, repeat, queue, queueIndex,
    isFullPlayerOpen, showMiniPlayer,
  };
}

function notify() {
  const state = getPlayerState();
  listeners.forEach((l) => l(state));
}

export function setTrack(track: PlayerTrack) {
  currentTrack = track;
  showMiniPlayer = true;
  isPlaying = true;
  progress = 0;
  notify();
}

export function togglePlay() {
  isPlaying = !isPlaying;
  notify();
}

export function seek(time: number) {
  progress = time;
  notify();
}

export function setDuration(d: number) {
  duration = d;
  notify();
}

export function setVolume(vol: number) {
  volume = vol;
  isMuted = vol === 0;
  notify();
}

export function toggleMute() {
  isMuted = !isMuted;
  notify();
}

export function toggleShuffle() {
  shuffle = !shuffle;
  notify();
}

export function toggleRepeat() {
  repeat = repeat === 'none' ? 'one' : repeat === 'one' ? 'all' : 'none';
  notify();
}

export function setQueue(tracks: PlayerTrack[], start = 0) {
  queue = tracks;
  queueIndex = start;
  currentTrack = tracks[start] ?? null;
  isPlaying = true;
  progress = 0;
  notify();
}

export function nextTrack() {
  if (queue.length === 0) return;
  if (repeat === 'one') { progress = 0; notify(); return; }
  let next: number;
  if (shuffle) next = Math.floor(Math.random() * queue.length);
  else next = (queueIndex + 1) % queue.length;
  if (next === 0 && repeat === 'none' && queueIndex === queue.length - 1) { isPlaying = false; notify(); return; }
  queueIndex = next;
  currentTrack = queue[next];
  progress = 0;
  notify();
}

export function prevTrack() {
  if (progress > 3) { progress = 0; notify(); return; }
  queueIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
  currentTrack = queue[queueIndex];
  progress = 0;
  notify();
}

export function openFullPlayer() { isFullPlayerOpen = true; notify(); }
export function closeFullPlayer() { isFullPlayerOpen = false; notify(); }
export function addSongToQueue(track: PlayerTrack) { queue.push(track); notify(); }
export function clearQueue() { queue = []; queueIndex = -1; currentTrack = null; isPlaying = false; notify(); }

export function subscribe(listener: (state: PlayerState) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
