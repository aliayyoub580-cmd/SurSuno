import { motion } from 'motion/react';
import { SearchBar } from '@/components/SearchBar';
import { usePlayerStore } from '@/stores/playerStore';
import { useState } from 'react';
import { searchSongs } from '@/services/musicApi';
import { SongCard } from '@/components/SongCard';
import { SongCardSkeleton } from '@/components/Skeleton';

export function DiscoverPage() {
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
    const list = moodSongs.length > 0 ? moodSongs : [];
    if (list.length > 0) {
      setQueue(list);
      const idx = list.findIndex((s: any) => s.id === song.id);
      setTrack(list[Math.max(0, idx)]);
    } else {
      setTrack(song);
    }
    togglePlay();
  };

  return (
    <div className="pb-24 md:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text">Discover</h1>
        <p className="text-text-muted mt-1">Find music for every mood</p>
      </motion.div>

      {/* Mood selector */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
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
            <EmptyState icon="🎵" title="No songs found" subtitle={`Try a different mood for ${moods.find(m => m.id === mood)?.label}`} />
          )}
        </div>
      )}

      {/* Quick picks */}
      {!mood && (
        <>
          <QuickSection
            title="Popular Artists"
            items={[
              { name: 'Arijit Singh', img: 'https://c.saavncdn.com/050/Arijit-Singh-English-2022-20221026165913-500x500.jpg' },
              { name: 'Atif Aslam', img: 'https://c.saavncdn.com/037/Atif-Aslam-Hindi-2019-20191205155310-500x500.jpg' },
              { name: 'Neha Kakkar', img: 'https://c.saavncdn.com/066/Neha-Kakkar-Hindi-2021-20210817141813-500x500.jpg' },
              { name: 'Diljit Dosanjh', img: 'https://c.saavncdn.com/064/Diljit-Dosanjh-Punjabi-2023-20230517180851-500x500.jpg' },
            ]}
          />
          <QuickSection
            title="New Releases"
            items={[
              { name: 'Animal', img: 'https://c.saavncdn.com/064/Animal-Soundtrack-Hindi-2023-20231227162536-500x500.jpg' },
              { name: 'Pathaan', img: 'https://c.saavncdn.com/066/Pathaan-Hindi-2023-20230125174241-500x500.jpg' },
              { name: 'Gangubai', img: 'https://c.saavncdn.com/049/Gangubai-Kathiawadi-Soundtrack-Hindi-2022-202200309221818-500x500.jpg' },
              { name: 'Rocky Aur Rani', img: 'https://c.saavncdn.com/046/Rocky-Aur-Rani-Ki-Kahani-Hindi-2023-20230725165223-500x500.jpg' },
            ]}
          />
        </>
      )}
    </div>
  );
}

function QuickSection({ title, items }: { title: string; items: { name: string; img: string }[] }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-text mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {items.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex-shrink-0 w-36 cursor-pointer group"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
              <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            </div>
            <p className="text-sm font-medium text-text truncate">{item.name}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold text-text">{title}</h3>
      <p className="text-text-muted text-sm mt-1">{subtitle}</p>
    </div>
  );
}
