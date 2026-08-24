import { motion } from 'motion/react';
import { useTrending } from '@/hooks/useApi';
import { SongList } from '@/components/SongList';
import { SongCardSkeleton } from '@/components/Skeleton';
import { usePlayerStore } from '@/stores/playerStore';

export function TrendingPage() {
  const { songs, loading } = useTrending();

  const handlePlayAll = (list: any[]) => {
    const { setTrack, setQueue, togglePlay } = usePlayerStore.getState();
    setQueue(list);
    setTrack(list[0]);
    togglePlay();
  };

  return (
    <div className="pb-24 md:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text">Trending</h1>
        <p className="text-text-muted mt-1">The hottest tracks right now</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SongCardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          <SongList songs={songs} title="Today's Top Hits" onPlayAll={handlePlayAll} />

          <div className="mt-8">
            <h2 className="text-xl font-bold text-text mb-4">By Language</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Hindi', gradient: 'from-blue-500 to-cyan-400', plays: '2.5M' },
                { name: 'Punjabi', gradient: 'from-pink-500 to-rose-400', plays: '1.8M' },
                { name: 'Pakistani', gradient: 'from-green-500 to-emerald-400', plays: '900K' },
                { name: 'English', gradient: 'from-purple-500 to-violet-400', plays: '1.2M' },
              ].map((lang, i) => (
                <motion.div
                  key={lang.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.03 }}
                  className={`bg-gradient-to-br ${lang.gradient} rounded-xl p-5 text-white cursor-pointer`}
                >
                  <p className="font-bold text-lg">{lang.name}</p>
                  <p className="text-white/70 text-sm mt-1">{lang.plays} plays</p>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
