"use client";

// Browse + discovery surface. Owns the three live filters (free-text search,
// country, genre) and hands a chosen station to the global player. The
// currently-playing card is highlighted with an "On air" equaliser so the
// browse view and the persistent bar always agree on what's playing.

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Genre, Station } from "@/lib/stations";
import { usePlayer } from "@/lib/player/PlayerProvider";
import styles from "./StationList.module.css";

interface Country {
  code: string;
  name: string;
}

export function StationList({
  stations,
  genres,
  countries,
}: {
  stations: Station[];
  genres: Genre[];
  countries: Country[];
}) {
  const { station: current, status, play, toggle } = usePlayer();

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string | "all">("all");
  const [genre, setGenre] = useState<Genre | "all">("all");

  // All three filters combine with AND and recompute on every keystroke so
  // results update live. Search matches name/country/city — forgiving, but
  // still anchored on the station name the user is most likely typing.
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return stations.filter((s) => {
      if (country !== "all" && s.countryCode !== country) return false;
      if (genre !== "all" && !s.genres.includes(genre)) return false;
      if (term) {
        const haystack = `${s.name} ${s.country} ${s.city ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [stations, search, country, genre]);

  const hasFilters = search.trim() !== "" || country !== "all" || genre !== "all";
  const reset = () => {
    setSearch("");
    setCountry("all");
    setGenre("all");
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.search}
          placeholder="Search stations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search stations by name"
        />
        <select
          className={styles.select}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          aria-label="Filter by country"
        >
          <option value="all">All countries</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filters} role="group" aria-label="Filter by genre">
        <button
          type="button"
          className={styles.chip}
          data-active={genre === "all"}
          onClick={() => setGenre("all")}
        >
          All genres
        </button>
        {genres.map((g) => (
          <button
            key={g}
            type="button"
            className={styles.chip}
            data-active={genre === g}
            onClick={() => setGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <div className={styles.resultBar}>
        <span className={styles.count}>
          {visible.length} station{visible.length === 1 ? "" : "s"}
        </span>
        {hasFilters && (
          <button type="button" className={styles.reset} onClick={reset}>
            Clear filters
          </button>
        )}
      </div>

      <ul className={styles.grid}>
        {visible.map((s) => {
          const isCurrent = current?.id === s.id;
          const isPlaying = isCurrent && status === "playing";
          const isLoading = isCurrent && status === "loading";
          return (
            <li
              key={s.id}
              className={styles.card}
              data-current={isCurrent || undefined}
            >
              <button
                type="button"
                className={styles.playBtn}
                onClick={() => (isCurrent ? toggle() : play(s))}
                aria-label={isPlaying ? `Pause ${s.name}` : `Play ${s.name}`}
              >
                <span className={styles.artwork} aria-hidden>
                  {s.logoUrl ? (
                    // Plain <img>: station logos come from arbitrary remote
                    // hosts and a browse thumbnail doesn't warrant Next's image
                    // pipeline (which would need per-host allow-listing).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logoUrl} alt="" className={styles.artworkImg} />
                  ) : (
                    <span className={styles.artworkFallback}>
                      {s.name.charAt(0)}
                    </span>
                  )}
                  <span className={styles.playGlyph}>
                    {isLoading ? "…" : isPlaying ? "❚❚" : "▶"}
                  </span>
                </span>
              </button>

              <div className={styles.info}>
                <Link href={`/station/${s.id}`} className={styles.cardName}>
                  {s.name}
                </Link>
                <span className={styles.cardMeta}>
                  {s.country}
                  {s.city ? ` · ${s.city}` : ""}
                </span>
                <span className={styles.cardGenres}>
                  {s.genres.slice(0, 3).join(" · ")}
                </span>
              </div>

              {isCurrent && (
                <span
                  className={styles.nowPlaying}
                  data-playing={isPlaying || undefined}
                >
                  {isPlaying ? (
                    <span className={styles.eq} aria-hidden>
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : null}
                  {isLoading ? "Buffering" : isPlaying ? "On air" : "Paused"}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <p className={styles.empty}>
          No stations match these filters. Try clearing the search or picking a
          different country or genre.
        </p>
      )}
    </div>
  );
}
