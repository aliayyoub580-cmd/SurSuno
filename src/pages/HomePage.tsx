import { motion } from 'motion/react';
import { useTrending, useRecommended, usePersonalized } from '@/hooks/useApi';
import { SongCard } from '@/components/SongCard';
import { SongList } from '@/components/SongList';
import { SongCardSkeleton } from '@/components/Skeleton';
import { usePlayerStore } from '@/stores/playerStore';
import { useUserStore } from '@/stores/userStore';
import { Hero } from '@/components/Hero';
import type { Song } from '@/types';

export function HomePage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { songs: trendingSongs, loading: trendingLoading } = useTrending();
  const { songs: personalizedSongs, loading: personalizedLoading } = usePersonalized();
  const { currentTrack, isPlaying } = usePlayerStore();
  const { addToRecentlyPlayed } = useUserStore();

  const madeForYouSongs = personalizedSongs.length > 0 ? personalizedSongs : trendingSongs;
  const recommended = useRecommended(currentTrack);

  const handlePlay = (song: Song) => {
    addToRecentlyPlayed(song);
    const { setQueue } = usePlayerStore.getState();
    setQueue([song], 0, 'recommendation');
  };

  const handlePlayAll = (list: Song[]) => {
    const { setQueue } = usePlayerStore.getState();
    setQueue(list, 0, 'recommendation');
  };

  return (
    <div className="pb-24 md:pb-8">
      <Hero onSearch={(q) => onNavigate(`/search?q=${encodeURIComponent(q)}`)} />

      {/* Made For You */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text">Made For You</h2>
        </div>
        {personalizedLoading || (madeForYouSongs.length === 0 && trendingLoading) ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SongCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {madeForYouSongs.slice(0, 6).map((song, i) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <SongCard
                  song={song}
                  onPlay={handlePlay}
                  isPlaying={currentTrack?.id === song.id && isPlaying}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Trending */}
      <SongList songs={trendingSongs} title="Trending Now" onPlayAll={handlePlayAll} loading={trendingLoading} />

      {/* Recommended */}
      {currentTrack && !recommended.loading && recommended.songs.length > 0 && (
        <SongList
          songs={recommended.songs}
          title="Because You Listened"
          subtitle={`More like "${currentTrack.title}"`}
          onPlayAll={handlePlayAll}
        />
      )}
    </div>
  );
}
