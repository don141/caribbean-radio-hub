// Pure route-guard decision logic, factored out of the component so it is
// trivially unit-testable (AC-AUTH covers "route guard logic") without a DOM.

import type { AuthUser } from "./types";

/**
 * What the guard should render:
 * - `loading`         — auth state not yet known; show a splash, never catalog.
 * - `sign-in`         — no user and auth is required; show the sign-in screen.
 * - `authenticated`   — render the app (a real user, or auth not enforced).
 */
export type GateDecision = "loading" | "sign-in" | "authenticated";

export function resolveGate(params: {
  authRequired: boolean;
  loading: boolean;
  user: AuthUser | null;
}): GateDecision {
  // When the gate is not enforced (e.g. the open demo deploy), the app is
  // always accessible — but the auth stack (sign-in, sign-out, session) is
  // still live for anyone who signs in. Flip enforcement on with one env var
  // once the real backend and go-live decision are in place.
  if (!params.authRequired) return "authenticated";
  if (params.loading) return "loading";
  return params.user ? "authenticated" : "sign-in";
}

/**
 * Whether unauthenticated users are hard-gated out of the catalog.
 *
 * Defaults OFF so the live static deploy stays open until real accounts exist
 * (the demo backend has no real users — hard-gating now would lock out the live
 * site). Set `NEXT_PUBLIC_AUTH_REQUIRED=1` to enforce AC-AUTH-1 once Linus's
 * Firebase backend and the CEO's go-live call are in. Inlined at build time by
 * Next, so it is baked into the static export.
 */
export function isAuthRequired(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_REQUIRED === "1";
}
