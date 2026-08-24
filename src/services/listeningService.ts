import { supabase, isSupabaseConfigured } from './supabaseClient';
import { useUserStore } from '@/stores/userStore';
import type { Song } from '@/types';

export type EventType = 'play' | 'complete' | 'skip' | 'favorite' | 'unfavorite' | 'search';

export interface MusicEvent {
  songId: string;
  eventType: EventType;
  artistName?: string;
  language?: string;
  genre?: string;
  durationPlayed?: number;
  songDuration?: number;
  completionRate?: number;
}

export async function recordListeningEvent(event: MusicEvent, song?: Song): Promise<void> {
  if (song) {
    useUserStore.getState().recordMusicInteraction({
      song,
      eventType: event.eventType,
      completionRate: event.completionRate ?? 0,
    });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userId = session.user.id;
        await supabase.from('user_music_events').insert({
          user_id: userId,
          song_id: event.songId,
          event_type: event.eventType,
          artist_name: event.artistName || song?.singers || '',
          language: event.language || song?.language || 'hindi',
          genre: event.genre || '',
          duration_played: event.durationPlayed || 0,
          song_duration: event.songDuration || 0,
          completion_rate: event.completionRate || 0,
        });

        if (event.eventType === 'complete' || event.eventType === 'play') {
          await supabase.from('listening_history').insert({
            user_id: userId,
            song_id: event.songId,
            song_title: song?.title || '',
            artist_name: song?.singers || '',
            image_url: song?.image || '',
            completion_rate: event.completionRate || 0,
          });
        }
      }
    } catch (err) {
      console.warn('Supabase event log warning:', err);
    }
  }
}
