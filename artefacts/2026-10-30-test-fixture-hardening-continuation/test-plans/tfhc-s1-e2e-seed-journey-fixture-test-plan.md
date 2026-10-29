## Test Plan: Extract a shared E2E fixture for seeding an approval journey

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s1-e2e-seed-journey-fixture.md
**Epic reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/epics/fixture-divergence-closure.md
**Test plan author:** Copilot
**Date:** 2026-10-30

**Test runner (confirmed from `package.json`):** E2E specs run via `npm run test:e2e` → `playwright test` (ADR-018 — Architecture Decision Record 18: Playwright is the E2E testing framework; specs live in `tests/e2e/`; devDependency only). Run individually via `npx playwright test tests/e2e/ep3-s1-regression.spec.js tests/e2e/ep2-s4-concurrent-merge.spec.js`.

**Real callers confirmed by grep (4 total, matching the story's own count):** `tests/e2e/ep3-s1-regression.spec.js`, `tests/e2e/ep2-s4-concurrent-merge.spec.js`, `tests/e2e/dsa-s2-dashboard-restyle.spec.js`, `tests/e2e/ep2-s3-approval.spec.js`. This plan migrates the first two (different `stage` values — `'test-plan'` and `'discovery'` — giving the overrides test real coverage of two distinct cases, not two copies of the same one).

**Real endpoint shape confirmed from `src/web-ui/server.js:2663-2688`:** `/test/seed-approval-journey` accepts `{ featureSlug, stage, completedStages }`, defaults `featureSlug` to `'ep2-s3-e2e-feature-' + Date.now()` and `stage` to `'discovery'` server-side, returns `{ journeyId, ... }`. Guarded by `process.env.NODE_ENV === 'test'`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Fixture module exports a function that POSTs to `/test/seed-approval-journey` with sensible defaults, returns parsed response incl. `journeyId` | — | — | 2 | — | — | 🟢 |
| AC2 | Fixture accepts `overrides` merging over defaults without full payload reconstruction | — | — | 1 | — | — | 🟢 |
| AC3 | 2 of 4 real callers migrated, existing assertions pass unchanged | — | — | 2 | — | — | 🟢 |
| AC4 | Migrated specs produce the same pass/fail outcome as before migration (flakiness is not asserted — observed, not tested) | — | — | 1 | — | — | 🟢 |

---

## Coverage gaps

None. AC4 as revised (see story amendment, 2026-10-30) asserts only the deterministic pass/fail-outcome claim, which is fully testable by running the migrated specs before and after migration and diffing the result. Flakiness itself is explicitly out of this AC's testable scope — monitored observationally post-merge, not a coverage gap.

---

## Test Data Strategy

**Source:** Fixtures — the fixture module itself is new code under test; its payloads are Synthetic (generated at call time with sensible defaults), consumed against the real `/test/seed-approval-journey` endpoint running in a `NODE_ENV=test` server instance (standard Playwright E2E setup for this repo).
**PCI/sensitivity in scope:** No.
**Availability:** Available now — no new server-side endpoint required; the endpoint already exists and is already exercised by all 4 real callers today.
**Owner:** Self-contained — fixture generates its own default payload; migrated specs supply only the overrides they already passed inline before migration.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Default `featureSlug`/`stage` values for the fixture's own defaults (distinct from the server's own defaults — the fixture's job is to remove the need for callers to specify them at all) | Synthetic, hardcoded in the fixture | None | |
| AC2 | An `overrides` object, e.g. `{ stage: 'test-plan' }` | Synthetic | None | |
| AC3 | The real inline payloads currently hardcoded in `ep3-s1-regression.spec.js` (`stage: 'test-plan'`, 4 `completedStages`) and `ep2-s4-concurrent-merge.spec.js` (`stage: 'discovery'`, 1 `completedStages` entry) | Fixtures (existing repo files, migrated in place) | None | |
| AC4 | Pre-migration pass/fail baseline for both files (captured once, before the migration edit is made) | Synthetic (captured at implementation time via a baseline Playwright run) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — this story's deliverable is a Playwright E2E fixture; it has no meaning outside a running server + browser context, and jsdom cannot exercise a real `page.request.post`. Per ADR-018, this fixture is Playwright-devDependency-only; all tests for it are E2E tests (below), not unit tests. This is not a gap — it is the correct test layer for this class of code (see `templates/test-plan.md`'s own Gap types: a jsdom-incompatible-but-e2e-testable AC is `DOM-behaviour`, not applicable here since full E2E coverage exists).

---

## E2E Tests

### Fixture seeds an approval journey with sensible defaults and returns a usable journeyId

- **Verifies:** AC1
- **Precondition:** `tests/e2e/fixtures/seed-journey.js` does not exist yet (import fails).
- **Action:** `const { seedApprovalJourney } = require('./fixtures/seed-journey'); const result = await seedApprovalJourney(request);` (called from within a Playwright test, `request` = the Playwright `APIRequestContext`)
- **Expected result:** `result.journeyId` is a truthy, non-empty string. A follow-up `GET`/navigation to `/journey/<result.journeyId>/...` succeeds (HTTP 200), proving the seeded journey is real and addressable — not just a 200 response with no usable side effect.
- **Edge case:** No.

### Fixture accepts overrides and merges them over its own defaults

- **Verifies:** AC2
- **Precondition:** Fixture from AC1 exists.
- **Action:** `await seedApprovalJourney(request, { stage: 'test-plan', completedStages: [{ skillName: 'discovery' }, { skillName: 'benefit-metric' }, { skillName: 'definition' }, { skillName: 'review' }] });`
- **Expected result:** The seeded journey's `stage` reflects `'test-plan'` (confirmed by navigating to `/journey/<journeyId>/stage/definition/confirm-back` as `ep3-s1-regression.spec.js` itself does, and observing the confirm-back interstitial renders — proving the stage override took effect server-side, not just client-side).
- **Edge case:** No.

### Migrated spec ep3-s1-regression.spec.js passes unchanged after adopting the shared fixture

- **Verifies:** AC3
- **Components involved:** `tests/e2e/fixtures/seed-journey.js` (new) ↔ `tests/e2e/ep3-s1-regression.spec.js` (existing, migrated)
- **Precondition:** The spec's inline `page.request.post('/test/seed-approval-journey', {...})` block (lines 16-28) is replaced with a call to `seedApprovalJourney(page.request, { stage: 'test-plan', completedStages: [...] })`, preserving the exact same override values the file already passes today.
- **Action:** `npx playwright test tests/e2e/ep3-s1-regression.spec.js`
- **Expected result:** All of this file's existing assertions (confirm-back interstitial visible, reason field, submit behaviour) pass exactly as they did before migration.
- **Edge case:** No.

### Migrated spec ep2-s4-concurrent-merge.spec.js passes unchanged after adopting the shared fixture

- **Verifies:** AC3
- **Components involved:** `tests/e2e/fixtures/seed-journey.js` (new) ↔ `tests/e2e/ep2-s4-concurrent-merge.spec.js` (existing, migrated)
- **Precondition:** The spec's inline seed call (line 75, `stage: 'discovery'`, 1 `completedStages` entry) is replaced with `seedApprovalJourney(page.request, { stage: 'discovery', completedStages: [{ skillName: 'discovery' }] })`.
- **Action:** `npx playwright test tests/e2e/ep2-s4-concurrent-merge.spec.js`
- **Expected result:** All of this file's existing assertions pass exactly as they did before migration.
- **Edge case:** No.

### Both migrated specs produce the same pass/fail outcome as their pre-migration baseline

- **Verifies:** AC4 (as revised — deterministic claim only; see story amendment)
- **Precondition:** A baseline run of both specs is captured before the migration edit is made (implementation-time step, not a standing CI test).
- **Action:** `npx playwright test tests/e2e/ep3-s1-regression.spec.js tests/e2e/ep2-s4-concurrent-merge.spec.js` — run once before migration (baseline), once after (post-migration).
- **Expected result:** Identical pass/fail outcome for both files in both runs (both fully passing before and after, since neither file's assertions changed). Flakiness across multiple runs is observed, not asserted, per the AC's revised scope.
- **Edge case:** Yes — this is the direct test of the AC4 collision class the review finding flagged.

---

## Integration Tests

None beyond the E2E tests above — this story's only seam (fixture ↔ real `/test/seed-approval-journey` endpoint ↔ real `journey-store` module) is already exercised end-to-end by the E2E tests; there is no narrower integration layer to test separately without a running server, which the E2E tests already require.

---

## NFR Tests

None — confirmed with story owner. The story's NFRs section states "None identified" for Performance and Accessibility/Audit, and Security is satisfied structurally by the existing `NODE_ENV === 'test'` guard on the real server route (already covered by `src/web-ui/server.js:2663`'s own existing condition — this story adds no new production code path to test).

---

## Out of Scope for This Test Plan

- Testing the other 1-2 real callers of `/test/seed-approval-journey` beyond this 2-file proof-of-pattern batch — fast-follow (see discovery.md Out of Scope item 1).
- Testing any of the 8 non-journey-related `/test/seed-*` endpoints — out of this epic entirely.
- Multi-run flakiness measurement — explicitly out of AC4's revised testable scope; monitored observationally post-merge.

---

## Test Gaps and Risks

None.
