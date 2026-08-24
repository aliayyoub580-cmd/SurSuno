import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { searchSongs } from '@/services/musicApi';
import { usePlayerStore } from '@/stores/playerStore';
import { useUserStore } from '@/stores/userStore';
import { SearchBar } from '@/components/SearchBar';
import { SongList } from '@/components/SongList';
import { SongCardSkeleton } from '@/components/Skeleton';
import type { Song } from '@/types';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToSearchHistory, searchHistory } = useUserStore();

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    setLoading(true);
    searchSongs(debouncedQuery, false)
      .then((data) => setResults((data as Song[]).slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handlePlayAll = () => {
    if (!results.length) return;
    const { setQueue } = usePlayerStore.getState();
    setQueue(results, 0, 'search');
  };

  const clearHistory = () => {
    useUserStore.getState().clearSearchHistory();
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-30 bg-bg/80 backdrop-blur-xl -mx-4 px-4 py-3 md:-mx-0 md:px-0 md:static md:bg-transparent md:backdrop-blur-none md:py-0 md:mb-6">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={() => addToSearchHistory(query)}
          placeholder="Search songs, artists, albums..."
        />
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <SongCardSkeleton key={i} />)}
            </div>
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SongList
              songs={results}
              title={`Results for "${debouncedQuery}"`}
              onPlayAll={handlePlayAll}
              loading={false}
            />
          </motion.div>
        ) : query.trim() ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-lg font-semibold text-text mb-2">No results found</h3>
            <p className="text-text-muted text-sm">Try searching for something else</p>
          </motion.div>
        ) : (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-text mb-2">Search for your favorite music</h3>
            <p className="text-text-muted text-sm">Songs, artists, albums, and more</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search history */}
      {!query && searchHistory.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text">Recent Searches</h2>
            <button onClick={clearHistory} className="text-sm text-accent hover:underline">Clear all</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 10).map((hist: string) => (
              <button
                key={hist}
                onClick={() => setQuery(hist)}
                className="px-3 py-1.5 bg-surface-2 text-text-muted rounded-full text-sm hover:bg-surface-3 hover:text-text transition-colors"
              >
                {hist}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
