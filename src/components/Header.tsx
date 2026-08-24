import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { SunIcon, MoonIcon, MenuIcon, CloseIcon } from '@/components/Icons';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Discover', path: '/discover' },
    { label: 'Trending', path: '/trending' },
    { label: 'Genres', path: '/genres' },
    { label: 'Library', path: '/library' },
  ];

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 bg-bg/80 backdrop-blur-xl border-b border-border"
    >
      <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-text tracking-tight">Sur<span className="text-accent">Suno</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/search"
            className="p-2 rounded-full hover:bg-surface-2 transition-colors text-text-muted hover:text-text"
            aria-label="Search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-surface-2 transition-colors text-text-muted hover:text-text"
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
              S
            </div>
            <span className="hidden lg:inline">Profile</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-full hover:bg-surface-2 transition-colors text-text-muted"
            aria-label="Open menu"
          >
            <MenuIcon size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-72 bg-surface z-50 md:hidden shadow-2xl"
            >
              <div className="p-4 flex items-center justify-between border-b border-border">
                <span className="text-lg font-bold text-text">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-surface-2" aria-label="Close menu">
                  <CloseIcon size={20} />
                </button>
              </div>
              <nav className="p-4 space-y-1" aria-label="Mobile navigation">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      location.pathname === link.path
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-muted hover:text-text hover:bg-surface-2'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                    S
                  </div>
                  Profile
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
