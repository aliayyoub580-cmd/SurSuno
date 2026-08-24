import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon, DiscoverIcon, TrendingIcon, NewsIcon, PlaylistIcon, UserIcon,
} from '@/components/Icons';

const navItems = [
  { label: 'Home', path: '/', icon: HomeIcon },
  { label: 'Discover', path: '/discover', icon: DiscoverIcon },
  { label: 'Trending', path: '/trending', icon: TrendingIcon },
  { label: 'News', path: '/news', icon: NewsIcon },
  { label: 'Playlists', path: '/playlists', icon: PlaylistIcon },
  { label: 'Profile', path: '/profile', icon: UserIcon },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-player-bg backdrop-blur-xl border-t border-border safe-area-bottom"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                isActive ? 'text-accent' : 'text-text-muted hover:text-text'
              }`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
              >
                <Icon size={22} />
              </motion.div>
              <span className="text-[0.65rem] font-medium">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute -top-0.5 w-6 h-0.5 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-surface border-r border-border h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto" aria-label="Sidebar navigation">
      <nav className="p-3 space-y-1">
        {navItems.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            S
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text truncate">Sur User</p>
            <p className="text-xs text-text-muted">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
