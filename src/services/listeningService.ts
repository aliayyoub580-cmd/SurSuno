import { supabase, isSupabaseConfigured } from './supabaseClient';
import { useUserStore } from '@/stores/userStore';
import { extractSongFeatures } from './recommendationEngine/featureExtractor';
import { updateUserProfileWithInteraction } from './recommendationEngine/profileEngine';
import type { InteractionType } from './recommendationEngine/types';
import type { Song } from '@/types';

export type EventType =
  | 'play'
  | 'complete'
  | 'skip'
  | 'quickSkip'
  | 'favorite'
  | 'unfavorite'
  | 'like'
  | 'dislike'
  | 'save'
  | 'playlistAdd'
  | 'share'
  | 'artistFollow'
  | 'search';

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

function mapEventTypeToInteractionType(eventType: EventType, completionRate = 0): InteractionType {
  switch (eventType) {
    case 'complete':
      return 'completion';
    case 'favorite':
    case 'like':
      return 'like';
    case 'unfavorite':
    case 'dislike':
      return 'dislike';
    case 'save':
      return 'save';
    case 'playlistAdd':
      return 'playlistAdd';
    case 'share':
      return 'share';
    case 'artistFollow':
      return 'artistFollow';
    case 'quickSkip':
      return 'quickSkip';
    case 'skip':
      return completionRate < 0.15 ? 'quickSkip' : 'partialPlay';
    case 'play':
    default:
      return completionRate >= 0.9 ? 'completion' : completionRate > 0.3 ? 'partialPlay' : 'play';
  }
}

export async function recordListeningEvent(event: MusicEvent, song?: Song): Promise<void> {
  const completionRate = event.completionRate ?? 0;
  const interactionType = mapEventTypeToInteractionType(event.eventType, completionRate);

  if (song) {
    // 1. Update user store interaction history
    const userStore = useUserStore.getState();
    userStore.recordMusicInteraction({
      song,
      eventType: event.eventType,
      completionRate,
    });

    // 2. Real-time update of ML UserMusicProfile in local Zustand / localStorage
    const features = extractSongFeatures(song);
    const updatedProfile = updateUserProfileWithInteraction(
      userStore.userMusicProfile,
      features,
      interactionType,
      completionRate
    );
    userStore.setUserMusicProfile(updatedProfile);
  }

  // 3. Persist to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userId = session.user.id;

        // Log interaction table
        await supabase.from('user_interactions').insert({
          user_id: userId,
          song_id: event.songId,
          interaction_type: interactionType,
          weight: interactionType === 'like' ? 8 : interactionType === 'completion' ? 4 : 1,
          completion_rate: completionRate,
          duration_played: event.durationPlayed || 0,
        });

        // Log general music events table
        await supabase.from('user_music_events').insert({
          user_id: userId,
          song_id: event.songId,
          event_type: event.eventType,
          artist_name: event.artistName || song?.singers || '',
          language: event.language || song?.language || 'hindi',
          genre: event.genre || '',
          duration_played: event.durationPlayed || 0,
          song_duration: event.songDuration || 0,
          completion_rate: completionRate,
        });

        if (event.eventType === 'complete' || event.eventType === 'play') {
          await supabase.from('listening_history').insert({
            user_id: userId,
            song_id: event.songId,
            song_title: song?.title || '',
            artist_name: song?.singers || '',
            image_url: song?.image || '',
            completion_rate: completionRate,
          });
        }
      }
    } catch (err) {
      console.warn('Supabase event log warning:', err);
    }
  }
}
