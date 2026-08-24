import { motion, AnimatePresence } from 'motion/react';
import { usePlayerStore } from '@/stores/playerStore';
import { AudioEngine } from './AudioEngine';
import { MiniPlayer } from './MiniPlayer';
import { FullPlayer } from './FullPlayer';

export function Player() {
  const { showMiniPlayer, isFullPlayerOpen, openFullPlayer, closeFullPlayer } = usePlayerStore();

  return (
    <>
      <AudioEngine />
      <AnimatePresence>
        {showMiniPlayer && !isFullPlayerOpen && (
          <MiniPlayer onOpen={openFullPlayer} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isFullPlayerOpen && (
          <FullPlayer onClose={closeFullPlayer} />
        )}
      </AnimatePresence>
    </>
  );
}
