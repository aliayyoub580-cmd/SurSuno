import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { animate, stagger } from 'animejs';
import { useLibraryStore, type Playlist } from '@/stores/libraryStore';
import { useUserStore } from '@/stores/userStore';
import { usePlayerStore } from '@/stores/playerStore';
import { SongCard } from '@/components/SongCard';
import { PlusIcon, HeartIcon, PlaylistIcon, CloseIcon, PlayIcon, SearchIcon } from '@/components/Icons';
import { FAMOUS_ARTISTS, type ArtistItem } from '@/data/artistsData';
import { getStrictArtistTop20Songs, searchArtists } from '@/services/musicApi';
import type { Song } from '@/types';

// Fuzzy artist search matcher (handles typos like "aleemark" -> "Aleemrk")
function fuzzyArtistMatch(query: string, artistName: string): boolean {
  const q = query.toLowerCase().trim();
  const name = artistName.toLowerCase().trim();

  if (!q) return true;
  if (name.includes(q) || q.includes(name)) return true;

  // Prefix match (e.g. "aleem" matching "aleemrk")
  const qWords = q.split(/\s+/);
  const nameWords = name.split(/\s+/);

  for (const qw of qWords) {
    if (qw.length >= 3) {
      for (const nw of nameWords) {
        if (nw.startsWith(qw) || qw.startsWith(nw) || nw.includes(qw)) {
          return true;
        }
      }
    }
  }

  // Levenshtein character distance for close typos
  let matchCount = 0;
  for (let i = 0; i < Math.min(q.length, name.length); i++) {
    if (q[i] === name[i]) matchCount++;
  }
  if (q.length >= 4 && matchCount >= q.length - 2) return true;

  return false;
}

export function PlaylistsPage() {
  const { playlists, createPlaylist, deletePlaylist, removeSongFromPlaylist } = useLibraryStore();
  const { favoriteSongs, favoriteArtists } = useUserStore();
  const { setTrack, setQueue, togglePlay, currentTrack, isPlaying } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | string>('all');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Artist Selection State for Custom Playlist
  const [selectedArtistMap, setSelectedArtistMap] = useState<Map<string, ArtistItem>>(new Map());
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [liveApiArtists, setLiveApiArtists] = useState<ArtistItem[]>([]);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current) {
      animate(gridRef.current.children, {
        translateY: [20, 0],
        opacity: [0, 1],
        delay: stagger(60),
        easing: 'easeOutCubic',
        duration: 400,
      });
    }
  }, [playlists.length, activeTab]);

  // Debounced live API artist search for custom search queries
  useEffect(() => {
    if (!artistSearchQuery.trim()) {
      setLiveApiArtists([]);
      setIsSearchingArtists(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingArtists(true);
      try {
        const results = await searchArtists(artistSearchQuery);
        const formatted: ArtistItem[] = results.map((a) => ({
          id: a.id || a.name.toLowerCase().replace(/\s+/g, '-'),
          name: a.name,
          image: a.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
          genre: 'Artist',
          followers: '1M+',
        }));
        setLiveApiArtists(formatted);
      } catch (err) {
        console.error('Error searching live artists:', err);
      } finally {
        setIsSearchingArtists(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [artistSearchQuery]);

  const toggleArtistSelection = (artist: ArtistItem) => {
    const nextMap = new Map(selectedArtistMap);
    if (nextMap.has(artist.id)) {
      nextMap.delete(artist.id);
    } else {
      nextMap.set(artist.id, artist);
    }
    setSelectedArtistMap(nextMap);
  };

  const handleCreatePlaylist = async () => {
    if (!newTitle.trim() || selectedArtistMap.size < 3) return;

    setIsGenerating(true);
    try {
      const chosenArtists = Array.from(selectedArtistMap.values());
      const songsPerArtist = await Promise.all(
        chosenArtists.map((artist) => getStrictArtistTop20Songs(artist.name).catch(() => []))
      );

      const combinedSongs: Song[] = [];
      const seenIds = new Set<string>();

      // Collect top 20 songs per selected artist
      songsPerArtist.forEach((artistSongs) => {
        const top20 = artistSongs.slice(0, 20);
        for (const song of top20) {
          if (song && song.id && !seenIds.has(song.id)) {
            seenIds.add(song.id);
            combinedSongs.push(song);
          }
        }
      });

      const autoDescription =
        newDescription.trim() ||
        `Top 20 hits from ${chosenArtists.map((a) => a.name).join(', ')}`;

      const newPl = createPlaylist(
        newTitle.trim(),
        autoDescription,
        chosenArtists[0]?.image || '',
        combinedSongs
      );

      setNewTitle('');
      setNewDescription('');
      setSelectedArtistMap(new Map());
      setArtistSearchQuery('');
      setShowCreateModal(false);

      // Automatically select and view the newly created playlist
      setActiveTab(newPl.id);
      setSelectedPlaylist(newPl);
    } catch (err) {
      console.error('Error generating artist playlist:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlaySongList = (songsList: Song[], startIndex = 0) => {
    if (!songsList || songsList.length === 0) return;
    setQueue(songsList, startIndex);
    setTrack(songsList[startIndex]);
    togglePlay();
  };

  const isFavoriteView = activeTab === 'favorites';
  const currentViewPlaylist = playlists.find((p) => p.id === activeTab) || selectedPlaylist;

  // Combine User Favorite Artists FIRST, then Static Famous Artists, then Live API Search Results
  const combinedArtistList: ArtistItem[] = [];
  const seenArtistNames = new Set<string>();

  // 1. Add User's Favorite Artists FIRST
  for (const fav of favoriteArtists) {
    if (fav?.name && !seenArtistNames.has(fav.name.toLowerCase())) {
      seenArtistNames.add(fav.name.toLowerCase());
      combinedArtistList.push({
        id: fav.id || fav.name.toLowerCase().replace(/\s+/g, '-'),
        name: fav.name,
        image: fav.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
        genre: 'Your Favorite Artist ⭐',
        followers: 'Top Pick',
      });
    }
  }

  // 2. Add Static Famous Artists
  for (const fa of FAMOUS_ARTISTS) {
    if (!seenArtistNames.has(fa.name.toLowerCase())) {
      seenArtistNames.add(fa.name.toLowerCase());
      combinedArtistList.push(fa);
    }
  }

  // 3. Add Live API Search Results
  for (const liveA of liveApiArtists) {
    if (!seenArtistNames.has(liveA.name.toLowerCase())) {
      seenArtistNames.add(liveA.name.toLowerCase());
      combinedArtistList.push(liveA);
    }
  }

  // Filter with Fuzzy Typo Matcher
  const filteredArtists = combinedArtistList.filter(
    (a) =>
      fuzzyArtistMatch(artistSearchQuery, a.name) ||
      a.genre.toLowerCase().includes(artistSearchQuery.toLowerCase())
  );

  const selectedCount = selectedArtistMap.size;
  const isFormValid = newTitle.trim().length > 0 && selectedCount >= 3;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-accent/20 via-purple-600/15 to-pink-500/15 p-6 md:p-8 border border-border/80 shadow-sm backdrop-blur-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-accent font-semibold text-xs tracking-widest uppercase">
              <PlaylistIcon size={18} />
              <span>Personal Music Collection</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-text tracking-tight">Playlists</h1>
            <p className="text-text-muted text-xs md:text-sm max-w-lg">
              Create custom playlists with top 20 songs from 3 or more of your favorite artists!
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-full bg-[#7c3aed] text-white font-extrabold text-xs shadow-md hover:bg-[#6d28d9] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 self-start md:self-auto border border-[#6d28d9]/40 cursor-pointer"
          >
            <PlusIcon size={18} className="text-white" />
            <span className="text-white font-extrabold tracking-wide">Create New Playlist</span>
          </button>
        </div>
      </motion.div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => { setActiveTab('all'); setSelectedPlaylist(null); }}
          className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#7c3aed] text-white shadow-md border border-[#6d28d9]'
              : 'bg-surface border border-border text-text-muted hover:text-text'
          }`}
        >
          All Playlists ({playlists.length + 1})
        </button>

        {/* Favorites Badge Tab */}
        <button
          onClick={() => { setActiveTab('favorites'); setSelectedPlaylist(null); }}
          className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            activeTab === 'favorites'
              ? 'bg-[#7c3aed] text-white shadow-md border border-[#6d28d9]'
              : 'bg-surface border border-border text-text-muted hover:text-text'
          }`}
        >
          <HeartIcon size={14} filled={activeTab === 'favorites'} className={activeTab === 'favorites' ? 'text-white' : 'text-pink-500'} />
          <span>Favorites ({favoriteSongs.length})</span>
        </button>

        {playlists.map((pl) => (
          <button
            key={pl.id}
            onClick={() => { setActiveTab(pl.id); setSelectedPlaylist(pl); }}
            className={`px-4 py-2.5 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === pl.id
                ? 'bg-[#7c3aed] text-white shadow-md border border-[#6d28d9]'
                : 'bg-surface border border-border text-text-muted hover:text-text'
            }`}
          >
            {pl.name} ({pl.songs.length})
          </button>
        ))}
      </div>

      {/* VIEW 1: FAVORITES PLAYLIST DETAIL */}
      {isFavoriteView && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shrink-0">
                <HeartIcon size={32} filled />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text">Liked Songs / Favorites</h2>
                <p className="text-xs text-text-muted mt-0.5">{favoriteSongs.length} songs favorited</p>
              </div>
            </div>

            {favoriteSongs.length > 0 && (
              <button
                onClick={() => handlePlaySongList(favoriteSongs, 0)}
                className="px-6 py-2.5 rounded-full bg-[#7c3aed] text-white font-extrabold text-xs shadow-md hover:bg-[#6d28d9] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlayIcon size={16} />
                <span>Play All Favorites</span>
              </button>
            )}
          </div>

          {favoriteSongs.length === 0 ? (
            <div className="p-12 rounded-3xl bg-surface border border-border text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto text-pink-500">
                <HeartIcon size={28} />
              </div>
              <h3 className="text-base font-bold text-text">No favorited songs yet</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Click the ❤️ heart icon on any song while playing to automatically save it to your Favorites playlist!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {favoriteSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onPlay={() => handlePlaySongList(favoriteSongs, favoriteSongs.findIndex((s) => s.id === song.id))}
                  isPlaying={currentTrack?.id === song.id && isPlaying}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* VIEW 2: SPECIFIC CUSTOM PLAYLIST DETAIL */}
      {currentViewPlaylist && !isFavoriteView && activeTab !== 'all' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0">
                {currentViewPlaylist.name[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-text">{currentViewPlaylist.name}</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {currentViewPlaylist.description || `${currentViewPlaylist.songs.length} tracks`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentViewPlaylist.songs.length > 0 && (
                <button
                  onClick={() => handlePlaySongList(currentViewPlaylist.songs, 0)}
                  className="px-6 py-2.5 rounded-full bg-[#7c3aed] text-white font-extrabold text-xs shadow-md hover:bg-[#6d28d9] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlayIcon size={16} />
                  <span>Play All ({currentViewPlaylist.songs.length} tracks)</span>
                </button>
              )}
              <button
                onClick={() => {
                  deletePlaylist(currentViewPlaylist.id);
                  setActiveTab('all');
                }}
                className="px-4 py-2.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 font-semibold text-xs transition-all cursor-pointer"
              >
                Delete Playlist
              </button>
            </div>
          </div>

          {currentViewPlaylist.songs.length === 0 ? (
            <div className="p-12 rounded-3xl bg-surface border border-border text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-accent">
                <PlaylistIcon size={28} />
              </div>
              <h3 className="text-base font-bold text-text">This playlist is empty</h3>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {currentViewPlaylist.songs.map((song) => (
                <div key={song.id} className="relative group">
                  <SongCard
                    song={song}
                    onPlay={() => handlePlaySongList(currentViewPlaylist.songs, currentViewPlaylist.songs.findIndex((s) => s.id === song.id))}
                    isPlaying={currentTrack?.id === song.id && isPlaying}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSongFromPlaylist(currentViewPlaylist.id, song.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all z-20"
                    title="Remove from playlist"
                  >
                    <CloseIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* VIEW 3: ALL PLAYLISTS GRID */}
      {activeTab === 'all' && (
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Favorites Featured Card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => setActiveTab('favorites')}
            className="p-5 rounded-3xl bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-surface border border-pink-500/30 hover:border-pink-500/60 transition-all cursor-pointer group shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-sm">
                <HeartIcon size={24} filled />
              </div>
              <span className="text-[0.65rem] font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full">
                Auto Playlist
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base text-text group-hover:text-pink-400 transition-colors">
                Favorites
              </h3>
              <p className="text-xs text-text-muted mt-1">{favoriteSongs.length} favorited songs</p>
            </div>
          </motion.div>

          {/* User Custom Playlists */}
          {playlists.map((pl) => (
            <motion.div
              key={pl.id}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => { setActiveTab(pl.id); setSelectedPlaylist(pl); }}
              className="p-5 rounded-3xl bg-surface border border-border hover:border-accent/50 transition-all cursor-pointer group shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md overflow-hidden">
                  {pl.coverImage ? (
                    <img src={pl.coverImage} alt={pl.name} className="w-full h-full object-cover" />
                  ) : (
                    pl.name[0]?.toUpperCase()
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePlaylist(pl.id);
                  }}
                  className="p-2 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-surface-2"
                  title="Delete playlist"
                >
                  <CloseIcon size={16} />
                </button>
              </div>
              <div>
                <h3 className="font-bold text-base text-text group-hover:text-accent transition-colors truncate">
                  {pl.name}
                </h3>
                <p className="text-xs text-text-muted mt-1 truncate">
                  {pl.description || `${pl.songs.length} songs`}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Create Playlist Action Card */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => setShowCreateModal(true)}
            className="p-5 rounded-3xl border border-dashed border-accent/40 hover:border-accent bg-accent/5 hover:bg-accent/10 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center">
              <PlusIcon size={20} />
            </div>
            <p className="font-bold text-xs text-accent">Create New Playlist</p>
          </motion.div>
        </div>
      )}

      {/* CREATE PLAYLIST WITH TOP 3+ ARTISTS MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isGenerating && setShowCreateModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-text z-10 my-auto max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="font-black text-base sm:text-lg text-text">Create Custom Artist Playlist</h3>
                  <p className="text-xs text-text-muted">Select 3 or more artists to pull their top 20 hits!</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={isGenerating}
                  className="p-1.5 rounded-full hover:bg-surface-2 text-text-muted hover:text-text cursor-pointer"
                >
                  <CloseIcon size={18} />
                </button>
              </div>

              {/* Title & Description Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-text mb-1">Playlist Title *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Bollywood & Punjabi Bangers..."
                    className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-xs sm:text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g. My top daily workout mix..."
                    className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-xs text-text placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Artist Picker Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-text">
                    Choose Artists <span className="text-accent font-extrabold">(Select 3+)</span>
                  </label>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    selectedCount >= 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-500 font-extrabold'
                  }`}>
                    {selectedCount >= 3 ? `✓ ${selectedCount} selected` : `${selectedCount} / 3 selected`}
                  </span>
                </div>

                {/* Artist Search Bar */}
                <div className="relative">
                  <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={artistSearchQuery}
                    onChange={(e) => setArtistSearchQuery(e.target.value)}
                    placeholder="Search any artist (Aleemrk, Arijit, Sidhu, Parmish...)"
                    className="w-full pl-9 pr-4 py-2.5 bg-surface-2 border border-border rounded-xl text-xs text-text placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                  {isSearchingArtists && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  )}
                </div>

                {/* Artist Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1.5 border border-border rounded-2xl bg-surface-2/40">
                  {filteredArtists.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-text-muted text-xs space-y-1">
                      <p className="font-semibold text-text">No artists found matching "{artistSearchQuery}"</p>
                      <p className="text-[0.7rem]">Try searching for another artist or check spelling.</p>
                    </div>
                  ) : (
                    filteredArtists.map((artist) => {
                      const isSelected = selectedArtistMap.has(artist.id);
                      return (
                        <button
                          key={artist.id}
                          type="button"
                          onClick={() => toggleArtistSelection(artist)}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-accent/15 border-accent text-accent shadow-sm ring-1 ring-accent'
                              : 'bg-surface border-border hover:border-accent/40 text-text'
                          }`}
                        >
                          <img
                            src={artist.image}
                            alt={artist.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate">{artist.name}</p>
                            <p className="text-[0.65rem] text-text-muted truncate">{artist.genre}</p>
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-accent text-white font-bold text-[0.65rem] flex items-center justify-center shrink-0">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isGenerating}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-text-muted hover:text-text cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreatePlaylist}
                  disabled={!isFormValid || isGenerating}
                  style={
                    isFormValid
                      ? { backgroundColor: '#7c3aed', color: '#ffffff' }
                      : { backgroundColor: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af' }
                  }
                  className="px-6 py-3 rounded-full text-xs font-black shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#6d28d9]/50"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Building Playlist (Top 20 Hits)...</span>
                    </>
                  ) : (
                    <span>Create & Auto-Fill Hits</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
