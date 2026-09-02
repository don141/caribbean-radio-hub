/**
 * Station invariant logic — the single source of truth for the
 * `isActive ⇒ streamable` guarantee (BRE-42, ratified on BRE-30).
 *
 * This module is intentionally PURE and dependency-free so it can be:
 *   1. imported by the Cloud Functions (write-path trigger, callable verify,
 *      scheduled reconciliation), and
 *   2. unit-tested with `node:test` WITHOUT the Firestore emulator, and
 *   3. mirrored, field-for-field, by `firestore.rules` (see stations rules).
 *
 * Schema authority: BRE-31 "Authoritative stations Contract" (schemaVersion 2).
 * The four §16 workflow states are first-class and never collapsed:
 *   streamDiscovered · streamVerification · stationContact · permission
 *
 * Field paths this module reads (all optional / defensively defaulted):
 *   station.streamVerification.status               unverified|pending|verified|rejected
 *   station.streamVerification.streamCheck.status   unknown|ok|failed|unreachable
 *   station.streamVerification.streamCheck.consecutiveFailures  number
 *   station.permission.status                        none|pending|granted|denied|revoked
 *   station.permission.scope.stream                  boolean
 *   station.permission.evidenceRef                   string|null
 *   station.isActive                                 boolean
 */

'use strict';

/**
 * Number of consecutive failed/unreachable automated probes before a station is
 * treated as "sustained unreachable" and auto-deactivated by reconciliation.
 * A single transient flap must NOT deactivate a station (open impl decision,
 * admin-writepath-isactive-invariant): chosen threshold = 3.
 */
const SUSTAINED_UNREACHABLE_THRESHOLD = 3;

/**
 * Derive `rightToStream` (granted | denied | unknown) from the four workflow
 * states. This is the computed convenience field named in BRE-42.
 *
 * Policy (conservative — see admin-writepath-isactive-invariant memory):
 *   - denied  : permission was explicitly refused or pulled back.
 *   - granted : permission granted, scope covers the stream, with recorded evidence.
 *   - unknown : everything else (the normal freshly-researched condition).
 *
 * Note: a public, working stream URL is NOT permission (BRE-11 §16.1).
 */
function computeRightToStream(station) {
  const permission = (station && station.permission) || {};
  const status = permission.status || 'none';

  if (status === 'denied' || status === 'revoked') {
    return 'denied';
  }

  const scope = permission.scope || {};
  const hasEvidence =
    permission.evidenceRef !== undefined &&
    permission.evidenceRef !== null &&
    String(permission.evidenceRef).length > 0;

  if (status === 'granted' && scope.stream === true && hasEvidence) {
    return 'granted';
  }

  return 'unknown';
}

/**
 * Is the station technically + legally publishable? This is the exact predicate
 * the `isActive ⇒ streamable` invariant requires. `isActive:true` is only
 * permitted when ALL hold:
 *   - streamVerification.status == 'verified'   (admin confirmed it plays)
 *   - streamVerification.streamCheck.status == 'ok'  (latest automated probe OK)
 *   - rightToStream != 'denied'                  (not explicitly refused)
 */
function isStreamable(station) {
  const sv = (station && station.streamVerification) || {};
  const check = sv.streamCheck || {};
  const verified = sv.status === 'verified';
  const checkOk = check.status === 'ok';
  const notDenied = computeRightToStream(station) !== 'denied';
  return verified && checkOk && notDenied;
}

/**
 * Does the station currently VIOLATE the invariant? True when it is live to
 * clients (`isActive:true`) but is not streamable. Reconciliation flips these.
 */
function violatesInvariant(station) {
  return station && station.isActive === true && !isStreamable(station);
}

/**
 * Write-path validation. Given the proposed post-write station document,
 * reject any write that would set `isActive:true` while the invariant is
 * violated. Returns { ok:true } or { ok:false, code, message }.
 *
 * `before` is optional (undefined on create). We only block the *transition to*
 * / *persistence of* isActive:true on a non-streamable doc; we never block
 * setting isActive:false.
 */
function validateWrite(after, before) {
  if (!after || after.isActive !== true) {
    return { ok: true };
  }
  if (isStreamable(after)) {
    return { ok: true };
  }
  const reasons = [];
  const sv = after.streamVerification || {};
  const check = sv.streamCheck || {};
  if (sv.status !== 'verified') {
    reasons.push(`streamVerification.status is "${sv.status || 'unverified'}" (must be "verified")`);
  }
  if (check.status !== 'ok') {
    reasons.push(`streamVerification.streamCheck.status is "${check.status || 'unknown'}" (must be "ok")`);
  }
  if (computeRightToStream(after) === 'denied') {
    reasons.push('rightToStream is "denied" (permission refused/revoked)');
  }
  return {
    ok: false,
    code: 'failed-precondition',
    message:
      'Cannot set isActive:true — station is not streamable. ' + reasons.join('; ') + '.',
  };
}

/**
 * Classify an automated HTTP probe of the stream URL into the streamCheck status
 * vocabulary. `reachable` is false when the request never got an HTTP response
 * (DNS/connect/timeout). `httpStatus` is the response code when reachable.
 *   - unreachable : no HTTP response at all.
 *   - ok          : 2xx, or 3xx redirect (stream hosts often 302 to an edge).
 *   - failed      : any other HTTP status (4xx/5xx).
 */
function classifyProbe({ reachable, httpStatus }) {
  if (!reachable) return 'unreachable';
  if (httpStatus >= 200 && httpStatus < 400) return 'ok';
  return 'failed';
}

/**
 * Fold a fresh probe result into the prior streamCheck state, maintaining the
 * consecutive-failure counter used by the sustained-unreachable threshold.
 * `nowIso` is passed in (callers stamp the real time) to keep this pure.
 */
function nextStreamCheck(prevCheck, probeStatus, nowIso) {
  const prev = prevCheck || {};
  const prevFails = typeof prev.consecutiveFailures === 'number' ? prev.consecutiveFailures : 0;
  const isFailure = probeStatus === 'failed' || probeStatus === 'unreachable';
  return {
    status: probeStatus,
    lastChecked: nowIso,
    consecutiveFailures: isFailure ? prevFails + 1 : 0,
  };
}

/**
 * Sustained-unreachable check used by reconciliation: true once the station has
 * failed/been-unreachable for >= threshold consecutive probes.
 */
function isSustainedUnreachable(station, threshold = SUSTAINED_UNREACHABLE_THRESHOLD) {
  const sv = (station && station.streamVerification) || {};
  const check = sv.streamCheck || {};
  const fails = typeof check.consecutiveFailures === 'number' ? check.consecutiveFailures : 0;
  return fails >= threshold;
}

module.exports = {
  SUSTAINED_UNREACHABLE_THRESHOLD,
  computeRightToStream,
  isStreamable,
  violatesInvariant,
  validateWrite,
  classifyProbe,
  nextStreamCheck,
  isSustainedUnreachable,
};
