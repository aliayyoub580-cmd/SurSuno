import { motion } from 'motion/react';
import { PlayIcon, PauseIcon, HeartIcon } from './Icons';

interface SongCardProps {
  song: {
    id: string;
    title: string;
    singers: string;
    image: string;
    duration: string;
  };
  onPlay: (song: any) => void;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
  isPlaying?: boolean;
  variant?: 'grid' | 'list';
}

export function SongCard({ song, onPlay, onFavorite, isFavorite, isPlaying, variant = 'grid' }: SongCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-xl overflow-hidden cursor-pointer ${
        variant === 'list' ? 'flex items-center gap-3 p-2 bg-surface hover:bg-surface-2 transition-colors' : ''
      }`}
      onClick={() => onPlay(song)}
      role="button"
      tabIndex={0}
      aria-label={`Play ${song.title} by ${song.singers}`}
      onKeyDown={(e) => e.key === 'Entry' && onPlay(song)}
    >
      {variant === 'grid' && (
        <>
          <div className="relative aspect-square overflow-hidden rounded-xl">
            <img
              src={song.image}
              alt={song.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isPlaying ? (
                  <PauseIcon size={24} className="text-white" />
                ) : (
                  <PlayIcon size={24} className="text-white" />
                )}
              </motion.div>
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-text text-[0.9rem] truncate">{song.title}</h3>
            <p className="text-text-muted text-[0.75rem] truncate mt-0.5">{song.singers}</p>
            <span className="text-text-subtle text-[0.7rem] mt-1 block">{formatDuration(song.duration)}</span>
          </div>
        </>
      )}

      {variant === 'list' && (
        <>
          <img
            src={song.image}
            alt={song.title}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-text text-[0.875rem] truncate">{song.title}</h3>
            <p className="text-text-muted text-[0.75rem] truncate">{song.singers}</p>
          </div>
          <span className="text-text-subtle text-[0.75rem] flex-shrink-0">{formatDuration(song.duration)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite?.(song.id); }}
            className="p-2 hover:bg-surface-3 rounded-full transition-colors flex-shrink-0"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <HeartIcon size={16} filled={isFavorite} className={isFavorite ? 'text-accent' : 'text-text-muted'} />
          </button>
        </>
      )}
    </motion.div>
  );
}

function formatDuration(sec: string): string {
  const s = parseInt(sec) || 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
