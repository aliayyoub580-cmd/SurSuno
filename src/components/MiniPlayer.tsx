import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useUserStore } from '@/stores/userStore';
import { PauseIcon, PlayIcon, SkipNextIcon, SkipPrevIcon, HeartIcon, VolumeIcon, PlusIcon } from './Icons';
import { AddToPlaylistModal } from './AddToPlaylistModal';

interface MiniPlayerProps {
  onOpen: () => void;
}

export function MiniPlayer({ onOpen }: MiniPlayerProps) {
  const { currentTrack, isPlaying, togglePlay, next, prev, seek, volume, isMuted, toggleMute, progress, duration, isLoadingMoreRecommendations } = usePlayerStore();
  const { isFavorite } = useUserStore();
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  if (!currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);
  const pct = duration ? (progress / duration) * 100 : 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-player-bg backdrop-blur-xl border-t border-border"
    >
      {/* Progress bar */}
      <div
        className="h-1 w-full cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek(((e.clientX - rect.left) / rect.width) * duration);
        }}
        role="slider"
        aria-label="Seek"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={duration}
      >
        <div className="h-full bg-surface-3 relative">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.1 }}
          />
          <div
            className="absolute top-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md -translate-y-1/2"
            style={{ left: `calc(${pct}% - 6px)` }}
          />
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 h-16 md:h-20 flex items-center gap-3 md:gap-6">
        {/* Track info */}
        <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left" aria-label="Open full player">
          <motion.img
            src={currentTrack.image}
            alt={currentTrack.title}
            className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover flex-shrink-0"
            animate={isPlaying ? { scale: [1, 1.02, 1] } : {}}
            transition={isPlaying ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
          />
          <div className="min-w-0">
            <p className="font-medium text-text text-sm md:text-base truncate">{currentTrack.title}</p>
            <div className="flex items-center gap-2">
              <p className="text-text-muted text-xs md:text-sm truncate">{currentTrack.singers}</p>
              {isLoadingMoreRecommendations && (
                <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-medium animate-pulse shrink-0">
                  Auto-Expanding Queue...
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Center controls */}
        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={prev} className="p-2 text-text-muted hover:text-text transition-colors" aria-label="Previous">
            <SkipPrevIcon size={20} />
          </button>
          <motion.button
            onClick={togglePlay}
            className="p-2 md:p-3 rounded-full hover:opacity-90 transition-opacity shadow-md flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
            whileTap={{ scale: 0.9 }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon size={20} className="text-white fill-current" /> : <PlayIcon size={20} className="text-white fill-current" />}
          </motion.button>
          <button onClick={next} className="p-2 text-text-muted hover:text-text transition-colors" aria-label="Next">
            <SkipNextIcon size={20} />
          </button>
        </div>

        {/* Right controls - desktop */}
        <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
          {/* Option 1: Heart (Favorites) */}
          <button
            onClick={() => useUserStore.getState().toggleFavorite(currentTrack)}
            className={`p-2 rounded-full transition-colors ${isFav ? 'text-accent' : 'text-text-muted hover:text-text'}`}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            title={isFav ? 'In Favorites' : 'Add to Favorites'}
          >
            <HeartIcon size={18} filled={isFav} />
          </button>

          {/* Option 2: Plus (Add to Playlist) */}
          <button
            onClick={() => setIsPlaylistModalOpen(true)}
            className="p-2 rounded-full text-text-muted hover:text-accent hover:bg-accent/10 transition-all"
            aria-label="Add to playlist"
            title="Add to Playlist"
          >
            <PlusIcon size={18} />
          </button>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="p-1 text-text-muted hover:text-text" aria-label={isMuted ? 'Unmute' : 'Mute'}>
              <VolumeIcon size={18} muted={isMuted} />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                usePlayerStore.getState().toggleMute();
                usePlayerStore.getState().setVolume(v);
              }}
              className="w-20 accent-accent"
              aria-label="Volume"
            />
          </div>
          <span className="text-text-subtle text-xs w-20 text-right font-mono">
            {fmt(progress)} / {fmt(duration)}
          </span>
        </div>
      </div>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        song={currentTrack}
      />
    </motion.div>
  );
}
