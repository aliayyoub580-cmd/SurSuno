import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePlayerStore } from '@/stores/playerStore';
import { usePWAInstall } from '@/hooks/usePWAInstall';

function getUserDisplayName(user: any): string {
  const metaName = user?.user_metadata?.full_name;
  if (metaName && metaName !== 'Music Lover' && metaName !== 'Sur User') {
    return metaName;
  }
  if (user?.email) {
    const parts = user.email.split('@')[0].split(/[._-]/);
    return parts
      .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  }
  return 'Music Enthusiast';
}

export function ProfilePage() {
  const { favorites, favoriteArtists, recentlyPlayed } = useUserStore();
  const { user, signOut } = useAuthStore();
  const { isInstalled, isInstallable, isIOS, promptInstall } = usePWAInstall();
  const navigate = useNavigate();

  const displayName = getUserDisplayName(user);
  const topArtists = favoriteArtists.map((a) => a.name);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

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

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">
                {displayName}
              </h1>
              <p className="text-text-muted text-xs sm:text-sm">{user?.email || 'Music Enthusiast'}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="self-start sm:self-auto px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard label="Favorites" value={favorites.length} icon="❤️" />
          <StatCard label="Played" value={recentlyPlayed.length} icon="🎵" />
          <StatCard label="Artists" value={favoriteArtists.length} icon="🎤" />
        </div>
      </motion.div>

      {/* Favorite Artists / Preferences Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-text">Your Favorite Artists</h2>
            <p className="text-xs text-text-muted">Drives your personalized "Made For You" feed</p>
          </div>
          <button
            onClick={() => navigate('/onboarding/artists?edit=true')}
            className="px-4 py-1.5 rounded-full bg-accent/10 hover:bg-accent/20 text-accent font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <span>✏️ Edit Artists</span>
          </button>
        </div>

        {favoriteArtists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {favoriteArtists.map((artist) => (
              <Link
                key={artist.id || artist.name}
                to={`/artist/${encodeURIComponent(artist.name)}`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all group"
              >
                <img
                  src={artist.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'}
                  alt={artist.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <span className="text-xs font-bold text-text group-hover:text-accent truncate">
                  {artist.name}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-surface border border-border text-center space-y-2">
            <p className="text-xs text-text-muted">No favorite artists selected yet.</p>
            <button
              onClick={() => navigate('/onboarding/artists?edit=true')}
              className="px-4 py-2 rounded-full bg-accent text-white font-bold text-xs hover:bg-accent/90 transition-colors"
            >
              Pick Your Artists
            </button>
          </div>
        )}
      </section>


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
