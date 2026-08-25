import type { Song } from '@/types';
import type { SongFeatures } from './types';

const GENRE_KEYWORD_MAP: Record<string, { moods: string[]; energy: number; valence: number; tempo: number; acousticness: number }> = {
  bollywood: { moods: ['Romantic', 'Emotional', 'Happy'], energy: 0.75, valence: 0.7, tempo: 112, acousticness: 0.3 },
  romantic: { moods: ['Romantic', 'Emotional', 'Melancholic'], energy: 0.45, valence: 0.6, tempo: 92, acousticness: 0.5 },
  punjabi: { moods: ['Energetic', 'Happy', 'Aggressive'], energy: 0.88, valence: 0.85, tempo: 128, acousticness: 0.15 },
  lofi: { moods: ['Chill', 'Relaxing', 'Melancholic'], energy: 0.35, valence: 0.45, tempo: 84, acousticness: 0.7 },
  sufi: { moods: ['Emotional', 'Inspirational', 'Dark'], energy: 0.6, valence: 0.5, tempo: 98, acousticness: 0.6 },
  ghazal: { moods: ['Melancholic', 'Emotional', 'Relaxing'], energy: 0.3, valence: 0.35, tempo: 78, acousticness: 0.85 },
  hiphop: { moods: ['Aggressive', 'Energetic', 'Dark'], energy: 0.82, valence: 0.65, tempo: 120, acousticness: 0.1 },
  party: { moods: ['Energetic', 'Happy'], energy: 0.92, valence: 0.9, tempo: 132, acousticness: 0.08 },
  rock: { moods: ['Aggressive', 'Energetic'], energy: 0.85, valence: 0.55, tempo: 125, acousticness: 0.2 },
  pop: { moods: ['Happy', 'Energetic', 'Chill'], energy: 0.7, valence: 0.75, tempo: 116, acousticness: 0.35 },
  classical: { moods: ['Relaxing', 'Inspirational', 'Emotional'], energy: 0.4, valence: 0.5, tempo: 90, acousticness: 0.9 },
};

const TITLE_MOOD_KEYWORDS: Record<string, string> = {
  dil: 'Romantic',
  pyar: 'Romantic',
  ishq: 'Romantic',
  love: 'Romantic',
  tere: 'Emotional',
  yaad: 'Melancholic',
  dard: 'Melancholic',
  roye: 'Sad',
  sad: 'Sad',
  nasha: 'Chill',
  party: 'Energetic',
  bhangra: 'Energetic',
  sufi: 'Inspirational',
  peace: 'Relaxing',
};

export function extractSongFeatures(song: Song): SongFeatures {
  if (!song || !song.id) {
    return {
      songId: 'unknown',
      title: 'Unknown',
      artistId: 'unknown',
      artistName: 'Unknown',
      genres: ['bollywood'],
      moods: ['Happy'],
      language: 'hindi',
      tempo: 110,
      energy: 0.6,
      danceability: 0.6,
      valence: 0.6,
      acousticness: 0.3,
      instrumentalness: 0.1,
      vocalType: 'mixed',
      instruments: ['guitar', 'drums'],
      themes: ['love'],
      duration: 180,
      popularity: 50,
    };
  }

  const titleLower = (song.title || song.song || '').toLowerCase();
  const albumLower = (song.album || '').toLowerCase();
  const lang = (song.language || 'hindi').toLowerCase();
  const artistName = (song.singers || song.primary_artists || 'Unknown Artist').split(',')[0].trim();

  // Detect genres
  const genres = new Set<string>();
  Object.keys(GENRE_KEYWORD_MAP).forEach((genreKey) => {
    if (titleLower.includes(genreKey) || albumLower.includes(genreKey) || lang.includes(genreKey)) {
      genres.add(genreKey);
    }
  });

  if (genres.size === 0) {
    if (lang === 'punjabi') genres.add('punjabi');
    else if (lang === 'urdu') genres.add('sufi');
    else genres.add('bollywood');
  }

  const primaryGenre = Array.from(genres)[0] || 'bollywood';
  const genreProfile = GENRE_KEYWORD_MAP[primaryGenre] || GENRE_KEYWORD_MAP.bollywood;

  // Detect moods
  const moods = new Set<string>(genreProfile.moods);
  Object.entries(TITLE_MOOD_KEYWORDS).forEach(([keyword, mood]) => {
    if (titleLower.includes(keyword)) {
      moods.add(mood);
    }
  });

  // Calculate audio features with slight deterministic jitter based on song ID string code
  const charSum = song.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const jitter = (charSum % 15) / 100 - 0.07; // -0.07 to +0.07

  const energy = Math.max(0.1, Math.min(0.99, genreProfile.energy + jitter));
  const valence = Math.max(0.1, Math.min(0.99, genreProfile.valence + jitter));
  const danceability = Math.max(0.1, Math.min(0.99, (energy + valence) / 2));
  const acousticness = Math.max(0.05, Math.min(0.95, genreProfile.acousticness - jitter / 2));
  const tempo = Math.max(70, Math.min(160, Math.round(genreProfile.tempo + charSum % 20 - 10)));
  const playCountNum = parseInt(song.play_count || '0', 10) || 500000;
  const popularity = Math.min(99, Math.max(30, Math.round(Math.log10(playCountNum + 1) * 15)));

  return {
    songId: song.id,
    title: song.title || song.song || 'Untitled',
    artistId: btoa(encodeURIComponent(artistName)).slice(0, 10),
    artistName,
    genres: Array.from(genres),
    moods: Array.from(moods),
    language: lang,
    tempo,
    energy: Number(energy.toFixed(2)),
    danceability: Number(danceability.toFixed(2)),
    valence: Number(valence.toFixed(2)),
    acousticness: Number(acousticness.toFixed(2)),
    instrumentalness: genres.has('classical') ? 0.8 : 0.05,
    vocalType: 'mixed',
    instruments: genres.has('lofi') ? ['synth', 'drums', 'piano'] : ['guitar', 'harmonium', 'tabla'],
    themes: Array.from(moods).map((m) => m.toLowerCase()),
    duration: parseInt(song.duration, 10) || 180,
    popularity,
    originalSong: song,
  };
}
