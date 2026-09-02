#!/usr/bin/env bash
# Build a fully static export of the app into ./out for zero-server hosting.
#
# The user-facing app (browse, filter, search, station pages, playback) has no
# runtime server dependency, so it exports cleanly to static HTML/JS. The only
# server-only pieces are the `/api/*` route handlers, which are dynamic and
# therefore incompatible with `output: export`. We move them aside for the
# duration of the build and always restore them (even on failure).
#
# Usage:  ./scripts/build-static.sh   ->   produces ./out
set -euo pipefail
cd "$(dirname "$0")/.."

API_DIR="src/app/api"
STASH_DIR=".api-stash"

restore() {
  if [ -d "$STASH_DIR/api" ]; then
    rm -rf "$API_DIR"
    mv "$STASH_DIR/api" "$API_DIR"
    rmdir "$STASH_DIR" 2>/dev/null || true
  fi
}
trap restore EXIT

# Set the server-only API routes aside so `output: export` doesn't choke on them.
if [ -d "$API_DIR" ]; then
  mkdir -p "$STASH_DIR"
  mv "$API_DIR" "$STASH_DIR/api"
fi

rm -rf out
STATIC_EXPORT=1 npx next build

echo "Static export ready in ./out"
