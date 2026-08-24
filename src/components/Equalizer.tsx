import { motion, AnimatePresence } from 'motion/react';
import { PlayIcon, PauseIcon } from './Icons';

interface EqualizerProps {
  isActive: boolean;
  barCount?: number;
}

export function Equalizer({ isActive, barCount = 4 }: EqualizerProps) {
  return (
    <div className="flex items-end gap-[3px] h-4" aria-hidden="true">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-accent"
          animate={isActive ? {
            scaleY: [0.3, 1, 0.5, 1, 0.3],
          } : { scaleY: 0.3 }}
          transition={isActive ? {
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          } : { duration: 0.2 }}
        />
      ))}
    </div>
  );
}
