import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useUserStore } from '@/stores/userStore';
import { usePlayerStore } from '@/stores/playerStore';
import { getPersonalizedRecommendations } from '@/services/recommendationService';

export function OnboardingConfirmation() {
  const { favoriteArtists } = useUserStore();
  const { setQueue, setTrack, togglePlay } = usePlayerStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Take up to 3 chosen artist avatars
  const chosenAvatars = favoriteArtists.slice(0, 3);

  const handleStartListening = async () => {
    setLoading(true);
    try {
      // Build personalized queue based on selected favorite artists
      const recommendedQueue = await getPersonalizedRecommendations(new Set(), [], 20);
      if (recommendedQueue.length > 0) {
        setQueue(recommendedQueue);
        setTrack(recommendedQueue[0]);
        // Auto-play initial track
        usePlayerStore.setState({ isPlaying: true });
      }
    } catch (err) {
      console.error('Error starting initial playlist:', err);
    } finally {
      setLoading(false);
      navigate('/');
    }
  };

  const handleNotNow = () => {
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col items-center justify-center p-6 selection:bg-accent selection:text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md text-center space-y-8 flex flex-col items-center"
      >
        {/* Overlapping Artist Avatars */}
        <div className="flex items-center justify-center -space-x-6 py-4">
          {chosenAvatars.map((artist, idx) => (
            <motion.div
              key={artist.id || artist.name}
              initial={{ opacity: 0, x: -20 * (idx + 1) }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.15 }}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#000000] overflow-hidden shadow-2xl bg-[#12121a]"
              style={{ zIndex: 10 - idx }}
            >
              <img
                src={artist.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80'}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>

        {/* Headings */}
        <div className="space-y-3 max-w-sm">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white"
          >
            Great Picks!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-white/70 leading-relaxed"
          >
            We've made a playlist to get you started based on your favorite artists.
          </motion.p>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full space-y-3 pt-4 max-w-xs"
        >
          <button
            onClick={handleStartListening}
            disabled={loading}
            style={{ backgroundColor: '#ffffff', color: '#000000' }}
            className="w-full py-4 px-6 rounded-full font-black text-sm sm:text-base border-2 border-white shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 hover:text-black hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer ring-2 ring-emerald-400"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span className="font-black text-black tracking-wide">Start Listening</span>
              </>
            )}
          </button>

          <button
            onClick={handleNotNow}
            disabled={loading}
            className="w-full py-3 px-6 text-white/60 hover:text-white font-semibold text-xs transition-colors"
          >
            Not Now
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
