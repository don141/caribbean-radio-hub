# Deploy — Island Waves (Caribbean Radio Hub)

How to deploy this app to a live public URL, repeatably.

## Live URL

**https://island-waves-radio.surge.sh** — live now (browse + playback verified).

## What's deployed & why (platform choice)

**Live host: Surge.sh (free static CDN).** The app is deployed as a **fully
static export** of the Next.js site.

Why this works with zero fidelity loss for end users: the entire user-facing
app has **no runtime server dependency**. The catalog is embedded at build time
(a Server Component reads `src/lib/stations/catalog.ts` and hands it to a client
component), there are **no `fetch()` calls anywhere**, all filtering/search is
client-side, station pages are pre-rendered (SSG), and playback is a client
`<audio>` element pointing straight at each station's external stream. So a
static export serves browse, filter, search, station pages, and playback
identically — no server, no account with a credit card, no spend.

The only server-only pieces are the `/api/health` and `/api/stations` route
handlers, which the UI never calls. They're excluded from the static build (see
`scripts/build-static.sh`) and are only relevant if you later host the full
Next.js server (see "Full-server upgrade path" below).

Chosen because it needed **no paid plan and no credit card** — honoring the
BRE-6 escalation clause (a board approval authorized creating the hosting
account; no spend was incurred).

### Known limitation — mixed content (HTTP streams)

The live site is HTTPS. 26 of 41 stations use **HTTPS** streams and play
normally. 15 stations use plain **HTTP** stream URLs; browsers block those as
mixed content on an HTTPS page, so they will not play until their stream URLs
are upgraded to HTTPS (or proxied). Tracked as a follow-up. "At least one
station plays end-to-end" is satisfied by the 26 HTTPS stations (verified live:
Irie FM, Big Reggae Mix, HOTT 95.3FM all return live audio).

## Prerequisites

- Node.js 20+ and npm 10+
- The `surge` CLI: `npm i -g surge`
- Surge auth: log in once with `surge login` (account already exists for this
  project — credentials are held in the deploy agent's private memory, not in
  this repo). For CI/non-interactive deploys, set `SURGE_LOGIN` (email) and
  `SURGE_TOKEN` (from `surge token`).

## Deploy steps (repeatable)

From the repo root:

```bash
# 1. Build the static export into ./out (sets the /api routes aside, restores them after)
./scripts/build-static.sh

# 2. Publish ./out to the production domain
surge ./out island-waves-radio.surge.sh
```

`scripts/build-static.sh` runs `STATIC_EXPORT=1 next build` (which flips
`next.config.ts` to `output: "export"`) and writes the site to `./out`. The
default `next dev` / `next build` / `next start` are unaffected — they still run
the full app including the API routes.

### Non-interactive / CI

```bash
export SURGE_LOGIN=<account-email>
export SURGE_TOKEN=<token from `surge token`>
./scripts/build-static.sh
surge ./out island-waves-radio.surge.sh
```

## Environment variables

**None** for the app itself — no runtime config, secrets, or external services
(verified: `grep -rn "process.env" src` has no matches). `STATIC_EXPORT=1` is a
build-time flag only, set by the build script. Surge auth uses `SURGE_LOGIN` /
`SURGE_TOKEN` for non-interactive deploys.

## Verify the deploy

```bash
BASE=https://island-waves-radio.surge.sh
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/"                         # 200
curl -s "$BASE/" | grep -o "stations across the Caribbean"               # browse catalog present
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/station/irie-fm-jm"       # 200 (a station page)
```

Then in a browser at `$BASE`:

- **Browse works** — stations list; country/genre filters and search respond.
- **A station plays end-to-end** — open an HTTPS-stream station (e.g. Irie FM),
  press play, hear audio; the persistent player bar keeps playing while you
  browse.

## Rollback

Surge keeps revisions: `surge island-waves-radio.surge.sh rollback` (or
`rollfore`). To take the site down entirely:
`surge island-waves-radio.surge.sh teardown`.

## Full-server upgrade path (Vercel) — optional

If you later want the live `/api/*` routes and full Next.js server rendering
(e.g. server-side filtering, or a future DB), deploy the **unmodified** app to
Vercel. `vercel.json` already pins `framework: nextjs`; it's zero-config and
free on the Hobby tier (no credit card). This needs a Vercel account/token
(a browser OAuth login the deploy sandbox can't perform), so it's a one-time
operator step:

```bash
npm i -g vercel
vercel login            # browser OAuth
vercel --prod           # prints the *.vercel.app URL
```
