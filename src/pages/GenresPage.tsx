import { motion } from 'motion/react';
import { GENRES, getGenreSongs } from '@/services/musicApi';
import { usePlayerStore } from '@/stores/playerStore';
import { SongList } from '@/components/SongList';
import { useState } from 'react';

export function GenresPage() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genreSongs, setGenreSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenreClick = async (genreId: string) => {
    if (selectedGenre === genreId) {
      setSelectedGenre(null);
      setGenreSongs([]);
      return;
    }
    setSelectedGenre(genreId);
    setLoading(true);
    try {
      const songs = await getGenreSongs(genreId);
      setGenreSongs(songs);
    } finally {
      setLoading(false);
    }
  };

  const selected = GENRES.find((g) => g.id === selectedGenre);

  const handlePlayAll = (songsList: any[]) => {
    const { setTrack, setQueue, togglePlay } = usePlayerStore.getState();
    setQueue(songsList);
    setTrack(songsList[0]);
    togglePlay();
  };

  return (
    <div className="pb-24 md:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text">Genres</h1>
        <p className="text-text-muted mt-1">Explore music by genre</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
        {GENRES.map((genre, i) => (
          <motion.button
            key={genre.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleGenreClick(genre.id)}
            className={`rounded-xl p-4 text-left text-white font-bold transition-all ${
              selectedGenre === genre.id ? 'ring-4 ring-white/50 scale-105' : ''
            }`}
            style={{ background: genre.gradient }}
          >
            {genre.name}
          </motion.button>
        ))}
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {loading ? (
            <p className="text-text-muted text-center py-8">Loading {selected.name} songs...</p>
          ) : genreSongs.length > 0 ? (
            <SongList songs={genreSongs} title={`${selected.name} Hits`} onPlayAll={handlePlayAll} />
          ) : (
            <p className="text-text-muted text-center py-8">No songs available for {selected.name}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
