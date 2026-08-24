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
  const { currentTrack } = usePlayerStore();
  const { recentlyPlayed } = useUserStore();
  const recommended = useRecommended(currentTrack);

  const handlePlayAll = (list: Song[]) => {
    const { setQueue } = usePlayerStore.getState();
    setQueue(list, 0, 'recommendation');
  };

  return (
    <div className="pb-24 md:pb-8 space-y-10">
      <Hero onSearch={(q) => onNavigate(`/search?q=${encodeURIComponent(q)}`)} />

      {/* Trending Now (2 complete rows = 12 songs) */}
      <SongList
        songs={trendingSongs.slice(0, 12)}
        title="Trending Now"
        subtitle="Top 12 hottest tracks (2 rows of 6)"
        onPlayAll={handlePlayAll}
        loading={trendingLoading}
      />

      {/* Recently Played Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text">Recently Played</h2>
            <p className="text-xs text-text-muted">Songs you listened to today</p>
          </div>
          {recentlyPlayed.length > 0 && (
            <button
              onClick={() => onNavigate('/library')}
              className="text-xs font-bold text-accent hover:underline"
            >
              View Full History →
            </button>
          )}
        </div>

        {recentlyPlayed.length > 0 ? (
          <SongList
            songs={recentlyPlayed.slice(0, 12)}
            title=""
            showPlayAll={false}
            onPlayAll={handlePlayAll}
          />
        ) : (
          <div className="p-8 rounded-2xl bg-surface border border-border text-center space-y-2">
            <span className="text-3xl">🎧</span>
            <p className="text-sm font-semibold text-text">No recently played songs yet</p>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Play any track from Trending, Search, or Discover to automatically build your listening history here!
            </p>
          </div>
        )}
      </section>

      {/* Recommended */}
      {currentTrack && !recommended.loading && recommended.songs.length > 0 && (
        <SongList
          songs={recommended.songs.slice(0, 12)}
          title="Because You Listened"
          subtitle={`More like "${currentTrack.title}"`}
          onPlayAll={handlePlayAll}
        />
      )}
    </div>
  );
}
