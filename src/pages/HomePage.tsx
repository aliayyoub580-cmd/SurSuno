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
    <div className="pb-24 md:pb-8 space-y-8">
      <Hero onSearch={(q) => onNavigate(`/search?q=${encodeURIComponent(q)}`)} />

      {/* Trending Now (6 songs) */}
      <SongList
        songs={trendingSongs.slice(0, 6)}
        title="Trending Now"
        onPlayAll={handlePlayAll}
        loading={trendingLoading}
      />

      {/* Recommended */}
      {currentTrack && !recommended.loading && recommended.songs.length > 0 && (
        <SongList
          songs={recommended.songs.slice(0, 6)}
          title="Because You Listened"
          subtitle={`More like "${currentTrack.title}"`}
          onPlayAll={handlePlayAll}
        />
      )}
    </div>
  );
}
