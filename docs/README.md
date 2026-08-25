# SurSuno Documentation

This section is the documentation index for the SurSuno project.

## Overview

SurSuno is a music discovery and playback application built with React, Vite, and TypeScript on the frontend, and a Node.js + Express backend that wraps JioSaavn APIs for songs, albums, playlists, lyrics, and news. The app also includes a PWA installation flow, personalized music recommendations, local playlist management, and optional Supabase integration for analytics and news.

## Documentation Pages

- [Architecture](./architecture.md) — component, frontend, backend, data flow, and deployment model
- [API Reference](./api.md) — backend endpoints, request/response expectations, and examples
- [Development Guide](./development.md) — setup, environment variables, scripts, and working on the codebase
- [Deployment Guide](./deployment.md) — local, Vercel, and production deployment notes

## Quick Navigation

- Frontend app entry: [src/App.tsx](../src/App.tsx)
- Backend server: [backend/server.js](../backend/server.js)
- Main API wrapper: [backend/jiosaavn.js](../backend/jiosaavn.js)
- Frontend API layer: [src/services/musicApi.ts](../src/services/musicApi.ts)
- Supabase schema: [supabase_schema.sql](../supabase_schema.sql)

## Key Features

- Search songs, albums, playlists, and lyrics
- Browse home, discover, trending, language, genre, and artist pages
- Audio player with queue, repeat, shuffle, and recommendation support
- User playlists stored locally via Zustand persistence
- PWA install support and mobile-friendly layout
- News feed powered by RSS and optional Supabase sync
- Personalized preference logic based on user history and favorite artists/languages

## Tech Stack

- Frontend: React 19, Vite, TypeScript, React Router, Zustand
- Backend: Node.js, Express, Axios, dotenv
- Media/content: JioSaavn API data, RSS news feeds
- Optional services: Supabase, PWA service worker

## Repository Layout

- [src](../src) — React app source
- [backend](../backend) — Express server and JioSaavn integration
- [api](../api) — Vercel serverless adapter
- [public](../public) — service worker and static assets
- [scripts](../scripts) — database setup and content sync scripts

## Getting Started

For a full setup and run guide, see [Development Guide](./development.md).
