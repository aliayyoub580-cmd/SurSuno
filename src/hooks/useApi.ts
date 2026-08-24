import { useState, useEffect, useRef, useCallback } from 'react';
import { searchSongs, getTrendingSongs } from '@/services/musicApi';
import { getRelatedSongs, getPersonalizedRecommendations } from '@/services/recommendationService';
import type { Song } from '@/types';

export function useSearch(query: string) {
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    searchSongs(query, false)
      .then((data) => { if (!controller.signal.aborted) setResults(data as Song[]); })
      .catch(() => { if (!controller.signal.aborted) setError('Failed to search'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
  }, [query]);

  const clear = useCallback(() => { setResults([]); setLoading(false); setError(null); }, []);
  return { results, loading, error, clear };
}

export function useTrending() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    getTrendingSongs()
      .then(setSongs)
      .catch(() => setError('Failed to load trending'))
      .finally(() => setLoading(false));
  }, []);
  return { songs, loading, error };
}

export function useRecommended(track: Song | null) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!track) {
      setSongs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getRelatedSongs(track, new Set([track.id]))
      .then(setSongs)
      .finally(() => setLoading(false));
  }, [track?.id]);
  return { songs, loading };
}

export function usePersonalized() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getPersonalizedRecommendations()
      .then(setSongs)
      .finally(() => setLoading(false));
  }, []);
  return { songs, loading };
}
