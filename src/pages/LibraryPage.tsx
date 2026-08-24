import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useUserStore } from '@/stores/userStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { SongList } from '@/components/SongList';
import type { Song } from '@/types';

export function LibraryPage() {
  const { recentlyPlayed } = useUserStore();
  const { playlists, deletePlaylist, createPlaylist } = useLibraryStore();
  const [activeTab, setActiveTab] = useState<'favorites' | 'recent' | 'playlists'>('recent');
  const [newName, setNewName] = useState('');

  const handlePlayAll = (list: Song[]) => {
    const { setTrack, setQueue, togglePlay } = usePlayerStore.getState();
    setQueue(list);
    setTrack(list[0]);
    togglePlay();
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text">Library</h1>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 rounded-full p-1 mb-6 w-fit">
        {([
          { key: 'recent' as const, label: `Recent (${recentlyPlayed.length})` },
          { key: 'playlists' as const, label: `Playlists (${playlists.length})` },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'recent' && (
          <motion.div key="recent" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            {recentlyPlayed.length === 0 ? (
              <EmptyState icon="🕐" title="Recently played is empty" subtitle="Songs you play will appear here" />
            ) : (
              <SongList songs={recentlyPlayed} title="Recently Played" onPlayAll={handlePlayAll} />
            )}
          </motion.div>
        )}

        {activeTab === 'playlists' && (
          <motion.div key="pl" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Playlist name..."
                className="flex-1 px-4 py-2 bg-surface-2 border border-border rounded-full text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim()) {
                    createPlaylist(newName.trim());
                    setNewName('');
                  }
                }}
              />
              <button
                onClick={() => { if (newName.trim()) { createPlaylist(newName.trim()); setNewName(''); } }}
                className="px-4 py-2 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent/90"
              >
                Create
              </button>
            </div>

            {playlists.length === 0 ? (
              <EmptyState icon="📁" title="No playlists yet" subtitle="Create a playlist to organize your music" />
            ) : (
              <div className="space-y-2">
                {playlists.map((pl: any) => (
                  <div key={pl.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-surface-2 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {pl.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text text-sm truncate">{pl.name}</p>
                      <p className="text-text-muted text-xs">{pl.songIds.length} songs</p>
                    </div>
                    <button
                      onClick={() => deletePlaylist(pl.id)}
                      className="p-2 text-text-muted hover:text-red-500 transition-colors"
                      aria-label={`Delete ${pl.name}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-text mb-1">{title}</h3>
      <p className="text-text-muted text-sm">{subtitle}</p>
    </div>
  );
}
