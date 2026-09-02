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

const SEED_PATH = path.join(__dirname, "jamaica-poc-seed.json");
const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));

// isActive⇒streamable invariant, enforced at seed time.
// isActive:true is ONLY legal when verified AND streamCheck ok AND not denied.
function assertInvariant(s) {
  if (s.isActive !== true) return;
  const ok =
    s.verificationStatus === "verified" &&
    s.streamCheck &&
    s.streamCheck.status === "ok" &&
    s.rightToStream !== "denied";
  if (!ok) {
    throw new Error(
      `Invariant violation for "${s.id}": isActive:true requires ` +
        `verificationStatus==verified (got ${s.verificationStatus}), ` +
        `streamCheck.status==ok (got ${s.streamCheck && s.streamCheck.status}), ` +
        `rightToStream!=denied (got ${s.rightToStream}).`
    );
  }
}

function validateFeatured(seed) {
  const ids = new Set(seed.stations.map((s) => s.id));
  for (const [slot, ref] of Object.entries(seed.featured || {})) {
    if (!ids.has(ref.stationId)) {
      throw new Error(`featured/${slot} references unknown stationId "${ref.stationId}".`);
    }
    const target = seed.stations.find((s) => s.id === ref.stationId);
    if (target.verificationStatus !== "verified") {
      throw new Error(`featured/${slot} must reference a verified station; "${ref.stationId}" is not verified.`);
    }
  }
}

function stripInternal(s) {
  // Persist the §9 field set (plus useful discovery metadata), drop nothing sensitive.
  const { ...doc } = s;
  return doc;
}

async function main() {
  seed.stations.forEach(assertInvariant);
  validateFeatured(seed);

  const activeCount = seed.stations.filter((s) => s.isActive).length;
  console.log(
    `Validated ${seed.stations.length} stations (${activeCount} isActive) + ` +
      `${Object.keys(seed.featured || {}).length} featured slot(s). Invariant OK.`
  );

  let admin;
  try {
    admin = require("firebase-admin");
  } catch {
    console.warn(
      "\n[dry-run] firebase-admin not installed — validation passed but nothing written.\n" +
        "         Install it (npm i -D firebase-admin) and re-run against the emulator to seed.\n"
    );
    for (const s of seed.stations) console.log(`  would write /stations/${s.id} (isActive=${s.isActive})`);
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
  for (const s of seed.stations) {
    batch.set(db.collection("stations").doc(s.id), stripInternal(s), { merge: true });
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
