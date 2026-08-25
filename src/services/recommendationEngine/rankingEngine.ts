import type {
  UserMusicProfile,
  SongFeatures,
  RecommendationCategory,
  RecommendationResult,
} from './types';
import { calculateContentSimilarityScore } from './similarityEngine';
import { calculateCollaborativeScore } from './collaborativeEngine';
import { generateRecommendationReason } from './recommendationReasons';

export interface RankingWeights {
  contentWeight: number; // default 0.40
  collaborativeWeight: number; // default 0.25
  userAffinityWeight: number; // default 0.15
  popularityWeight: number; // default 0.05
  freshnessWeight: number; // default 0.10
  explorationWeight: number; // default 0.05
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  contentWeight: 0.40,
  collaborativeWeight: 0.25,
  userAffinityWeight: 0.15,
  popularityWeight: 0.05,
  freshnessWeight: 0.10,
  explorationWeight: 0.05,
};

/**
  * Calculate final recommendation ranking score for a candidate song against a user profile.
  */
export function calculateFinalScore(
  profile: UserMusicProfile,
  features: SongFeatures,
  neighborhoodProfiles: UserMusicProfile[] = [],
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS
): { finalScore: number; contentScore: number; collaborativeScore: number } {
  // 1. Content Score
  const { totalScore: contentScore } = calculateContentSimilarityScore(profile, features);

  // 2. Collaborative Score
  const collaborativeScore = calculateCollaborativeScore(profile, features, neighborhoodProfiles);

  // 3. User Affinity Score (artist & genre specific affinity)
  const artistAffinity = profile.artistPreferences[features.artistName.toLowerCase()] || 0.05;
  const genreAffinity = Math.max(
    ...features.genres.map((g) => profile.genrePreferences[g.toLowerCase()] || 0.05)
  );
  const userAffinityScore = (artistAffinity + genreAffinity) / 2;

  // 4. Popularity Score (normalized 0..1)
  const popularityScore = features.popularity / 100;

  // 5. Freshness Score (new releases / less played boost)
  const isRecentlyPlayed = profile.recentlyPlayedSongs.includes(features.songId);
  const freshnessScore = isRecentlyPlayed ? 0.1 : 0.9;

  // 6. Exploration Score (random jitter for discovering new items)
  const explorationScore = Math.random();

  const finalScore =
    contentScore * weights.contentWeight +
    collaborativeScore * weights.collaborativeWeight +
    userAffinityScore * weights.userAffinityWeight +
    popularityScore * weights.popularityWeight +
    freshnessScore * weights.freshnessWeight +
    explorationScore * weights.explorationWeight;

  return {
    finalScore: Number(finalScore.toFixed(3)),
    contentScore,
    collaborativeScore,
  };
}

/**
  * Apply Diversity Rules & Exploration vs Exploitation Mix:
  * - Max 2 songs from same artist
  * - Max 3 songs from same album
  * - Max 4 songs from same genre consecutively
  * - 80% exploitation / 20% exploration mix
  */
export function applyDiversityAndExploration(
  rankedCandidates: { features: SongFeatures; score: number }[],
  limit = 20
): { features: SongFeatures; score: number }[] {
  if (rankedCandidates.length === 0) return [];

  const artistCounts: Record<string, number> = {};
  const albumCounts: Record<string, number> = {};
  const selected: { features: SongFeatures; score: number }[] = [];
  const explorationCandidates: { features: SongFeatures; score: number }[] = [];

  let lastGenre = '';
  let consecutiveGenreCount = 0;

  const targetPersonalizedCount = Math.floor(limit * 0.8);

  for (const item of rankedCandidates) {
    if (selected.length >= limit) break;

    const artistKey = item.features.artistName.toLowerCase();
    const albumKey = (item.features.originalSong?.album || 'single').toLowerCase();
    const primaryGenre = (item.features.genres[0] || 'bollywood').toLowerCase();

    // Check artist constraint (max 2)
    if ((artistCounts[artistKey] || 0) >= 2) {
      explorationCandidates.push(item);
      continue;
    }

    // Check album constraint (max 3)
    if ((albumCounts[albumKey] || 0) >= 3) {
      explorationCandidates.push(item);
      continue;
    }

    // Check consecutive genre constraint (max 4)
    if (primaryGenre === lastGenre && consecutiveGenreCount >= 4) {
      explorationCandidates.push(item);
      continue;
    }

    // Track counts
    artistCounts[artistKey] = (artistCounts[artistKey] || 0) + 1;
    albumCounts[albumKey] = (albumCounts[albumKey] || 0) + 1;
    if (primaryGenre === lastGenre) {
      consecutiveGenreCount++;
    } else {
      lastGenre = primaryGenre;
      consecutiveGenreCount = 1;
    }

    selected.push(item);
  }

  // Fill 20% exploration pool if needed
  if (selected.length < limit && explorationCandidates.length > 0) {
    for (const expItem of explorationCandidates) {
      if (selected.length >= limit) break;
      if (!selected.some((s) => s.features.songId === expItem.features.songId)) {
        selected.push(expItem);
      }
    }
  }

  return selected;
}

/**
  * Main Engine Pipeline: Scores, ranks, diversifies, and produces RecommendationResult[].
  */
export function generateRankedRecommendations(
  profile: UserMusicProfile,
  candidates: SongFeatures[],
  category: RecommendationCategory = 'madeForYou',
  neighborhoodProfiles: UserMusicProfile[] = [],
  limit = 20,
  excludeSongIds: Set<string> = new Set()
): RecommendationResult[] {
  const filteredCandidates = candidates.filter(
    (c) => c && c.songId && c.originalSong && !excludeSongIds.has(c.songId)
  );

  const scored = filteredCandidates.map((features) => {
    const { finalScore } = calculateFinalScore(profile, features, neighborhoodProfiles);
    return { features, score: finalScore };
  });

  // Sort descending by final score
  scored.sort((a, b) => b.score - a.score);

  // Apply diversity & 80/20 exploration rules
  const diversified = applyDiversityAndExploration(scored, limit);

  return diversified.map(({ features, score }) => ({
    songId: features.songId,
    song: features.originalSong!,
    score,
    category,
    reason: generateRecommendationReason(profile, features, category),
    features,
  }));
}
