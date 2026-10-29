## Test Plan: Extract a shared mockReq/mockRes fixture module for journey.js tests

**Story reference:** artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s1-shared-journey-fixture-module.md
**Epic reference:** artefacts/2026-10-29-test-suite-infra-refactor/epics/journey-js-shared-test-fixture.md
**Test plan author:** Copilot
**Date:** 2026-10-29

**Test runner (confirmed from `package.json`):** `npm test` → `node scripts/run-all-tests.js`, which spawns each `tests/check-*.js` file individually via plain Node.js (`assert` module + this repo's own `test(name, fn)` helper convention — no Jest/Mocha). All tests below follow this exact convention. Run individually via `node tests/check-tsir-s1-shared-journey-fixture.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Factory returns mockReq grounded in journey.js's real `req.session` reads | 2 | — | — | — | — | 🟢 |
| AC2 | Migrated existing consumer file (`check-ep1-s1-journey-feature-merge.js`) still passes unchanged | — | 1 | — | — | — | 🟢 |
| AC3 | Default `session.tenantId` is non-empty synthetic, never `''`/`undefined` | 1 | — | — | — | — | 🟢 |
| AC4 | Factory accepts `overrides` and merges over defaults | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — all test data is generated in test setup, no real/external data involved.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained — tests generate their own data in setup.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Real field list journey.js reads from `req.session`: `login`, `tenantId`, `accessToken`, `userId`, `role` (confirmed via `grep -n "req\.session\." src/web-ui/routes/journey.js`) | Synthetic, hardcoded in the test | None | `activeFeatureSlug`, `stageIndex`, `flags`, `impersonation`, `returnTo` are route-set dynamically, not fixture-default concerns — excluded from the default shape assertion |
| AC2 | Existing `check-ep1-s1-journey-feature-merge.js` file, migrated in place | Fixtures (existing repo file) | None | |
| AC3 | A synthetic non-empty tenantId string (e.g. `'tsir-test-tenant'`) | Synthetic | None | |
| AC4 | An overrides object, e.g. `{ tenantId: 'other-tenant' }` | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### journeyFixture() default session includes every field journey.js actually reads

- **Verifies:** AC1
- **Precondition:** `tests/helpers/journey-fixture.js` does not exist yet (fails to require).
- **Action:** `const { journeyFixture } = require('../tests/helpers/journey-fixture'); const req = journeyFixture();`
- **Expected result:** `req.session` has own properties `login`, `tenantId`, `accessToken`, `userId`, `role`, each a defined, non-null value.
- **Edge case:** No.

### journeyFixture() returns a fresh object on every call, not a shared reference

- **Verifies:** AC1 (robustness — prevents one test's mutation leaking into another's)
- **Precondition:** None.
- **Action:** Call `journeyFixture()` twice, mutate the first result's `session.tenantId`, then re-read the second result.
- **Expected result:** The second call's `session.tenantId` is unaffected by the first call's mutation.
- **Edge case:** Yes.

### journeyFixture() defaults session.tenantId to a non-empty synthetic value

- **Verifies:** AC3
- **Precondition:** None.
- **Action:** `const req = journeyFixture();`
- **Expected result:** `req.session.tenantId` is a non-empty string, and is not `''`. Also assert `req.session.tenantId !== undefined` explicitly (the exact collision class named in AC3 and in `ctpl-s1`'s own dedicated test).
- **Edge case:** Yes — this is directly the `ctpl-s1` collision class.

### journeyFixture(overrides) merges overrides over defaults without discarding other fields

- **Verifies:** AC4
- **Precondition:** None.
- **Action:** `const req = journeyFixture({ session: { tenantId: 'other-tenant' } });` (or equivalent override shape as implemented)
- **Expected result:** `req.session.tenantId === 'other-tenant'`, and `req.session.login`/`accessToken`/`role` are still present at their default values.
- **Edge case:** No.

---

## Integration Tests

### Migrated consumer file (check-ep1-s1-journey-feature-merge.js) passes unchanged after adopting the shared fixture

- **Verifies:** AC2
- **Components involved:** `tests/helpers/journey-fixture.js` (new) ↔ `tests/check-ep1-s1-journey-feature-merge.js` (existing, migrated)
- **Precondition:** `tests/check-ep1-s1-journey-feature-merge.js`'s own hand-rolled `mockReq` is replaced with `journeyFixture(...)` calls, preserving every per-test override that file's existing assertions depend on.
- **Action:** `node tests/check-ep1-s1-journey-feature-merge.js`
- **Expected result:** Exit code 0, same pass count as before migration (this file's current baseline: all tests passing per the `ctpl-s1` PR's own final regression run).

---

## NFR Tests

None — confirmed with story owner. The story's NFRs section states "None identified" for Performance, Security, Accessibility, and Audit; this module introduces no production code path.

---

## Out of Scope for This Test Plan

- Testing any of the other 41 existing `journey.js`-touching files' own migration — only the one example migration (AC2) is in scope for this story.
- Testing `tests/check-journey-fixture-self-test.js` (the dedicated self-test module) — that is `tsir-s2`'s own test plan.
- Testing `scripts/check-journey-fixture-usage.js` (the structural check) — that is `tsir-s3`'s own test plan.

---

## Test Gaps and Risks

None.
