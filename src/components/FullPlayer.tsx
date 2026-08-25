import { motion } from 'motion/react';
import { useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useUserStore } from '@/stores/userStore';
import {
  PauseIcon, PlayIcon, SkipNextIcon, SkipPrevIcon,
  HeartIcon, VolumeIcon, ShuffleIcon, RepeatIcon, QueueIcon, CloseIcon, PlusIcon,
} from './Icons';
import { AddToPlaylistModal } from './AddToPlaylistModal';

interface FullPlayerProps {
  onClose: () => void;
}

export function FullPlayer({ onClose }: FullPlayerProps) {
  const { currentTrack, isPlaying, togglePlay, next, prev, seek, volume, isMuted, toggleMute, shuffle, toggleShuffle, repeat, toggleRepeat, progress, duration } = usePlayerStore();
  const { isFavorite, toggleFavorite } = useUserStore();
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  if (!currentTrack) return null;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * duration);
  };

  const isFav = isFavorite(currentTrack.id);
  const pct = duration ? (progress / duration) * 100 : 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="fixed inset-0 z-50 bg-bg text-text h-full max-h-screen w-full overflow-hidden flex flex-col justify-between"
      onClick={onClose}
    >
      <div
        className="flex-1 flex flex-col justify-between max-w-xl mx-auto w-full px-4 sm:px-6 py-3 sm:py-5 h-full max-h-screen overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 mb-1">
          <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-surface-2 transition-colors text-text-muted hover:text-text" aria-label="Close player">
            <CloseIcon size={22} />
          </button>
          <span className="text-[0.65rem] font-bold text-text-muted uppercase tracking-widest">Now Playing</span>
          <button className="p-2 -mr-2 rounded-full hover:bg-surface-2 transition-colors text-text-muted hover:text-text" aria-label="Queue">
            <QueueIcon size={20} />
          </button>
        </div>

        {/* Dynamic Artwork (Scales to fit screen height) */}
        <div className="flex-1 flex items-center justify-center min-h-0 my-2 overflow-hidden">
          <motion.div
            className="relative h-full max-h-[30vh] sm:max-h-[40vh] md:max-h-[320px] aspect-square mx-auto shadow-2xl rounded-2xl overflow-hidden"
            animate={isPlaying ? { scale: [1, 1.01, 1] } : {}}
            transition={isPlaying ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : {}}
          >
            <img
              src={currentTrack.image}
              alt={currentTrack.title}
              className="w-full h-full object-cover rounded-2xl"
            />
          </motion.div>
        </div>

        {/* Track Info */}
        <div className="text-center shrink-0 my-1">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-text truncate px-2">{currentTrack.title}</h2>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5 truncate">{currentTrack.singers}</p>
          {currentTrack.album && (
            <p className="text-text-subtle text-[0.65rem] mt-0.5 truncate">{currentTrack.album}</p>
          )}
        </div>

        {/* Progress Slider */}
        <div className="shrink-0 my-2">
          <div
            className="h-1.5 bg-surface-3 rounded-full cursor-pointer group relative"
            onClick={handleSeek}
            role="slider"
            aria-label="Seek"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={duration}
          >
            <motion.div
              className="h-full bg-accent rounded-full relative"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.1 }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow" />
            </motion.div>
          </div>
          <div className="flex justify-between mt-1 text-[0.65rem] text-text-subtle font-mono">
            <span>{fmt(progress)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 shrink-0 my-2">
          <button
            onClick={toggleShuffle}
            className={`p-2 transition-colors rounded-full ${shuffle ? 'text-accent' : 'text-text-muted hover:text-text'}`}
            aria-label="Shuffle"
            aria-pressed={shuffle}
          >
            <ShuffleIcon size={20} active={shuffle} />
          </button>
          <button onClick={prev} className="p-2 text-text hover:text-accent transition-colors" aria-label="Previous">
            <SkipPrevIcon size={26} />
          </button>
          <motion.button
            onClick={togglePlay}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg shrink-0"
            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
            whileTap={{ scale: 0.92 }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon size={26} className="text-white fill-current" /> : <PlayIcon size={26} className="text-white fill-current" />}
          </motion.button>
          <button onClick={next} className="p-2 text-text hover:text-accent transition-colors" aria-label="Next">
            <SkipNextIcon size={26} />
          </button>
          <button
            onClick={toggleRepeat}
            className={`p-2 transition-colors rounded-full ${repeat !== 'none' ? 'text-accent' : 'text-text-muted hover:text-text'}`}
            aria-label="Repeat"
            aria-pressed={repeat !== 'none'}
          >
            <RepeatIcon size={20} mode={repeat} />
          </button>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between px-2 pt-2 border-t border-border/40 shrink-0">
          <div className="flex items-center gap-1">
            {/* Option 1: Heart */}
            <button
              onClick={() => toggleFavorite(currentTrack)}
              className={`p-2 rounded-full transition-colors ${isFav ? 'text-accent' : 'text-text-muted hover:text-text'}`}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              title={isFav ? 'In Favorites' : 'Add to Favorites'}
            >
              <HeartIcon size={20} filled={isFav} />
            </button>

            {/* Option 2: Plus */}
            <button
              onClick={() => setIsPlaylistModalOpen(true)}
              className="p-2 rounded-full text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              aria-label="Add to playlist"
              title="Add to Playlist"
            >
              <PlusIcon size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="p-1.5 text-text-muted hover:text-text transition-colors" aria-label={isMuted ? 'Unmute' : 'Mute'}>
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
              className="w-16 sm:w-24 accent-accent"
              aria-label="Volume"
            />
          </div>
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
