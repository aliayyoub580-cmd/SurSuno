import { useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useUserStore } from '@/stores/userStore';
import { SongCard } from './SongCard';
import type { Song } from '@/types';

interface SongListProps {
  songs: Song[];
  title: string;
  subtitle?: string;
  loading?: boolean;
  emptyText?: string;
  onPlayAll?: (songs: Song[]) => void;
  showPlayAll?: boolean;
  id?: string;
}

export function SongList({ songs, title, subtitle, loading, emptyText = 'No songs found', onPlayAll, showPlayAll = true, id }: SongListProps) {
  const { setTrack, setQueue, togglePlay, isPlaying, currentTrack } = usePlayerStore();
  const { isFavorite, addFavorite, removeFavorite } = useUserStore();

  const handlePlay = (song: Song) => {
    const idx = songs.findIndex((s) => s.id === song.id);
    setQueue(songs, Math.max(0, idx));
    setTrack(song);
    togglePlay();
  };

  if (loading) return <div className="text-text-muted text-sm py-4">Loading...</div>;
  if (!songs.length) return (
    <div className="text-center py-8 text-text-muted">
      <p className="text-sm">{emptyText}</p>
    </div>
  );

  return (
    <section className="mb-8" id={id}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-text">{title}</h2>
          {subtitle && <p className="text-text-muted text-sm mt-0.5">{subtitle}</p>}
        </div>
        {showPlayAll && onPlayAll && (
          <button
            onClick={() => onPlayAll(songs)}
            className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium hover:bg-accent/20 transition-colors"
            aria-label={`Play all ${title}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play All
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {songs.map((song, i) => (
          <div key={song.id}>
            <SongCard
              song={song}
              onPlay={handlePlay}
              onFavorite={isFavorite(song.id) ? () => removeFavorite(song.id) : () => addFavorite(song.id)}
              isFavorite={isFavorite(song.id)}
              isPlaying={currentTrack?.id === song.id && isPlaying}
              variant="grid"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
