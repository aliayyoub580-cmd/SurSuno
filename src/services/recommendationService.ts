import { searchSongs, getTrendingSongs, getRecommendedSongs, getArtistSongs } from './musicApi';
import { useUserStore } from '@/stores/userStore';
import { extractSongFeatures } from './recommendationEngine/featureExtractor';
import { generateRankedRecommendations } from './recommendationEngine/rankingEngine';
import type { RecommendationCategory, RecommendationResult } from './recommendationEngine/types';
import type { Song } from '@/types';

export interface RecommendationContext {
  currentTrack?: Song | null;
  existingQueue?: Song[];
  sessionHistory?: string[];
}

export function scoreSong(
  song: Song,
  contextTrack?: Song | null,
  userFavArtistNames: string[] = [],
  mostPlayedLanguage = 'hindi',
  recentlyPlayedAlbums: string[] = [],
  sessionHistory: string[] = [],
  skippedIds: string[] = []
): number {
  let score = 0;

  if (!song || !song.id) return -999;

  const songSingers = (song.singers || song.primary_artists || '').toLowerCase();
  const songAlbum = (song.album || '').toLowerCase();
  const songLang = (song.language || '').toLowerCase();

  // 1. Favorite artist match (+3)
  if (userFavArtistNames.some((fav) => songSingers.includes(fav.toLowerCase()))) {
    score += 3;
  }

  // Context track same artist bonus (+3)
  if (contextTrack?.singers) {
    const currentArtist = contextTrack.singers.split(',')[0]?.trim().toLowerCase();
    if (currentArtist && songSingers.includes(currentArtist)) {
      score += 3;
    }
  }

  // 2. Language match (+2)
  if (mostPlayedLanguage && songLang === mostPlayedLanguage.toLowerCase()) {
    score += 2;
  }

  // 3. Album match (+1)
  if (songAlbum && recentlyPlayedAlbums.some((alb) => alb.toLowerCase() === songAlbum)) {
    score += 1;
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

  const primaryArtist = (seedTrack.primary_artists || seedTrack.singers || '').split(',')[0]?.trim();
  if (primaryArtist) {
    const artistSongs = await searchSongs(primaryArtist).catch(() => []);
    addCandidates(artistSongs);
  }

  if (candidates.length < limit) {
    const related = await getRecommendedSongs(seedTrack.id).catch(() => []);
    addCandidates(related);
  }

  if (candidates.length < limit) {
    const trending = await getTrendingSongs().catch(() => []);
    addCandidates(trending);
  }

  const userStore = useUserStore.getState();
  const favArtistNames = userStore.favoriteArtists.map((a) => a.name);
  const recentlyPlayed = userStore.recentlyPlayed || [];
  const mostPlayedLang = recentlyPlayed[0]?.language || 'hindi';
  const recentAlbums = recentlyPlayed.map((s) => s.album).filter(Boolean);
  const skippedIds = userStore.skippedTrackIds || [];

  const scored = candidates.map((song) => ({
    song,
    score: scoreSong(
      song,
      seedTrack,
      favArtistNames,
      mostPlayedLang,
      recentAlbums,
      sessionHistory,
      skippedIds
    ),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.song);
}

/**
  * Full ML Recommendation Pipeline using rankingEngine and featureExtractor.
  */
export async function getEngineRecommendations(
  category: RecommendationCategory = 'madeForYou',
  limit = 20,
  excludeIds: Set<string> = new Set()
): Promise<RecommendationResult[]> {
  const userStore = useUserStore.getState();
  const { favoriteArtists, userMusicProfile } = userStore;

  const rawCandidates: Song[] = [];
  const seenIds = new Set<string>();

  const addSongs = (list: Song[]) => {
    for (const song of list) {
      if (song && song.id && (song.title || song.song) && !seenIds.has(song.id)) {
        seenIds.add(song.id);
        rawCandidates.push(song);
      }
    }
  };

  // Step 1: Collect seed candidates from favorite artists, trending, or search queries
  if (favoriteArtists.length > 0) {
    const artistSongLists = await Promise.all(
      favoriteArtists.slice(0, 4).map((a) => getArtistSongs(a.name).catch(() => []))
    );
    artistSongLists.forEach(addSongs);
  }

  if (rawCandidates.length < 15) {
    const trending = await getTrendingSongs().catch(() => []);
    addSongs(trending);
  }

  if (rawCandidates.length < 20) {
    const extra = await searchSongs('latest hits 2025').catch(() => []);
    addSongs(extra);
  }

  // Step 2: Extract features for candidates
  const featureCandidates = rawCandidates.map(extractSongFeatures);

  // Step 3: Run rankingEngine hybrid pipeline with diversity rules
  return generateRankedRecommendations(
    userMusicProfile,
    featureCandidates,
    category,
    [], // neighborhood profiles
    limit,
    excludeIds
  );
}

// In-memory feed cache for fast repeat loads
let cachedFeed: Song[] = [];
let cachedFeedTime = 0;

export async function getPersonalizedRecommendations(
  existingQueueIds: Set<string> = new Set(),
  sessionHistory: string[] = [],
  limit = 30
): Promise<Song[]> {
  const now = Date.now();
  if (cachedFeed.length >= 10 && now - cachedFeedTime < 120000) {
    return cachedFeed.slice(0, limit);
  }

  try {
    const recResults = await getEngineRecommendations('madeForYou', limit, existingQueueIds);
    if (recResults.length > 0) {
      const songs = recResults.map((r) => r.song);
      cachedFeed = songs;
      cachedFeedTime = Date.now();
      return songs;
    }
  } catch (err) {
    console.error('Error fetching engine recommendations:', err);
  }

  const trending = await getTrendingSongs().catch(() => []);
  return trending.slice(0, limit);
}

