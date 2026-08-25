import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLibraryStore } from '@/stores/libraryStore';
import { PlusIcon, CloseIcon, PlaylistIcon } from './Icons';
import type { Song } from '@/types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
}

export function AddToPlaylistModal({ isOpen, onClose, song }: AddToPlaylistModalProps) {
  const { playlists, createPlaylist, addSongToPlaylist, removeSongFromPlaylist } = useLibraryStore();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !song) return null;

  const handleCreateAndAdd = () => {
    if (!newPlaylistName.trim()) return;
    const newPl = createPlaylist(newPlaylistName.trim());
    addSongToPlaylist(newPl.id, song);
    setNewPlaylistName('');
    setShowCreateForm(false);
    showToast(`Added to "${newPl.name}"`);
  };

  const togglePlaylistSong = (playlistId: string, playlistName: string, isAdded: boolean) => {
    if (isAdded) {
      removeSongFromPlaylist(playlistId, song.id);
      showToast(`Removed from "${playlistName}"`);
    } else {
      addSongToPlaylist(playlistId, song);
      showToast(`Added to "${playlistName}"`);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window (Coconut UI & Backlit Glow) */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-surface-2/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden text-text z-10"
          style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(var(--accent-rgb, 120, 80, 255), 0.15)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
              {song.image ? (
                <img src={song.image} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                  <PlaylistIcon size={20} />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-text truncate">Add to Playlist</h3>
                <p className="text-xs text-text-muted truncate">{song.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-surface-3 text-text-muted hover:text-text transition-colors"
            >
              <CloseIcon size={18} />
            </button>
          </div>

          {/* Toast Banner */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="my-3 p-2.5 rounded-xl bg-accent text-white text-xs font-semibold text-center shadow-lg"
              >
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Body List */}
          <div className="my-4 max-h-60 overflow-y-auto space-y-2 pr-1">
            {playlists.length === 0 && !showCreateForm ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-accent">
                  <PlaylistIcon size={24} />
                </div>
                <p className="text-sm font-semibold text-text">No custom playlists yet</p>
                <p className="text-xs text-text-muted max-w-xs mx-auto">
                  Create a playlist to organize your favorite tracks.
                </p>
              </div>
            ) : (
              playlists.map((pl) => {
                const isAdded = pl.songs.some((s) => s.id === song.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => togglePlaylistSong(pl.id, pl.name, isAdded)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                      isAdded
                        ? 'bg-accent/15 border-accent/40 text-accent'
                        : 'bg-surface border-border hover:border-accent/30 text-text'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/40 to-pink-500/40 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {pl.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs truncate">{pl.name}</p>
                        <p className="text-[0.65rem] text-text-muted">{pl.songs.length} songs</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs transition-all ${
                      isAdded ? 'bg-accent border-accent text-white' : 'border-border'
                    }`}>
                      {isAdded ? '✓' : '+'}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Create New Playlist Form / Trigger */}
          {showCreateForm ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2 border-t border-border space-y-3">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name..."
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAdd(); }}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-2xl text-xs text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-text-muted hover:text-text"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAndAdd}
                  disabled={!newPlaylistName.trim()}
                  className="px-5 py-2 rounded-full text-xs font-extrabold bg-[#7c3aed] text-white shadow-md disabled:opacity-50 hover:bg-[#6d28d9] transition-all"
                >
                  Create & Add
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full py-2.5 rounded-2xl border border-dashed border-accent/40 hover:border-accent text-accent font-semibold text-xs flex items-center justify-center gap-2 hover:bg-accent/5 transition-all"
              >
                <PlusIcon size={16} />
                <span>Create New Playlist</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
