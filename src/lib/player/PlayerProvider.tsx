"use client";

// Global audio player. Lives once in the root layout so the single <audio>
// element survives client-side navigation — the core promise of the product is
// "press play, keep listening while you browse", and that only holds if the
// element is never unmounted. Do NOT render this per-page.
//
// Live internet radio is unreliable by nature (streams stall, die, or reject
// mixed-content). Reliability is our #1 technical risk, so the provider treats
// transient failures as recoverable: buffering shows a loading state, and a
// dropped connection auto-reconnects with backoff before surfacing a hard,
// user-actionable error.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Station } from "@/lib/stations";

/**
 * Playback lifecycle as the UI cares about it (a coarser view than the raw
 * media element readyState):
 * - `idle`    — nothing selected yet.
 * - `loading` — connecting or buffering (initial load, station switch, or
 *   mid-stream stall / reconnect attempt).
 * - `playing` — audio is flowing.
 * - `paused`  — user paused a selected station.
 * - `error`   — stream failed and auto-reconnect was exhausted; needs a retry.
 */
export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

export interface PlayerState {
  /** Currently selected station, or null before the first play. */
  station: Station | null;
  status: PlayerStatus;
  /** 0..1. Applied to the media element; persists across station switches. */
  volume: number;
  muted: boolean;
  /** Human-readable error, present only when `status === "error"`. */
  error: string | null;
  /**
   * Select a station and start playback. If it is the already-selected station
   * and merely paused, this resumes without reconnecting.
   */
  play: (station: Station) => void;
  /** Toggle play/pause for the current station. No-op if nothing selected. */
  toggle: () => void;
  /** Re-attempt the current station after an error. */
  retry: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

const PlayerContext = createContext<PlayerState | null>(null);

/** Read the global player. Throws if used outside {@link PlayerProvider}. */
export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return ctx;
}

/** Max automatic reconnect attempts before we surface a hard error. */
const MAX_RECONNECTS = 3;
/** Backoff base; attempt n waits min(BASE * 2^n, CAP) ms. */
const RECONNECT_BASE_MS = 800;
const RECONNECT_CAP_MS = 6000;

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [station, setStation] = useState<Station | null>(null);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reconnect bookkeeping kept in refs so the media event handlers (attached
  // once) always see current values without re-subscribing.
  const reconnectsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirror of `station` for the media event handlers, which are attached once
  // and read the latest selection without re-subscribing. Synced in an effect
  // (never during render) so the handlers see the current station.
  const stationRef = useRef<Station | null>(null);
  useEffect(() => {
    stationRef.current = station;
  }, [station]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // Point the element at a station's stream and start playing. `load()` forces
  // a fresh connection (important for live streams — we never want to resume a
  // stale buffer) and play() is guarded because the promise rejects on both
  // autoplay policy and unreachable streams.
  const connect = useCallback((target: Station) => {
    const audio = audioRef.current;
    if (!audio) return;
    setStatus("loading");
    setError(null);
    audio.src = target.streamUrl;
    audio.load();
    void audio.play().catch(() => {
      // Rejection here is handled by the element's `error` event which drives
      // the reconnect/backoff path; swallow so it isn't an unhandled rejection.
    });
  }, []);

  const play = useCallback(
    (target: Station) => {
      clearReconnectTimer();
      reconnectsRef.current = 0;

      const audio = audioRef.current;
      // Resume rather than reconnect if it's the same, merely-paused station.
      if (audio && stationRef.current?.id === target.id && audio.paused) {
        void audio.play().catch(() => setStatus("error"));
        return;
      }

      setStation(target);
      connect(target);
    },
    [clearReconnectTimer, connect],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    const current = stationRef.current;
    if (!audio || !current) return;

    if (audio.paused) {
      // If the last attempt errored, a resume won't help — reconnect instead.
      if (status === "error") {
        reconnectsRef.current = 0;
        connect(current);
      } else {
        void audio.play().catch(() => setStatus("error"));
      }
    } else {
      audio.pause();
    }
  }, [status, connect]);

  const retry = useCallback(() => {
    const current = stationRef.current;
    if (!current) return;
    clearReconnectTimer();
    reconnectsRef.current = 0;
    connect(current);
  }, [clearReconnectTimer, connect]);

  const setVolume = useCallback((next: number) => {
    const clamped = Math.min(1, Math.max(0, next));
    setVolumeState(clamped);
    // Adjusting volume off zero is an implicit unmute.
    if (clamped > 0) setMuted(false);
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  // Keep the media element's volume/muted in sync with UI state.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  // Attach media event handlers once. These translate raw element events into
  // our coarse status and own the reconnect/backoff loop.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlaying = () => {
      reconnectsRef.current = 0;
      clearReconnectTimer();
      setError(null);
      setStatus("playing");
    };
    const onWaiting = () => setStatus("loading");
    const onPause = () => {
      // Ignore pauses that fire as part of tearing down for a reconnect/switch.
      if (reconnectTimerRef.current === null && !audio.ended) {
        setStatus((s) => (s === "error" ? s : "paused"));
      }
    };

    const scheduleReconnect = () => {
      const current = stationRef.current;
      if (!current) return;

      if (reconnectsRef.current >= MAX_RECONNECTS) {
        clearReconnectTimer();
        setStatus("error");
        setError(
          "This stream isn't responding. It may be offline — try again or pick another station.",
        );
        return;
      }

      const attempt = reconnectsRef.current;
      reconnectsRef.current += 1;
      setStatus("loading");
      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** attempt,
        RECONNECT_CAP_MS,
      );
      clearReconnectTimer();
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        const target = stationRef.current;
        if (!target) return;
        audio.src = target.streamUrl;
        audio.load();
        void audio.play().catch(() => {
          // Next failure re-enters this loop via the `error` event.
        });
      }, delay);
    };

    const onError = () => {
      // Only react to failures for a station we're actually trying to play.
      if (!stationRef.current) return;
      scheduleReconnect();
    };
    const onStalled = () => {
      // A stall on an already-playing stream: show buffering. The browser often
      // recovers on its own; a real death will fire `error` and reconnect.
      if (status !== "error") setStatus("loading");
    };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.addEventListener("stalled", onStalled);

    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("stalled", onStalled);
    };
    // `status` is intentionally excluded: handlers read it via closure only for
    // a cheap guard, and re-subscribing on every status change would thrash the
    // listeners. Reconnect state lives in refs precisely to avoid that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearReconnectTimer]);

  // Clean up any pending reconnect timer on unmount.
  useEffect(() => clearReconnectTimer, [clearReconnectTimer]);

  const value: PlayerState = {
    station,
    status,
    volume,
    muted,
    error,
    play,
    toggle,
    retry,
    setVolume,
    toggleMute,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/*
        The single, app-wide audio element. `preload="none"` avoids fetching
        anything until the user presses play. Hidden — all controls are custom.
      */}
      <audio ref={audioRef} preload="none" hidden />
    </PlayerContext.Provider>
  );
}
