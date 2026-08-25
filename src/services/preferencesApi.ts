import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Artist } from '@/types';

const LOCAL_STORAGE_PREFS_KEY = 'sursuno-user-artist-preferences';

export async function saveUserArtistPreferences(userId: string, artists: Artist[]): Promise<boolean> {
  if (!userId) return false;

  if (isSupabaseConfigured && supabase) {
    try {
      // First delete existing prefs for user to replace with new selection
      await supabase.from('user_artist_preferences').delete().eq('user_id', userId);

      // Insert new artist preferences
      const rows = artists.map((artist) => ({
        user_id: userId,
        artist_id: artist.id,
        artist_name: artist.name,
        artist_image: artist.image,
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

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_artist_preferences')
        .select('*')
        .eq('user_id', userId);

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
    const stored = localStorage.getItem(`${LOCAL_STORAGE_PREFS_KEY}-${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore error
  }

  return [];
}
