## Test Plan: Thread the authenticating person's identity through requireAdmin's live role re-check

**Story reference:** artefacts/2026-08-21-live-role-recheck-tenant-collapse/stories/lrtc-s1-thread-identity-through-live-role-recheck.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Two distinct people sharing one tenant resolve to two different, individually-correct roles via the LIVE re-check | 1 test | — | — | — | — | 🔴 |
| AC2 | Solo-tenant / no-identity-key call pattern unchanged (no regression) | 1 test | — | — | — | — | 🟢 |
| AC3 | rbg-s1's own AC1 E2E test passes without further changes once this ships | — | — | 1 test (existing, unmodified) | — | — | 🟢 |

**Important context for the coding agent — read before writing AC1's test:** `tests/check-sec-perf-s2-stale-role-revalidation.js` already has a test (T8, "wiring resolves two distinct sessions to two distinct, correct roles", AC5 of `sec-perf-s2`) that LOOKS like it covers this exact scenario and currently passes. It does not actually catch this bug: it wires `setGetCurrentRole` to a hand-rolled mock (`async function(/* tenantId */) { return roleByPerson[currentPerson]; }`) that ignores its own `tenantId` argument entirely and instead branches on an external test-only variable (`currentPerson`) flipped by the test itself between calls. This never exercises the real argument-passing bug (`_getCurrentRole` receiving only `tenantId`, no identity) — it is the same "asserts wiring occurred, not that the wiring is behaviourally correct" anti-pattern CLAUDE.md's D37 rule already documents for `tir-s1`. AC1's new test below must NOT repeat this shape — it must exercise the REAL `resolveRoleForPerson` chain (real `identityKey` resolution against a pool with 2 people sharing one `tenant_id`), not a hand-substituted external switch.

---

## Coverage gaps

None. AC1/AC2 have direct unit coverage against the real resolution chain; AC3 is confirmed by an already-existing E2E test needing no changes.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, using the in-memory fake pool pattern already established in `tests/check-tir-s7-person-scoped-login-resolution.js`/`tests/check-tir-s9-per-person-identitykey-login-fix.js` (a hand-rolled pool-shaped object with `.query()`, not the full `fake-test-db.js` module — those existing tests construct a minimal in-memory `person_identities`/`team_memberships` fixture directly; reuse that same minimal-pool pattern rather than requiring the full `fake-test-db.js` module for a unit test).
**PCI/sensitivity in scope:** No
**Availability:** Available now — no external dependency, test constructs its own fixture rows.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Two synthetic people (`person-X`=admin, `person-Y`=engineer) sharing one `tenant_id`, in a minimal in-memory pool | Constructed in test setup | None | Mirrors `tir-s7`'s own existing fixture-construction pattern |
| AC2 | One synthetic solo-tenant person (`tenant_id` == their own identity) | Constructed in test setup | None | Confirms the pre-existing single-argument call pattern still works |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1a: requireAdmin's live re-check resolves two distinct people sharing one tenant to two different, correct roles

- **File:** `tests/check-sec-perf-s2-stale-role-revalidation.js` (extend — add alongside the existing T8, do not replace T8; T8 still validates its own narrower original claim, just not this one)
- **Verifies:** AC1 — using the REAL `resolveRoleForPerson`/`getRoleForTenant` chain (`src/web-ui/modules/user-roles.js`), not a hand-substituted external switch.
- **Precondition:** A minimal synthetic pool (matching `tir-s7`'s test fixture pattern) with `person_identities` rows for `person-X`→personId 1 and `person-Y`→personId 2, and `team_memberships` rows: (personId 1, tenant `shared-tenant`, role `admin`), (personId 2, tenant `shared-tenant`, role `engineer`).
- **Action:** Wire `setGetCurrentRole` to the FIXED closure shape (`function(tenantId, identityKey) { return getRoleForTenant(tenantId, identityKey); }`, mirroring the fix this story makes to `server.js`), with `setGetRoleForTenant` wired to `resolveRoleForPerson(syntheticPool, identityKey || tenantId, tenantId)` (the real production wiring pattern, not a mock). Call `requireAdmin` twice: once with `req = { session: { userId: 'person-X', tenantId: 'shared-tenant', login: 'person-X', role: 'user' } }`, once with `req = { session: { userId: 'person-Y', tenantId: 'shared-tenant', login: 'person-Y', role: 'admin' } }` (deliberately cached-wrong, like the existing T1 test, to prove the live check overrides it).
- **Expected result:** person-X's request calls `next()` (admin, granted). person-Y's request does NOT call `next()`, gets `403` (correctly denied despite the stale cached `role: 'admin'`).
- **Edge case:** This is the primary case — written to fail against the current (pre-fix) `require-admin.js`/`server.js`, since today `_getCurrentRole` never receives `identityKey` at all, and the real `resolveRoleForPerson` fallback path resolves both to the same (first-inserted) person.

### AC2: solo-tenant / no-identity-key call pattern is unchanged (regression check)

- **File:** `tests/check-sec-perf-s2-stale-role-revalidation.js` (extend)
- **Verifies:** AC2 — the existing, pre-this-story common case (tenantId already equals the one person's own identity) is not broken by adding the new parameter.
- **Precondition:** A minimal synthetic pool with one `person_identities` row for `solo-person`→personId 3, and one `team_memberships` row: (personId 3, tenant `solo-person`, role `admin`) — i.e. `tenant_id` literally equals the person's own identity string, the pre-`sec-perf-s2` common shape.
- **Action:** Call `requireAdmin` with `req = { session: { userId: 'solo-person', tenantId: 'solo-person', login: 'solo-person', role: 'user' } }` (cached-stale, like AC1's test).
- **Expected result:** `next()` is called (admin, granted) — identical outcome to before this story, confirming the identityKey addition doesn't change resolution when `identityKey === tenantId`.
- **Edge case:** Also confirm the same call succeeds when `req.session.login` is `undefined` (defensive — some legacy/test session shapes may not set it), falling back to `tenantId` exactly as `getRoleForTenant`'s own documented fallback behaviour already specifies.

---

## Integration Tests

None — `requireAdmin` + `user-roles.js`'s `resolveRoleForPerson` together constitute the integration seam being tested; the unit tests above already exercise them together via the real (non-mocked) function chain, per this repo's own established pattern in `check-tir-s7-person-scoped-login-resolution.js`.

---

## E2E Tests

### AC3: rbg-s1's own AC1 test passes without further changes

- **Verifies:** AC3 — confirms this fix, applied at the `require-admin.js`/`server.js` layer, is sufficient for the real HTTP-level regression `rbg-s1` found, with zero changes needed to `rbg-s1`'s own test file.
- **Target:** `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`, specifically the `AC1: admin (alice) succeeds on role-gated feature, engineer (bob) is denied` test (already written by `rbg-s1`, currently failing on `bob`'s assertion).
- **Precondition:** `rbg-s1`'s own WIP commit (feature branch `feature/rbg-s1`, wiring the role adapters to the fake test DB) is available — either by rebasing `lrtc-s1`'s branch on top of it, or by cherry-picking that one commit, so both fixes are present together for this specific verification. If `lrtc-s1` ships to master before `rbg-s1`'s branch merges, `rbg-s1` picks this fix up on its next rebase instead — either order works, this test is the final confirmation regardless of order.
- **Action:** Run `npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js -g "AC1: admin"`.
- **Expected result:** `1 passed` — alice `200`, bob `403`.
- **Edge case:** No.

---

## NFR Tests

### Security — no privilege escalation between teammates sharing a tenant

- **NFR addressed:** Security (this story's core purpose).
- **Measurement method:** Not a separate NFR test — AC1's own assertion (person-Y denied despite sharing a tenant with an admin) IS the security-relevant behaviour. No additional NFR-specific test needed beyond AC1/AC2, per the NFR test scope rule (don't duplicate AC-level assertions inside a nominal "NFR test").
- **Pass threshold:** N/A — see AC1.
- **Tool:** This repo's hand-rolled `test()`/`assert` harness (existing pattern in `check-sec-perf-s2-stale-role-revalidation.js`).

---

## Out of Scope for This Test Plan

- Re-testing `require-admin.js`'s existing AC1-AC4/AC6 behaviour (demotion/promotion/unwired-fallback/fail-closed-on-error) — already covered by the existing T1-T7, T10 tests in `check-sec-perf-s2-stale-role-revalidation.js`, untouched by this story.
- T8/T9 (the existing, weaker AC5 tests) are NOT deleted or rewritten — they still validate their own original (narrower) claims. The new AC1a test is added alongside them, not as a replacement.
- Any production-tenant audit for real-world exploitability — flagged in the story as a recommended follow-up, not part of this test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
