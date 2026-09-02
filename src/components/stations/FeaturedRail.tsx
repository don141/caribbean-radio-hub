"use client";

// Featured rail for the home screen. Horizontal, curated strip of promoted
// stations that reads from the featured-slot source of truth (see
// lib/stations/featured.ts), NOT a per-station `isFeatured` flag (AC-CAT-5).
// Each card shares the play/now-playing behaviour of the main grid so the rail,
// the grid, and the persistent bar always agree on what is on air.

import Link from "next/link";
import type { Station } from "@/lib/stations";
import { usePlayer } from "@/lib/player/PlayerProvider";
import styles from "./FeaturedRail.module.css";

export function FeaturedRail({ stations }: { stations: Station[] }) {
  const { station: current, status, play, toggle } = usePlayer();

  // Empty state: nothing curated (or every slot resolved to a withheld
  // station). Render nothing so the home page falls straight through to the
  // full list rather than showing an empty "Featured" shell.
  if (stations.length === 0) return null;

  return (
    <section className={styles.rail} aria-label="Featured stations">
      <h2 className={styles.heading}>Featured</h2>
      <ul className={styles.track}>
        {stations.map((s) => {
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
                    // hosts and don't warrant Next's image pipeline.
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
                <Link href={`/station/${s.id}`} className={styles.name}>
                  {s.name}
                </Link>
                <span className={styles.meta}>{s.country}</span>
                <span className={styles.genres}>
                  {s.genres.slice(0, 2).join(" · ")}
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
    </section>
  );
}
