# Restore same-tenant journey access under POLICY.TENANT — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Add a same-tenant grant path to `requireJourneyAccess()` for `POLICY.TENANT` callers, using an explicit, positively-verified tenant match — not the module's existing `isSameTenant()` helper, whose deliberately permissive "either side missing → true" passthrough (built for unrelated Phase-0 legacy compatibility) would grant access even when neither side has a verified tenant identity, and would flip an existing, currently-passing test (`tests/check-p0.1-journey-access.js` Test 4).
**Branch:** `feature/jatg-s1`
**Worktree:** `.worktrees/jatg-s1`
**Test command:** `node scripts/run-all-tests.js` (glob-discovers `tests/check-*.js`; individual files can be run directly with `node tests/check-<name>.js`)

---

## File map

```
Create:
  tests/check-jatg-s1-tenant-access-grant.js  — unit tests for AC1-AC4 (new-behaviour + regression guards)

Modify:
  src/web-ui/middleware/journey-access.js  — requireJourneyAccess() gains an explicit-tenant-match grant branch for POLICY.TENANT
```

**Deliberately not modified:** `tests/check-p0.1-journey-access.js` — with the stricter, explicit-match design below, none of its 16 existing tests change outcome. Confirming this (not just assuming it) is Task 2's own verification step.

---

## Task 1: Write failing tests for the new same-tenant grant path (AC1, AC2, AC3)

**Files:**
- Create: `tests/check-jatg-s1-tenant-access-grant.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
// check-jatg-s1-tenant-access-grant.js
// AC verification for jatg-s1 (AC1, AC2, AC3, AC4's existing-behaviour guards).
// AC5 is covered by re-running the existing, unmodified check-wsm2-collaborative-sessions.js.

const assert = require('assert');
const { requireJourneyAccess, asHttpResponse, POLICY } = require('../src/web-ui/middleware/journey-access.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ── AC1: same-tenant non-owner under POLICY.TENANT → granted ──────────────────

test('AC1: same-tenant non-owner is granted access under POLICY.TENANT', () => {
  const journey = { ownerId: 'user-A', tenantId: 'acme' };
  const session = { accessToken: 'tok', login: 'user-B', tenantId: 'acme' };
  assert.doesNotThrow(() => requireJourneyAccess(journey, session, POLICY.TENANT));
});

// ── AC2: different-tenant non-owner under POLICY.TENANT → denied, 404 ─────────

test('AC2: different-tenant non-owner is denied (404) under POLICY.TENANT', () => {
  const journey = { ownerId: 'user-A', tenantId: 'acme' };
  const session = { accessToken: 'tok', login: 'user-C', tenantId: 'other-tenant' };
  assert.throws(() => requireJourneyAccess(journey, session, POLICY.TENANT), { code: 'FORBIDDEN' });
  let caught;
  try { requireJourneyAccess(journey, session, POLICY.TENANT); } catch (e) { caught = e; }
  assert.strictEqual(asHttpResponse(caught, POLICY.TENANT), 404);
});

// ── AC3: same-tenant non-owner under POLICY.OWNER → still denied ──────────────

test('AC3: same-tenant non-owner is still denied under POLICY.OWNER', () => {
  const journey = { ownerId: 'user-A', tenantId: 'acme' };
  const session = { accessToken: 'tok', login: 'user-B', tenantId: 'acme' };
  assert.throws(() => requireJourneyAccess(journey, session, POLICY.OWNER), { code: 'FORBIDDEN' });
});

// ── AC4: existing-behaviour regression guards ──────────────────────────────────

test('AC4: the journey owner is still granted access under both policies', () => {
  const journey = { ownerId: 'user-A', tenantId: 'acme' };
  const session = { accessToken: 'tok', login: 'user-A', tenantId: 'acme' };
  assert.doesNotThrow(() => requireJourneyAccess(journey, session, POLICY.TENANT));
  assert.doesNotThrow(() => requireJourneyAccess(journey, session, POLICY.OWNER));
});

test('AC4: an unowned (ownerId null) journey still grants access under POLICY.TENANT', () => {
  const journey = { ownerId: null, tenantId: 'acme' };
  const session = { accessToken: 'tok', login: 'anyone', tenantId: 'other-tenant' };
  assert.doesNotThrow(() => requireJourneyAccess(journey, session, POLICY.TENANT));
});

test('AC4: a null journey still throws NOT_FOUND', () => {
  assert.throws(
    () => requireJourneyAccess(null, { accessToken: 'tok', login: 'x', tenantId: 'acme' }, POLICY.TENANT),
    { code: 'NOT_FOUND' }
  );
});

test('AC4: a missing session still throws UNAUTHENTICATED', () => {
  assert.throws(
    () => requireJourneyAccess({ ownerId: 'user-A', tenantId: 'acme' }, null, POLICY.TENANT),
    { code: 'UNAUTHENTICATED' }
  );
});

test('AC4: a non-owner with NEITHER side having a tenantId is still denied (deny-by-default for ambiguous tenant identity)', () => {
  // This is exactly tests/check-p0.1-journey-access.js's own Test 4 scenario --
  // proving the new grant path requires a POSITIVELY VERIFIED tenant match, not
  // isSameTenant()'s permissive "either side missing -> true" passthrough.
  const journey = { ownerId: 'bob' };
  const session = { accessToken: 'tok-test', userId: '1', login: 'alice' };
  assert.throws(() => requireJourneyAccess(journey, session, POLICY.TENANT), { code: 'FORBIDDEN' });
});

console.log(`\n[jatg-s1] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-jatg-s1-tenant-access-grant.js
```

Expected output: `AC1` fails (`requireJourneyAccess` currently throws for a same-tenant non-owner). `AC2`, `AC3`, and all `AC4` guards pass already (they describe existing, unchanged behaviour) — confirming the RED state is narrowly scoped to exactly the one bug this story fixes.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/check-jatg-s1-tenant-access-grant.js
git commit -m "test: add failing test for jatg-s1 AC1 (same-tenant non-owner grant)"
```

---

## Task 2: Fix requireJourneyAccess() with an explicit-tenant-match grant path (AC1)

**Files:**
- Modify: `src/web-ui/middleware/journey-access.js`

- [ ] **Step 1: Make the fix**

Find:

```javascript
function requireJourneyAccess(journey, session, policy) {
  if (journey == null) throw { code: 'NOT_FOUND' };
  if (!session || !session.accessToken) throw { code: 'UNAUTHENTICATED' };
  if (journey.ownerId == null) return;
  if (session.login === journey.ownerId) return;
  if (!isSameTenant(journey, session)) throw { code: 'FORBIDDEN' };
  throw { code: 'FORBIDDEN' };
}
```

Replace with:

```javascript
// jatg-s1: the policy param was accepted but never read -- whether
// isSameTenant() returned true or false, both branches above threw
// FORBIDDEN, so every POLICY.TENANT route behaved as owner-only
// regardless of tenant match. Fixed with an explicit, positively-verified
// tenant-match grant -- deliberately NOT reusing isSameTenant() here,
// since that helper's "either side missing tenantId -> true" passthrough
// was built for unrelated Phase-0 legacy compatibility and would grant
// access even when neither side has a verified tenant identity (see
// tests/check-p0.1-journey-access.js Test 4, and jatg-s1's own decisions.md).
function requireJourneyAccess(journey, session, policy) {
  if (journey == null) throw { code: 'NOT_FOUND' };
  if (!session || !session.accessToken) throw { code: 'UNAUTHENTICATED' };
  if (journey.ownerId == null) return;
  if (session.login === journey.ownerId) return;
  if (policy === POLICY.TENANT &&
      journey.tenantId != null &&
      session.tenantId != null &&
      journey.tenantId === session.tenantId) {
    return;
  }
  throw { code: 'FORBIDDEN' };
}
```

- [ ] **Step 2: Run the new test file — must pass**

```bash
node tests/check-jatg-s1-tenant-access-grant.js
```

Expected output: `[jatg-s1] Results: 8 passed, 0 failed`

- [ ] **Step 3: Run the existing p0.1 test file — must be unaffected**

```bash
node tests/check-p0.1-journey-access.js
```

Expected output: `All 16 tests passed.` — in particular, `PASS 4: non-owner throws FORBIDDEN` (the exact scenario the stricter design was chosen to preserve).

- [ ] **Step 4: Commit**

```bash
git add src/web-ui/middleware/journey-access.js
git commit -m "fix: grant same-tenant journey access under POLICY.TENANT via explicit tenant match"
```

---

## Task 3: Confirm AC5 (existing wsm2 tests) and AC4's full-suite regression check

**Files:**
- None modified — verification only

- [ ] **Step 1: Run the existing wsm2 test file unmodified**

```bash
node tests/check-wsm2-collaborative-sessions.js
```

Expected output: last line reads `=== wsm2 results: 22 passed, 0 failed ===`. `T2b`, `T2c`, `T2d`, `T4a`, `T4b` (previously failing with 404s) now show as passed.

- [ ] **Step 2: Run the full suite**

```bash
node scripts/run-all-tests.js
```

Expected output: the "Failed files" list contains only the already-known, already-accepted pre-existing entries unrelated to this story (`scripts/check-pipeline-state-integrity.js`'s 3 C3 entries, `tests/check-p3.5-validate-trace.js`, `tests/check-p4-enf-decision.js`) — `tests/check-wsm2-collaborative-sessions.js` must no longer appear, and no other file should newly appear either.

- [ ] **Step 3: If the full suite matches the expected baseline, this task needs no commit** — verification only. Proceed to `/verify-completion`.

---

## Notes for the implementing agent

- The story's own "Root cause" section sketches a fix using `isSameTenant()` directly — this plan deliberately departs from that suggestion (explicitly permitted by the story's own wording: "not prescribed as the only valid fix") after discovering it would flip `tests/check-p0.1-journey-access.js` Test 4. Do not revert to the `isSameTenant()`-based version without re-confirming Test 4 stays green.
- `isSameTenant()` itself is NOT modified — its own tests (`check-p0.1-journey-access.js` Test 14/15) are unaffected, and it continues to serve whatever other callers already rely on its permissive passthrough semantics.
