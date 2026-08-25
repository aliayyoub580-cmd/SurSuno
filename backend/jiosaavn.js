import axios from 'axios';
import * as endpoints from './endpoints.js';
import { formatSong, formatAlbum, formatPlaylist } from './helper.js';

function parseJsonResponse(data) {
  if (!data) return null;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    try {
      const fixed = data.replace(/\(From "([^"]+)"\)/g, "(From '$1')");
      return JSON.parse(fixed);
    } catch (e) {
      console.error('JSON parse error:', e.message);
      return null;
    }
  }
}

export async function getLyrics(id) {
  try {
    const url = endpoints.lyricsBaseUrl + id;
    const res = await axios.get(url);
    const data = parseJsonResponse(res.data);
    return data?.lyrics || null;
  } catch (err) {
    console.error('Error fetching lyrics:', err.message);
    return null;
  }
}

export async function getSong(id, lyrics = false) {
  try {
    const url = endpoints.songDetailsBaseUrl + id;
    const res = await axios.get(url);
    const data = parseJsonResponse(res.data);
    if (data && data[id]) {
      return await formatSong(data[id], lyrics);
    }
    return null;
  } catch (err) {
    console.error(`Error getting song ${id}:`, err.message);
    return null;
  }
}

export async function getSongId(url) {
  try {
    const res = await axios.get(url, { params: { bitrate: '320' } });
    const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    if (text.includes('"pid":"')) {
      return text.split('"pid":"')[1].split('","')[0];
    }
    if (text.includes('"song":{"type":"')) {
      return text.split('"song":{"type":"')[1].split('","image":')[0].split('"id":"').pop();
    }
    return null;
  } catch (err) {
    console.error('Error getting song ID from URL:', err.message);
    return null;
  }
}

export async function getSongsBatch(ids, lyrics = false) {
  if (!ids || ids.length === 0) return [];
  try {
    const url = endpoints.songDetailsBaseUrl + ids.join(',');
    const res = await axios.get(url, { timeout: 6000 });
    const data = parseJsonResponse(res.data);
    if (!data) return [];

    const songs = [];
    for (const id of ids) {
      if (data[id]) {
        const formatted = await formatSong(data[id], lyrics);
        if (formatted) songs.push(formatted);
      }
    }
    return songs;
  } catch (err) {
    console.error('Error fetching batch songs:', err.message);
    return [];
  }
}

export async function searchForSong(query, lyrics = false, songdata = true) {
  if (query.startsWith('http') && query.includes('saavn.com')) {
    const id = await getSongId(query);
    if (id) return await getSong(id, lyrics);
  }

  try {
    const url = endpoints.searchBaseUrl + encodeURIComponent(query);
    const res = await axios.get(url, { timeout: 6000 });
    const json = parseJsonResponse(res.data);
    const songData = json?.songs?.data || [];

    if (!songdata) {
      return songData;
    }

    const ids = songData.map((item) => item.id).filter(Boolean);
    if (ids.length > 0) {
      const songs = await getSongsBatch(ids, lyrics);
      if (songs.length > 0) return songs;
    }

    // Fallback: format directly from autocomplete items if batch fails or times out
    return songData.map((item) => ({
      id: item.id || String(Math.random()),
      title: item.title || item.song || 'Song',
      song: item.title || item.song || 'Song',
      image: (item.image || '').replace('150x150', '500x500'),
      singers: item.singers || item.description || '',
      primary_artists: item.singers || item.description || '',
      album: item.album || '',
      media_url: item.media_url || item.url || '',
      language: 'hindi',
      duration: '180',
    }));
  } catch (err) {
    console.error(`Error searching for song '${query}':`, err.message);
    return [];
  }
}

export async function getAlbumId(inputUrl) {
  try {
    const res = await axios.get(inputUrl);
    const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    if (text.includes('"album_id":"')) {
      return text.split('"album_id":"')[1].split('"')[0];
    }
    if (text.includes('"page_id","')) {
      return text.split('"page_id","')[1].split('","')[0];
    }
    return null;
  } catch (err) {
    console.error('Error getting album ID:', err.message);
    return null;
  }
}

export async function getAlbum(albumId, lyrics = false) {
  try {
    const url = endpoints.albumDetailsBaseUrl + albumId;
    const res = await axios.get(url);
    const json = parseJsonResponse(res.data);
    return await formatAlbum(json, lyrics);
  } catch (err) {
    console.error(`Error getting album ${albumId}:`, err.message);
    return null;
  }
}

export async function getPlaylistId(inputUrl) {
  try {
    const res = await axios.get(inputUrl);
    const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    if (text.includes('"type":"playlist","id":"')) {
      return text.split('"type":"playlist","id":"')[1].split('"')[0];
    }
    if (text.includes('"page_id","')) {
      return text.split('"page_id","')[1].split('","')[0];
    }
    return null;
  } catch (err) {
    console.error('Error getting playlist ID:', err.message);
    return null;
  }
}

export async function getPlaylist(listId, lyrics = false) {
  try {
    const url = endpoints.playlistDetailsBaseUrl + listId;
    const res = await axios.get(url);
    const json = parseJsonResponse(res.data);
    return await formatPlaylist(json, lyrics);
  } catch (err) {
    console.error(`Error getting playlist ${listId}:`, err.message);
    return null;
  }
}

export async function getArtist(idOrName, lyrics = false) {
  try {
    let url = endpoints.artistDetailsBaseUrl + encodeURIComponent(idOrName);
    let res = await axios.get(url);
    let json = parseJsonResponse(res.data);

    if (!json || (!json.artistId && !json.name && !json.artist_name)) {
      url = endpoints.artistDetailsByNameUrl + encodeURIComponent(idOrName);
      res = await axios.get(url);
      json = parseJsonResponse(res.data);
    }

    const artistName = json?.name || json?.artist_name || idOrName;
    const image = (json?.image || '').replace('150x150', '500x500');
    const followerCount = json?.follower_count || json?.fan_count || '1M+';

    let rawTopSongs = json?.topSongs || json?.top_songs || json?.songs || [];
    let formattedSongs = [];

    if (Array.isArray(rawTopSongs) && rawTopSongs.length > 0) {
      for (const item of rawTopSongs) {
        if (item.id) {
          const fullSong = await getSong(item.id, lyrics);
          if (fullSong) {
            formattedSongs.push(fullSong);
          }
        }
      }
    }

    // Fallback if top songs API returned empty
    if (formattedSongs.length === 0) {
      const searchedSongs = await searchForSong(`${artistName} top songs`, lyrics, true);
      formattedSongs = searchedSongs;
    }

    return {
      status: true,
      artistId: json?.artistId || json?.id || idOrName,
      name: artistName,
      image: image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
      follower_count: followerCount,
      is_verified: true,
      top_songs: formattedSongs,
    };
  } catch (err) {
    console.error(`Error getting artist ${idOrName}:`, err.message);
    // Fallback: search for songs by artist name
    const fallbackSongs = await searchForSong(idOrName, lyrics, true);
    return {
      status: true,
      artistId: idOrName,
      name: idOrName,
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
      follower_count: '1M+',
      is_verified: true,
      top_songs: fallbackSongs,
    };
  }
}

