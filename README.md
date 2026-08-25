# SurSuno

SurSuno is a music discovery and streaming-style web app that fetches music metadata and playback URLs from JioSaavn, then presents them in a polished React experience with playlists, recommendations, news, and PWA support.

## Project Summary

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Data source: JioSaavn public API / scraping endpoints
- Content extension: RSS news feed + optional Supabase integration
- Extras: PWA install flow, local playlist persistence, recommendation engine

## Documentation

The complete project documentation has been organized into the following markdown files:

- [docs/README.md](docs/README.md) — documentation index
- [docs/architecture.md](docs/architecture.md) — system architecture and design flow
- [docs/api.md](docs/api.md) — frontend and backend API reference
- [docs/development.md](docs/development.md) — setup, scripts, and developer workflow
- [docs/deployment.md](docs/deployment.md) — deployment and environment configuration

## Main Application Areas

- [src/App.tsx](src/App.tsx) — app router and shell layout
- [src/pages](src/pages) — screens for home, search, discovery, trending, news, profiles, and playlists
- [src/components](src/components) — reusable UI and player components
- [src/services](src/services) — API client logic and recommendation/news integrations
- [src/stores](src/stores) — Zustand state for player, playlists, and user preferences
- [backend/server.js](backend/server.js) — Express API server
- [backend/jiosaavn.js](backend/jiosaavn.js) — JioSaavn integration logic
- [supabase_schema.sql](supabase_schema.sql) — optional database schema for Supabase

## Typical Local Setup

```bash
npm install
npm run dev
```

For the backend:

```bash
cd backend
npm install
npm run dev
```

## Notes

This project depends on external service data and therefore includes fallback handling for upstream API or feed changes. The docs in the [docs](docs) folder contain the full technical reference and operational guidance.
