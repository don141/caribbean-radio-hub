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

## Firebase backend (Firestore + Auth)

The server-side data (stations catalog, per-user favorites / recently-played /
preferences, featured shelf) lives in **Cloud Firestore**, secured by
`firestore.rules`. Security posture is **deny-by-default + authenticated-only**:
no rule permits an unauthenticated read of any collection, the catalog is
read-only to signed-in clients, and every catalog write requires an `admin`
custom claim. Audio is **never** relayed through Firebase — Firestore stores only
metadata and stream URLs; audio flows Station → Internet → Listener.

Committed config (no secrets): `firebase.json`, `.firebaserc`,
`firestore.rules`, `firestore.indexes.json`.

### Run the emulator suite

Requires the Firebase CLI and a Java runtime (the Firestore/Auth emulators are
JVM processes).

```bash
npm install -g firebase-tools     # or: npx firebase-tools ...
firebase emulators:start          # Firestore :8080, Auth :9099, UI :4000
```

The emulators use the local `firestore.rules` — no prod project or credentials
needed. Point a local app at them with the standard Firebase emulator env vars
(`FIRESTORE_EMULATOR_HOST=localhost:8080`, `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`).

### Run the security-rules tests

The rules are covered by an emulator test suite (21 cases) that proves the
acceptance criteria: unauthenticated reads are denied, signed-in users can read
`/stations` and `/featured`, non-admins cannot write the catalog, admins can,
and users can only touch their own `/users/{uid}` subtree.

```bash
cd firestore-tests
npm install
npm test            # firebase emulators:exec --only firestore "jest --runInBand"
```

### Prod project & Auth providers (one-time, human/console step)

Emulator work is self-contained; the live project must be provisioned once in the
Firebase console (no secret is committed here):

1. Create the Firebase project and set its id as `default` in `.firebaserc`
   (placeholder is `breadfruit-radio`).
2. **Authentication → Sign-in method:** enable **Email/Password**; leave
   **Anonymous** *disabled* (MVP is authenticated-only).
3. Grant an admin: set the custom claim `{ admin: true }` on the admin user via
   the Admin SDK (`admin.auth().setCustomUserClaims(uid, { admin: true })`).
   The claim is server-set only — never trust a client-supplied admin flag.
4. Deploy rules: `firebase deploy --only firestore:rules`.
5. Client Firebase web config (public, not a secret) is injected via
   `NEXT_PUBLIC_FIREBASE_*` env vars — never commit `google-services.json` /
   `GoogleService-Info.plist` with private keys (they are gitignored).

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
