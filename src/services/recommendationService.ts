import { searchSongs, getTrendingSongs } from './musicApi';
import { useUserStore } from '@/stores/userStore';
import type { Song } from '@/types';

export interface RecommendationContext {
  currentTrack?: Song | null;
  existingQueue?: Song[];
  sessionHistory?: string[];
}

export function scoreSong(
  song: Song,
  contextTrack?: Song | null,
  userFavArtists: string[] = [],
  userFavLanguages: string[] = [],
  sessionHistory: string[] = [],
  skippedIds: string[] = []
): number {
  let score = 0;

  if (!song || !song.id) return -999;

  // Same artist (+30)
  if (contextTrack?.singers && song.singers) {
    const currentArtist = contextTrack.singers.split(',')[0]?.trim().toLowerCase();
    const candidateArtist = song.singers.split(',')[0]?.trim().toLowerCase();
    if (currentArtist && candidateArtist && currentArtist === candidateArtist) {
      score += 30;
    }
  }

  // Same language (+15)
  if (contextTrack?.language && song.language && contextTrack.language.toLowerCase() === song.language.toLowerCase()) {
    score += 15;
  }

  // Same album (+20)
  if (contextTrack?.album && song.album && contextTrack.album.toLowerCase() === song.album.toLowerCase()) {
    score += 20;
  }

  // User Favorite Artist (+20)
  const artistName = (song.singers || '').toLowerCase();
  if (userFavArtists.some((a) => artistName.includes(a))) {
    score += 20;
  }

  // User Favorite Language (+15)
  const lang = (song.language || '').toLowerCase();
  if (userFavLanguages.includes(lang)) {
    score += 15;
  }

  // Session history penalty (-30)
  if (sessionHistory.includes(song.id)) {
    score -= 30;
  }

  // Recently skipped penalty (-20)
  if (skippedIds.includes(song.id)) {
    score -= 20;
  }

  return score;
}

export async function getRelatedSongs(
  seedTrack: Song,
  existingQueueIds: Set<string> = new Set(),
  sessionHistory: string[] = [],
  limit = 8
): Promise<Song[]> {
  const candidates: Song[] = [];
  const candidateIds = new Set<string>();

  const addCandidates = (songs: Song[]) => {
    for (const song of songs) {
      if (
        song &&
        song.id &&
        song.media_url &&
        !existingQueueIds.has(song.id) &&
        !candidateIds.has(song.id)
      ) {
        candidateIds.add(song.id);
        candidates.push(song);
      }
    }
  };

  // Tier 1: Search by Primary Artist
  const primaryArtist = (seedTrack.primary_artists || seedTrack.singers || '').split(',')[0]?.trim();
  if (primaryArtist) {
    const artistSongs = await searchSongs(primaryArtist).catch(() => []);
    addCandidates(artistSongs);
  }

  // Tier 2: Search by Song Title / Keywords
  if (candidates.length < limit) {
    const titleClean = seedTrack.title.replace(/\([^)]*\)/g, '').trim();
    if (titleClean) {
      const related = await searchSongs(titleClean).catch(() => []);
      addCandidates(related);
    }
  }

  // Tier 3: Search by Language / Genre
  if (candidates.length < limit && seedTrack.language) {
    const langSongs = await searchSongs(seedTrack.language).catch(() => []);
    addCandidates(langSongs);
  }

  // Tier 4: Trending / Popular Fallback
  if (candidates.length < limit) {
    const trending = await getTrendingSongs().catch(() => []);
    addCandidates(trending);
  }

  const userStore = useUserStore.getState();
  const { topArtists, topLanguages } = userStore.getTopPreferences();
  const skippedIds = userStore.skippedTrackIds || [];

  const scored = candidates.map((song) => ({
    song,
    score: scoreSong(song, seedTrack, topArtists, topLanguages, sessionHistory, skippedIds),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.song);
}

export async function getPersonalizedRecommendations(
  existingQueueIds: Set<string> = new Set(),
  sessionHistory: string[] = [],
  limit = 10
): Promise<Song[]> {
  const userStore = useUserStore.getState();
  const { topArtists, topLanguages } = userStore.getTopPreferences();
  const candidates: Song[] = [];
  const candidateIds = new Set<string>();

  const addCandidates = (songs: Song[]) => {
    for (const song of songs) {
      if (
        song &&
        song.id &&
        song.media_url &&
        !existingQueueIds.has(song.id) &&
        !candidateIds.has(song.id)
      ) {
        candidateIds.add(song.id);
        candidates.push(song);
      }
    }
  };

  for (const artist of topArtists.slice(0, 2)) {
    const songs = await searchSongs(artist).catch(() => []);
    addCandidates(songs);
  }

  for (const lang of topLanguages.slice(0, 2)) {
    const songs = await searchSongs(lang).catch(() => []);
    addCandidates(songs);
  }

  if (candidates.length < limit) {
    const trending = await getTrendingSongs().catch(() => []);
    addCandidates(trending);
  }

  const skippedIds = userStore.skippedTrackIds || [];
  const scored = candidates.map((song) => ({
    song,
    score: scoreSong(song, null, topArtists, topLanguages, sessionHistory, skippedIds),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.song);
}
