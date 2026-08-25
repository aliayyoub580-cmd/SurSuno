import type { UserMusicProfile, SongFeatures } from './types';
import { cosineSimilarity } from './similarityEngine';

/**
  * Convert a user music profile into a unified numerical feature vector for profile-to-profile similarity.
  */
export function profileToFeatureVector(profile: UserMusicProfile): number[] {
  const genres = ['bollywood', 'punjabi', 'romantic', 'lofi', 'sufi', 'hiphop', 'pop', 'rock'];
  const moods = ['Romantic', 'Happy', 'Chill', 'Melancholic', 'Energetic', 'Dark'];

  const genreVals = genres.map((g) => profile.genrePreferences[g] || 0);
  const moodVals = moods.map((m) => profile.moodPreferences[m] || 0);

  return [
    ...genreVals,
    ...moodVals,
    profile.preferredTempo / 160,
    profile.preferredEnergy,
    profile.preferredPopularity / 100,
  ];
}

/**
  * Calculate user-to-user similarity score.
  */
export function calculateUserSimilarity(profileA: UserMusicProfile, profileB: UserMusicProfile): number {
  if (profileA.userId === profileB.userId) return 1.0;
  const vecA = profileToFeatureVector(profileA);
  const vecB = profileToFeatureVector(profileB);
  return cosineSimilarity(vecA, vecB);
}

/**
  * Lightweight neighborhood collaborative filtering candidate scorer.
  */
export function calculateCollaborativeScore(
  userProfile: UserMusicProfile,
  candidateFeatures: SongFeatures,
  neighborhoodProfiles: UserMusicProfile[] = []
): number {
  if (neighborhoodProfiles.length === 0) {
    // Cold-start fallback: use popularity & genre overlap
    return candidateFeatures.popularity / 100;
  }

  let totalSim = 0;
  let weightedAffinitySum = 0;

  for (const neighbor of neighborhoodProfiles) {
    const sim = calculateUserSimilarity(userProfile, neighbor);
    if (sim > 0.3) {
      totalSim += sim;
      // Check if neighbor liked or played candidate song
      const hasLiked = neighbor.recentlyLikedSongs.includes(candidateFeatures.songId) ? 1.0 : 0;
      const hasPlayed = neighbor.recentlyPlayedSongs.includes(candidateFeatures.songId) ? 0.6 : 0;
      const affinity = Math.max(hasLiked, hasPlayed);

      weightedAffinitySum += sim * affinity;
    }
  }

  if (totalSim === 0) {
    return candidateFeatures.popularity / 100;
  }

  return Number((weightedAffinitySum / totalSim).toFixed(3));
}
