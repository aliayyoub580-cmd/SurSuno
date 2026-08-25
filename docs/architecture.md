# Architecture

## System Overview

SurSuno is a two-part application:

1. A frontend React app for browsing music and playing streams.
2. A backend Express service that exposes API routes and fetches data from JioSaavn.

The app is designed to make the frontend experience feel like a modern streaming app while keeping the data access isolated in one backend layer.

```mermaid
flowchart LR
  User[User Browser] --> Frontend[React + Vite App]
  Frontend --> API[Express API /backend/server.js]
  API --> JioSaavn[JioSaavn Public API]
  Frontend --> Supabase[Supabase (optional)]
  API --> RSS[RSS News Feed]
  Frontend --> LocalStorage[Local playlists / user preferences]
```

## Frontend Architecture

The React app lives in the [src](../src) folder and is organized by feature domain:

- [src/App.tsx](../src/App.tsx) — router and app shell
- [src/pages](../src/pages) — route-level pages such as Home, Search, Trending, News, Profile, and Download
- [src/components](../src/components) — reusable UI: player, navigation, cards, modal, hero sections
- [src/services](../src/services) — API clients and external integration logic
- [src/stores](../src/stores) — Zustand state for playlists, player, and user preferences
- [src/hooks](../src/hooks) — custom hooks for search, recommendations, and PWA installation
- [src/types](../src/types/index.ts) — shared TypeScript interfaces

### State Model

The frontend uses Zustand stores:

- `useAuthStore` — authentication session (`signUp`, `signIn`, `signOut`, `restoreSession`, `hasOnboarded`) with Supabase Auth & local session fallback
- `usePlayerStore` — player state, queue management, playback actions, recommendations
- `useLibraryStore` — local playlist CRUD and persisted songs
- `useUserStore` — favorites, `favoriteArtists`, recently played, search history, recommendation preferences
- `useThemeStore` — light/dark theme preference

These stores persist user data in browser storage / Supabase database and enforce mandatory authentication and first-run artist onboarding.


## Backend Architecture

The backend is in [backend](../backend):

- [backend/server.js](../backend/server.js) — Express entrypoint and route definitions
- [backend/jiosaavn.js](../backend/jiosaavn.js) — JioSaavn scraping/data extraction layer
- [backend/helper.js](../backend/helper.js) — URL decryption and song normalization
- [backend/endpoints.js](../backend/endpoints.js) — JioSaavn endpoint templates
- [backend/newsWorker.js](../backend/newsWorker.js) — RSS and Supabase news syncing

### Backend Responsibilities

- Accept search/query requests from frontend
- Transform JioSaavn data into a consistent API payload
- Resolve song, album, playlist, and lyrics details
- Return JSON responses to the app
- Provide news feed syncing and optional daily updates

## Data Flow

### Search and playback flow

1. User enters a search term in the frontend.
2. The frontend calls the API client in [src/services/musicApi.ts](../src/services/musicApi.ts).
3. The client calls `/api/song/`, `/api/album/`, or `/api/result/`.
4. The Express app forwards the request to the JioSaavn helper logic.
5. Data is normalized and returned to the frontend as typed objects.
6. The player store handles queue generation and playback.

### Recommendation flow

1. The player store detects nearby queue exhaustion.
2. It calls recommendation helpers from [src/services/recommendationService.ts](../src/services/recommendationService.ts).
3. Candidate songs are ranked using artist, language, album, and user preference signals.
4. Recommended tracks are appended to the queue.

### News flow

1. The frontend requests news from `/api/news/` or Supabase.
2. The backend tries Supabase first if configured.
3. If unavailable, it falls back to live RSS fetches.
4. Optional updates can be triggered through `/news/update` with a cron secret.

## Deployment Architecture

The project includes both local web and Vercel-style deployment patterns:

- [api/index.js](../api/index.js) wraps the backend Express app for serverless hosting.
- [vercel.json](../vercel.json) defines rewrite rules and cache rules.
- [Procfile](../Procfile) supports deployment platforms that run a Node process.

This means the same Express app can be used in:

- Local development
- Production hosting on Node/Express-compatible platforms
- Vercel serverless functions via the `api` wrapper

## Persistence and Offline Considerations

- Playlists are saved using Zustand persistence in browser storage.
- User preferences are also persisted locally.
- Supabase can be configured for analytics, profiles, and news caching.
- The app registers a service worker from [src/main.tsx](../src/main.tsx) and includes a PWA banner and install prompt.

## Security and Configuration Notes

- The frontend depends on env values such as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The backend may also use `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CRON_SECRET`.
- External data sources like JioSaavn and RSS feeds can change over time, so the backend includes resilient parsing and fallback handling.

## Notable Files

- [src/services/musicApi.ts](../src/services/musicApi.ts) — frontend client layer
- [backend/server.js](../backend/server.js) — API route entrypoint
- [backend/jiosaavn.js](../backend/jiosaavn.js) — JioSaavn integration logic
- [backend/helper.js](../backend/helper.js) — media URL handling and normalization
- [supabase_schema.sql](../supabase_schema.sql) — optional database schema
