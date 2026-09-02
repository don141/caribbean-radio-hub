#!/usr/bin/env node
/*
 * BRE-48 — Readback acceptance check for the Jamaica PoC seed.
 *
 * Reads /stations and /featured back OUT of the running Firestore emulator (the
 * emulator is ephemeral under `emulators:exec`, so seed + verify must share one
 * session) and asserts the BRE-48 acceptance criteria against the persisted docs:
 *   1. exactly 5 station docs exist,
 *   2. featured/slot_1 -> irie-fm-jm,
 *   3. every persisted doc is BRE-31 v2-shaped (streamVerification / permission),
 *   4. the isActive⇒streamable invariant holds for the active stations, checked
 *      with the SAME predicate the rules + Cloud Functions use (invariant.js).
 *
 * Run alongside the seed:
 *   firebase emulators:exec --only firestore \
 *     'node scripts/seed_stations.js && node scripts/verify_seed.js'
 */
"use strict";

const admin = require("firebase-admin");
const { isStreamable } = require("../functions/lib/invariant.js");

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("Refusing to run: FIRESTORE_EMULATOR_HOST is not set (emulator-only readback).");
  process.exit(1);
}

const EXPECTED_STATION_IDS = [
  "irie-fm-jm",
  "alpha-boys-school-radio-jm",
  "suncity-104-9-fm-jm",
  "rebel-radio-jm",
  "mello-radio-88-fm-jm",
];

function assert(cond, msg) {
  if (!cond) {
    console.error("  ✗ " + msg);
    process.exitCode = 1;
    return false;
  }
  console.log("  ✓ " + msg);
  return true;
}

async function main() {
  admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || "breadfruit-dev" });
  const db = admin.firestore();

  const snap = await db.collection("stations").get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  console.log("Readback: /stations");
  assert(docs.length === 5, `exactly 5 station docs (got ${docs.length})`);
  for (const id of EXPECTED_STATION_IDS) {
    assert(docs.some((d) => d.id === id), `/stations/${id} present`);
  }

  console.log("Readback: v2 shape + isActive⇒streamable invariant");
  for (const d of docs) {
    const v2 =
      d.schemaVersion === 2 &&
      d.streamVerification && typeof d.streamVerification.status === "string" &&
      d.streamVerification.streamCheck && typeof d.streamVerification.streamCheck.status === "string" &&
      d.permission && typeof d.permission.status === "string" &&
      d.rightToStream === undefined && d.verificationStatus === undefined; // flat §9 fields gone
    assert(v2, `/stations/${d.id} is v2-shaped (nested streamVerification/permission, no flat §9)`);
    if (d.isActive === true) {
      assert(isStreamable(d), `/stations/${d.id} is active AND streamable (verified + streamCheck ok + not denied)`);
    } else {
      console.log(`  · /stations/${d.id} isActive:false (invariant not required)`);
    }
  }

  console.log("Readback: /featured");
  const feat = await db.collection("featured").get();
  const slots = Object.fromEntries(feat.docs.map((d) => [d.id, d.data()]));
  assert("slot_1" in slots, "featured/slot_1 present");
  assert(slots.slot_1 && slots.slot_1.stationId === "irie-fm-jm", "featured/slot_1 -> irie-fm-jm");
  assert(docs.some((d) => d.id === (slots.slot_1 || {}).stationId), "featured/slot_1 target exists in /stations");

  const activeCount = docs.filter((d) => d.isActive === true).length;
  console.log(
    `\nSummary: ${docs.length} stations (${activeCount} active), ${feat.size} featured slot(s). ` +
      (process.exitCode ? "FAILED." : "All acceptance checks passed.")
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
