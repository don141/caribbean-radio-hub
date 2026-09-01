"use client";

// Browse grid + genre filter. Selecting a card hands the station to the global
// player; the currently-playing card is highlighted so the browse view and the
// persistent bar stay in agreement.

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Genre, Station } from "@/lib/stations";
import { usePlayer } from "@/lib/player/PlayerProvider";
import styles from "./StationList.module.css";

export function StationList({
  stations,
  genres,
}: {
  stations: Station[];
  genres: Genre[];
}) {
  const { station: current, status, play, toggle } = usePlayer();
  const [genre, setGenre] = useState<Genre | "all">("all");

  const visible = useMemo(
    () =>
      genre === "all"
        ? stations
        : stations.filter((s) => s.genres.includes(genre)),
    [stations, genre],
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.filters} role="group" aria-label="Filter by genre">
        <button
          type="button"
          className={styles.chip}
          data-active={genre === "all"}
          onClick={() => setGenre("all")}
        >
          All
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
                aria-label={
                  isPlaying ? `Pause ${s.name}` : `Play ${s.name}`
                }
              >
                {isLoading ? "…" : isPlaying ? "❚❚" : "▶"}
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
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <p className={styles.empty}>No stations for this genre yet.</p>
      )}
    </div>
  );
}
