"use client";

// App header: brand + (when signed in) the signed-in email and a sign-out
// action (BRE-40 deliverable). Sign-out clears auth state via the provider;
// under an enforced gate that drops the user back to the sign-in screen with no
// catalog visible (AC-AUTH-4). The control only appears when there is a user,
// so the open (gate-off) deploy is unchanged for anonymous visitors.

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        🎧 Island Waves
      </Link>
      {user && (
        <div className={styles.account}>
          <span className={styles.email} title={user.email}>
            {user.email}
          </span>
          <button
            type="button"
            className={styles.signOut}
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
