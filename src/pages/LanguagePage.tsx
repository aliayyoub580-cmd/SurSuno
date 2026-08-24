import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { searchSongs } from '@/services/musicApi';
import { SongCard } from '@/components/SongCard';
import { SongCardSkeleton } from '@/components/Skeleton';
import { usePlayerStore } from '@/stores/playerStore';
import type { Song } from '@/types';

const LANGUAGE_META: Record<string, { title: string; query: string; gradient: string }> = {
  hindi: { title: 'Hindi Top Hits', query: 'hindi top hits 2025', gradient: 'from-cyan-500 to-blue-600' },
  punjabi: { title: 'Punjabi Blockbusters', query: 'punjabi top songs 2025', gradient: 'from-pink-500 to-rose-600' },
  pakistani: { title: 'Pakistani Pop & Sufi', query: 'pakistani Coke Studio top songs', gradient: 'from-emerald-500 to-teal-600' },
  english: { title: 'English International Hits', query: 'english top pop Billboard hits', gradient: 'from-purple-500 to-indigo-600' },
};

const EXTRA_QUERIES: Record<string, string[]> = {
  hindi: ['arijit singh romantic hindi', 'bollywood party hits', 'lofi hindi songs', 'old hindi classics'],
  punjabi: ['karan aujla diljit dosanjh', 'punjabi workout beats', 'punjabi sad songs', 'latest punjabi bangers'],
  pakistani: ['atif aslam rahat fateh ali khan', 'young stunners urdu rap', 'pakistani indie pop', 'coke studio classics'],
  english: ['taylor swift ed sheeran', 'the weeknd synth pop', 'top 40 pop hits', 'chill english acoustic'],
};

export function LanguagePage() {
  const { lang = 'hindi' } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const normalizedLang = lang.toLowerCase();

  const meta = LANGUAGE_META[normalizedLang] || {
    title: `${lang.toUpperCase()} Music Feed`,
    query: `${lang} top songs`,
    gradient: 'from-accent to-pink-500',
  };

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const { currentTrack, isPlaying } = usePlayerStore();

  const loadInitialSongs = async () => {
    setLoading(true);
    setSongs([]);
    setPage(0);
    setHasMore(true);

    try {
      const initialList = await searchSongs(meta.query);
      setSongs(initialList);
    } catch (err) {
      console.error('Failed to load language songs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialSongs();
  }, [lang]);

  const loadMoreSongs = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const queryList = EXTRA_QUERIES[normalizedLang] || [`${lang} trending music`];
    const nextQueryIndex = page % queryList.length;
    const nextQuery = queryList[nextQueryIndex];

    try {
      const more = await searchSongs(nextQuery);
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
      console.warn('Error loading more language songs:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, normalizedLang, lang]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreSongs();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, hasMore, loadMoreSongs]
  );

  const handlePlaySong = (song: Song) => {
    const { setTrack, setQueue, togglePlay } = usePlayerStore.getState();
    setQueue(songs, songs.findIndex((s) => s.id === song.id));
    setTrack(song);
    togglePlay();
  };

  return (
    <div className="pb-24 md:pb-8 space-y-6">
      {/* Header Banner */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${meta.gradient} p-6 md:p-8 text-white shadow-xl`}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-black/20 hover:bg-black/40 backdrop-blur-md transition-colors"
          >
            ← Back
          </button>
          <span className="text-xs uppercase tracking-widest font-bold opacity-80">Continuous Feed</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold capitalize">{meta.title}</h1>
        <p className="text-sm text-white/80 mt-2 max-w-xl">
          Endless stream of top {lang} tracks. Scroll down for infinite music.
        </p>
      </div>

      {/* Language Switcher Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {['hindi', 'punjabi', 'pakistani', 'english'].map((l) => (
          <button
            key={l}
            onClick={() => navigate(`/language/${l}`)}
            className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all flex-shrink-0 ${
              normalizedLang === l
                ? 'bg-accent text-white shadow-md'
                : 'bg-surface border border-border text-text-muted hover:text-text'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Songs Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <SongCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {songs.map((song, index) => {
              const isLast = index === songs.length - 1;
              return (
                <div key={song.id || index} ref={isLast ? lastElementRef : null}>
                  <SongCard
                    song={song}
                    onPlay={handlePlaySong}
                    isPlaying={currentTrack?.id === song.id && isPlaying}
                  />
                </div>
              );
            })}
          </div>

          {/* Lazy Loading Spinner / Sentinel */}
          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-3 text-sm text-text-muted font-medium bg-surface px-4 py-2 rounded-full border border-border">
                <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                Loading more {lang} songs...
              </div>
            </div>
          )}

          {!hasMore && (
            <div className="text-center py-8 text-xs text-text-muted font-medium">
              You've reached the end of the feed for {lang}!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
