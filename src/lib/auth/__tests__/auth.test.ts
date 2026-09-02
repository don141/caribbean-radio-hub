import { describe, it, expect, beforeEach } from "vitest";
import { resolveGate } from "../gate";
import { messageForAuthError, AuthError, type AuthUser } from "../types";
import {
  LocalAuthBackend,
  MemoryStore,
  DEMO_CREDENTIALS,
} from "../localBackend";

const USER: AuthUser = { uid: "u1", email: "a@b.com" };

describe("resolveGate (route guard logic)", () => {
  it("passes through when auth is not required, regardless of user", () => {
    expect(
      resolveGate({ authRequired: false, loading: true, user: null }),
    ).toBe("authenticated");
    expect(
      resolveGate({ authRequired: false, loading: false, user: null }),
    ).toBe("authenticated");
  });

  it("shows the splash while loading when auth is required", () => {
    expect(
      resolveGate({ authRequired: true, loading: true, user: null }),
    ).toBe("loading");
  });

  it("routes an unauthenticated user to sign-in (AC-AUTH-1)", () => {
    expect(
      resolveGate({ authRequired: true, loading: false, user: null }),
    ).toBe("sign-in");
  });

  it("routes an authenticated user to the app (AC-AUTH-2)", () => {
    expect(
      resolveGate({ authRequired: true, loading: false, user: USER }),
    ).toBe("authenticated");
  });
});

describe("messageForAuthError", () => {
  it("maps each known code to friendly copy", () => {
    expect(messageForAuthError(new AuthError("invalid-credentials"))).toMatch(
      /isn't right/i,
    );
    expect(messageForAuthError(new AuthError("network"))).toMatch(/network/i);
    expect(messageForAuthError(new AuthError("rate-limited"))).toMatch(
      /too many/i,
    );
    expect(messageForAuthError(new AuthError("invalid-email"))).toMatch(
      /valid email/i,
    );
  });

  it("falls back to a generic message for unknown/non-auth errors", () => {
    expect(messageForAuthError(new Error("boom"))).toMatch(/went wrong/i);
    expect(messageForAuthError("nope")).toMatch(/went wrong/i);
  });
});

describe("LocalAuthBackend (authStateProvider stream)", () => {
  let store: MemoryStore;
  let backend: LocalAuthBackend;

  beforeEach(() => {
    store = new MemoryStore();
    backend = new LocalAuthBackend(store);
  });

  it("starts signed out and emits null immediately on subscribe", () => {
    const seen: (AuthUser | null)[] = [];
    backend.subscribe((u) => seen.push(u));
    expect(seen).toEqual([null]);
  });

  it("rejects a malformed email with invalid-email", async () => {
    await expect(backend.signIn("not-an-email", "x")).rejects.toMatchObject({
      code: "invalid-email",
    });
  });

  it("rejects wrong credentials and stays signed out (AC-AUTH-3)", async () => {
    await expect(
      backend.signIn(DEMO_CREDENTIALS.email, "wrong"),
    ).rejects.toMatchObject({ code: "invalid-credentials" });
    const seen: (AuthUser | null)[] = [];
    backend.subscribe((u) => seen.push(u));
    expect(seen).toEqual([null]);
  });

  it("signs in with valid credentials and emits the user (AC-AUTH-2)", async () => {
    const seen: (AuthUser | null)[] = [];
    backend.subscribe((u) => seen.push(u));
    await backend.signIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    expect(seen.at(-1)?.email).toBe(DEMO_CREDENTIALS.email);
  });

  it("persists the session across restarts (AC-AUTH-5)", async () => {
    await backend.signIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    // A fresh backend over the same store simulates an app restart.
    const restarted = new LocalAuthBackend(store);
    const seen: (AuthUser | null)[] = [];
    restarted.subscribe((u) => seen.push(u));
    expect(seen[0]?.email).toBe(DEMO_CREDENTIALS.email);
  });

  it("signs out, emits null, and clears the persisted session (AC-AUTH-4)", async () => {
    await backend.signIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    const seen: (AuthUser | null)[] = [];
    backend.subscribe((u) => seen.push(u));
    await backend.signOut();
    expect(seen.at(-1)).toBeNull();
    // No session survives for the next restart.
    const restarted = new LocalAuthBackend(store);
    restarted.subscribe((u) => expect(u).toBeNull());
  });

  it("accepts a reset request for a valid email and rejects a malformed one", async () => {
    await expect(
      backend.sendPasswordReset("someone@example.com"),
    ).resolves.toBeUndefined();
    await expect(backend.sendPasswordReset("bad")).rejects.toMatchObject({
      code: "invalid-email",
    });
  });
});
