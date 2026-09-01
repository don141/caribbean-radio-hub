"use client";

// Large play/pause control for the station detail page. Reflects and drives the
// same global player as the browse cards and the bottom bar.

import type { Station } from "@/lib/stations";
import { usePlayer } from "@/lib/player/PlayerProvider";
import styles from "./StationPlayButton.module.css";

export function StationPlayButton({ station }: { station: Station }) {
  const { station: current, status, play, toggle, retry } = usePlayer();

  const isCurrent = current?.id === station.id;
  const isPlaying = isCurrent && status === "playing";
  const isLoading = isCurrent && status === "loading";
  const isError = isCurrent && status === "error";

  const label = isLoading
    ? "Buffering…"
    : isError
      ? "Retry stream"
      : isPlaying
        ? "Pause"
        : isCurrent
          ? "Resume"
          : "Play station";

  const onClick = () => {
    if (isError) retry();
    else if (isCurrent) toggle();
    else play(station);
  };

  return (
    <button
      type="button"
      className={styles.btn}
      onClick={onClick}
      data-state={isError ? "error" : isPlaying ? "playing" : "idle"}
    >
      <span className={styles.glyph} aria-hidden>
        {isLoading ? "…" : isPlaying ? "❚❚" : isError ? "↻" : "▶"}
      </span>
      {label}
    </button>
  );
}
