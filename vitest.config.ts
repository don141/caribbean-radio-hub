import { defineConfig } from "vitest/config";

// Unit tests for pure logic (auth state, route-guard decisions, error mapping)
// run in the default node environment — no DOM needed. The Firebase adapter,
// when it lands, can add its own suite. This is the web translation of the
// issue's `flutter test` coverage requirement for authStateProvider + guard.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
