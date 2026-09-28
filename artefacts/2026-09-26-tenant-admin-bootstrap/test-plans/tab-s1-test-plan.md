## Test Plan: Bootstrap a brand-new tenant's first admin automatically on login

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s1.md
**Epic reference:** artefacts/2026-09-26-tenant-admin-bootstrap/epics/real-admin-bootstrap.md
**Test plan author:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | First login on a genuinely new tenant grants admin, real `team_memberships` row created | 1 test | 2 tests (GitHub + email) | — | — | — | 🟢 |
| AC2 | Second person's first login into an already-bootstrapped tenant does not become admin | 1 test | — | — | — | — | 🟢 |
| AC3 | Concurrent bootstrap attempts on the same brand-new tenant — exactly one wins | 1 test | — | — | — | — | 🟢 |
| AC4 | Bootstrap resolves identically across GitHub, Google, email — no provider-specific gap | 1 test | 3 tests (all 3 real callback/sign-up handlers) | — | — | — | 🟢 |
| AC5 | Bootstrap is a no-op when the tenant already has a real admin | 1 test | — | — | — | — | 🟢 |
| AC6 | Transaction rollback — a failure in the second write leaves no claimed-but-adminless tenant | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. This story is entirely server-side (no client script, no rendered UI) — every AC is testable by calling the bootstrap function (or dispatching through the real route handlers) against a fake pool with real transactional semantics.

---

## Test Data Strategy

**Source:** Mixed — synthetic fake-pool data for unit tests; the same fake pool extended to model real Postgres transactional semantics (`BEGIN`/`COMMIT`/`ROLLBACK`, atomic `ON CONFLICT DO NOTHING RETURNING`) for AC3 (concurrency) and AC6 (rollback), since these two ACs specifically require correct transaction behaviour, not just query-shape matching.
**PCI/sensitivity in scope:** No — synthetic identities and tenant IDs only.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fake pool with zero rows for a fresh `tenant_id`; one resolvable person | Synthetic | None | Asserts session role resolves admin and a real `team_memberships` row is created |
| AC2 | Fake pool pre-seeded with an existing `tenant_admin_bootstrap` row for a `tenant_id`, claimed by person A | Synthetic | None | A different person B's first login into the same tenant must not auto-resolve admin |
| AC3 | Fake pool with zero rows for a fresh `tenant_id`; two distinct resolvable persons | Synthetic | None | Drives two concurrent bootstrap attempts via `Promise.all`; fake pool's `ON CONFLICT` emulation must correctly serialize the two calls the way a real unique-constraint insert would |
| AC4 | Fake pool with zero rows, one fresh `tenant_id` per provider (3 total) | Synthetic | None | One test per real login call site (GitHub callback, Google callback, email sign-up) |
| AC5 | Fake pool pre-seeded with an existing `team_memberships` row, `role='admin'`, for a `tenant_id` — seeded directly, not via this mechanism (simulating an admin granted some other way) | Synthetic | None | Proves the no-op holds even without a `tenant_admin_bootstrap` row present |
| AC6 | Fake pool with zero rows for a fresh `tenant_id`; a test hook forcing the `team_memberships` insert to throw after the `tenant_admin_bootstrap` insert succeeds | Synthetic | None | Fake pool must model `BEGIN`/snapshot/`ROLLBACK` correctly — asserts both tables have zero rows for that tenant after rollback |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### First login on a genuinely new tenant grants admin and creates a real team_memberships row

- **Verifies:** AC1
- **Precondition:** Fake pool has zero rows in both `tenant_admin_bootstrap` and `team_memberships` for `tenant-x`; one resolvable person exists
- **Action:** Call the bootstrap function directly with `(pool, 'tenant-x', personId)`
- **Expected result:** The call resolves indicating admin was granted; a real `team_memberships` row exists with `person_id=personId, tenant_id='tenant-x', role='admin'`; a real `tenant_admin_bootstrap` row exists for `tenant-x` with `admin_person_id=personId`
- **Edge case:** No

### Second person's first login into an already-bootstrapped tenant does not become admin

- **Verifies:** AC2
- **Precondition:** Fake pool pre-seeded with a `tenant_admin_bootstrap` row for `tenant-x` claimed by person A (via the seed helper, not by running AC1's own test first)
- **Action:** Call the bootstrap function with `(pool, 'tenant-x', personB)`, a different person
- **Expected result:** The call resolves indicating admin was NOT granted; no `team_memberships` row with `role='admin'` exists for person B in `tenant-x`; the pre-existing `tenant_admin_bootstrap` row for `tenant-x` is unchanged (still shows person A)
- **Edge case:** Yes — the story's own named non-first-person case

### Concurrent bootstrap attempts on the same brand-new tenant: exactly one wins

- **Verifies:** AC3
- **Precondition:** Fake pool has zero rows for `tenant-y`; two distinct resolvable persons (A and B)
- **Action:** Call the bootstrap function twice concurrently via `Promise.all([bootstrap(pool, 'tenant-y', personA), bootstrap(pool, 'tenant-y', personB)])`
- **Expected result:** Exactly one of the two calls results in a real `team_memberships` admin row; the other does not. `tenant_admin_bootstrap` has exactly one row for `tenant-y` (never zero, never two). The fake pool's own `ON CONFLICT` emulation must genuinely serialize the two calls (first-arrived wins), not just always let the first-array-position call win regardless of timing
- **Edge case:** Yes — the story's own explicitly required concurrency-safety proof, real test not a mocked/serialized simulation

### Bootstrap resolves identically across GitHub, Google, and email/password first logins

- **Verifies:** AC4
- **Precondition:** Fake pool has zero rows for 3 separate fresh `tenant_id`s, one per provider
- **Action:** Call the bootstrap function once per provider context (the function itself should be provider-agnostic — this test confirms no hidden provider-specific branch produces a different outcome)
- **Expected result:** All three calls grant admin correctly and identically — same `team_memberships` row shape, same `tenant_admin_bootstrap` row shape, regardless of which provider's tenant context was passed in
- **Edge case:** No

### Bootstrap is a no-op when the tenant already has a real admin

- **Verifies:** AC5
- **Precondition:** Fake pool pre-seeded with an existing `team_memberships` row, `role='admin'`, for `tenant-z` — seeded directly (not via this bootstrap mechanism), with NO `tenant_admin_bootstrap` row present (proving the no-op holds even without the gate table's own claim)
- **Action:** Call the bootstrap function with `(pool, 'tenant-z', newPerson)`
- **Expected result:** No second `team_memberships` admin row is created; the existing admin's row is completely unchanged; `newPerson` gets no admin grant
- **Edge case:** Yes — the story's own named already-has-admin case

### Transaction rollback: a failure in the second write leaves no claimed-but-adminless tenant

- **Verifies:** AC6
- **Precondition:** Fake pool has zero rows for `tenant-w`; a test hook configures the fake pool to throw on the `team_memberships` insert specifically, after the `tenant_admin_bootstrap` insert has already succeeded
- **Action:** Call the bootstrap function with `(pool, 'tenant-w', person)`
- **Expected result:** The call rejects/throws. After the call, `tenant_admin_bootstrap` has ZERO rows for `tenant-w` (the first write was rolled back, not left committed) and `team_memberships` has zero rows for `tenant-w` too — confirming the fake pool's `ROLLBACK` genuinely undid the first write, not merely skipped attempting the second
- **Edge case:** Yes — the security-critical failure-mode this AC exists to prove, found during `/review` (finding 1-H1)

---

## Integration Tests

### GitHub OAuth callback route dispatch wires into the bootstrap correctly for a genuinely new tenant

- **Verifies:** AC1, AC4 (D37 wiring test — real route dispatch, not just calling the bootstrap function directly)
- **Components involved:** `routes/auth.js`'s real GitHub OAuth callback handler, the bootstrap module, the fake pool
- **Precondition:** Fake pool has zero rows for the tenant a first-time GitHub login would resolve to
- **Action:** Dispatch a real request through the real router (matching this repo's own `router(req, res)` dispatch convention), simulating a first-time GitHub OAuth callback
- **Expected result:** `req.session.role` is `'admin'` after the real callback handler completes; a real `team_memberships` admin row exists, confirmed via the fake pool's own state, not just the session value

### Google OAuth callback route dispatch wires into the bootstrap correctly for a genuinely new tenant

- **Verifies:** AC1, AC4 (D37 wiring test)
- **Components involved:** `routes/auth.js`'s real Google OAuth callback handler, the bootstrap module, the fake pool
- **Precondition:** Fake pool has zero rows for the tenant a first-time Google login would resolve to
- **Action:** Dispatch a real request through the real router, simulating a first-time Google OAuth callback
- **Expected result:** Same as the GitHub integration test above, proving no provider-specific wiring gap

### Email sign-up route dispatch wires into the bootstrap correctly for a genuinely new tenant

- **Verifies:** AC1, AC4 (D37 wiring test)
- **Components involved:** `routes/auth-email.js`'s real sign-up handler, the bootstrap module, the fake pool
- **Precondition:** Fake pool has zero rows for the tenant a first-time email sign-up would resolve to
- **Action:** Dispatch a real request through the real router, simulating a first-time email/password sign-up
- **Expected result:** Same as the GitHub integration test above, closing the exact GitHub-vs-email inconsistency already named on `product/roadmap.md`

---

## NFR Tests

### Bootstrap adds a small, fixed number of queries to the login path

- **NFR addressed:** Performance
- **Measurement method:** Count real `pool.query()` calls made by the bootstrap function for a single successful bootstrap — assert the count is small and fixed (`BEGIN`, `tenant_admin_bootstrap` insert, `team_memberships` insert, `COMMIT` — expect exactly 4), not something that grows with unrelated input size
- **Pass threshold:** Exactly 4 query calls for one successful bootstrap
- **Tool:** `node scripts/run-all-tests.js` (query-call counting against the fake pool)

### Race-safety under concurrent load

- **NFR addressed:** Security
- **Measurement method:** Covered directly by AC3's own unit test above (real concurrent-request proof against the atomic `ON CONFLICT`) — not duplicated here per this repo's own NFR test scope rule (EXP-007).
- **Pass threshold:** N/A — see AC3.
- **Tool:** N/A — see AC3.

### Admin grants are audit-logged without the raw identity string

- **NFR addressed:** Audit
- **Measurement method:** Seed a spy logger, trigger a successful bootstrap, assert an `admin_bootstrap_granted` event is logged with `personId`, `tenantId`, and a `timestamp` field, and assert the raw identity string (e.g. the GitHub login or email) never appears anywhere in the logged event
- **Pass threshold:** Event present with all 3 required fields; zero occurrences of the raw identity string in the log call's arguments
- **Tool:** `node scripts/run-all-tests.js`

---

## Out of Scope for This Test Plan

- Any test of `tab-s2`'s own backfill migration — separate story, separate test plan.
- Any test of `tab-s3`'s own legacy-removal — separate story, separate test plan; this plan does not assert anything about `ADMIN_GITHUB_LOGINS`/`user_roles` behaviour.
- Real Postgres round-trip testing — this plan tests the fake pool's own modelled transactional semantics, matching this repo's established convention (no local test suite ever connects to a real database); real-environment confirmation happens at `/verify-completion`/DoD via a live check where Chrome/staging access allows it.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
