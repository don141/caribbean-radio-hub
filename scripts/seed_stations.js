#!/usr/bin/env node
/*
 * BRE-39 — Station seed: 5 Jamaican PoC stations -> Firestore.
 *
 * Owner split: DATA is Nina's (scripts/jamaica-poc-seed.json, streams verified
 * 2026-09-02). IMPORT TOOLING is Linus's. This script is a runnable reference
 * so the data is import-ready; Linus owns confirming the emulator run and the
 * Firestore-console acceptance checks.
 *
 * STACK NOTE: the live MVP shipped as a Next.js static app (no Firebase in this
 * repo). These same 5 stations already ship in src/lib/stations/catalog.ts.
 * Confirm the target backend before treating this Firestore path as canonical
 * (BRE-39 escalation to CEO).
 *
 * Run against the Firestore emulator:
 *   firebase emulators:exec --only firestore 'node scripts/seed_stations.js'
 * or point at an emulator manually:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=breadfruit-dev node scripts/seed_stations.js
 *
 * Requires: firebase-admin (npm i -D firebase-admin). If it is not installed the
 * script validates the data + invariant and prints what it WOULD write, so it is
 * still useful as a dry run.
 */

const fs = require("fs");
const path = require("path");
// Single source of truth for the isActive⇒streamable invariant (BRE-42). The
// seed is validated with the SAME predicate the Cloud Functions write-path and
// firestore.rules use, so "dry-run OK" means "the rules would accept this write".
const { validateWrite } = require("../functions/lib/invariant.js");

const SEED_PATH = path.join(__dirname, "jamaica-poc-seed.json");
const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));

// ---- flat §9  ->  BRE-31 v2 (schemaVersion 2) normalization (BRE-48) ----
// Nina's seed JSON is the §9 field set (flat verificationStatus / streamCheck /
// rightToStream / stationContactStatus). The authoritative contract is BRE-31 v2:
// the four §16 workflow states are first-class nested objects, and rightToStream
// is COMPUTED from permission — never stored flat. firestore.rules + invariant.js
// both read the nested paths, so we normalize here at seed time (Linus's call on
// BRE-48; v2 is canonical). A working public stream URL is NOT permission
// (BRE-11 §16.1): "not_requested" maps to permission.status "none", never granted.
function mapPermission(rightToStream) {
  switch (rightToStream) {
    case "denied":    return { status: "denied",  scope: { stream: false }, evidenceRef: null };
    case "revoked":   return { status: "revoked", scope: { stream: false }, evidenceRef: null };
    case "granted":   return { status: "granted", scope: { stream: true },  evidenceRef: null };
    case "requested": return { status: "pending", scope: { stream: false }, evidenceRef: null };
    case "not_requested":
    default:          return { status: "none",    scope: { stream: false }, evidenceRef: null };
  }
}

function toV2(s) {
  // Drop the flat §9 fields; everything else (streamUrl, logoUrl, genre, …) rides along.
  const { verificationStatus, streamCheck, rightToStream, stationContactStatus, ...rest } = s;
  const sc = streamCheck || {};
  return {
    ...rest,
    schemaVersion: 2,
    sortName: (s.name || "").toLowerCase(),
    isFeatured: false, // featured is slot-driven (featured/{slot}, BRE-41), not this flag.
    streamVerification: {
      status: verificationStatus || "unverified",
      streamCheck: {
        status: sc.status || "unknown",
        consecutiveFailures: sc.status === "ok" ? 0 : (sc.consecutiveFailures || 0),
        lastChecked: sc.checkedAt || null,
        // Preserve the live re-verification diagnostics (2026-09-02) for auditability.
        httpStatus: sc.httpStatus ?? null,
        contentType: sc.contentType ?? null,
        format: sc.format ?? null,
        isHttps: sc.isHttps ?? null,
        notes: sc.notes ?? null,
      },
    },
    permission: mapPermission(rightToStream),
    stationContact: { status: stationContactStatus || "not_contacted" },
  };
}

// isActive⇒streamable invariant, enforced at seed time via the canonical predicate.
function assertInvariant(doc) {
  const res = validateWrite(doc);
  if (!res.ok) {
    throw new Error(`Invariant violation for "${doc.id}": ${res.message}`);
  }
}

function validateFeatured(seed, docsById) {
  for (const [slot, ref] of Object.entries(seed.featured || {})) {
    const target = docsById.get(ref.stationId);
    if (!target) {
      throw new Error(`featured/${slot} references unknown stationId "${ref.stationId}".`);
    }
    if (target.streamVerification.status !== "verified") {
      throw new Error(`featured/${slot} must reference a verified station; "${ref.stationId}" is not verified.`);
    }
  }
}

async function main() {
  const docs = seed.stations.map(toV2);
  const docsById = new Map(docs.map((d) => [d.id, d]));

  docs.forEach(assertInvariant);
  validateFeatured(seed, docsById);

  const activeCount = docs.filter((d) => d.isActive).length;
  console.log(
    `Validated ${docs.length} stations (${activeCount} isActive) + ` +
      `${Object.keys(seed.featured || {}).length} featured slot(s). ` +
      `Normalized flat §9 -> v2. Invariant OK.`
  );

  let admin;
  try {
    admin = require("firebase-admin");
  } catch {
    console.warn(
      "\n[dry-run] firebase-admin not installed — validation passed but nothing written.\n" +
        "         Install it (npm i -D firebase-admin) and re-run against the emulator to seed.\n"
    );
    for (const d of docs) console.log(`  would write /stations/${d.id} (isActive=${d.isActive})`);
    for (const [slot, ref] of Object.entries(seed.featured || {}))
      console.log(`  would write /featured/${slot} -> ${ref.stationId}`);
    return;
  }

  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error(
      "Refusing to run: FIRESTORE_EMULATOR_HOST is not set. This seed is emulator-only. " +
        "Use `firebase emulators:exec --only firestore 'node scripts/seed_stations.js'`."
    );
  }

  admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || "breadfruit-dev" });
  const db = admin.firestore();

  const batch = db.batch();
  for (const d of docs) {
    batch.set(db.collection("stations").doc(d.id), d, { merge: true });
  }
  for (const [slot, ref] of Object.entries(seed.featured || {})) {
    batch.set(db.collection("featured").doc(slot), ref, { merge: true });
  }
  await batch.commit();

  console.log(`Seeded ${seed.stations.length} stations + ${Object.keys(seed.featured || {}).length} featured slot(s).`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
