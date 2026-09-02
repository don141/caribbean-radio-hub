// Featured rail source of truth.
//
// Per AC-CAT-5, the featured rail is driven by an ordered set of *slots* — NOT
// by a per-station `isFeatured` flag. In the Firebase design this lives at
// `/featured/{slot}`, each slot document pointing at one station id. This app
// is a static-export Next.js site with a local catalog (no Firestore), so the
// web-native equivalent of that slot collection is the ordered list below.
// Editing curation = editing slots here (or, later, a `/featured` doc), never
// toggling a boolean on the Station record. Keeping the boolean off the model
// is deliberate: it prevents the "two sources of truth" drift the AC warns
// against.
//
// Each slot references a station by id. Resolution (below) drops any slot whose
// station is missing or withheld (`available: false`), so a featured station
// that goes dark never surfaces a broken rail entry — it just leaves a gap that
// the next re-curation fills.

import { getStationById } from "./index";
import type { Station } from "./types";

/** One curated position on the home rail. `slot` is the stable slot key. */
export interface FeaturedSlot {
  /** Stable slot key — the analog of the `/featured/{slot}` document id. */
  slot: string;
  /** Id of the station promoted into this slot. */
  stationId: string;
}

/**
 * Ordered featured slots. Hand-curated for the MVP. Order here is display order
 * on the rail (left → right). Ids must exist in the catalog; unknown/withheld
 * ids are silently skipped at resolve time rather than erroring the home page.
 *
 * TODO(§24 F2 rights-gate — PENDING FOUNDER DECISION): once the CEO rules on
 * whether the live catalog requires `rightToStream == granted` (strict) or also
 * admits `rightToStream == unknown` (broader), the same gate must apply to
 * featured slots so we never promote a station we lack rights to stream. Until
 * then this list is curated by hand from already-active stations only. Do not
 * add rights-based filtering here before the decision lands.
 */
export const FEATURED_SLOTS: FeaturedSlot[] = [
  { slot: "hero", stationId: "boom-94fm-tt" },
  { slot: "slot-2", stationId: "slam-101-1-haggatt-hall-bb" },
];

/**
 * Resolve the featured slots against the live catalog, in slot order. Skips any
 * slot whose station is absent or withheld so the rail only ever contains
 * playable, active stations (AC-CAT-2). Returns an empty array when nothing
 * resolves — the rail component treats that as "no featured stations" and
 * renders nothing rather than an empty shell.
 */
export function getFeaturedStations(): Station[] {
  const seen = new Set<string>();
  const out: Station[] = [];
  for (const { stationId } of FEATURED_SLOTS) {
    if (seen.has(stationId)) continue;
    const station = getStationById(stationId);
    if (!station) continue; // missing or withheld → skip
    seen.add(stationId);
    out.push(station);
  }
  return out;
}
