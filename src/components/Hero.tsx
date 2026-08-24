import { motion } from 'motion/react';
import { useState } from 'react';
import { SearchBar } from './SearchBar';
import { usePlayerStore } from '@/stores/playerStore';
import { useUserStore } from '@/stores/userStore';
import { useAnimeHero } from '@/hooks/useAnime';

export function Hero({ onSearch }: { onSearch: (q: string) => void }) {
  const heroRef = useAnimeHero();
  const [searchQuery, setSearchQuery] = useState('');
  const { addToSearchHistory } = useUserStore();

  const handleSearch = (query: string) => {
    const q = (query || searchQuery).trim();
    if (!q) return;
    addToSearchHistory(q);
    onSearch(q);
  };

  const handlePlayMix = () => {
    onSearch('trending');
  };

  return (
    <section
      ref={heroRef}
      className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-accent/20 via-purple-500/10 to-pink-500/20"
      data-hero
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(236,72,153,0.2) 0%, transparent 50%)',
        }} />
      </div>
      <div className="relative px-6 py-12 md:px-10 md:py-16 lg:py-20">
        <div className="max-w-2xl">
          <motion.p
            data-hero
            className="text-accent font-medium text-sm uppercase tracking-widest mb-3"
          >
            Welcome to SurSuno
          </motion.p>
          <motion.h1
            data-hero
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-text leading-tight mb-4"
          >
            Your Music. Your Mood.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-pink-500">
              Your SurSuno.
            </span>
          </motion.h1>
          <motion.p
            data-hero
            className="text-text-muted text-base md:text-lg mb-8 max-w-lg"
          >
            Discover songs you'll love, from the artists and languages you listen to most.
          </motion.p>
          <motion.div data-hero className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search songs, artists, albums..."
              className="flex-1"
            />
            <motion.button
              onClick={handlePlayMix}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-accent text-white rounded-full font-semibold text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 flex-shrink-0"
              style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play Mix
            </motion.button>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
        <svg viewBox="0 0 1440 100" className="w-full h-full" preserveAspectRatio="none" aria-hidden="true">
          <path fill="var(--accent)" d="M0,50 C360,100 720,0 1080,50 C1260,75 1380,50 1440,50 L1440,100 L0,100 Z" />
        </svg>
      </div>
    </section>
  );
}
