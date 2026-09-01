"use client";

// Persistent bottom bar — the always-visible face of the global player. Renders
// nothing until a station is selected, then stays pinned across navigation
// (it's mounted in the root layout, outside the routed children).

import Link from "next/link";
import { usePlayer } from "@/lib/player/PlayerProvider";
import styles from "./PlayerBar.module.css";

/** Label for the transport button, driven by playback status. */
function transportLabel(status: string): string {
  switch (status) {
    case "playing":
      return "Pause";
    case "loading":
      return "Loading";
    case "error":
      return "Retry";
    default:
      return "Play";
  }
}

export function PlayerBar() {
  const { station, status, volume, muted, error, toggle, setVolume, toggleMute } =
    usePlayer();

  // Nothing to show until the first station is chosen.
  if (!station) return null;

  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const isError = status === "error";

  return (
    <div
      className={styles.bar}
      role="region"
      aria-label="Audio player"
      data-status={status}
    >
      <div className={styles.station}>
        <div className={styles.artwork} aria-hidden>
          {station.logoUrl ? (
            // Plain <img>: station logos come from arbitrary remote hosts and a
            // player thumbnail doesn't warrant Next's image pipeline.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={station.logoUrl} alt="" className={styles.artworkImg} />
          ) : (
            <span className={styles.artworkFallback}>
              {station.name.charAt(0)}
            </span>
          )}
        </div>
        <div className={styles.meta}>
          <Link href={`/station/${station.id}`} className={styles.name}>
            {station.name}
          </Link>
          <span className={styles.sub}>
            {isError ? (
              <span className={styles.errorText}>{error}</span>
            ) : (
              <>
                <span className={styles.statusDot} data-status={status} />
                {isLoading
                  ? "Buffering…"
                  : isPlaying
                    ? "On air"
                    : "Paused"}
                {" · "}
                {station.country}
              </>
            )}
          </span>
        </div>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.transport}
          onClick={toggle}
          aria-label={transportLabel(status)}
          data-status={status}
        >
          {isLoading ? (
            <span className={styles.spinner} aria-hidden />
          ) : isPlaying ? (
            <PauseIcon />
          ) : isError ? (
            <RetryIcon />
          ) : (
            <PlayIcon />
          )}
        </button>

        <div className={styles.volume}>
          <button
            type="button"
            className={styles.muteBtn}
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? <MutedIcon /> : <VolumeIcon />}
          </button>
          <input
            type="range"
            className={styles.slider}
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}

/* --- Inline icons (no icon dependency for a handful of glyphs) --- */

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="currentColor">
      <path d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor">
      <path d="M3 10v4h4l5 5V5L7 10zM16 12a4 4 0 0 0-2-3.46v6.92A4 4 0 0 0 16 12z" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor">
      <path d="M3 10v4h4l5 5V5L7 10zm13.5 2 2.5-2.5-1-1L15.5 11 13 8.5l-1 1 2.5 2.5L12 14.5l1 1 2.5-2.5 2.5 2.5 1-1z" />
    </svg>
  );
}
