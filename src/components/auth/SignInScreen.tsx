"use client";

// Email/password sign-in screen with loading, error, and success states, plus
// a password-reset link (BRE-40 deliverables / AC-AUTH-3, AC-AUTH-6). On
// success the AuthProvider's user stream flips and the route guard swaps this
// screen for the catalog — this component renders nothing catalog-related, so
// no catalog content is visible while signed out (AC-AUTH-1).

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { DEMO_CREDENTIALS } from "@/lib/auth";
import styles from "./SignInScreen.module.css";

export function SignInScreen() {
  const { signIn, sendPasswordReset, submitting, error, clearError } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    // Success is handled implicitly: the guard unmounts this screen when the
    // user stream emits. We only need to act on failure (error state is set by
    // the provider and rendered inline below).
    await signIn(email, password);
  }

  async function onReset() {
    clearError();
    if (!email.trim()) {
      setNotice("Enter your email above, then tap “Forgot password?” again.");
      return;
    }
    const ok = await sendPasswordReset(email);
    if (ok) {
      setNotice(
        "If an account exists for that email, a reset link is on its way.",
      );
    }
  }

  // Editing the form clears any stale error/notice so the message tracks the
  // current attempt.
  function onEdit(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      if (error) clearError();
      if (notice) setNotice(null);
      setter(e.target.value);
    };
  }

  return (
    <main className={styles.wrap}>
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <div className={styles.brand}>🎧 Island Waves</div>
        <h1 className={styles.heading}>Sign in to start listening</h1>

        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={onEdit(setEmail)}
            placeholder="you@example.com"
            required
            disabled={submitting}
            className={styles.input}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={onEdit(setPassword)}
            placeholder="••••••••"
            required
            disabled={submitting}
            className={styles.input}
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}

        <button
          type="submit"
          className={styles.submit}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <button
          type="button"
          className={styles.link}
          onClick={onReset}
          disabled={submitting}
        >
          Forgot password?
        </button>

        {/* Demo credentials for the local backend, shown until Linus's Firebase
            backend + real accounts land. Safe to display: it is a throwaway
            client-only account, not a secret. */}
        <p className={styles.demo}>
          Demo: <code>{DEMO_CREDENTIALS.email}</code> /{" "}
          <code>{DEMO_CREDENTIALS.password}</code>
        </p>
      </form>
    </main>
  );
}
