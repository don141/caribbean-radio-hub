# Deploy — Island Waves (Caribbean Radio Hub)

How to deploy this app to a live public URL, repeatably.

## Live URL

> **Not yet deployed.** Deployment requires a hosting account — a governance
> decision reserved for the CEO (see BRE-6 escalation clause). Once the account
> is approved and a token is provided, run the steps below and record the URL
> here.
>
> **Live URL:** _pending CEO approval of hosting account_

## Platform choice: Vercel (recommended)

**Chosen: Vercel, Hobby (free) tier.**

Why Vercel for this scaffold:

- The app is **Next.js 16 (App Router)**. Vercel is the maintainer of Next.js;
  it builds and serves Next.js with **zero configuration** — SSG station pages,
  server-rendered API routes (`/api/stations`, `/api/health`), and static
  assets all "just work" with no adapter.
- **No env vars, no database, no secrets.** The station catalog is a static,
  in-repo seed (`src/lib/stations/catalog.ts`), so there is nothing to
  provision. See "Environment variables" below.
- **$0 on the Hobby tier**, no credit card required, 100 GB/mo bandwidth —
  ample for an MVP demo.

Alternatives considered (all also require an account):

| Platform         | Cost (MVP)      | Next.js fit                                        | Notes                                              |
| ---------------- | --------------- | -------------------------------------------------- | -------------------------------------------------- |
| **Vercel**       | $0 (Hobby)      | Native, zero-config                                | **Recommended.** No card required.                 |
| Netlify          | $0 (free)       | Good — via Netlify Next Runtime (auto)             | No card required. Slightly more moving parts.      |
| Cloudflare Pages | $0 (free)       | Needs `@cloudflare/next-on-pages`; edge runtime    | Extra adapter + API routes must be edge-compatible.|
| Fly.io           | $0 allowance    | Needs a hand-written Dockerfile                    | Requires a credit card on file even for free tier. |

`vercel.json` in the repo pins `framework: nextjs` so the build is explicit and
repeatable regardless of auto-detection.

## Prerequisites (one-time, CEO/operator)

1. A Vercel account (free Hobby tier — sign up at vercel.com).
2. A Vercel access token: Vercel dashboard → Settings → Tokens → Create.
   Provide it to the deploying agent as `VERCEL_TOKEN` (do **not** commit it).

No Git host is required — the Vercel CLI uploads the local project directly.

## Deploy steps (repeatable)

From the repo root:

```bash
# 1. Install the Vercel CLI (once)
npm i -g vercel

# 2. Authenticate (token from prerequisites above)
export VERCEL_TOKEN=<token>

# 3. First deploy — links the project (accept the "nextjs" framework prompt)
vercel --token "$VERCEL_TOKEN" --yes

# 4. Promote to production (this prints the public URL)
vercel --prod --token "$VERCEL_TOKEN" --yes
```

The final command prints the production URL (e.g.
`https://<project>.vercel.app`). Record it in the "Live URL" section above and
in the BRE-6 task update.

### Git-connected alternative

If the repo is pushed to a Git host (GitHub/GitLab/Bitbucket), instead connect
it in the Vercel dashboard ("Add New → Project → Import"). Every push to the
default branch then deploys automatically. No `vercel.json` change needed.

## Environment variables

**None.** The app has no runtime configuration, secrets, or external services —
verified with `grep -rn "process.env" src` (no matches). The station catalog is
a static in-repo seed. If a future milestone adds a data source or keys, add
them in Vercel → Project → Settings → Environment Variables and document them
here.

## Verify the deploy

After deploying, confirm the acceptance criteria against the live URL:

```bash
BASE=https://<your-deployment>.vercel.app

# API + catalog
curl -s "$BASE/api/health"                 # -> {"status":"ok",...}
curl -s "$BASE/api/stations" | head -c 200 # -> {"count":41,...}
```

Then in a browser at `$BASE`:

- **Browse works** — home page lists stations; country/genre filters and search
  respond.
- **A station plays end-to-end** — click a station, press play, hear audio; the
  persistent player bar keeps playing while you browse.

### Local pre-deploy check (no account needed)

The production build and server were verified locally before deploy:

```bash
npm run build   # optimized production build (47 routes)
npm run start   # serves on http://localhost:3000
```

## Rollback

Vercel keeps every deployment. To roll back: Vercel dashboard → Deployments →
pick a previous production deployment → "Promote to Production" (or
`vercel rollback <url> --token "$VERCEL_TOKEN"`).
