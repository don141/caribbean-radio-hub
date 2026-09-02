import type { NextConfig } from "next";

// STATIC_EXPORT=1 produces a fully static site (`out/`) for zero-server hosts
// (e.g. Surge, GitHub Pages, any CDN). The user-facing app — browse, filter,
// search, station pages, and audio playback — has no runtime server dependency
// (the catalog is embedded at build time; there are no fetch() calls), so the
// static export is functionally identical for end users. The server-only
// `/api/*` routes are set aside for this build by scripts/build-static.sh.
//
// Unset (the default), `next dev`/`next build`/`next start` run the full app
// including the API routes — unchanged.
const nextConfig: NextConfig =
  process.env.STATIC_EXPORT === "1"
    ? { output: "export", images: { unoptimized: true } }
    : {};

export default nextConfig;
