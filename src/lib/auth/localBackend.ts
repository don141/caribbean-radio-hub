// Client-only, storage-backed auth for development and the current static
// deploy — a stand-in that satisfies the same {@link AuthBackend} contract as
// the eventual Firebase adapter. It is NOT a security boundary (all checks run
// in the browser); it exists so the sign-in flow, route guard, and sign-out are
// fully runnable and testable before Linus's Firebase backend lands, and so the
// gate can be exercised end-to-end (see AC-AUTH-2/3/5).
//
// Session persistence (AC-AUTH-5: app restart with a valid session → catalog,
// no re-sign-in) is provided by writing the active user to storage and reading
// it back on construction.

import {
  AuthError,
  type AuthBackend,
  type AuthUser,
} from "./types";

const SESSION_KEY = "iw.auth.session";

/** A seeded demo account so the gate is usable without a real backend. */
export const DEMO_CREDENTIALS = {
  email: "demo@islandwaves.fm",
  password: "islandwaves",
} as const;

// Loose but practical email shape check — mirrors the client-side validation a
// Firebase call would reject with `auth/invalid-email` before hitting the wire.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A `Storage`-like slice we actually use. Accepting this (rather than reaching
 * for `window.localStorage` directly) keeps the backend unit-testable with an
 * in-memory fake and safe under SSR/static prerender where `window` is absent.
 */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** In-memory {@link KeyValueStore} — the SSR/no-window fallback and test double. */
export class MemoryStore implements KeyValueStore {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

function uidFor(email: string): string {
  return `local:${email.toLowerCase()}`;
}

export class LocalAuthBackend implements AuthBackend {
  private store: KeyValueStore;
  private listeners = new Set<(user: AuthUser | null) => void>();
  private current: AuthUser | null;

  constructor(store?: KeyValueStore) {
    this.store =
      store ??
      (typeof window !== "undefined" ? window.localStorage : new MemoryStore());
    this.current = this.readSession();
  }

  private readSession(): AuthUser | null {
    const raw = this.store.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AuthUser;
      return parsed?.email ? parsed : null;
    } catch {
      return null;
    }
  }

  private emit(): void {
    for (const cb of this.listeners) cb(this.current);
  }

  subscribe(cb: (user: AuthUser | null) => void): () => void {
    this.listeners.add(cb);
    // Fire immediately with current state, matching onAuthStateChanged.
    cb(this.current);
    return () => this.listeners.delete(cb);
  }

  async signIn(email: string, password: string): Promise<void> {
    const normalized = email.trim();
    if (!EMAIL_RE.test(normalized)) {
      throw new AuthError("invalid-email");
    }
    // The demo backend recognizes exactly the seeded account. Anything else is
    // treated as bad credentials — the same surface a real backend presents.
    if (
      normalized.toLowerCase() !== DEMO_CREDENTIALS.email ||
      password !== DEMO_CREDENTIALS.password
    ) {
      throw new AuthError("invalid-credentials");
    }
    this.current = { uid: uidFor(normalized), email: normalized };
    this.store.setItem(SESSION_KEY, JSON.stringify(this.current));
    this.emit();
  }

  async signOut(): Promise<void> {
    this.current = null;
    this.store.removeItem(SESSION_KEY);
    this.emit();
  }

  async sendPasswordReset(email: string): Promise<void> {
    if (!EMAIL_RE.test(email.trim())) {
      throw new AuthError("invalid-email");
    }
    // No-op success: a real backend emails a link; the demo backend cannot, but
    // it must not reveal whether the address exists, so it always resolves.
  }
}
