import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as jiosaavn from './jiosaavn.js';
import { fetchRssNews, fetchAndSyncNews } from './newsWorker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5100;

app.use(cors());
app.use(express.json());

// Handle /api prefix stripping for Vercel Services rewrites
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }
  next();
});

// Documentation Redirect
app.get('/', (req, res) => {
  res.redirect('https://cyberboysumanjay.github.io/JioSaavnAPI/');
});

// Song Search
app.get('/song/', async (req, res) => {
  const query = req.query.query;
  const lyrics = req.query.lyrics === 'true' || req.query.lyrics === 'True';
  const songdata = req.query.songdata !== 'false' && req.query.songdata !== 'False';

  if (!query) {
    return res.status(400).json({
      status: false,
      error: 'Query is required to search songs!',
    });
  }

  try {
    const results = await jiosaavn.searchForSong(query, lyrics, songdata);
    res.json(results);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// Get Song Details by ID
app.get('/song/get/', async (req, res) => {
  const id = req.query.id;
  const lyrics = req.query.lyrics === 'true' || req.query.lyrics === 'True';

  if (!id) {
    return res.status(400).json({
      status: false,
      error: 'Song ID is required to get a song!',
    });
  }

  try {
    const song = await jiosaavn.getSong(id, lyrics);
    if (!song) {
      return res.status(404).json({
        status: false,
        error: 'Invalid Song ID received!',
      });
    }
    res.json(song);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// Playlist Endpoint
app.get('/playlist/', async (req, res) => {
  const query = req.query.query;
  const lyrics = req.query.lyrics === 'true' || req.query.lyrics === 'True';

  if (!query) {
    return res.status(400).json({
      status: false,
      error: 'Query is required to search playlists!',
    });
  }

  try {
    let playlistId = query;
    if (query.startsWith('http')) {
      playlistId = await jiosaavn.getPlaylistId(query);
    }
    const songs = await jiosaavn.getPlaylist(playlistId, lyrics);
    res.json(songs || { status: false, error: 'Playlist not found' });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// Album Endpoint
app.get('/album/', async (req, res) => {
  const query = req.query.query;
  const lyrics = req.query.lyrics === 'true' || req.query.lyrics === 'True';

  if (!query) {
    return res.status(400).json({
      status: false,
      error: 'Query is required to search albums!',
    });
  }

  try {
    let albumId = query;
    if (query.startsWith('http')) {
      albumId = await jiosaavn.getAlbumId(query);
    }
    const songs = await jiosaavn.getAlbum(albumId, lyrics);
    res.json(songs || { status: false, error: 'Album not found' });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// Lyrics Endpoint
app.get('/lyrics/', async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({
      status: false,
      error: 'Query containing song link or id is required to fetch lyrics!',
    });
  }

  try {
    let id = query;
    if (query.startsWith('http') && query.includes('saavn')) {
      id = await jiosaavn.getSongId(query);
    }
    const lyricsText = await jiosaavn.getLyrics(id);
    res.json({ status: true, lyrics: lyricsText });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// Result Router Endpoint
app.get('/result/', async (req, res) => {
  const query = req.query.query;
  const lyrics = req.query.lyrics === 'true' || req.query.lyrics === 'True';

  if (!query) {
    return res.status(400).json({ status: false, error: 'Query parameter is required' });
  }

  try {
    if (!query.includes('saavn')) {
      const results = await jiosaavn.searchForSong(query, lyrics, true);
      return res.json(results);
    }

    if (query.includes('/song/')) {
      const songId = await jiosaavn.getSongId(query);
      const song = await jiosaavn.getSong(songId, lyrics);
      return res.json(song);
    } else if (query.includes('/album/')) {
      const id = await jiosaavn.getAlbumId(query);
      const album = await jiosaavn.getAlbum(id, lyrics);
      return res.json(album);
    } else if (query.includes('/playlist/') || query.includes('/featured/')) {
      const id = await jiosaavn.getPlaylistId(query);
      const playlist = await jiosaavn.getPlaylist(id, lyrics);
      return res.json(playlist);
    }

    const fallback = await jiosaavn.searchForSong(query, lyrics, true);
    res.json(fallback);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// Daily News Endpoints
app.get(['/news', '/news/'], async (req, res) => {
  try {
    const articles = await fetchRssNews();
    res.json({ status: true, count: articles.length, data: articles });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

app.all(['/news/update', '/news/update/'], async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = req.headers['x-cron-secret'] || req.query.secret;

  if (cronSecret && providedSecret !== cronSecret) {
    return res.status(401).json({ status: false, error: 'Unauthorized cron trigger' });
  }

  try {
    const result = await fetchAndSyncNews();
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`SurSuno Node.js Express server running at http://localhost:${PORT}`);
});

export default app;

