// Auth domain model and the backend seam.
//
// STACK NOTE: BRE-40 is authored for a Flutter/Firebase/Riverpod app, but this
// repo is the Next.js web app that is actually shipping. The deliverables are
// translated faithfully: `authStateProvider` (a stream of `User?`) becomes the
// `AuthProvider` React context backed by an `AuthBackend.subscribe` stream, and
// `flutter test` coverage becomes vitest coverage of the same logic.
//
// OWNERSHIP (per the issue): Ada owns the UI + auth-state/guard against this
// `AuthBackend` interface; Linus owns the concrete Firebase Auth backend that
// implements it. The interface is the seam between the two — a Firebase adapter
// is a drop-in `AuthBackend` (onAuthStateChanged → subscribe, signInWith… →
// signIn, etc.). Until it lands, `LocalAuthBackend` keeps the whole flow
// runnable and testable.

/**
 * The app's view of a signed-in user — intentionally minimal and serializable
 * so it can be persisted to storage and (later) hydrated from a Firebase
 * `User` without dragging the SDK's surface into our UI.
 */
export interface AuthUser {
  /** Stable unique id (Firebase `uid`, or a local id for the demo backend). */
  uid: string;
  email: string;
}

/**
 * Coarse, provider-agnostic failure categories. A Firebase adapter maps its
 * `auth/*` error codes onto these; the UI never sees raw provider codes.
 */
export type AuthErrorCode =
  | "invalid-credentials"
  | "network"
  | "rate-limited"
  | "invalid-email"
  | "unknown";

/** An auth failure carrying a category the UI can map to a friendly message. */
export class AuthError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code);
    this.name = "AuthError";
    this.code = code;
  }
}

/**
 * User-facing copy per failure category. Kept here (not in components) so it is
 * unit-testable and consistent everywhere an error surfaces.
 */
export function messageForAuthError(err: unknown): string {
  const code: AuthErrorCode =
    err instanceof AuthError ? err.code : "unknown";
  switch (code) {
    case "invalid-credentials":
      return "That email or password isn't right. Please try again.";
    case "network":
      return "Can't reach the network. Check your connection and try again.";
    case "rate-limited":
      return "Too many attempts. Please wait a moment and try again.";
    case "invalid-email":
      return "Please enter a valid email address.";
    default:
      return "Something went wrong signing in. Please try again.";
  }
}

/**
 * The seam every auth provider implements. Modeled on Firebase Auth so Linus's
 * adapter is a thin wrapper:
 * - `subscribe`         ← `onAuthStateChanged`
 * - `signIn`            ← `signInWithEmailAndPassword`
 * - `signOut`           ← `signOut`
 * - `sendPasswordReset` ← `sendPasswordResetEmail`
 */
export interface AuthBackend {
  /**
   * Observe auth state. Invokes `cb` immediately with the current user (or
   * null) and again on every change. Returns an unsubscribe function.
   */
  subscribe(cb: (user: AuthUser | null) => void): () => void;
  /** Resolve on success; reject with {@link AuthError} on failure. */
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Firebase never reveals whether an address exists, so this never rejects
   *  on "unknown email" — only on malformed input or transport failure. */
  sendPasswordReset(email: string): Promise<void>;
}
