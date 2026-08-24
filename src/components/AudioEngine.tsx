import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { recordListeningEvent } from '@/services/listeningService';

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    let hasRecordedCompletion = false;

    const onTimeUpdate = () => {
      usePlayerStore.setState({ progress: audio.currentTime });

      if (audio.duration > 0 && !hasRecordedCompletion) {
        const rate = audio.currentTime / audio.duration;
        if (rate >= 0.8) {
          hasRecordedCompletion = true;
          const track = usePlayerStore.getState().currentTrack;
          if (track) {
            recordListeningEvent(
              {
                songId: track.id,
                eventType: 'complete',
                durationPlayed: audio.currentTime,
                songDuration: audio.duration,
                completionRate: rate,
              },
              track
            );
          }
        }
      }
    };

    const onLoadedMetadata = () => {
      usePlayerStore.setState({ duration: audio.duration });
    };

    const onEnded = () => {
      const state = usePlayerStore.getState();
      const track = state.currentTrack;
      if (track && !hasRecordedCompletion) {
        hasRecordedCompletion = true;
        recordListeningEvent(
          {
            songId: track.id,
            eventType: 'complete',
            durationPlayed: audio.duration,
            songDuration: audio.duration,
            completionRate: 1,
          },
          track
        );
      }
      state.next();
    };

    const onError = (e: Event) => {
      console.warn('Audio playback error (skipping invalid track):', e);
      setTimeout(() => {
        usePlayerStore.getState().next();
      }, 500);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    let prevTrackId: string | null = null;
    let prevTrackTimePlayed = 0;
    let prevTrackDuration = 0;
    let prevTrackObj: any = null;
    let prevProgress = -1;

    const unsubscribe = usePlayerStore.subscribe((state) => {
      if (!audio) return;

      const trackId = state.currentTrack?.id ?? null;
      if (trackId !== prevTrackId) {
        if (prevTrackId && prevTrackObj && prevTrackDuration > 0) {
          const rate = prevTrackTimePlayed / prevTrackDuration;
          if (rate < 0.2) {
            recordListeningEvent(
              {
                songId: prevTrackId,
                eventType: 'skip',
                durationPlayed: prevTrackTimePlayed,
                songDuration: prevTrackDuration,
                completionRate: rate,
              },
              prevTrackObj
            );
          }
        }

        prevTrackId = trackId;
        prevTrackObj = state.currentTrack;
        hasRecordedCompletion = false;

        if (state.currentTrack?.media_url) {
          audio.src = state.currentTrack.media_url;
          audio.load();
          if (state.isPlaying) {
            audio.play().catch((err) => console.log('Audio play error:', err));
          }

          recordListeningEvent(
            {
              songId: state.currentTrack.id,
              eventType: 'play',
            },
            state.currentTrack
          );

          if ('mediaSession' in navigator && state.currentTrack) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: state.currentTrack.title,
              artist: state.currentTrack.singers,
              album: state.currentTrack.album,
              artwork: [
                { src: state.currentTrack.image, sizes: '500x500', type: 'image/jpeg' },
              ],
            });
          }
        } else {
          audio.pause();
          audio.removeAttribute('src');
        }
      }

      prevTrackTimePlayed = audio.currentTime;
      prevTrackDuration = audio.duration || 0;

      if (state.currentTrack?.media_url) {
        if (state.isPlaying && audio.paused) {
          audio.play().catch((err) => console.log('Audio play error:', err));
        } else if (!state.isPlaying && !audio.paused) {
          audio.pause();
        }
      }

      const targetVol = state.isMuted ? 0 : state.volume;
      if (audio.volume !== targetVol) {
        audio.volume = targetVol;
      }

      if (Math.abs(audio.currentTime - state.progress) > 1.2 && Math.abs(prevProgress - state.progress) > 0.5) {
        audio.currentTime = state.progress;
      }
      prevProgress = state.progress;
    });

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => usePlayerStore.getState().play());
      navigator.mediaSession.setActionHandler('pause', () => usePlayerStore.getState().pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().next());
    }

    return () => {
      unsubscribe();
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  return null;
}
