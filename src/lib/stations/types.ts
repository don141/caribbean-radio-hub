// Core data model for the Caribbean radio catalog.
// Kept intentionally flat and serializable so it can travel as JSON over the
// API route and be consumed directly by client components.

/** Streaming container/codec the audio URL delivers. Drives the <audio> element. */
export type StreamFormat = "mp3" | "aac" | "ogg";

/**
 * Genre vocabulary. A controlled list keeps browse/filter UX predictable and
 * avoids the messy free-text tags that upstream station directories carry.
 * Covers the flagship Caribbean genres plus common talk/variety buckets.
 */
export type Genre =
  | "reggae"
  | "dancehall"
  | "soca"
  | "calypso"
  | "zouk"
  | "kompa"
  | "chutney"
  | "bachata"
  | "merengue"
  | "salsa"
  | "gospel"
  | "jazz"
  | "ska"
  | "junkanoo"
  | "bollywood"
  | "hiphop"
  | "pop"
  | "variety"
  | "talk"
  | "news";

/**
 * A single internet radio station.
 *
 * `streamUrl` is the direct audio stream (not a playlist/website) and is the
 * one field the core play loop depends on. Everything else is discovery
 * metadata. Optional fields are absent (not empty strings) when unknown.
 */
export interface Station {
  /** Stable slug, unique across the catalog. Safe for URLs and React keys. */
  id: string;
  name: string;
  /** Human-readable country name, e.g. "Trinidad & Tobago". */
  country: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "TT". */
  countryCode: string;
  /** City / locale of the station, when known. */
  city?: string;
  /** One or more genres from the controlled vocabulary. At least one. */
  genres: Genre[];
  /** Primary broadcast language, e.g. "English", "Spanish", "Haitian Creole". */
  language: string;
  /** Direct audio stream URL — the thing the player connects to. */
  streamUrl: string;
  /** Container/codec of `streamUrl`. */
  streamFormat: StreamFormat;
  /** Advertised bitrate in kbps, when known (0/undefined means unknown). */
  bitrateKbps?: number;
  /** Station homepage. */
  website?: string;
  /** Logo / artwork URL. */
  logoUrl?: string;
  /** Short human description for browse cards. */
  description: string;
}
