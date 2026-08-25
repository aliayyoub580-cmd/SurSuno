import type { UserMusicProfile, SongFeatures, InteractionType } from './types';
import { calculateNetInteractionScore } from './weights';

export function createDefaultProfile(userId: string): UserMusicProfile {
  return {
    userId,
    genrePreferences: { bollywood: 0.5, romantic: 0.5, punjabi: 0.3 },
    moodPreferences: { Romantic: 0.5, Happy: 0.5, Chill: 0.4 },
    tempoPreferences: { '110': 0.5 },
    energyPreferences: { '0.7': 0.5 },
    languagePreferences: { hindi: 0.8 },
    artistPreferences: {},
    instrumentPreferences: { guitar: 0.5 },
    vocalPreferences: { mixed: 0.5 },
    topicPreferences: { love: 0.5 },
    preferredDuration: 180,
    preferredTempo: 110,
    preferredEnergy: 0.7,
    preferredPopularity: 60,
    recentlyLikedSongs: [],
    recentlyPlayedSongs: [],
    updatedAt: new Date(),
  };
}

/**
  * Normalize a record map of feature scores so max value is 1.0 and minimum is 0.0.
  */
export function normalizeScoreMap(map: Record<string, number>): Record<string, number> {
  const entries = Object.entries(map);
  if (entries.length === 0) return {};

  const maxVal = Math.max(...entries.map(([, v]) => v));
  if (maxVal <= 0) return map;

  const normalized: Record<string, number> = {};
  for (const [key, val] of entries) {
    normalized[key] = Number(Math.max(0, Math.min(1, val / maxVal)).toFixed(3));
  }
  return normalized;
}

/**
  * Update a user's music profile in real time based on a new song interaction.
  */
export function updateUserProfileWithInteraction(
  profile: UserMusicProfile,
  features: SongFeatures,
  interactionType: InteractionType,
  completionRate = 1.0,
  daysSinceInteraction = 0
): UserMusicProfile {
  const netScore = calculateNetInteractionScore(interactionType, completionRate, daysSinceInteraction);
  const updatedProfile: UserMusicProfile = {
    ...profile,
    genrePreferences: { ...profile.genrePreferences },
    moodPreferences: { ...profile.moodPreferences },
    languagePreferences: { ...profile.languagePreferences },
    artistPreferences: { ...profile.artistPreferences },
    instrumentPreferences: { ...profile.instrumentPreferences },
    vocalPreferences: { ...profile.vocalPreferences },
    topicPreferences: { ...profile.topicPreferences },
    updatedAt: new Date(),
  };

  // 1. Update Genres
  features.genres.forEach((genre) => {
    const key = genre.toLowerCase();
    const current = updatedProfile.genrePreferences[key] || 0.1;
    updatedProfile.genrePreferences[key] = Math.max(0, current + netScore * 0.1);
  });
  updatedProfile.genrePreferences = normalizeScoreMap(updatedProfile.genrePreferences);

  // 2. Update Moods
  features.moods.forEach((mood) => {
    const current = updatedProfile.moodPreferences[mood] || 0.1;
    updatedProfile.moodPreferences[mood] = Math.max(0, current + netScore * 0.1);
  });
  updatedProfile.moodPreferences = normalizeScoreMap(updatedProfile.moodPreferences);

  // 3. Update Language
  if (features.language) {
    const langKey = features.language.toLowerCase();
    const current = updatedProfile.languagePreferences[langKey] || 0.1;
    updatedProfile.languagePreferences[langKey] = Math.max(0, current + netScore * 0.12);
    updatedProfile.languagePreferences = normalizeScoreMap(updatedProfile.languagePreferences);
  }

  // 4. Update Artist
  if (features.artistName) {
    const artistKey = features.artistName.toLowerCase();
    const current = updatedProfile.artistPreferences[artistKey] || 0.1;
    updatedProfile.artistPreferences[artistKey] = Math.max(0, current + netScore * 0.15);
    updatedProfile.artistPreferences = normalizeScoreMap(updatedProfile.artistPreferences);
  }

  // 5. Exponential Moving Average for preferred audio targets (Tempo & Energy)
  if (netScore > 0) {
    const alpha = 0.1; // learning rate
    updatedProfile.preferredTempo = Math.round(
      updatedProfile.preferredTempo * (1 - alpha) + features.tempo * alpha
    );
    updatedProfile.preferredEnergy = Number(
      (updatedProfile.preferredEnergy * (1 - alpha) + features.energy * alpha).toFixed(2)
    );
    updatedProfile.preferredDuration = Math.round(
      updatedProfile.preferredDuration * (1 - alpha) + features.duration * alpha
    );
  }

  // 6. Track Recently Played & Liked
  if (interactionType === 'play' || interactionType === 'completion') {
    updatedProfile.recentlyPlayedSongs = [
      features.songId,
      ...updatedProfile.recentlyPlayedSongs.filter((id) => id !== features.songId),
    ].slice(0, 30);
  }

  if (interactionType === 'like' || interactionType === 'save') {
    updatedProfile.recentlyLikedSongs = [
      features.songId,
      ...updatedProfile.recentlyLikedSongs.filter((id) => id !== features.songId),
    ].slice(0, 30);
  }

  return updatedProfile;
}
