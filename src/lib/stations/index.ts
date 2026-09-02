import { STATIONS } from "./catalog";
import type { Genre, Station } from "./types";

export type { Station, Genre, StreamFormat } from "./types";
export { STATIONS } from "./catalog";
// Featured-rail helpers live in ./featured and import from this barrel, so they
// are imported directly (not re-exported here) to keep the dependency
// one-directional and avoid a circular module reference.

/**
 * Catalog the app actually serves: everything except stations explicitly
 * withheld via `available: false` (e.g. HTTP-only streams that browsers block
 * as mixed content on the HTTPS site — see BRE-35). All public helpers below
 * derive from this list so a withheld station disappears from browse, search,
 * facets, and detail routes rather than surfacing as a silent broken play.
 */
const ACTIVE_STATIONS: Station[] = STATIONS.filter((s) => s.available !== false);

/** Filters accepted by {@link queryStations}. All are optional and combine with AND. */
export interface StationQuery {
  /** ISO alpha-2 country code, case-insensitive (e.g. "jm"). */
  countryCode?: string;
  /** Single genre from the controlled vocabulary. */
  genre?: Genre;
  /** Free-text search over name, country, city, and genres. */
  search?: string;
}

/** Full catalog, sorted by country then station name for stable browse order. */
export function getAllStations(): Station[] {
  return [...ACTIVE_STATIONS].sort(
    (a, b) =>
      a.country.localeCompare(b.country) || a.name.localeCompare(b.name),
  );
}

/** Look up a single station by its stable id, or undefined if absent. */
export function getStationById(id: string): Station | undefined {
  return ACTIVE_STATIONS.find((s) => s.id === id);
}

/** Apply optional country/genre/search filters. Returns catalog order. */
export function queryStations(query: StationQuery = {}): Station[] {
  const cc = query.countryCode?.trim().toUpperCase();
  const genre = query.genre;
  const term = query.search?.trim().toLowerCase();

  return getAllStations().filter((s) => {
    if (cc && s.countryCode !== cc) return false;
    if (genre && !s.genres.includes(genre)) return false;
    if (term) {
      const haystack = [s.name, s.country, s.city ?? "", ...s.genres]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

/** Distinct countries present in the catalog, sorted by name. */
export function getCountries(): { code: string; name: string }[] {
  const map = new Map<string, string>();
  for (const s of ACTIVE_STATIONS) map.set(s.countryCode, s.country);
  return [...map.entries()]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Distinct genres present in the catalog, sorted alphabetically. */
export function getGenres(): Genre[] {
  const set = new Set<Genre>();
  for (const s of ACTIVE_STATIONS) for (const g of s.genres) set.add(g);
  return [...set].sort();
}
