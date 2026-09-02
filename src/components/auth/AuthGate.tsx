"use client";

// Client-side route guard. In a static export there is no server/middleware, so
// the guard is a component that decides — from live auth state — whether to
// render the catalog, the sign-in screen, or a loading splash. It wraps the
// routed page content, so when a user is required but absent, no catalog markup
// is ever mounted (AC-AUTH-1, AC-AUTH-4). The decision itself is the pure,
// unit-tested resolveGate() (AC "route guard logic").

import { useAuth, resolveGate, isAuthRequired } from "@/lib/auth";
import { SignInScreen } from "./SignInScreen";
import styles from "./AuthGate.module.css";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const decision = resolveGate({
    authRequired: isAuthRequired(),
    loading,
    user,
  });

  if (decision === "loading") {
    return (
      <main className={styles.splash} aria-busy="true">
        <span className={styles.spinner} aria-hidden="true" />
        <span className={styles.srOnly}>Loading…</span>
      </main>
    );
  }

  if (decision === "sign-in") {
    return <SignInScreen />;
  }

  return <>{children}</>;
}
