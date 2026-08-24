import CryptoJS from 'crypto-js';
import { getLyrics } from './jiosaavn.js';

export function formatString(str) {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .replace(/&quot;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'");
}

export function decryptUrl(url) {
  if (!url) return '';
  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const ciphertext = CryptoJS.enc.Base64.parse(url.trim());
    const decrypted = CryptoJS.DES.decrypt({ ciphertext }, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decStr = decrypted.toString(CryptoJS.enc.Utf8);
    return decStr ? decStr.replace('_96.mp4', '_320.mp4') : '';
  } catch (err) {
    console.error('Error decrypting URL:', err);
    return '';
  }
}

export async function formatSong(data, lyrics = false) {
  if (!data) return null;

  try {
    if (data.encrypted_media_url) {
      data.media_url = decryptUrl(data.encrypted_media_url);
      if (data['320kbps'] !== 'true' && data['320kbps'] !== true) {
        data.media_url = data.media_url.replace('_320.mp4', '_160.mp4');
      }
      data.media_preview_url = data.media_url
        .replace('_320.mp4', '_96_p.mp4')
        .replace('_160.mp4', '_96_p.mp4')
        .replace('//aac.', '//preview.');
    } else if (data.media_preview_url) {
      let url = data.media_preview_url.replace('preview', 'aac');
      if (data['320kbps'] === 'true' || data['320kbps'] === true) {
        url = url.replace('_96_p.mp4', '_320.mp4');
      } else {
        url = url.replace('_96_p.mp4', '_160.mp4');
      }
      data.media_url = url;
    }
  } catch (e) {
    console.error('Media URL formatting error:', e);
  }

  data.song = formatString(data.song);
  data.title = data.title ? formatString(data.title) : data.song;
  data.music = formatString(data.music);
  data.singers = formatString(data.singers);
  data.starring = formatString(data.starring);
  data.album = formatString(data.album);
  data.primary_artists = formatString(data.primary_artists);

  if (data.image) {
    data.image = data.image.replace('150x150', '500x500');
  }

  if (lyrics) {
    if (data.has_lyrics === 'true' || data.has_lyrics === true) {
      data.lyrics = await getLyrics(data.id);
    } else {
      data.lyrics = null;
    }
  }

  if (data.copyright_text) {
    data.copyright_text = data.copyright_text.replace(/&copy;/g, '©');
  }

  return data;
}

export async function formatAlbum(data, lyrics = false) {
  if (!data) return null;
  if (data.image) {
    data.image = data.image.replace('150x150', '500x500');
  }
  data.name = formatString(data.name);
  data.primary_artists = formatString(data.primary_artists);
  data.title = formatString(data.title);

  if (Array.isArray(data.songs)) {
    const formattedSongs = [];
    for (const song of data.songs) {
      const formatted = await formatSong(song, lyrics);
      if (formatted) formattedSongs.push(formatted);
    }
    data.songs = formattedSongs;
  }

  return data;
}

export async function formatPlaylist(data, lyrics = false) {
  if (!data) return null;
  data.firstname = formatString(data.firstname);
  data.listname = formatString(data.listname);

  if (Array.isArray(data.songs)) {
    const formattedSongs = [];
    for (const song of data.songs) {
      const formatted = await formatSong(song, lyrics);
      if (formatted) formattedSongs.push(formatted);
    }
    data.songs = formattedSongs;
  }

  return data;
}
