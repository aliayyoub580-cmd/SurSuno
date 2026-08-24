import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTrending } from '@/hooks/useApi';
import { searchSongs } from '@/services/musicApi';
import { SongCard } from '@/components/SongCard';
import { SongCardSkeleton } from '@/components/Skeleton';
import { usePlayerStore } from '@/stores/playerStore';
import type { Song } from '@/types';

const TRENDING_EXTRA_QUERIES = [
  'bollywood top hits 2025',
  'punjabi top 100 trending',
  'pakistani Coke Studio latest hits',
  'top global viral hits 2025',
  'arijit singh top songs',
];

export function TrendingPage() {
  const navigate = useNavigate();
  const { songs: initialSongs, loading: initialLoading } = useTrending();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isFullFeed, setIsFullFeed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const { currentTrack, isPlaying } = usePlayerStore();

  useEffect(() => {
    if (initialSongs.length > 0) {
      setSongs(initialSongs);
    }
  }, [initialSongs]);

  const loadMoreTrending = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const query = TRENDING_EXTRA_QUERIES[page % TRENDING_EXTRA_QUERIES.length];
    try {
      const more = await searchSongs(query);
      if (more.length === 0) {
        setHasMore(false);
      } else {
        setSongs((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const filtered = more.filter((s) => !existingIds.has(s.id));
          if (filtered.length === 0) setHasMore(false);
          return [...prev, ...filtered];
        });
        setPage((p) => p + 1);
      }
    } catch (err) {
      console.warn('Error loading more trending songs:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!isFullFeed || initialLoading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreTrending();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFullFeed, initialLoading, loadingMore, hasMore, loadMoreTrending]
  );

  const handlePlay = (song: Song) => {
    const { setTrack, setQueue, togglePlay } = usePlayerStore.getState();
    const idx = songs.findIndex((s) => s.id === song.id);
    setQueue(songs, Math.max(0, idx));
    setTrack(song);
    togglePlay();
  };

  // 2 complete rows = 12 cards preview
  const previewSongs = songs.slice(0, 12);
  const displayedSongs = isFullFeed ? songs : previewSongs;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-text">Trending Hits</h1>
        <p className="text-text-muted text-sm mt-1">The hottest music tracks trending across South Asia and globally</p>
      </motion.div>

      {/* Language Quick Categories */}
      <div>
        <h2 className="text-lg font-bold text-text mb-3">Browse By Language</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'hindi', name: 'Hindi', gradient: 'from-cyan-500 to-blue-600', plays: '2.5M plays' },
            { id: 'punjabi', name: 'Punjabi', gradient: 'from-pink-500 to-rose-600', plays: '1.8M plays' },
            { id: 'pakistani', name: 'Pakistani', gradient: 'from-emerald-500 to-teal-600', plays: '900K plays' },
            { id: 'english', name: 'English', gradient: 'from-purple-500 to-indigo-600', plays: '1.2M plays' },
          ].map((lang, i) => (
            <motion.div
              key={lang.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/language/${lang.id}`)}
              className={`bg-gradient-to-br ${lang.gradient} rounded-2xl p-5 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all`}
            >
              <p className="font-extrabold text-xl">{lang.name}</p>
              <p className="text-white/80 text-xs mt-1 font-medium">{lang.plays}</p>
              <span className="inline-block mt-3 text-[0.65rem] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full">
                Explore Feed →
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trending Songs Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">Today's Top Hits</h2>
          {isFullFeed && (
            <span className="text-xs text-text-muted font-medium">
              Showing {songs.length} continuous songs
            </span>
          )}
        </div>

        {initialLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <SongCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {displayedSongs.map((song, index) => {
                const isLast = index === displayedSongs.length - 1;
                return (
                  <div key={song.id || index} ref={isLast ? lastElementRef : null}>
                    <SongCard
                      song={song}
                      onPlay={handlePlay}
                      isPlaying={currentTrack?.id === song.id && isPlaying}
                    />
                  </div>
                );
              })}
            </div>

            {/* View More Button (when not in full continuous feed mode) */}
            {!isFullFeed && songs.length >= 12 && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => {
                    setIsFullFeed(true);
                    loadMoreTrending();
                  }}
                  className="px-8 py-3 rounded-full bg-accent text-white font-bold text-sm shadow-lg shadow-accent/25 hover:bg-accent/90 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>View More Trending Songs</span>
                  <span>↓</span>
                </button>
              </div>
            )}

            {/* Continuous Loading Spinner */}
            {isFullFeed && loadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-3 text-sm text-text-muted font-medium bg-surface px-4 py-2 rounded-full border border-border">
                  <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  Loading more trending songs...
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
