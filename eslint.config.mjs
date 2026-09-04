import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Node/CommonJS toolchains outside the Next.js app — each has its own
    // runtime (and package.json). The Next.js/TS ruleset (e.g. no-require-imports)
    // does not apply to these, so they are linted by their own tooling, not here.
    "functions/**",
    "firestore-tests/**",
    "scripts/**",
  ]),
]);

export default eslintConfig;
