import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { searchSongs } from '@/services/musicApi';
import { SongCard } from '@/components/SongCard';
import { SongCardSkeleton } from '@/components/Skeleton';
import { usePlayerStore } from '@/stores/playerStore';
import { FAMOUS_ARTISTS } from '@/data/artistsData';

export function DiscoverPage() {
  const navigate = useNavigate();
  const { currentTrack, isPlaying } = usePlayerStore();
  const [mood, setMood] = useState<string | null>(null);
  const [moodSongs, setMoodSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const moods = [
    { id: 'happy', label: 'Happy', emoji: '😊', gradient: 'from-yellow-400 to-orange-500' },
    { id: 'romantic', label: 'Romantic', emoji: '💕', gradient: 'from-pink-400 to-rose-500' },
    { id: 'chill', label: 'Chill', emoji: '🌊', gradient: 'from-blue-400 to-cyan-500' },
    { id: 'workout', label: 'Workout', emoji: '💪', gradient: 'from-red-400 to-orange-500' },
    { id: 'focus', label: 'Focus', emoji: '🧠', gradient: 'from-purple-400 to-indigo-500' },
    { id: 'party', label: 'Party', emoji: '🎉', gradient: 'from-pink-500 to-violet-500' },
  ];

  const popularArtists = FAMOUS_ARTISTS.slice(0, 6);

  const newReleases = [
    { name: 'Animal', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80' },
    { name: 'Pathaan', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=500&q=80' },
    { name: 'Gangubai Kathiawadi', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80' },
    { name: 'Rocky Aur Rani', img: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=500&q=80' },
    { name: 'Jawan', img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=500&q=80' },
    { name: 'Dunki', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=500&q=80' },
  ];

  const handleMoodClick = async (moodId: string) => {
    if (mood === moodId) { setMood(null); setMoodSongs([]); return; }
    setMood(moodId);
    setLoading(true);
    try {
      const queries: Record<string, string> = {
        happy: 'happy hindi songs',
        romantic: 'romantic hindi songs',
        chill: 'chill lofi hindi',
        workout: 'punjabi workout songs',
        focus: 'lofi study music',
        party: 'bollywood party songs',
      };
      const songs = await searchSongs(queries[moodId] || 'hindi songs');
      setMoodSongs(songs);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (song: any) => {
    const { setTrack, setQueue, togglePlay } = usePlayerStore.getState();
    const list = moodSongs.length > 0 ? moodSongs : [song];
    setQueue(list, list.findIndex((s) => s.id === song.id));
    setTrack(song);
    togglePlay();
  };

  return (
    <div className="pb-24 md:pb-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-text">Discover</h1>
        <p className="text-text-muted mt-1 text-sm">Find music for every mood and explore popular artists</p>
      </motion.div>

      {/* Mood Selector */}
      <div>
        <h2 className="text-lg font-bold text-text mb-3">Browse By Mood</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {moods.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMoodClick(m.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface border transition-all ${
                mood === m.id ? 'border-accent shadow-lg shadow-accent/20' : 'border-border hover:border-accent/30'
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs font-medium text-text">{m.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {mood && (
        <div>
          <h2 className="text-xl font-bold text-text mb-4">
            {moods.find((m) => m.id === mood)?.emoji} {moods.find((m) => m.id === mood)?.label} Songs
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SongCardSkeleton key={i} />)}
            </div>
          ) : moodSongs.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {moodSongs.map((song, i) => (
                <motion.div key={song.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <SongCard song={song} onPlay={handlePlay} isPlaying={currentTrack?.id === song.id && isPlaying} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted text-sm">No songs found for this mood.</div>
          )}
        </div>
      )}

      {/* 6 Popular Artists Section with "View All" */}
      {!mood && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text">Popular Artists</h2>
              <p className="text-xs text-text-muted">Top music icons across Hindi, Punjabi & Pakistani music</p>
            </div>
            <button
              onClick={() => navigate('/artists')}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all"
            >
              View All (50+) →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {popularArtists.map((artist, i) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/artists')}
                className="flex flex-col items-center p-4 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all cursor-pointer group text-center"
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 shadow-md bg-surface-2">
                  <img src={artist.image} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
                <p className="text-xs font-bold text-text group-hover:text-accent transition-colors truncate w-full">{artist.name}</p>
                <p className="text-[0.65rem] text-text-muted truncate w-full mt-0.5">{artist.genre}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* New Releases */}
      {!mood && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text">New Releases</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {newReleases.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/search?q=${encodeURIComponent(item.name)}`)}
                className="flex flex-col p-3 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all cursor-pointer group"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-surface-2">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
                <p className="text-xs font-bold text-text truncate">{item.name}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
