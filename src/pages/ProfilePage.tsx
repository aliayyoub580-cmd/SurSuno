import { motion } from 'motion/react';
import { useUserStore } from '@/stores/userStore';
import { usePlayerStore } from '@/stores/playerStore';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import type { Song } from '@/types';

export function ProfilePage() {
  const { favorites, recentlyPlayed, searchHistory } = useUserStore();
  const { currentTrack } = usePlayerStore();
  const { isInstalled, isInstallable, isIOS, promptInstall } = usePWAInstall();

  // Estimate language preferences from recently played
  const langCounts: Record<string, number> = {};
  recentlyPlayed.forEach((song) => {
    const lang = (song.language || 'unknown').toLowerCase();
    langCounts[lang] = (langCounts[lang] || 0) + 1;
  });
  const total = Object.values(langCounts).reduce((a, b) => a + b, 0);
  const langPercentages = Object.entries(langCounts)
    .map(([lang, count]) => ({ lang, pct: total ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  // Top artists
  const artistCounts: Record<string, number> = {};
  recentlyPlayed.forEach((song) => {
    song.singers?.split(',').forEach((a) => {
      artistCounts[a.trim()] = (artistCounts[a.trim()] || 0) + 1;
    });
  });
  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  return (
    <div className="pb-24 md:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
            S
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Sur User</h1>
            <p className="text-text-muted">Music Lover</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard label="Favorites" value={favorites.length} icon="❤️" />
          <StatCard label="Played" value={recentlyPlayed.length} icon="🎵" />
          <StatCard label="Searches" value={searchHistory.length} icon="🔍" />
        </div>
      </motion.div>

      {/* App Settings / PWA Installation */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-text mb-4">App</h2>
        <div className="bg-surface rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border/50 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 bg-accent/10 text-accent rounded-xl text-xl shrink-0">
              📱
            </div>
            <div>
              <h3 className="font-semibold text-text text-base">Install SurSuno App</h3>
              <p className="text-text-muted text-xs sm:text-sm mt-0.5">
                {isInstalled
                  ? 'SurSuno is installed and running in standalone app mode.'
                  : isIOS
                  ? "Tap Safari's Share button and select 'Add to Home Screen'."
                  : isInstallable
                  ? 'Install SurSuno on your desktop or home screen for standalone playback.'
                  : "Use your browser menu (⋮ or ⊕) and select 'Install' or 'Add to Home Screen'."}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {isInstalled ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-sm rounded-full">
                ✓ App Installed
              </span>
            ) : isInstallable ? (
              <button
                onClick={promptInstall}
                className="px-5 py-2.5 bg-accent text-white font-semibold text-sm rounded-full hover:bg-accent/90 transition-colors shadow-md flex items-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
              >
                Install App
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-2 text-text-muted font-medium text-xs rounded-full">
                Browser Menu Ready
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Language preferences */}
      {langPercentages.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-text mb-4">Your Music Profile</h2>
          <div className="bg-surface rounded-xl p-4 space-y-3">
            {langPercentages.map(({ lang, pct }) => (
              <div key={lang}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text font-medium capitalize">{lang}</span>
                  <span className="text-text-muted">{pct}%</span>
                </div>
                <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-accent to-pink-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top artists */}
      {topArtists.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-text mb-4">Top Artists</h2>
          <div className="flex flex-wrap gap-2">
            {topArtists.map((artist) => (
              <span key={artist} className="px-3 py-1.5 bg-surface-2 text-text-muted rounded-full text-sm">
                {artist}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      <section>
        <h2 className="text-lg font-bold text-text mb-4">Recently Played</h2>
        {recentlyPlayed.length === 0 ? (
          <EmptyState icon="🎧" title="No listening history" subtitle="Start playing songs to see your history here" />
        ) : (
          <div className="space-y-1">
            {recentlyPlayed.slice(0, 10).map((song) => (
              <div key={song.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-2 transition-colors">
                <img src={song.image} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text text-sm truncate">{song.title}</p>
                  <p className="text-text-muted text-xs truncate">{song.singers}</p>
                </div>
                <span className="text-text-subtle text-xs">{formatDuration(song.duration)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-surface rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="text-text-muted text-xs">{label}</p>
    </div>
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

function formatDuration(sec: string): string {
  const s = parseInt(sec) || 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
