import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getArtistDetails, type DetailedArtist } from '@/services/musicApi';
import { usePlayerStore } from '@/stores/playerStore';
import { useUserStore } from '@/stores/userStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { FAMOUS_ARTISTS } from '@/data/artistsData';
import type { Song } from '@/types';

export function ArtistDetail() {
  const { artistId } = useParams<{ artistId: string }>();
  const navigate = useNavigate();

  const [artist, setArtist] = useState<DetailedArtist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);

  const { currentTrack, isPlaying, setTrack, setQueue, togglePlay } = usePlayerStore();
  const { toggleFavorite, isFavorite } = useUserStore();
  const { playlists, addSongToPlaylist } = useLibraryStore();

  useEffect(() => {
    async function fetchArtist() {
      if (!artistId) return;
      setLoading(true);
      try {
        // First check static data for instant fallback metadata
        const decodedName = decodeURIComponent(artistId);
        const staticMatch = FAMOUS_ARTISTS.find(
          (a) => a.id === artistId || a.name.toLowerCase() === decodedName.toLowerCase()
        );

        const details = await getArtistDetails(decodedName);
        if (details) {
          if (staticMatch) {
            details.follower_count = staticMatch.followers;
            if (!details.image || details.image.includes('placeholder')) {
              details.image = staticMatch.image;
            }
          }
          setArtist(details);
        }
      } catch (err) {
        console.error('Error loading artist details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchArtist();
  }, [artistId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-64 sm:h-80 bg-surface-2 rounded-3xl w-full" />
        <div className="space-y-3">
          <div className="h-6 bg-surface-2 rounded-lg w-1/4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface rounded-2xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-4xl">🎤</div>
        <h2 className="text-2xl font-bold text-text">Artist Not Found</h2>
        <button
          onClick={() => navigate('/artists')}
          className="px-6 py-2.5 rounded-full bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-colors"
        >
          Explore Artists
        </button>
      </div>
    );
  }

  const handlePlayArtist = (startIndex = 0) => {
    if (!artist.top_songs || artist.top_songs.length === 0) return;
    setQueue(artist.top_songs, startIndex, `artist-${artist.name}`);
    setTrack(artist.top_songs[startIndex]);
    usePlayerStore.setState({ isPlaying: true });
  };

  const handleShufflePlay = () => {
    if (!artist.top_songs || artist.top_songs.length === 0) return;
    const shuffled = [...artist.top_songs].sort(() => Math.random() - 0.5);
    setQueue(shuffled, 0, `artist-${artist.name}-shuffle`);
    setTrack(shuffled[0]);
    usePlayerStore.setState({ isPlaying: true });
  };

  const handlePlaySongRow = (song: Song, index: number) => {
    if (currentTrack?.id === song.id) {
      togglePlay();
    } else {
      handlePlayArtist(index);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Banner Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative min-h-[320px] sm:min-h-[380px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-end p-6 sm:p-10 bg-surface-3"
      >
        {/* Background Image with Dark Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url(${artist.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/70 to-transparent" />

        {/* Banner Content */}
        <div className="relative z-10 space-y-4">
          {/* Verified Badge */}
          {artist.is_verified && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-500/40 text-blue-300 text-xs font-bold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Verified Artist
            </div>
          )}

          {/* Artist Name */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-md">
            {artist.name}
          </h1>

          <p className="text-xs sm:text-sm text-white/80 font-medium">
            {artist.follower_count} followers • Top South Asian & Global Hits
          </p>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {/* Big Circular Play Button */}
            <button
              onClick={() => handlePlayArtist(0)}
              className="w-14 h-14 rounded-full bg-accent hover:bg-accent/90 text-white flex items-center justify-center shadow-xl shadow-accent/30 hover:scale-105 active:scale-95 transition-all"
              aria-label="Play Top Tracks"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>

            {/* Shuffle Button */}
            <button
              onClick={handleShufflePlay}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:scale-105 transition-all"
              title="Shuffle Play"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </button>

            {/* Follow / Following Toggle Button */}
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-6 py-3 rounded-full font-bold text-xs sm:text-sm transition-all border ${
                isFollowing
                  ? 'bg-white/10 border-white/30 text-white hover:bg-red-500/20 hover:border-red-500/40'
                  : 'bg-white text-black hover:bg-white/90 border-transparent shadow-lg'
              }`}
            >
              {isFollowing ? 'Following' : '+ Follow'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Popular Tracks Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-text">Popular</h2>
          <span className="text-xs text-text-muted">{artist.top_songs.length} top tracks</span>
        </div>

        {artist.top_songs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface border border-border text-center text-text-muted text-sm">
            No popular tracks loaded for this artist right now.
          </div>
        ) : (
          <div className="space-y-1">
            {artist.top_songs.map((song, index) => {
              const isCurrent = currentTrack?.id === song.id;
              const isFav = isFavorite(song.id);

              return (
                <div
                  key={song.id}
                  className={`group relative flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                    isCurrent ? 'bg-accent/15 border border-accent/30' : 'hover:bg-surface-2 border border-transparent'
                  }`}
                  onClick={() => handlePlaySongRow(song, index)}
                >
                  {/* Left rank + image + title */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Rank index */}
                    <span className="w-6 text-center text-xs font-bold text-text-muted group-hover:hidden">
                      {index + 1}
                    </span>
                    <button
                      className="w-6 hidden group-hover:flex items-center justify-center text-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySongRow(song, index);
                      }}
                    >
                      {isCurrent && isPlaying ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>

                    {/* Track Thumbnail */}
                    <img
                      src={song.image}
                      alt={song.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm"
                    />

                    {/* Title + Album */}
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold text-sm truncate ${isCurrent ? 'text-accent' : 'text-text'}`}>
                        {song.title}
                      </p>
                      <p className="text-text-muted text-xs truncate">
                        {song.album || song.singers}
                      </p>
                    </div>
                  </div>

                  {/* Right actions: Duration & Overflow menu */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(song);
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        isFav ? 'text-red-500' : 'text-text-muted opacity-0 group-hover:opacity-100 hover:text-text'
                      }`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>

                    <span className="text-text-muted text-xs hidden sm:inline">
                      {formatDuration(song.duration)}
                    </span>

                    {/* Overflow menu button */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuSongId(activeMenuSongId === song.id ? null : song.id);
                        }}
                        className="p-2 text-text-muted hover:text-text rounded-full hover:bg-surface-3 transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {activeMenuSongId === song.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 top-10 z-30 w-48 bg-surface-2 border border-border rounded-2xl shadow-2xl py-2 space-y-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                usePlayerStore.getState().addToQueue(song);
                                setActiveMenuSongId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-semibold text-text hover:bg-surface-3 flex items-center gap-2"
                            >
                              ➕ Add to Queue
                            </button>

                            {playlists.map((pl) => (
                              <button
                                key={pl.id}
                                onClick={() => {
                                  addSongToPlaylist(pl.id, song);
                                  setActiveMenuSongId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-xs font-semibold text-text-muted hover:text-text hover:bg-surface-3 truncate"
                              >
                                🎵 Add to {pl.name}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function formatDuration(sec: string): string {
  const s = parseInt(sec) || 180;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
