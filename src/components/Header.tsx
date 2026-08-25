import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useThemeStore } from '@/stores/themeStore';
import { SunIcon, MoonIcon, MenuIcon, CloseIcon } from '@/components/Icons';
import { Link, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/stores/useAuthStore';

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

export function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const displayName = getUserDisplayName(user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Discover', path: '/discover' },
    { label: 'Trending', path: '/trending' },
    { label: 'Genres', path: '/genres' },
    { label: 'Playlists', path: '/playlists' },
  ];

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 bg-header-bg backdrop-blur-xl border-b border-border transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent via-purple-500 to-pink-500 p-0.5 shadow-md shadow-accent/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-[#0a0a0f] rounded-[10px] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          </div>
          <span className="text-lg font-black tracking-tight text-text">
            Sur<span className="text-accent">Suno</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-accent/15 text-accent font-bold shadow-sm'
                    : 'text-text-muted hover:text-text hover:bg-surface-2'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-surface-2 transition-colors text-text-muted hover:text-text"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'light' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
              </motion.div>
            </AnimatePresence>
          </button>

          <Link
            to="/profile"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 hover:bg-surface-3 transition-colors text-sm font-medium text-text-muted hover:text-text"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <span className="hidden lg:inline">{displayName}</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2.5 rounded-full bg-surface-2 hover:bg-surface-3 transition-colors text-text border border-border"
            aria-label="Open menu"
          >
            <MenuIcon size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay Portaled to document.body to break out of header stacking context */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Dimmed backdrop - tapping anywhere on left closes menu */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[99998] md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Side Drawer Panel (Matches clean reference design) */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                className="fixed right-0 top-0 bottom-0 h-full h-[100dvh] w-[75vw] max-w-[300px] bg-surface text-text border-l border-border z-[99999] md:hidden shadow-2xl flex flex-col select-none overflow-y-auto"
              >
                {/* Drawer Header with Close Button */}
                <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white font-black text-xs shadow-sm">
                      S
                    </div>
                    <span className="text-base font-extrabold text-text tracking-tight">SurSuno</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full text-accent hover:opacity-80 transition-opacity font-bold cursor-pointer"
                    aria-label="Close menu"
                  >
                    <CloseIcon size={22} />
                  </button>
                </div>

                {/* Clean Divided Navigation List (Exact match to reference layout) */}
                <nav className="flex-1 divide-y divide-border/40" aria-label="Mobile navigation">
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block py-3.5 px-5 font-semibold text-sm sm:text-base transition-colors ${
                          isActive
                            ? 'text-accent font-bold bg-accent/5'
                            : 'text-text hover:text-accent'
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}

                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-3.5 px-5 font-semibold text-sm sm:text-base transition-colors ${
                      location.pathname === '/profile'
                        ? 'text-accent font-bold bg-accent/5'
                        : 'text-text hover:text-accent'
                    }`}
                  >
                    Profile
                  </Link>

                  <Link
                    to="/onboarding/artists?edit=true"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3.5 px-5 font-semibold text-sm sm:text-base text-text-muted hover:text-accent transition-colors"
                  >
                    Edit Artists
                  </Link>
                </nav>

                {/* Footer User Profile & Sign Out */}
                <div className="p-4 border-t border-border/50 bg-surface-2 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-text truncate">{displayName}</p>
                      <p className="text-[0.65rem] text-text-muted truncate">{user?.email || 'Listener'}</p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      const { useAuthStore } = await import('@/stores/useAuthStore');
                      await useAuthStore.getState().signOut();
                    }}
                    className="w-full py-2 text-left font-bold text-xs text-red-500 hover:text-red-400 transition-colors flex items-center gap-1.5 pt-1 cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.header>
  );
}
