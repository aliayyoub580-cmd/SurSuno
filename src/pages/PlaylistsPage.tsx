import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { animate, stagger } from 'animejs';
import { useLibraryStore, type Playlist } from '@/stores/libraryStore';
import { useUserStore } from '@/stores/userStore';
import { usePlayerStore } from '@/stores/playerStore';
import { SongCard } from '@/components/SongCard';
import { PlusIcon, HeartIcon, PlaylistIcon, CloseIcon, PlayIcon } from '@/components/Icons';
import type { Song } from '@/types';

export function PlaylistsPage() {
  const { playlists, createPlaylist, deletePlaylist, removeSongFromPlaylist } = useLibraryStore();
  const { favoriteSongs } = useUserStore();
  const { setTrack, setQueue, togglePlay, currentTrack, isPlaying } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | string>('all');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

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

  const handleCreatePlaylist = () => {
    if (!newTitle.trim()) return;
    createPlaylist(newTitle.trim(), newDescription.trim());
    setNewTitle('');
    setNewDescription('');
    setShowCreateModal(false);
  };

  const handlePlaySongList = (songsList: Song[], startIndex = 0) => {
    if (!songsList || songsList.length === 0) return;
    setQueue(songsList, startIndex);
    setTrack(songsList[startIndex]);
    togglePlay();
  };

  const isFavoriteView = activeTab === 'favorites';
  const currentViewPlaylist = playlists.find((p) => p.id === activeTab) || selectedPlaylist;

  return (
    <div className="space-y-6">
      {/* Header Banner (Coconut UI & Backlit Glow) */}
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
              Create and manage your custom music playlists. All your favorited tracks automatically sync here.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-full bg-accent text-white font-extrabold text-xs shadow-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 self-start md:self-auto"
          >
            <PlusIcon size={18} />
            <span>Create New Playlist</span>
          </button>
        </div>
      </motion.div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => { setActiveTab('all'); setSelectedPlaylist(null); }}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            activeTab === 'all'
              ? 'bg-accent text-white shadow-md'
              : 'bg-surface border border-border text-text-muted hover:text-text'
          }`}
        >
          All Playlists ({playlists.length + 1})
        </button>

        {/* Favorites Badge Tab */}
        <button
          onClick={() => { setActiveTab('favorites'); setSelectedPlaylist(null); }}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'favorites'
              ? 'bg-accent text-white shadow-md'
              : 'bg-surface border border-border text-text-muted hover:text-text'
          }`}
        >
          <HeartIcon size={14} filled={activeTab === 'favorites'} className="text-pink-400" />
          <span>Favorites ({favoriteSongs.length})</span>
        </button>

        {playlists.map((pl) => (
          <button
            key={pl.id}
            onClick={() => { setActiveTab(pl.id); setSelectedPlaylist(pl); }}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeTab === pl.id
                ? 'bg-accent text-white shadow-md'
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
                className="px-6 py-2.5 rounded-full bg-accent text-white font-bold text-xs shadow-md hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0">
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
                  className="px-6 py-2.5 rounded-full bg-accent text-white font-bold text-xs shadow-md hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                >
                  <PlayIcon size={16} />
                  <span>Play All</span>
                </button>
              )}
              <button
                onClick={() => {
                  deletePlaylist(currentViewPlaylist.id);
                  setActiveTab('all');
                }}
                className="px-4 py-2.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 font-semibold text-xs transition-all"
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
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Play any song and click the <strong>+</strong> button on the player to add songs to "{currentViewPlaylist.name}".
              </p>
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
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {pl.name[0]?.toUpperCase()}
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

      {/* CREATE PLAYLIST MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-surface-2/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-text z-10"
              style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(var(--accent-rgb, 120,80,255), 0.2)' }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-base text-text">Create Playlist</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-full hover:bg-surface-3 text-text-muted hover:text-text"
                >
                  <CloseIcon size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Playlist Name</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="My Favorite Hits..."
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePlaylist(); }}
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-2xl text-xs text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Songs for rainy days & chill vibes..."
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-2xl text-xs text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-text-muted hover:text-text"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlaylist}
                  disabled={!newTitle.trim()}
                  className="px-6 py-2 rounded-full text-xs font-bold bg-accent text-white shadow-md disabled:opacity-50 hover:bg-accent/90 transition-all"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
