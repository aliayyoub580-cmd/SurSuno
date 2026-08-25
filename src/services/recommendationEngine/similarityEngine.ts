import type { UserMusicProfile, SongFeatures } from './types';

/**
  * Calculate Cosine Similarity between two numerical feature vectors.
  */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
  * Calculate content-based match score between a user's music profile and candidate song features.
  */
export function calculateContentSimilarityScore(
  profile: UserMusicProfile,
  features: SongFeatures
): { totalScore: number; components: Record<string, number> } {
  // 1. Genre Score (0.25 weight)
  let genreScore = 0;
  if (features.genres.length > 0) {
    const scores = features.genres.map((g) => profile.genrePreferences[g.toLowerCase()] || 0.1);
    genreScore = Math.max(...scores);
  }

  // 2. Mood Score (0.20 weight)
  let moodScore = 0;
  if (features.moods.length > 0) {
    const scores = features.moods.map((m) => profile.moodPreferences[m] || 0.1);
    moodScore = Math.max(...scores);
  }

  // 3. Artist Affinity Score (0.10 weight)
  const artistNameLower = (features.artistName || '').toLowerCase();
  const artistScore = profile.artistPreferences[artistNameLower] || 0.05;

  // 4. Tempo Proximity Score (0.10 weight)
  const targetTempo = profile.preferredTempo || 110;
  const tempoDiff = Math.abs(features.tempo - targetTempo);
  const tempoScore = Math.max(0, 1 - tempoDiff / 60);

  // 5. Energy Proximity Score (0.10 weight)
  const targetEnergy = profile.preferredEnergy || 0.7;
  const energyDiff = Math.abs(features.energy - targetEnergy);
  const energyScore = Math.max(0, 1 - energyDiff);

  // 6. Danceability Score (0.05 weight)
  const danceabilityScore = features.danceability;

  // 7. Language Match Score (0.05 weight)
  const langKey = (features.language || 'hindi').toLowerCase();
  const languageScore = profile.languagePreferences[langKey] || 0.1;

  // 8. Instrument Match Score (0.05 weight)
  let instrumentScore = 0.5;
  if (features.instruments.length > 0) {
    const scores = features.instruments.map((i) => profile.instrumentPreferences[i.toLowerCase()] || 0.2);
    instrumentScore = Math.max(...scores);
  }

  // 9. Theme / Topic Match Score (0.10 weight)
  let themeScore = 0.5;
  if (features.themes.length > 0) {
    const scores = features.themes.map((t) => profile.topicPreferences[t.toLowerCase()] || 0.2);
    themeScore = Math.max(...scores);
  }

  const components = {
    genreScore,
    moodScore,
    artistScore,
    tempoScore,
    energyScore,
    danceabilityScore,
    languageScore,
    instrumentScore,
    themeScore,
  };

  const totalScore =
    genreScore * 0.25 +
    moodScore * 0.20 +
    artistScore * 0.10 +
    tempoScore * 0.10 +
    energyScore * 0.10 +
    danceabilityScore * 0.05 +
    languageScore * 0.05 +
    instrumentScore * 0.05 +
    themeScore * 0.10;

  return { totalScore: Number(totalScore.toFixed(3)), components };
}

/**
  * Calculate song-to-song similarity for "More Like This".
  */
export function calculateSongToSongSimilarity(target: SongFeatures, candidate: SongFeatures): number {
  if (target.songId === candidate.songId) return 1.0;

  // Vector embeddings if available
  if (target.embedding && candidate.embedding) {
    return cosineSimilarity(target.embedding, candidate.embedding);
  }

  // Audio feature vector cosine similarity
  const vecA = [
    target.tempo / 160,
    target.energy,
    target.danceability,
    target.valence,
    target.acousticness,
    target.instrumentalness,
  ];

  const vecB = [
    candidate.tempo / 160,
    candidate.energy,
    candidate.danceability,
    candidate.valence,
    candidate.acousticness,
    candidate.instrumentalness,
  ];

  const vectorSim = cosineSimilarity(vecA, vecB);

  // Categorical similarity (Genre & Mood overlap)
  const sharedGenres = target.genres.filter((g) => candidate.genres.includes(g)).length;
  const genreSim = sharedGenres / Math.max(1, target.genres.length);

  const sharedMoods = target.moods.filter((m) => candidate.moods.includes(m)).length;
  const moodSim = sharedMoods / Math.max(1, target.moods.length);

  const artistSim = target.artistName.toLowerCase() === candidate.artistName.toLowerCase() ? 0.3 : 0.0;

  const totalSim = vectorSim * 0.4 + genreSim * 0.25 + moodSim * 0.2 + artistSim;
  return Number(Math.min(1.0, totalSim).toFixed(3));
}
