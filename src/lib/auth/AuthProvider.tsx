"use client";

// The app-wide auth store — the web translation of BRE-40's Riverpod
// `authStateProvider` (a stream of `User?`). Lives once near the root so a
// single subscription to the backend's auth-state stream drives routing
// everywhere. Reading it is how the route guard, sign-in screen, and sign-out
// all see the same source of truth.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createAuthBackend } from "./backend";
import {
  messageForAuthError,
  type AuthBackend,
  type AuthUser,
} from "./types";

export interface AuthState {
  /** Current user, or null when signed out. */
  user: AuthUser | null;
  /**
   * True until the backend reports initial auth state. The guard shows a splash
   * (never catalog) while this holds, so a valid persisted session resolves to
   * the app without a sign-in flash (AC-AUTH-5).
   */
  loading: boolean;
  /** True while a sign-in request is in flight (drives the button spinner). */
  submitting: boolean;
  /** User-facing error from the last sign-in attempt, or null. */
  error: string | null;
  /** Attempt sign-in. Returns true on success. Never throws. */
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Send a reset email. Returns true if the request was accepted. */
  sendPasswordReset: (email: string) => Promise<boolean>;
  /** Clear the current error (e.g. when the user edits the form). */
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** Read the auth store. Throws if used outside {@link AuthProvider}. */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function AuthProvider({
  children,
  backend: injected,
}: {
  children: React.ReactNode;
  /** Test/override hook; defaults to the app's selected backend. */
  backend?: AuthBackend;
}) {
  // One backend instance for the provider's lifetime. The lazy `useState`
  // initializer runs exactly once (render-safe — no ref reads during render)
  // and defers constructing the browser-only local backend until first render.
  const [backend] = useState<AuthBackend>(
    () => injected ?? createAuthBackend(),
  );

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single subscription to the auth-state stream. First emission clears the
  // loading splash; every subsequent change re-routes the app.
  useEffect(() => {
    const unsubscribe = backend.subscribe((next) => {
      setUser(next);
      setLoading(false);
    });
    return unsubscribe;
  }, [backend]);

  const clearError = useCallback(() => setError(null), []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      try {
        await backend.signIn(email, password);
        return true;
      } catch (err) {
        setError(messageForAuthError(err));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [backend],
  );

  const signOut = useCallback(async () => {
    await backend.signOut();
    setError(null);
  }, [backend]);

  const sendPasswordReset = useCallback(
    async (email: string): Promise<boolean> => {
      try {
        await backend.sendPasswordReset(email);
        return true;
      } catch (err) {
        setError(messageForAuthError(err));
        return false;
      }
    },
    [backend],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      submitting,
      error,
      signIn,
      signOut,
      sendPasswordReset,
      clearError,
    }),
    [
      user,
      loading,
      submitting,
      error,
      signIn,
      signOut,
      sendPasswordReset,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
