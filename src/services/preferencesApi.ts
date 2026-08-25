import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Artist } from '@/types';

const LOCAL_STORAGE_PREFS_KEY = 'sursuno-user-artist-preferences';

export function toValidUuid(str: string): string {
  if (!str) return '00000000-0000-4000-8000-000000000000';

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) {
    return str.toLowerCase();
  }

  const clean = str.trim().toLowerCase();
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const p3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const p4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');

  return `${p1}-${p2.slice(0, 4)}-4${p2.slice(1, 4)}-a${p3.slice(1, 4)}-${p4.slice(0, 8)}${p3.slice(0, 4)}`;
}

export async function saveUserArtistPreferences(userId: string, artists: Artist[]): Promise<boolean> {
  if (!userId) return false;
  const validUuid = toValidUuid(userId);

  if (isSupabaseConfigured && supabase) {
    try {
      // First delete existing prefs for user to replace with new selection
      await supabase.from('user_artist_preferences').delete().eq('user_id', validUuid);

      // Insert new artist preferences
      const rows = artists.map((artist) => ({
        user_id: validUuid,
        artist_id: artist.id || artist.name,
        artist_name: artist.name,
        artist_image: artist.image || '',
      }));

      const { error } = await supabase.from('user_artist_preferences').insert(rows);
      if (error) {
        console.error('Error saving artist preferences to Supabase:', error);
      }
    } catch (err) {
      console.error('Error in saveUserArtistPreferences:', err);
    }
  }

  // Always save to localStorage as backup/offline store
  try {
    localStorage.setItem(
      `${LOCAL_STORAGE_PREFS_KEY}-${validUuid}`,
      JSON.stringify(artists)
    );
    localStorage.setItem(
      `${LOCAL_STORAGE_PREFS_KEY}-${userId}`,
      JSON.stringify(artists)
    );
  } catch (err) {
    console.error('Error saving local artist preferences:', err);
  }

  return true;
}

export async function getUserArtistPreferences(userId: string): Promise<Artist[]> {
  if (!userId) return [];
  const validUuid = toValidUuid(userId);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_artist_preferences')
        .select('*')
        .eq('user_id', validUuid);

      if (!error && data && data.length > 0) {
        return data.map((item) => ({
          id: item.artist_id,
          name: item.artist_name,
          image: item.artist_image || '',
          url: `/artist/${encodeURIComponent(item.artist_name)}`,
        }));
      }
    } catch (err) {
      console.error('Error fetching artist preferences from Supabase:', err);
    }
  }

  // Fallback to localStorage
  try {
    const stored =
      localStorage.getItem(`${LOCAL_STORAGE_PREFS_KEY}-${validUuid}`) ||
      localStorage.getItem(`${LOCAL_STORAGE_PREFS_KEY}-${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore error
  }

  return [];
}
