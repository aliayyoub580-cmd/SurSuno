import type { UserMusicProfile, SongFeatures, RecommendationCategory } from './types';

export function generateRecommendationReason(
  profile: UserMusicProfile,
  features: SongFeatures,
  category: RecommendationCategory
): string {
  const primaryGenre = features.genres[0] || 'Bollywood';
  const primaryMood = features.moods[0] || 'Romantic';
  const artistName = features.artistName || 'Top Artist';

  switch (category) {
    case 'becauseYouLikeArtist':
      return `Because you like ${artistName}`;

    case 'moreLikeThis':
      return `Similar to your recently played tracks`;

    case 'recentFavorites':
      return `Based on songs you saved to your favorites`;

    case 'discoverNew':
      return `Fresh discovery: Top ${primaryGenre} hit for you`;

    case 'trendingForYou':
      return `Trending now in ${primaryGenre}`;

    case 'dailyMix':
      return `Daily Mix: ${primaryMood} ${primaryGenre} vibes`;

    case 'recommendedFromListening':
      return `Recommended from your recent listening session`;

    case 'newReleases':
      return `New release from an artist you might like`;

    case 'madeForYou':
    default: {
      const topArtistPref = Object.entries(profile.artistPreferences).sort((a, b) => b[1] - a[1])[0];
      if (topArtistPref && topArtistPref[0] === artistName.toLowerCase()) {
        return `Because you like ${artistName}`;
      }
      return `Matches your taste for ${primaryMood.toLowerCase()} ${primaryGenre} tracks`;
    }
  }
}
