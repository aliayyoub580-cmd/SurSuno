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

export async function searchForSong(query, lyrics = false, songdata = true) {
  if (query.startsWith('http') && query.includes('saavn.com')) {
    const id = await getSongId(query);
    if (id) return await getSong(id, lyrics);
  }

  try {
    const url = endpoints.searchBaseUrl + encodeURIComponent(query);
    const res = await axios.get(url);
    const json = parseJsonResponse(res.data);
    const songData = json?.songs?.data || [];

    if (!songdata) {
      return songData;
    }

    const songs = [];
    for (const item of songData) {
      if (item.id) {
        const fullSong = await getSong(item.id, lyrics);
        if (fullSong) {
          songs.push(fullSong);
        }
      }
    }
    return songs;
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
