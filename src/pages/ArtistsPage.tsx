import { useState } from 'react';
import { motion } from 'motion/react';
import { FAMOUS_ARTISTS, type ArtistItem } from '@/data/artistsData';
import { searchSongs } from '@/services/musicApi';
import { SongCard } from '@/components/SongCard';
import { SongCardSkeleton } from '@/components/Skeleton';
import { usePlayerStore } from '@/stores/playerStore';
import { SearchIcon } from '@/components/Icons';
import type { Song } from '@/types';

export function ArtistsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<ArtistItem | null>(null);
  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentTrack, isPlaying } = usePlayerStore();

  const filteredArtists = FAMOUS_ARTISTS.filter((artist) =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleArtistClick = async (artist: ArtistItem) => {
    setSelectedArtist(artist);
    setLoading(true);
    try {
      const songs = await searchSongs(`${artist.name} songs`);
      setArtistSongs(songs);
    } catch (err) {
      console.error('Error fetching artist songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song: Song) => {
    const { setTrack, setQueue, togglePlay } = usePlayerStore.getState();
    const list = artistSongs.length > 0 ? artistSongs : [song];
    setQueue(list);
    setTrack(song);
    togglePlay();
  };

  return (
    <div className="pb-24 md:pb-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text">Popular Artists</h1>
          <p className="text-text-muted text-sm mt-1">Discover 50+ legendary South Asian and global music icons</p>
        </div>

        {/* Search Filter */}
        <div className="relative w-full md:w-72">
          <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artists or genres..."
            className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border rounded-full text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
      </motion.div>

      {/* Selected Artist Songs Section */}
      {selectedArtist && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedArtist(null)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-2 text-text hover:bg-accent/10 hover:text-accent transition-colors"
            >
              ← Back to All Artists
            </button>
            <div className="flex items-center gap-3">
              <img src={selectedArtist.image} alt={selectedArtist.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <h2 className="text-xl font-bold text-text">{selectedArtist.name}</h2>
                <p className="text-xs text-text-muted">{selectedArtist.genre} • {selectedArtist.followers} listeners</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SongCardSkeleton key={i} />)}
            </div>
          ) : artistSongs.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {artistSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onPlay={handlePlaySong}
                  isPlaying={currentTrack?.id === song.id && isPlaying}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No songs found for {selectedArtist.name}.</p>
          )}
        </motion.div>
      )}

      {/* All 50 Artists Grid */}
      {!selectedArtist && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredArtists.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleArtistClick(artist)}
              className="flex flex-col items-center p-4 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all cursor-pointer group text-center"
            >
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3 shadow-md bg-surface-2">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <h3 className="text-sm font-bold text-text group-hover:text-accent transition-colors truncate w-full">
                {artist.name}
              </h3>
              <p className="text-[0.7rem] text-text-muted truncate w-full mt-0.5">{artist.genre}</p>
              <span className="mt-2 text-[0.65rem] font-semibold text-accent/80 px-2 py-0.5 rounded-full bg-accent/10">
                {artist.followers}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
