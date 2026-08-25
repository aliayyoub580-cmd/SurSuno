# Deployment Guide

## Local Deployment

Use the frontend and backend separately during development.

### Start frontend

```bash
npm run dev
```

### Start backend

```bash
cd backend
npm run dev
```

This gives you two services:

- frontend UI for browser use
- backend API for music and news data

## Vercel Deployment

The project already includes a Vercel adapter:

- [vercel.json](../vercel.json)
- [api/index.js](../api/index.js)

### Notes

- `/api/*` requests are rewritten to the Express serverless handler.
- Frontend single-page routes are rewritten back to `index.html`.
- The app is designed so the same backend can serve both local and deployed instances.

### Recommended steps

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Set environment variables in the Vercel dashboard.
4. Deploy.

## Environment Variables for Production

### Frontend variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend variables

```env
PORT=5100
CRON_SECRET=your-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Production Deployment Considerations

- Add `CRON_SECRET` for `/news/update` endpoint protection.
- Use Supabase only if you need persistent user data and news caching.
- Keep the backend route layer and JioSaavn integration resilient to upstream changes.
- Ensure CORS is configured appropriately if the frontend is served from a different domain.

## Platform-Specific Notes

### Render / Railway / Node hosts

The backend in [backend/server.js](../backend/server.js) can be mounted as a Node service with the `PORT` environment variable.

### Vercel

Use the included [api/index.js](../api/index.js) wrapper and [vercel.json](../vercel.json) rewrite configuration.

## Monitoring and Operations

- Watch logs for errors from JioSaavn or RSS feed access.
- Check `/news/update` responses if news syncs fail.
- Monitor Supabase connectivity if user analytics or news sync are enabled.
- Review browser console logs for PWA service worker warnings.

## Security Considerations

- Do not expose Supabase service-role keys on the frontend.
- Keep cron-trigger secrets in environment variables.
- Use HTTPS in production.
- Avoid storing secrets inside version-controlled files.
