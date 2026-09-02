/**
 * BRE-38 — Firestore security-rules emulator tests.
 *
 * Proves the deny-by-default + authenticated-only posture:
 *   - No unauthenticated read of ANY collection succeeds (PERMISSION_DENIED).
 *   - A signed-in non-admin can read /stations/{id} (active) and /featured/{slot}.
 *   - A signed-in non-admin CANNOT write stations/featured; an admin (custom
 *     claim) CAN.
 *   - Users read/write only their own /users/{uid} subtree, never another's.
 *   - Unmatched paths are denied (deny-by-default).
 *
 * Run:  firebase emulators:exec --only firestore "jest --runInBand"
 */
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const {
  doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, where,
} = require('firebase/firestore');

let testEnv;

const ACTIVE = {
  name: 'Irie FM', countryCode: 'JM', genreIds: ['reggae'],
  streamUrl: 'https://origin.example/irie.mp3', streamFormat: 'mp3',
  logoUrl: 'https://cdn.example/irie.png',
  isFeatured: false, isActive: true, sortName: 'irie fm', schemaVersion: 2,
};
const HIDDEN = { ...ACTIVE, name: 'Draft Station', sortName: 'draft station', isActive: false };

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'breadfruit-rules-test',
    firestore: { rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8') },
  });
});
afterAll(async () => { await testEnv.cleanup(); });

beforeEach(async () => {
  await testEnv.clearFirestore();
  // Seed with rules disabled so tests only exercise READ/WRITE rules, not setup.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'stations/active'), ACTIVE);
    await setDoc(doc(db, 'stations/hidden'), HIDDEN);
    await setDoc(doc(db, 'featured/slot-1'), { stationId: 'active', rank: 1 });
    await setDoc(doc(db, 'countries/JM'), { name: 'Jamaica' });
    await setDoc(doc(db, 'genres/reggae'), { name: 'Reggae' });
    await setDoc(doc(db, 'users/u1'), { displayName: 'User One' });
    await setDoc(doc(db, 'users/u1/favorites/active'), { stationId: 'active' });
    await setDoc(doc(db, 'users/u2'), { displayName: 'User Two' });
  });
});

const anon = () => testEnv.unauthenticatedContext().firestore();
const user = (uid) => testEnv.authenticatedContext(uid).firestore();                 // signed-in, non-admin
const admin = () => testEnv.authenticatedContext('a1', { admin: true }).firestore();  // custom claim

describe('deny-by-default: NO unauthenticated read of any collection', () => {
  test('1. anon cannot read /stations/{id}', async () => {
    await assertFails(getDoc(doc(anon(), 'stations/active')));
  });
  test('2. anon cannot read /featured/{slot}', async () => {
    await assertFails(getDoc(doc(anon(), 'featured/slot-1')));
  });
  test('3. anon cannot read /countries or /genres', async () => {
    await assertFails(getDoc(doc(anon(), 'countries/JM')));
    await assertFails(getDoc(doc(anon(), 'genres/reggae')));
  });
  test('4. anon cannot read /users/{uid}', async () => {
    await assertFails(getDoc(doc(anon(), 'users/u1')));
  });
  test('5. anon cannot list /stations even with isActive filter', async () => {
    await assertFails(getDocs(query(collection(anon(), 'stations'), where('isActive', '==', true))));
  });
  test('6. anon cannot read an arbitrary/undefined collection (deny-by-default)', async () => {
    await assertFails(getDoc(doc(anon(), 'secrets/anything')));
  });
});

describe('authenticated non-admin reads', () => {
  test('7. can read an active /stations/{id}', async () => {
    await assertSucceeds(getDoc(doc(user('u1'), 'stations/active')));
  });
  test('8. can read /featured/{slot}', async () => {
    await assertSucceeds(getDoc(doc(user('u1'), 'featured/slot-1')));
  });
  test('9. can read /countries and /genres', async () => {
    await assertSucceeds(getDoc(doc(user('u1'), 'countries/JM')));
    await assertSucceeds(getDoc(doc(user('u1'), 'genres/reggae')));
  });
  test('10. can list stations WITH where(isActive==true)', async () => {
    await assertSucceeds(getDocs(query(collection(user('u1'), 'stations'), where('isActive', '==', true))));
  });
  test('11. cannot read a hidden (isActive=false) station (isActive gate preserved)', async () => {
    await assertFails(getDoc(doc(user('u1'), 'stations/hidden')));
  });
  test('12. list WITHOUT isActive filter is denied (would expose hidden docs)', async () => {
    await assertFails(getDocs(query(collection(user('u1'), 'stations'))));
  });
});

describe('write authorization: catalog is admin-only', () => {
  test('13. non-admin cannot create a station', async () => {
    await assertFails(setDoc(doc(user('u1'), 'stations/new'), { ...ACTIVE }));
  });
  test('14. non-admin cannot update a station (e.g. flip isActive / change streamUrl)', async () => {
    await assertFails(updateDoc(doc(user('u1'), 'stations/hidden'), { isActive: true }));
    await assertFails(updateDoc(doc(user('u1'), 'stations/active'), { streamUrl: 'https://evil/x.mp3' }));
  });
  test('15. non-admin cannot write /featured/{slot}', async () => {
    await assertFails(setDoc(doc(user('u1'), 'featured/slot-2'), { stationId: 'active', rank: 2 }));
  });
  test('16. admin CAN create/update a station', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'stations/created'), { ...ACTIVE }));
    await assertSucceeds(updateDoc(doc(admin(), 'stations/hidden'), { isActive: true }));
  });
  test('17. admin CAN write /featured/{slot}', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'featured/slot-2'), { stationId: 'active', rank: 2 }));
  });
});

describe('owner-scoped user data', () => {
  test('18. a user can read and write their own /users/{uid} doc', async () => {
    await assertSucceeds(getDoc(doc(user('u1'), 'users/u1')));
    await assertSucceeds(setDoc(doc(user('u1'), 'users/u1'), { displayName: 'Renamed' }));
  });
  test('19. a user can read/write their own favorites subtree', async () => {
    await assertSucceeds(getDoc(doc(user('u1'), 'users/u1/favorites/active')));
    await assertSucceeds(setDoc(doc(user('u1'), 'users/u1/recentlyPlayed/active'), { at: 1 }));
  });
  test('20. a user CANNOT read another user\'s doc', async () => {
    await assertFails(getDoc(doc(user('u1'), 'users/u2')));
  });
  test('21. a user CANNOT write another user\'s subtree', async () => {
    await assertFails(setDoc(doc(user('u1'), 'users/u2/favorites/x'), { stationId: 'active' }));
  });
});
