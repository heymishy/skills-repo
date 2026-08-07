## Implementation Plan: NFR-security review and hardening pass for Admin User Impersonation (d4)

**Story:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/d4-nfr-security-review-and-hardening.md`
**DoR:** `artefacts/2026-07-21-web-ui-experience-redesign/dor/d4-dor.md`
**Test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d4-test-plan.md`
**Branch:** `feature/d4-nfr-security-review-and-hardening` (fresh off `origin/master` @ `32726505`, D1/D2/D3 all merged)

This is a review-and-harden story, not a build-from-scratch story. Tasks below are
organised by AC. AC1/AC2/AC4 are structured code-review checklists (their "test"
is a source-inspection artefact, per the test plan's own "integration + manual"
approach); AC3 requires a new, real concurrent-execution test; AC5 requires
fixing anything AC1-AC4 turn up, each with its own RED-GREEN regression test.

---

## File map

| File | Change |
|------|--------|
| `src/web-ui/middleware/credits-guard.js` | AC5 fix: route the admin bypass through the canonical `isEffectivelyAdmin()` helper instead of a raw `req.session.role === 'admin'` comparison |
| `src/web-ui/server.js` | AC5 fix: remove the duplicate, unchained second `ALTER TABLE impersonation_audit_log ADD COLUMN IF NOT EXISTS ended_at` migration (d2's copy) that reintroduces the exact fresh-database migration race already fixed twice in this feature (a1, d3) |
| `tests/check-d4-nfr-security-review-and-hardening.js` | New — AC1 enumeration checklist, AC2 double-impersonation residual-state test, AC3 concurrent-request test, AC4 audit-implementation checklist, AC5 regression tests for both fixes above |
| `artefacts/2026-07-21-web-ui-experience-redesign/decisions.md` | Append entries for every finding + fix |

---

## Task 1 — AC1: Exhaustive admin-gated surface enumeration

**Verifies:** AC1

**Action (review, not code):** Enumerate every `requireAdmin(` call site via `grep -rn "requireAdmin(" src/web-ui/` and every UI-level admin-visibility computation (`isAdmin`/`isEffectivelyAdmin`) via `grep -rn "isAdmin\|isEffectivelyAdmin" src/web-ui/`. For each, confirm it reads the *effective* role (via `requireAdmin`'s tenantId-keyed live re-check, or `isEffectivelyAdmin`/`getEffectiveRole`), not a cached/real-admin-only value.

**Expected result (from direct grep + read, done during this task):**

Backend route gates — 8 `requireAdmin(` call sites in `server.js`, all wired to the same `setGetCurrentRole(getRoleForTenant)` adapter (tenantId-keyed live recheck — since D1 overwrites `session.tenantId` to the target's during impersonation, all 8 automatically read the target's live DB role):
1. `GET /admin/credits` (line 1989)
2. `POST /api/admin/credits/adjust` (line 1996)
3. `GET /team/members` (line 2007)
4. `POST /api/team/members` (line 2020)
5. `POST /api/team/bulk-add-github-org` (line 2032)
6. `GET /admin/impersonate` (line 2044)
7. `POST /api/admin/impersonate/start` (line 2056)
8. `GET /api/admin/impersonate/audit` (line 2084)

(`POST /api/admin/impersonate/exit` is deliberately NOT `requireAdmin`-gated — reviewed and confirmed correct under Task 2/AC2 below; its own authorization check is `req.session.impersonation.active`.)

UI-level visibility gates — all reading effective role via `isEffectivelyAdmin(req.session)`:
9. `src/web-ui/routes/dashboard.js` `handleDashboard` — gates the "Admin credits" sidebar nav item
10. `src/web-ui/routes/journey.js` `handleGetJourneyHome` (~line 322) — gates the same sidebar item on the Journeys page
11. `src/web-ui/routes/settings.js` `handleGetSettings` — gates the Credits tab, the Impersonate tab, and their server-side data fetches (`creditsRows`, `impersonationAuditRows`)

**Gap found (AC5):** `src/web-ui/middleware/credits-guard.js` line 22 checks `req.session.role === 'admin'` directly (an admin bypass of the credit-balance check), not via `isEffectivelyAdmin()`. This is the *only* role-gate in the codebase not routed through the canonical helper. It is not exploitable today — D1's `startImpersonationSession` overwrites `session.role` to the target's role directly, so the raw check happens to read the correct effective value — but it is a fragile, non-canonical pattern: any future change to the swap mechanism that stops mutating `session.role` directly (relying solely on `session.impersonation.target.role`, exactly the kind of change `getEffectiveRole`'s own doc comment anticipates) would silently reintroduce a privilege leak here with no test to catch it. Fixed in Task 4.

**Not in scope (reviewed, no fix needed):** `dashboard.js`'s `handleGetActions` (`/api/actions`) is not an admin-gated surface — it is a personalised action queue available to any authenticated user — so it is outside AC1's literal remit. It does carry the pre-existing, already-flagged (decisions.md, d1 ARCH entry) limitation that it calls the GitHub API with the real admin's own `accessToken`/`userId` even while impersonating (since D1 deliberately never swaps those two fields). Reviewed directly for this story: this shows the *admin's own* data mislabelled during impersonation, not the target's or any additional privilege — it is a data-personalization-correctness gap, not a privilege leak, and remains correctly out of scope per D1's own decisions.md revisit trigger ("no such instance of privilege leakage found today").

**Not a security concern (reviewed):** `routes/products.js`, `routes/skills.js`, `routes/artefact.js`, `routes/features.js` never pass `isAdmin` to `renderShell`, so it defaults to `false` on those pages — the Admin credits nav link is invisible there even to a genuine admin. This is a fail-safe direction (under-shows, never over-shows) and `html-shell.js`'s own doc comment confirms the nav flag is "a UX convenience only; requireAdmin on the real route is the actual security boundary" — so this is a pre-existing UI consistency gap, not a privilege-leak gap, and is not in this story's remit to fix (would be new, unrequested UX scope).

---

## Task 2 — AC2: Line-by-line session-swap and exit review

**Verifies:** AC2

**Action (review, not code):** Read `startImpersonationSession` and `exitImpersonationSession` in `src/web-ui/modules/impersonation.js` line by line.

**Findings (documented, no gap):**
- `startImpersonationSession`: captures `adminSnapshot` (`userId`/`login`/`tenantId`/`role`) into `session.impersonation.admin` BEFORE any mutation; audit write is `await`-ed first (fails closed — session untouched if it throws); then one synchronous block sets `session.impersonation`, `session.tenantId`, `session.login`, `session.role` — `session.accessToken` and (during start) `session.userId` are deliberately never touched (documented, deliberate, flagged limitation, see Task 1).
- `exitImpersonationSession`: reads `session.impersonation.admin` (the exact snapshot from start); best-effort (fail-open, documented SEC judgment call) `endImpersonationAudit`; then one synchronous block restores `tenantId`/`login`/`role`/`userId` and `delete session.impersonation` — removing the *entire* sub-object (target identity, admin snapshot, reason, auditId, startedAt), not just individual fields.
- Existing test `check-d2-banner-exit-permission-visibility.js` T5 already proves single impersonate-then-exit leaves zero residue (`session.impersonation === undefined`, no `"bob"` substring anywhere in `JSON.stringify(session)`).

**Gap in test coverage (not a code gap):** no existing test proves the test plan's own Scenario 2 — impersonate user A, exit, then impersonate a *different* user B, and confirm B's session shows only B's data with nothing from A. Added in Task 3 below (same test file as AC3, since both are "real, not mocked" integration tests over the same session object).

---

## Task 3 — AC2 (double-impersonation) + AC3 (concurrency): write real tests

**Verifies:** AC2 (double-impersonation cycle), AC3 (concurrent-request state consistency)

### RED

Create `tests/check-d4-nfr-security-review-and-hardening.js`. Two new integration tests:

1. **Double impersonation, different targets:** admin session impersonates target A, exits (assert byte-for-byte restore, matching T5's existing assertion style), then impersonates target B. Assert the resulting session has ONLY B's `login`/`tenantId`/`role`/`impersonation.target`, and that no field anywhere in `JSON.stringify(session)` contains A's login or tenantId.

2. **Concurrency:** construct a real `session` object and a `writeImpersonationAudit` mock whose INSERT resolves only after a `setImmediate` delay (widening the real async window `startImpersonationSession` awaits on). Kick off `startImpersonationSession(session, target, reason)` without awaiting it yet; concurrently, poll `{tenantId: session.tenantId, role: session.role}` on every `setImmediate` tick until the start promise resolves. Assert every single sample recorded during the pending window is *exactly* the pre-swap admin pair (`{tenantId: 'tenant-alice', role: 'admin'}`) or *exactly* the post-swap target pair (`{tenantId: 'tenant-bob', role: 'user'}`) — never a cross combination (admin tenantId + target role, or vice versa). Repeat the same sampling technique around `exitImpersonationSession` with a delayed `endImpersonationAudit`.

Run: `node tests/check-d4-nfr-security-review-and-hardening.js`

**Expected (RED is not applicable here in the classic bug-fix sense — these are verification tests over already-implemented D1/D2 code):** run once written; if either fails, that IS an AC2/AC3 gap requiring an AC5 fix before this story can close.

### GREEN

Expected output: both tests pass against the existing, unmodified `modules/impersonation.js` — this demonstrates (not just asserts by reasoning) that D1's single-synchronous-block design and D2's mirrored exit design already satisfy AC2/AC3. No production code change from this task.

Commit message: `test(d4): add double-impersonation and concurrent-swap tests (AC2, AC3)`

---

## Task 4 — AC5 fix: `credits-guard.js` routes the admin bypass through `isEffectivelyAdmin()`

**Verifies:** AC5 (fixes the Task 1 finding)

### RED

Add to `tests/check-d4-nfr-security-review-and-hardening.js`:

```js
test('credits-guard.js: admin bypass check uses the canonical isEffectivelyAdmin() helper, not a raw req.session.role comparison', function() {
  var src = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/middleware/credits-guard.js'), 'utf8');
  assert.ok(/require\(.*modules\/impersonation.*\)/.test(src), 'expected credits-guard.js to require modules/impersonation');
  assert.ok(/isEffectivelyAdmin\(/.test(src), 'expected a call to isEffectivelyAdmin(...)');
  assert.ok(!/req\.session\.role\s*===\s*'admin'/.test(src), 'expected the raw req.session.role === \'admin\' comparison to be gone');
});
```

Run: `node tests/check-d4-nfr-security-review-and-hardening.js` → **fails** (current `credits-guard.js` has no `isEffectivelyAdmin` import and still has the raw comparison).

### GREEN

Edit `src/web-ui/middleware/credits-guard.js`:

```js
'use strict';

// credits-guard.js — middleware to enforce credit balance before each turn (lab-s3.3).
// Checks tenant credit balance via credits.js; returns HTTP 402 when balance <= 0.
// Audit-logs every blocked request with `credits_balance_check` event (AC6).
// Must be mounted AFTER session auth so req.session.tenantId is available (AC5).
//
// d4 (NFR-security review, AC1/AC5): the admin bypass now reads the EFFECTIVE
// role via isEffectivelyAdmin() (modules/impersonation.js) instead of a raw
// req.session.role === 'admin' comparison. Behaviourally identical today (D1's
// session swap already overwrites req.session.role to the target's role during
// an active impersonation, so the raw check happened to read the correct
// value) -- this closes the one remaining role-gate in the codebase that was
// not routed through the same canonical, audited helper as every other
// effective-role check (dashboard.js, journey.js, settings.js), removing the
// fragility flagged during this story's exhaustive AC1 enumeration: a future
// change to the swap mechanism that stops mutating session.role directly
// would otherwise silently reintroduce a privilege leak here with no test to
// catch it.

const { getBalance } = require('../modules/credits');
const { isEffectivelyAdmin } = require('../modules/impersonation');

/**
 * creditsGuard — check tenant credit balance before the turn handler runs.
 * Returns 402 with topUpUrl when balance <= 0; calls next() when balance > 0.
 * The 402 body is exactly { "error": "Insufficient credits", "topUpUrl": "/settings/billing" }.
 * No grace period: any balance <= 0 blocks the turn (AC1, AC2, AC5 — lab-s3.3).
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
async function creditsGuard(req, res, next) {
  // arl-s2: admin users bypass the credits check entirely. d4: reads the
  // EFFECTIVE role (never the real admin's own role while impersonating a
  // non-admin target) via the same canonical helper used everywhere else.
  if (req.session && isEffectivelyAdmin(req.session)) {
    return next();
  }
  const tenantId = req.session && req.session.tenantId;
  const balance = await getBalance(tenantId);
  if (balance <= 0) {
    console.info('credits_balance_check', { tenantId, balance, result: 'blocked' });
    res.writeHead(402, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Insufficient credits', topUpUrl: '/settings/billing' }));
    return;
  }
  next();
}

module.exports = { creditsGuard };
```

Run: `node tests/check-d4-nfr-security-review-and-hardening.js` → passes.
Run: `node tests/check-lab-s3.3-credit-enforcement.js` → still 100% passing (no test there sets `session.role`, so behaviour is unchanged for every existing case).

Commit message: `fix(d4): route credits-guard admin bypass through isEffectivelyAdmin() (AC1/AC5)`

---

## Task 5 — AC5 fix: remove the duplicate, unchained `impersonation_audit_log.ended_at` migration

**Verifies:** AC5 (fixes the migration-race finding found during Task 2's line-by-line read of the audit write path)

### RED

Add to `tests/check-d4-nfr-security-review-and-hardening.js`:

```js
test('server.js: exactly one ALTER TABLE impersonation_audit_log ADD COLUMN IF NOT EXISTS ended_at (no duplicate, unchained migration)', function() {
  var src = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
  var matches = src.match(/ALTER TABLE impersonation_audit_log ADD COLUMN IF NOT EXISTS ended_at/g) || [];
  assert.strictEqual(matches.length, 1, 'expected exactly one ended_at migration -- a second, unchained copy races the CREATE TABLE on a fresh database (the exact a1/d3 anti-pattern)');
});
```

Run: `node tests/check-d4-nfr-security-review-and-hardening.js` → **fails** (two matches today: d3's chained copy at ~line 647, and d2's independent, unchained copy at ~line 657).

### GREEN

Edit `src/web-ui/server.js`: remove the redundant, unchained block (the one starting `// d2: ended_at column -- exit (AC4) sets this...` through its `.catch(...)`), since d3's already-chained copy (inside D1's `CREATE TABLE impersonation_audit_log` `.then()`) adds the identical column and already runs safely on a fresh database. Leave a one-line comment noting the consolidation and pointing at this story's decisions.md entry.

Run: `node tests/check-d4-nfr-security-review-and-hardening.js` → passes.
Run: `node tests/check-d3-impersonation-audit-log.js` → still passes (its own schema-prerequisite test is a substring regex that still matches d3's remaining copy).
Run: `node tests/check-d2-banner-exit-permission-visibility.js` → still passes (its T20 is the same substring regex).

Commit message: `fix(d4): remove duplicate unchained impersonation_audit_log.ended_at migration (AC5, migration-race)`

---

## Task 6 — AC4: audit-log-vs-decision checklist

**Verifies:** AC4

**Action (review, not code):** Confirm against the confirmed `/clarify` decision (decisions.md, 2026-07-21 SEC entry: "admin-visible only, retained indefinitely, no notification"):
- Read access: `GET /api/admin/impersonate/audit` is `requireAdmin`-gated (Task 1, site #8); `settings.js` only fetches/renders `impersonationAuditRows` when `isEffectivelyAdmin` is true. No other route or file reads `impersonation_audit_log`.
- Retention: `grep -rn "DELETE FROM impersonation_audit_log\|TTL.*impersonat\|cleanup.*impersonat" src/` → zero matches. No cron/scheduled job references the table.
- Notification: `grep -rn "notify.*impersonat\|sendEmail.*impersonat\|impersonat.*email" src/` → zero matches.

**Result:** matches the confirmed decision exactly. No gap.

---

## Task 7 — Full-suite verification + decisions.md + PR

**Verifies:** AC5 (gate closure), all ACs' final sign-off

1. Run `node scripts/run-all-tests.js` — compare against this branch's own baseline (357 run / 37 failed, identical file list to the d2/d3 merge-reconciliation baseline already logged in decisions.md).
2. Append decisions.md entries for: the d4 branch-setup baseline RISK-ACCEPT, the AC1 enumeration + credits-guard.js finding/fix, the migration-race finding/fix, and the AC2/AC3/AC4 review outcomes.
3. Run `/verify-completion`, then `/branch-complete` (draft PR only).

---

## Self-review checklist

- [x] Exact file paths, no placeholders
- [x] Complete code shown for both AC5 fixes
- [x] Failing test written before each fix (Tasks 3-5)
- [x] Expected output stated for every run command
- [x] Commit messages in imperative mood
- [x] No scope beyond AC1-AC5 (no session time-limiting, no second reviewer, no other new hardening)
