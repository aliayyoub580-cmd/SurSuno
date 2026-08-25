import axios from 'axios';
import type { Song, Artist, Album, Playlist } from '@/types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function normalizeSong(raw: any): Song {
  if (!raw) return {} as Song;
  const songTitle = decodeHtmlEntities(raw.title || raw.song || 'Unknown Song');
  const singers = decodeHtmlEntities(raw.singers || raw.primary_artists || 'Unknown Artist');
  const albumName = decodeHtmlEntities(raw.album || '');
  const imageUrl = (raw.image || '').replace('150x150', '500x500');
  const mediaUrl = raw.media_url || raw.media_preview_url || '';

  return {
    id: raw.id || String(Math.random()),
    title: songTitle,
    song: songTitle,
    image: imageUrl,
    url: raw.url || `/song/${raw.id}`,
    duration: raw.duration ? String(raw.duration) : '180',
    singers: singers,
    primary_artists: raw.primary_artists ? decodeHtmlEntities(raw.primary_artists) : singers,
    album: albumName,
    album_url: raw.album_url || '',
    language: raw.language || 'hindi',
    year: raw.year || '2025',
    perma_url: raw.perma_url || '',
    media_url: mediaUrl,
    download_url: mediaUrl,
    downloadAvailable: Boolean(mediaUrl),
    play_count: raw.play_count || '',
  };
}

export function normalizeSongs(data: any): Song[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map(normalizeSong).filter((s: Song) => Boolean(s.id && s.title));
  }
  if (typeof data === 'object') {
    if (data.status === false || data.error) return [];
    if (data.id && (data.song || data.title)) return [normalizeSong(data)];
    if (Array.isArray(data.songs)) return data.songs.map(normalizeSong).filter((s: Song) => Boolean(s.id && s.title));
  }
  return [];
}

// --- Search ---
export async function searchSongs(query: string, withLyrics = false): Promise<Song[]> {
  try {
    const res = await api.get('/song/', { params: { query, lyrics: withLyrics } });
    const normalized = normalizeSongs(res.data);
    if (normalized.length > 0) return normalized;
  } catch (err) {
    console.warn('Backend proxy /song/ unavailable, trying direct JioSaavn fallback...');
  }

  // Direct public fallback if local Express server is offline or proxying 502
  try {
    const fallbackUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(query)}`;
    const directRes = await axios.get(fallbackUrl, { timeout: 8000 });
    const json = typeof directRes.data === 'string' ? JSON.parse(directRes.data) : directRes.data;
    const songData = json?.songs?.data || [];

    return songData.map((item: any) => ({
      id: item.id || String(Math.random()),
      title: decodeHtmlEntities(item.title || item.song || 'Song'),
      song: decodeHtmlEntities(item.title || item.song || 'Song'),
      image: (item.image || '').replace('150x150', '500x500'),
      url: item.url || `/song/${item.id}`,
      duration: '180',
      singers: decodeHtmlEntities(item.singers || item.description || ''),
      primary_artists: decodeHtmlEntities(item.singers || item.description || ''),
      album: decodeHtmlEntities(item.album || ''),
      album_url: '',
      language: 'hindi',
      year: '2025',
      perma_url: item.url || '',
      media_url: item.media_url || item.url || '',
      download_url: item.media_url || item.url || '',
      downloadAvailable: true,
      play_count: '',
    }));
  } catch (directErr) {
    console.error('Direct JioSaavn fallback failed:', directErr);
    return [];
  }
}

export async function searchAll(query: string) {
  const [songs, artists, albums, playlists] = await Promise.all([
    searchSongs(query).catch(() => []),
    searchArtists(query).catch(() => []),
    searchAlbums(query).catch(() => []),
    searchPlaylists(query).catch(() => []),
  ]);
  return { songs, artists, albums, playlists };
}

// --- Song ---
export async function getSong(id: string, withLyrics = false): Promise<Song | null> {
  try {
    const res = await api.get('/song/get/', { params: { id, lyrics: withLyrics } });
    const songs = normalizeSongs(res.data);
    return songs[0] ?? null;
  } catch (err) {
    console.error('Error fetching song:', err);
    return null;
  }
}

export async function getSongByIds(ids: string[]): Promise<Song[]> {
  try {
    const res = await api.get('/song/get/', { params: { id: ids.join(','), lyrics: false } });
    return normalizeSongs(res.data);
  } catch (err) {
    console.error('Error fetching songs by IDs:', err);
    return [];
  }
}

// --- Artist ---
import { FAMOUS_ARTISTS } from '@/data/artistsData';

export async function searchArtists(query: string): Promise<Artist[]> {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const artistMap = new Map<string, Artist>();

  // 1. Fuzzy & sub-string search in FAMOUS_ARTISTS database
  for (const fa of FAMOUS_ARTISTS) {
    const faName = fa.name.toLowerCase();
    // Match full name, partial words (e.g. "parmash" matching "parmish"), or words overlap
    const queryWords = normalizedQuery.split(/\s+/);
    const isWordMatch = queryWords.some((qw) => qw.length >= 3 && faName.includes(qw));
    const isLevenshteinLike = faName.includes(normalizedQuery) || normalizedQuery.includes(faName);

    if (isWordMatch || isLevenshteinLike) {
      artistMap.set(fa.name.toLowerCase(), {
        id: fa.id,
        name: fa.name,
        image: fa.image,
        url: `/artist/${encodeURIComponent(fa.name)}`,
      });
    }
  }

  // 2. Fetch live songs from JioSaavn API matching query and extract singers
  try {
    const songs = await searchSongs(query);
    for (const song of songs) {
      const singersList = (song.singers || song.primary_artists || '').split(',').map((s) => s.trim());
      for (const name of singersList) {
        if (name && !artistMap.has(name.toLowerCase())) {
          artistMap.set(name.toLowerCase(), {
            id: btoa(encodeURIComponent(name)).slice(0, 8),
            name: decodeHtmlEntities(name),
            image: song.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
            url: `/artist/${encodeURIComponent(name)}`,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error searching live songs for artists:', err);
  }

  // 3. Fallback: If no direct match found, synthesize artist entry for query
  if (artistMap.size === 0) {
    const formattedName = query
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    artistMap.set(query.toLowerCase(), {
      id: btoa(encodeURIComponent(formattedName)).slice(0, 8),
      name: formattedName,
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
      url: `/artist/${encodeURIComponent(formattedName)}`,
    });
  }

  return Array.from(artistMap.values());
}

export interface DetailedArtist extends Artist {
  follower_count?: string;
  is_verified?: boolean;
  top_songs: Song[];
}

export async function getArtistDetails(idOrName: string): Promise<DetailedArtist | null> {
  try {
    const res = await api.get('/artist/get/', { params: { id: idOrName } });
    const data = res.data;
    if (!data || data.status === false) {
      // Fallback: search songs for artist
      const songs = await searchSongs(`${idOrName} top songs`);
      return {
        id: idOrName,
        name: decodeHtmlEntities(idOrName),
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
        url: `/artist/${encodeURIComponent(idOrName)}`,
        follower_count: '1.2M',
        is_verified: true,
        top_songs: songs,
      };
    }

    const topSongs = normalizeSongs(data.top_songs || data.songs);

    return {
      id: data.artistId || data.id || idOrName,
      name: decodeHtmlEntities(data.name || idOrName),
      image: (data.image || '').replace('150x150', '500x500') || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
      url: `/artist/${encodeURIComponent(data.name || idOrName)}`,
      follower_count: data.follower_count || '1.5M',
      is_verified: data.is_verified ?? true,
      top_songs: topSongs,
    };
  } catch (err) {
    console.error(`Error fetching artist details for ${idOrName}:`, err);
    // Graceful fallback
    const songs = await searchSongs(idOrName);
    return {
      id: idOrName,
      name: decodeHtmlEntities(idOrName),
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
      url: `/artist/${encodeURIComponent(idOrName)}`,
      follower_count: '1M+',
      is_verified: true,
      top_songs: songs,
    };
  }
}

export async function getArtistSongs(idOrName: string): Promise<Song[]> {
  const details = await getArtistDetails(idOrName);
  return details?.top_songs || [];
}

export async function getStrictArtistTop20Songs(artistName: string): Promise<Song[]> {
  const cleanName = artistName.trim();
  const lowerArtist = cleanName.toLowerCase();

  let candidateSongs: Song[] = [];
  try {
    const details = await getArtistDetails(cleanName);
    if (details && details.top_songs && details.top_songs.length > 0) {
      candidateSongs = details.top_songs;
    }
  } catch {}

  if (candidateSongs.length < 20) {
    try {
      const searchRes = await searchSongs(`artist:${cleanName}`);
      const fallbackSearch = await searchSongs(cleanName);
      candidateSongs = [...candidateSongs, ...searchRes, ...fallbackSearch];
    } catch {}
  }

  const strictSongs: Song[] = [];
  const seenIds = new Set<string>();

  const artistWords = lowerArtist.split(/\s+/).filter((w) => w.length >= 3);

  for (const song of candidateSongs) {
    if (!song || !song.id || seenIds.has(song.id)) continue;

    const singerStr = (song.singers || song.primary_artists || (song as any).artist || '').toLowerCase();
    const titleStr = (song.song || (song as any).name || '').toLowerCase();
    const albumStr = (song.album || '').toLowerCase();

    const matchesSingers = artistWords.some((w) => singerStr.includes(w));
    const matchesTitle = artistWords.some((w) => titleStr.includes(w));
    const matchesAlbum = artistWords.some((w) => albumStr.includes(w));

    if (artistWords.length === 0 || matchesSingers || matchesTitle || matchesAlbum) {
      seenIds.add(song.id);
      strictSongs.push(song);
      if (strictSongs.length >= 20) break;
    }
  }

  return strictSongs.slice(0, 20);
}


// --- Album ---
export async function searchAlbums(query: string): Promise<Album[]> {
  try {
    const res = await api.get('/album/', { params: { query } });
    const data = res.data;
    if (!data || data.status === false) return [];
    return [{
      id: data.id || 'album-1',
      title: decodeHtmlEntities(data.title || data.name || query),
      name: decodeHtmlEntities(data.name || data.title || query),
      image: (data.image || '').replace('150x150', '500x500'),
      song_count: String(data.songs?.length || 0),
      year: data.year || '2025',
      singers: decodeHtmlEntities(data.primary_artists || ''),
      music: decodeHtmlEntities(data.music || ''),
      primary_artists: decodeHtmlEntities(data.primary_artists || ''),
      songs: normalizeSongs(data.songs),
      url: `/album/${data.id}`,
    }];
  } catch {
    return [];
  }
}

export async function getAlbum(id: string): Promise<Album | null> {
  const albums = await searchAlbums(id);
  return albums[0] ?? null;
}

// --- Playlist ---
export async function searchPlaylists(query: string): Promise<Playlist[]> {
  try {
    const res = await api.get('/playlist/', { params: { query } });
    const data = res.data;
    if (!data || data.status === false) return [];
    return [{
      id: data.id || 'playlist-1',
      title: decodeHtmlEntities(data.listname || data.title || query),
      listname: decodeHtmlEntities(data.listname || data.title || query),
      firstname: decodeHtmlEntities(data.firstname || ''),
      image: (data.image || '').replace('150x150', '500x500'),
      song_count: String(data.songs?.length || 0),
      songs: normalizeSongs(data.songs),
      url: `/playlist/${data.id}`,
    }];
  } catch {
    return [];
  }
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  const playlists = await searchPlaylists(id);
  return playlists[0] ?? null;
}

// --- Lyrics ---
export async function getLyrics(query: string): Promise<string | null> {
  try {
    const res = await api.get('/lyrics/', { params: { query } });
    return res.data?.lyrics ?? null;
  } catch {
    return null;
  }
}

// --- Universal ---
export async function universalSearch(query: string): Promise<any> {
  try {
    const res = await api.get('/result/', { params: { query } });
    return res.data;
  } catch {
    return null;
  }
}

const TRENDING_QUERIES = [
  'top hindi songs 2025',
  'bollywood trending hits',
  'punjabi top songs 2025',
  'coke studio top hits',
  'arijit singh latest hits',
  'diljit dosanjh top hits',
  'trending reels music hindi',
  'viral hits hindi punjabi',
  'lofi hindi top songs',
];

// --- Trending / Recommended ---
export async function getTrendingSongs(): Promise<Song[]> {
  try {
    const q1 = TRENDING_QUERIES[Math.floor(Math.random() * TRENDING_QUERIES.length)];
    const q2 = TRENDING_QUERIES[(Math.floor(Math.random() * TRENDING_QUERIES.length) + 1) % TRENDING_QUERIES.length];
    const q3 = TRENDING_QUERIES[(Math.floor(Math.random() * TRENDING_QUERIES.length) + 2) % TRENDING_QUERIES.length];

    const [res1, res2, res3] = await Promise.all([
      searchSongs(q1).catch(() => []),
      searchSongs(q2).catch(() => []),
      searchSongs(q3).catch(() => []),
    ]);

    const combined = [...res1, ...res2, ...res3];
    const seenIds = new Set<string>();
    const uniqueSongs: Song[] = [];

    for (const song of combined) {
      if (song && song.id && !seenIds.has(song.id)) {
        seenIds.add(song.id);
        uniqueSongs.push(song);
      }
    }

    if (uniqueSongs.length >= 6) {
      // Return exactly 12 songs (2 complete 6-card rows) shuffled randomly
      const shuffled = uniqueSongs.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 12);
    }
  } catch (err) {
    console.error('Failed to load trending songs:', err);
  }
  return [];
}

export async function getRecommendedSongs(songId: string): Promise<Song[]> {
  try {
    const songs = await searchSongs('top hindi');
    return songs.filter((s) => s.id !== songId).slice(0, 6);
  } catch {
    return [];
  }
}

export const GENRES = [
  { id: 'bollywood', name: 'Bollywood', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'pakistani', name: 'Pakistani Pop', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'punjabi', name: 'Punjabi', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'hindi', name: 'Hindi', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'sufi', name: 'Sufi', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 'ghazal', name: 'Ghazal', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { id: 'hiphop', name: 'Hip-Hop', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { id: 'rock', name: 'Rock', gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
  { id: 'edmund', name: 'EDM', gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' },
  { id: 'classical', name: 'Classical', gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
  { id: 'romantic', name: 'Romantic', gradient: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)' },
  { id: 'lofi', name: 'Lo-Fi', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
] as const;

export async function getGenreSongs(genre: string): Promise<Song[]> {
  try {
    const songs = await searchSongs(genre);
    if (songs.length > 0) return songs;
  } catch {
    // fallback
  }
  return [];
}
