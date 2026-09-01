# Island Waves — Caribbean Radio Hub

One place to discover and play Caribbean internet radio — reggae, soca,
dancehall, zouk, kompa, chutney, and island talk/news from across the Caribbean.
Find a station, press play, get a reliable stream, and keep listening while you
browse.

This repo is the MVP skeleton. It's a clean, runnable, buildable foundation —
product features (station catalog, browse/discovery, and audio playback) are
built on top of this in later milestones.

## Tech stack

- **[Next.js](https://nextjs.org/) 16 (App Router)** — React framework with a
  built-in place for both the frontend and backend/API routes, and a
  straightforward deploy story. Chosen so the whole product (UI + API) lives in
  one codebase and one deployment.
- **TypeScript** — type safety from day one.
- **ESLint** (`eslint-config-next`) + **Prettier** — linting and formatting.

Frontend lives in `src/app/`. Backend/API routes live under `src/app/api/`
(there's a `GET /api/health` placeholder to prove the API layer works).

## Prerequisites

- Node.js 20+ and npm 10+

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. You should see the **Island Waves** home
page. The API health check is at <http://localhost:3000/api/health>.

## Build

```bash
npm run build     # production build
npm run start     # serve the production build (after build)
```

## Lint & format

```bash
npm run lint          # ESLint
npm run format        # Prettier: write
npm run format:check  # Prettier: check only (CI-friendly)
```

## Project structure

```
src/app/
  layout.tsx        # root layout + metadata
  page.tsx          # placeholder home page
  globals.css       # global styles
  page.module.css   # home page styles
  api/
    health/route.ts # GET /api/health — placeholder backend route
public/             # static assets
```
