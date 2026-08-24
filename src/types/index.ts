export type Song = {
  id: string;
  title: string;
  song: string;
  image: string;
  url: string;
  duration: string;
  singers: string;
  primary_artists: string;
  album: string;
  album_url: string;
  language: string;
  year?: string;
  perma_url: string;
  media_url: string;
  download_url?: string;
  downloadAvailable?: boolean;
  play_count?: string;
};

export type Artist = {
  id: string;
  name: string;
  image: string;
  url: string;
  bio?: string;
  followers?: string;
};

export type Album = {
  id: string;
  title: string;
  name: string;
  image: string;
  song_count: string;
  year: string;
  singers: string;
  music: string;
  primary_artists: string;
  songs: Song[];
  url: string;
  downloadAvailable?: boolean;
};

export type Playlist = {
  id: string;
  title: string;
  listname: string;
  firstname: string;
  image: string;
  song_count: string;
  songs: Song[];
  url: string;
  description?: string;
};

export type NewsArticle = {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  source_name: string;
  article_url: string;
  published_at: string;
  category: string;
  created_at?: string;
};

export type PlayerTrack = Song;
