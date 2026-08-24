import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isTransitioning: boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: (typeof window !== 'undefined'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : 'light') as Theme,
      isTransitioning: false,

      setTheme: (theme) => {
        set({ isTransitioning: true });
        setTimeout(() => {
          document.documentElement.setAttribute('data-theme', theme);
          localStorage.setItem('sursuno-theme', theme);
          set({ theme, isTransitioning: false });
        }, 50);
      },

      toggleTheme: () => {
        const current = get().theme;
        set({ isTransitioning: true });
        setTimeout(() => {
          const next = current === 'light' ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', next);
          localStorage.setItem('sursuno-theme', next);
          set({ theme: next, isTransitioning: false });
        }, 50);
      },
    }),
    {
      name: 'sursuno-theme',
    }
  )
);
