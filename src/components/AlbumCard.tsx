import { motion } from 'motion/react';
import { PlayIcon, HeartIcon } from './Icons';
import type { Song } from '@/types';

interface AlbumCardProps {
  album: Song;
  onPlay: (song: Song) => void;
}

export function AlbumCard({ album, onPlay }: AlbumCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.03 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-xl overflow-hidden bg-surface cursor-pointer"
      onClick={() => onPlay(album)}
      role="button"
      tabIndex={0}
      aria-label={`Play album ${album.title}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl">
        <img src={album.image} alt={album.title} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Play"
          >
            <PlayIcon size={20} className="text-white" />
          </motion.button>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-text text-[0.9rem] truncate">{album.title}</h3>
        <p className="text-text-muted text-[0.75rem] truncate mt-0.5">{album.singers}</p>
      </div>
    </motion.div>
  );
}
