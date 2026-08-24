import { motion } from 'motion/react';
import { DownloadIcon, PlayIcon } from '@/components/Icons';

export function DownloadPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 md:py-20"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-xl">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-text mb-3">Take SurSuno With You</h1>
        <p className="text-text-muted text-lg max-w-md mx-auto mb-10">
          Listen anywhere with the SurSuno app. Offline mode, background play, and more.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <DownloadButton
            icon={<AndroidIcon />}
            title="Download for Android"
            subtitle="APK • 45 MB"
          />
          <DownloadButton
            icon={<WindowsIcon />}
            title="Download for Windows"
            subtitle="EXE • 62 MB"
          />
        </div>

        {/* Features */}
        <h2 className="text-2xl font-bold text-text mb-6">Why download the app?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto mb-16">
          {[
            { icon: '📴', title: 'Offline Mode', desc: 'Download songs and listen without internet' },
            { icon: '🔒', title: 'Background Play', desc: 'Keep music playing while using other apps' },
            { icon: '🎨', title: 'Custom Themes', desc: 'Personalize your experience' },
            { icon: '⚡', title: 'Faster', desc: 'Optimized for smooth playback' },
            { icon: '🔔', title: 'Notifications', desc: 'Never miss new releases from your artists' },
            { icon: '💾', title: 'More Storage', desc: 'Larger download limits than web' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface rounded-xl p-5 text-left"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-text mb-1">{feature.title}</h3>
              <p className="text-text-muted text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Version info */}
        <div className="text-text-subtle text-sm">
          <p>Version 2.1.0 • Last updated August 2026</p>
          <p className="mt-1">Requires Android 8.0+ / Windows 10+</p>
        </div>
      </motion.div>
    </div>
  );
}

function DownloadButton({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-4 px-6 py-4 bg-surface border border-border rounded-2xl hover:border-accent/50 hover:shadow-lg transition-all text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-text">{title}</p>
        <p className="text-text-muted text-sm">{subtitle}</p>
      </div>
    </motion.button>
  );
}

function AndroidIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#3DDC84" aria-hidden="true">
      <path d="M17.523 15.341a.5.5 0 0 0-.5.5v3a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v3a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 0-.5-.5M5.995 5.995l.007.007L11.995 12l-5.993 5.993-.007-.007L5.988 12l.007-6.005zM18.005 5.995l.007.007L24 12l-5.988 6.005-.007-.007L18.012 12l.007-6.005z" />
    </svg>
  );
}

function WindowsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#00ADEF" aria-hidden="true">
      <path d="M3 5.548l7.537 1.073v6.923L3 14.452V5.548zm7.537 11.831L3 18.452v-4.95l7.537 1.073v4.804zm1.463-1.173V7.145l7.537-1.073v9.856l-7.537-1.073zM21 12.502v4.95l-7.537 1.073v-6.923L21 12.502z" />
    </svg>
  );
}
