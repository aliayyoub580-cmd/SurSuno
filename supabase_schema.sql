-- ==========================================
-- SurSuno Supabase Database Schema
-- ==========================================
-- Run this script in your Supabase SQL Editor (https://app.supabase.com -> SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    preferred_language TEXT DEFAULT 'hindi',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PLAYLISTS TABLE
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PLAYLIST SONGS TABLE
CREATE TABLE IF NOT EXISTS public.playlist_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    song_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    album TEXT,
    image_url TEXT,
    duration TEXT,
    position INT DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(playlist_id, song_id)
);

-- 4. USER FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id TEXT NOT NULL,
    song_title TEXT,
    artist_name TEXT,
    image_url TEXT,
    added_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, song_id)
);

-- 5. USER MUSIC EVENTS TABLE (Analytics / Recommendations)
CREATE TABLE IF NOT EXISTS public.user_music_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'play', 'complete', 'skip', 'favorite', 'unfavorite', 'search'
    artist_name TEXT,
    language TEXT DEFAULT 'hindi',
    genre TEXT,
    duration_played NUMERIC DEFAULT 0,
    song_duration NUMERIC DEFAULT 0,
    completion_rate NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. LISTENING HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.listening_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id TEXT NOT NULL,
    song_title TEXT,
    artist_name TEXT,
    image_url TEXT,
    completion_rate NUMERIC DEFAULT 0,
    played_at TIMESTAMPTZ DEFAULT now()
);

-- 7. DAILY NEWS TABLE
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    source_name TEXT,
    article_url TEXT UNIQUE NOT NULL,
    published_at TIMESTAMPTZ DEFAULT now(),
    category TEXT DEFAULT 'Music & Entertainment',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- INDEXES FOR FAST QUERY PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON public.playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON public.user_music_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON public.user_music_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_id ON public.listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_played_at ON public.listening_history(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON public.news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_article_url ON public.news(article_url);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_music_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.user_profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
    ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Playlists Policies
CREATE POLICY "Users can view public playlists or own playlists" 
    ON public.playlists FOR SELECT USING (is_public OR auth.uid() = user_id);

CREATE POLICY "Users can insert own playlists" 
    ON public.playlists FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists" 
    ON public.playlists FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists" 
    ON public.playlists FOR DELETE USING (auth.uid() = user_id);

-- 3. Playlist Songs Policies
CREATE POLICY "Playlist songs viewable if playlist viewable" 
    ON public.playlist_songs FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE playlists.id = playlist_songs.playlist_id 
            AND (playlists.is_public OR playlists.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert songs into own playlists" 
    ON public.playlist_songs FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE playlists.id = playlist_songs.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete songs from own playlists" 
    ON public.playlist_songs FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE playlists.id = playlist_songs.playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

-- 4. Favorites Policies
CREATE POLICY "Users can view own favorites" 
    ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own favorites" 
    ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own favorites" 
    ON public.user_favorites FOR DELETE USING (auth.uid() = user_id);

-- 5. Music Events Policies
CREATE POLICY "Users can view own music events" 
    ON public.user_music_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can record own music events" 
    ON public.user_music_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Listening History Policies
CREATE POLICY "Users can view own listening history" 
    ON public.listening_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own listening history" 
    ON public.listening_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. News Policies (Public read, Service Role write)
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public news viewable by everyone" 
    ON public.news FOR SELECT USING (true);


-- ==========================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Music Enthusiast'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
