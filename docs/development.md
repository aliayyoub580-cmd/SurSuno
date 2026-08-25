# Development Guide

## Prerequisites

Before you start, install the following:

- Node.js 18+ or newer
- npm or pnpm
- Git
- A browser for local debugging
- Optional: a Supabase project for analytics and news storage

## Repository Layout

```text
Sur Suno/
├── api/                  # Vercel serverless wrapper
├── backend/              # Express integration layer
├── docs/                 # Project documentation
├── public/               # Static PWA files and assets
├── scripts/              # setup scripts
├── src/                  # Frontend React app
├── app.json              # Mobile app metadata
├── backend/package.json  # Backend dependencies
├── package.json          # Frontend package configuration
├── README.md             # Project overview
├── supabase_schema.sql   # Optional schema for Supabase
├── vercel.json           # Vercel route config
└── vite.config.ts       # Vite configuration
```

## Install Dependencies

### Frontend

```bash
npm install
```

### Backend

```bash
cd backend
npm install
```

## Environment Variables

Create a `.env` file in the project root for frontend variables when using Supabase.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For the backend, create a `.env` file inside [backend](../backend) or set environment variables before running the server:

```env
PORT=5100
CRON_SECRET=your-strong-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Run the App

### Frontend dev server

```bash
npm run dev
```

The app will usually start on Vite’s default local port, typically http://localhost:5173.

### Backend server

```bash
cd backend
npm run dev
```

The backend runs by default on port 5100.

### Production-style frontend build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Scripts

### Root package scripts

- `npm run dev` — start the frontend Vite dev server
- `npm run build` — TypeScript + Vite production build
- `npm run lint` — run lint checks
- `npm run preview` — preview the built frontend

### Backend package scripts

- `npm run dev` — watch mode for Express
- `npm run start` — start the Express app

## Core Development Notes

### Frontend conventions

- App routing is defined in [src/App.tsx](../src/App.tsx).
- Feature pages live in [src/pages](../src/pages).
- Reusable UI resides in [src/components](../src/components).
- Data fetching should go through the service layer, not directly from pages.
- Prefer Zustand stores for stateful shared player and preference behavior.

### Backend conventions

- The Express server is the API gateway for the app.
- Heavy business logic should remain in [backend/jiosaavn.js](../backend/jiosaavn.js) and helpers rather than the route file.
- Keep route handlers focused on validation and response formatting.
- Add a fallback when upstream external services change shape or become unavailable.

## Recommended Workflow

1. Start the frontend dev server.
2. Start the backend server.
3. Use the app UI to search for songs and test API calls.
4. Validate the relevant route and data flow.
5. Optionally configure Supabase for news and user analytics.

## Supabase Setup

Use [supabase_schema.sql](../supabase_schema.sql) in the Supabase SQL editor to create the tables and Row Level Security rules used by the application.

To seed news data, run:

```bash
node scripts/setupDatabase.js
```

If not configured, the app still works using live RSS data for the news section.

## Troubleshooting

### JioSaavn API errors

External data providers can change their HTML or JSON structure. When that happens:

- inspect the actual `res.data` from the upstream service
- adjust parsing logic in [backend/jiosaavn.js](../backend/jiosaavn.js) and [backend/helper.js](../backend/helper.js)
- ensure the app still handles empty or malformed responses gracefully

### Supabase mismatch

If Supabase is not configured, the app will continue with RSS-based news fallback. This is expected behavior.

### Frontend build issues

Run the project’s TypeScript and build flow:

```bash
npm run build
```

Then fix any type errors reported by the compiler.

## Contribution Checklist

- Keep documentation in sync with behavior
- Prefer small, focused changes
- Validate the route or module you edited
- Retain graceful fallback behavior for upstream third-party services
- Document new environment variables and their purpose
