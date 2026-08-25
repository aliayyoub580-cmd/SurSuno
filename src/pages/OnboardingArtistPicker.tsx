import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FAMOUS_ARTISTS } from '@/data/artistsData';
import { searchArtists } from '@/services/musicApi';
import { saveUserArtistPreferences, getUserArtistPreferences } from '@/services/preferencesApi';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Artist } from '@/types';

export function OnboardingArtistPicker({ editMode: propEditMode }: { editMode?: boolean }) {
  const [searchParams] = useSearchParams();
  const isEditMode = propEditMode || searchParams.get('edit') === 'true';

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMap, setSelectedMap] = useState<Map<string, Artist>>(new Map());
  const [saving, setSaving] = useState(false);

  const { user, setHasOnboarded } = useAuthStore();
  const { favoriteArtists, setFavoriteArtists } = useUserStore();
  const navigate = useNavigate();

  // Load existing favorites on mount
  useEffect(() => {
    async function loadPreferences() {
      let initial: Artist[] = favoriteArtists;
      if ((!initial || initial.length === 0) && user?.id) {
        initial = await getUserArtistPreferences(user.id);
      }
      if (initial && initial.length > 0) {
        const map = new Map<string, Artist>();
        initial.forEach((a) => map.set(a.id || a.name, a));
        setSelectedMap(map);
      }
    }
    loadPreferences();
  }, [user?.id, favoriteArtists]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchArtists(query.trim());
        setSearchResults(results);
      } catch (err) {
        console.error('Error searching artists:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Default curated list mapped to Artist format
  const curatedArtists: Artist[] = useMemo(() => {
    return FAMOUS_ARTISTS.map((a) => ({
      id: a.id,
      name: a.name,
      image: a.image,
      url: `/artist/${encodeURIComponent(a.name)}`,
    }));
  }, []);

  const displayList = query.trim() ? searchResults : curatedArtists;

  const toggleArtist = (artist: Artist) => {
    const key = artist.id || artist.name;
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, artist);
      }
      return next;
    });
  };

  // Dynamically calculate 4 to 5 related artists based on current selections
  const relatedArtists: Artist[] = useMemo(() => {
    if (selectedMap.size === 0) return [];

    const selectedKeys = new Set(Array.from(selectedMap.keys()).map((k) => k.toLowerCase()));
    const selectedNames = Array.from(selectedMap.values()).map((a) => a.name);

    // Map genres of selected artists from FAMOUS_ARTISTS
    const selectedGenres = FAMOUS_ARTISTS.filter((fa) =>
      selectedNames.some((name) => name.toLowerCase() === fa.name.toLowerCase())
    ).map((fa) => fa.genre);

    // Find candidate artists matching any selected genre that are NOT yet selected
    const candidates = FAMOUS_ARTISTS.filter((fa) => {
      const isAlreadySelected = selectedKeys.has(fa.id.toLowerCase()) || selectedKeys.has(fa.name.toLowerCase());
      if (isAlreadySelected) return false;

      // Check genre overlap
      return selectedGenres.some((g) => {
        const primaryG = g.split('/')[0].trim().toLowerCase();
        return fa.genre.toLowerCase().includes(primaryG);
      });
    });

    // Fallback: If not enough genre matches, take top unselected famous artists
    if (candidates.length < 5) {
      const extra = FAMOUS_ARTISTS.filter(
        (fa) => !selectedKeys.has(fa.id.toLowerCase()) && !selectedKeys.has(fa.name.toLowerCase())
      );
      candidates.push(...extra);
    }

    // Deduplicate and return 5 artists
    const uniqueMap = new Map<string, Artist>();
    for (const c of candidates) {
      if (!uniqueMap.has(c.name.toLowerCase())) {
        uniqueMap.set(c.name.toLowerCase(), {
          id: c.id,
          name: c.name,
          image: c.image,
          url: `/artist/${encodeURIComponent(c.name)}`,
        });
      }
      if (uniqueMap.size >= 5) break;
    }

    return Array.from(uniqueMap.values());
  }, [selectedMap]);

  const selectedCount = selectedMap.size;
  const isValid = selectedCount >= 3;

  const handleContinue = async () => {
    if (!isValid || saving) return;
    setSaving(true);

    const selectedList = Array.from(selectedMap.values());

    // 1. Update Zustand store locally
    setFavoriteArtists(selectedList);

    // 2. Save to Supabase / Local preferences API
    if (user?.id) {
      await saveUserArtistPreferences(user.id, selectedList);
    }

    // 3. Mark profile onboarded
    await setHasOnboarded(true);

    setSaving(false);

    // 4. Navigate
    if (isEditMode) {
      navigate('/profile');
    } else {
      navigate('/onboarding/confirmation');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#000000] text-white flex flex-col justify-between px-4 sm:px-8 md:px-12 pt-6 pb-28 selection:bg-accent selection:text-white relative overflow-x-hidden">
      {/* Header section */}
      <div className="space-y-4 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center font-bold text-sm shadow-lg shadow-accent/20">
              S
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Sur<span className="text-accent">Suno</span></span>
          </div>
          {isEditMode && (
            <button
              onClick={() => navigate('/profile')}
              className="text-xs font-semibold px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="max-w-4xl">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight">
            {isEditMode ? 'Edit Your Favorite Artists' : 'Choose 3 or more artists you like.'}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-white/60 mt-2">
            We’ll build a personalized feed and daily mix tailored to your taste.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-2xl pt-2">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artists by name..."
            className="w-full pl-12 pr-10 py-3.5 bg-[#121216] border border-white/15 rounded-2xl text-sm sm:text-base text-white placeholder-white/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all shadow-inner"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs font-bold px-2 py-1 bg-white/10 rounded-md"
            >
              Clear
            </button>
          )}
        </div>

        {/* Related Artists Suggestion Bar */}
        {selectedMap.size > 0 && relatedArtists.length > 0 && !query && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl p-4 bg-gradient-to-r from-accent/15 via-purple-900/30 to-[#121216] border border-accent/30 rounded-2xl space-y-3 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-accent flex items-center gap-1.5">
                ✨ Suggested for you based on your picks (4 to 5 related artists)
              </h3>
              <span className="text-[0.7rem] text-white/50">Tap to add</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              {relatedArtists.map((rel) => (
                <button
                  key={rel.id || rel.name}
                  onClick={() => toggleArtist(rel)}
                  className="flex items-center gap-2.5 px-3.5 py-2 bg-white/10 hover:bg-emerald-500/20 border border-white/15 hover:border-emerald-500/40 rounded-full transition-all duration-200 shrink-0 group"
                >
                  <img
                    src={rel.image}
                    alt={rel.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-xs font-semibold text-white group-hover:text-emerald-400">
                    + {rel.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Grid area - Full width device responsive */}
      <div className="my-8 flex-1 w-full">
        {isSearching ? (
          <div className="flex items-center justify-center h-48 space-x-2">
            <div className="w-3.5 h-3.5 rounded-full bg-accent animate-bounce" />
            <div className="w-3.5 h-3.5 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
            <div className="w-3.5 h-3.5 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-20 text-white/50 space-y-2">
            <p className="text-base font-semibold text-white/80">No artists found matching "{query}"</p>
            <p className="text-xs">Try searching for another artist or check spelling.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6 md:gap-8 w-full">
            {displayList.map((artist, idx) => {
              const key = artist.id || artist.name;
              const isSelected = selectedMap.has(key);

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                  onClick={() => toggleArtist(artist)}
                  className="group flex flex-col items-center cursor-pointer select-none text-center w-full"
                >
                  <div
                    className={`relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full p-1 transition-all duration-300 ${
                      isSelected
                        ? 'ring-4 ring-emerald-500 shadow-2xl shadow-emerald-500/30 scale-105'
                        : 'hover:scale-105 border border-transparent'
                    }`}
                  >
                    <img
                      src={artist.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80'}
                      alt={artist.name}
                      className="w-full h-full rounded-full object-cover bg-[#1a1a24] shadow-md"
                      loading="lazy"
                    />

                    {/* Checkmark badge */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute right-1 bottom-1 w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg border-2 border-black font-extrabold"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <span className={`mt-3 text-xs sm:text-sm font-bold truncate max-w-full transition-colors ${isSelected ? 'text-emerald-400' : 'text-white group-hover:text-accent'}`}>
                    {artist.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Full Screen Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-[#000000]/95 backdrop-blur-2xl border-t border-white/10 px-4 sm:px-8 md:px-12 py-4 flex flex-row items-center justify-between gap-4 z-50">
        <div className="text-xs sm:text-sm text-white/80 flex items-center gap-2.5">
          <span className={`w-3 h-3 rounded-full ${isValid ? 'bg-emerald-500 animate-pulse' : 'bg-white/30'}`} />
          {isValid ? (
            <span className="font-bold text-white">{selectedCount} artists selected</span>
          ) : (
            <span>Select at least <strong className="text-white">{3 - selectedCount} more</strong> artist{3 - selectedCount === 1 ? '' : 's'}</span>
          )}
        </div>

        <button
          onClick={handleContinue}
          disabled={!isValid || saving}
          style={
            isValid
              ? { backgroundColor: '#ffffff', color: '#000000' }
              : { backgroundColor: 'rgba(255, 255, 255, 0.15)', color: 'rgba(255, 255, 255, 0.4)' }
          }
          className={`px-8 sm:px-10 py-3.5 rounded-full font-black text-sm sm:text-base transition-all duration-300 shadow-2xl flex items-center justify-center gap-2.5 border ${
            isValid
              ? 'border-white hover:bg-emerald-400 hover:text-black hover:scale-105 cursor-pointer shadow-emerald-500/30 ring-2 ring-emerald-400'
              : 'border-white/10 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <span className={`font-black tracking-wide ${isValid ? 'text-black' : 'text-white/40'}`}>
                {isEditMode ? 'Save Preferences' : 'Continue'}
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isValid ? '#000000' : 'rgba(255,255,255,0.4)'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
