import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { CloseIcon } from './Icons';

export function PWABanner() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState<boolean>(true);

  useEffect(() => {
    const isDismissed = localStorage.getItem('sursuno-pwa-banner-dismissed') === 'true';
    setDismissed(isDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('sursuno-pwa-banner-dismissed', 'true');
  };

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setDismissed(true);
    }
  };

  if (!isInstallable || isInstalled || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-24 md:max-w-md z-40 bg-surface/95 backdrop-blur-md border border-border/80 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-white font-bold shrink-0 text-lg shadow-sm">
            S
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-text text-sm truncate">Install SurSuno App</h4>
            <p className="text-text-muted text-xs truncate">Get standalone music playback & quick access</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="px-3.5 py-1.5 bg-accent text-white text-xs font-semibold rounded-full hover:bg-accent/90 transition-colors shadow-sm"
            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-text-muted hover:text-text rounded-full transition-colors"
            aria-label="Dismiss banner"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
