import type { Song } from '@/types';

export type InteractionType =
  | 'play'
  | 'partialPlay'
  | 'completion'
  | 'replay'
  | 'like'
  | 'save'
  | 'playlistAdd'
  | 'share'
  | 'artistFollow'
  | 'dislike'
  | 'quickSkip';

export interface InteractionWeights {
  play: number;
  partialPlay: number;
  completion: number;
  replay: number;
  like: number;
  save: number;
  playlistAdd: number;
  share: number;
  artistFollow: number;
  dislike: number;
  quickSkip: number;
}

export interface UserInteraction {
  id?: string;
  userId: string;
  songId: string;
  interactionType: InteractionType;
  weight: number;
  completionRate: number; // 0.0 - 1.0
  durationPlayed: number; // in seconds
  createdAt: Date;
}

export interface UserMusicProfile {
  userId: string;
  genrePreferences: Record<string, number>; // normalized 0..1
  moodPreferences: Record<string, number>; // normalized 0..1
  tempoPreferences: Record<string, number>; // normalized 0..1
  energyPreferences: Record<string, number>; // normalized 0..1
  languagePreferences: Record<string, number>; // normalized 0..1
  artistPreferences: Record<string, number>; // normalized 0..1
  instrumentPreferences: Record<string, number>; // normalized 0..1
  vocalPreferences: Record<string, number>; // normalized 0..1
  topicPreferences: Record<string, number>; // normalized 0..1

  preferredDuration: number;
  preferredTempo: number; // target BPM
  preferredEnergy: number; // target 0..1
  preferredPopularity: number; // target 0..100

  recentlyLikedSongs: string[];
  recentlyPlayedSongs: string[];
  updatedAt: Date;
}

export interface SongFeatures {
  songId: string;
  title: string;
  artistId: string;
  artistName: string;
  genres: string[];
  moods: string[];
  language: string;
  tempo: number; // BPM (80-160)
  energy: number; // 0.0 - 1.0
  danceability: number; // 0.0 - 1.0
  valence: number; // 0.0 - 1.0 (happiness/positivity)
  acousticness: number; // 0.0 - 1.0
  instrumentalness: number; // 0.0 - 1.0
  vocalType: 'male' | 'female' | 'duet' | 'instrumental' | 'mixed';
  instruments: string[];
  themes: string[];
  duration: number; // seconds
  popularity: number; // 0 - 100
  embedding?: number[]; // optional vector embedding
  originalSong?: Song;
}

export type RecommendationCategory =
  | 'madeForYou'
  | 'becauseYouLikeArtist'
  | 'moreLikeThis'
  | 'recentFavorites'
  | 'discoverNew'
  | 'trendingForYou'
  | 'dailyMix'
  | 'recommendedFromListening'
  | 'newReleases';

export interface RecommendationResult {
  songId: string;
  song: Song;
  score: number;
  category: RecommendationCategory;
  reason: string;
  features?: SongFeatures;
}
