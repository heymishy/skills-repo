## Test Plan: Add a structural /review check flagging hand-rolled mockReq on journey.js-touching test files

**Story reference:** artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s3-structural-review-check-fixture-usage.md
**Epic reference:** artefacts/2026-10-29-test-suite-infra-refactor/epics/journey-js-shared-test-fixture.md
**Test plan author:** Copilot
**Date:** 2026-10-29

**Test runner (confirmed from `package.json`):** `npm test` → `node scripts/run-all-tests.js` (plain Node.js `assert` + this repo's `test(name, fn)` convention). Run individually via `node tests/check-tsir-s3-journey-fixture-usage-check.js`.

**Precedent followed:** `scripts/check-design-tokens.js` / `tests/check-design-tokens-scan.js` — same shape (a standalone grep-based Node.js script, unit-tested via two small fixture files: one compliant, one non-compliant).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Check flags a hand-rolled mockReq file | 1 | — | — | — | — | 🟢 |
| AC2 | Check passes a file using the shared fixture | 1 | — | — | — | — | 🟢 |
| AC3 | Check is wired into /review's own flow as a new finding category | — | 1 | — | — | — | 🟢 |
| AC4 | Check's pass/fail is tied to the actual pattern, not a fixed answer (mutation-test) | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

None. Unlike `tsir-s2`'s AC2, this story's equivalent mutation-test proof (AC4) is fully automatable: toggling a real fixture file's content between the two states and re-running the check is the check script's own normal operating mode, not a require-cache workaround.

---

## Test Data Strategy

**Source:** Fixtures — two small static files committed under `tests/fixtures/`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — fixtures are authored as part of this story's own implementation.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `tests/fixtures/tsir-s3-hand-rolled-mockreq.js` — a test file that requires `journey.js` and defines its own local `mockReq` object (e.g. `function mockReq() { return { session: { tenantId: 't1' } }; }`) without importing the shared fixture | Fixtures (new, authored by this story) | None | |
| AC2 | `tests/fixtures/tsir-s3-shared-fixture-usage.js` — a test file that requires `journey.js` and uses `journeyFixture(...)` from `tsir-s1`'s module | Fixtures (new, authored by this story) | None | |
| AC3 | `skills/review/SKILL.md`'s own source text | Fixtures (existing real file) | None | |
| AC4 | A temporary working copy of the AC1 fixture, mutated in-place during the test | Synthetic (generated at test-run time in a temp dir, cleaned up after) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Check flags a file that hand-rolls its own mockReq instead of using the shared fixture

- **Verifies:** AC1
- **Precondition:** `tests/fixtures/tsir-s3-hand-rolled-mockreq.js` exists with the content described above.
- **Action:** `node scripts/check-journey-fixture-usage.js tests/fixtures/tsir-s3-hand-rolled-mockreq.js` (or the equivalent exported function called directly, matching `check-design-tokens.js`'s own exported-function-plus-CLI-wrapper shape).
- **Expected result:** Non-zero exit code; stdout/stderr includes the fixture file's path and names `tests/helpers/journey-fixture.js` (or the real module path from `tsir-s1`) as the fix.
- **Edge case:** No.

### Check passes a file that correctly uses the shared fixture

- **Verifies:** AC2
- **Precondition:** `tests/fixtures/tsir-s3-shared-fixture-usage.js` exists with the content described above.
- **Action:** `node scripts/check-journey-fixture-usage.js tests/fixtures/tsir-s3-shared-fixture-usage.js`
- **Expected result:** Exit code 0, no findings reported.
- **Edge case:** No.

### Check's result flips from fail to pass when the hand-rolled pattern is actually removed (mutation-test)

- **Verifies:** AC4
- **Precondition:** A temp copy of the AC1 fixture file is made in a throwaway temp directory (not the committed fixture itself).
- **Action:** (1) Run the check against the temp copy unmodified — record result. (2) Edit the temp copy in place to replace the hand-rolled `mockReq` with a `journeyFixture(...)` call, matching the AC2 fixture's shape. (3) Run the check again against the now-edited temp copy.
- **Expected result:** Step 1 is non-zero (fails, same as AC1). Step 3 is exit 0 (passes) — proving the check's signal is tied to the real presence/absence of the pattern in that specific run, not a cached or fixed answer.
- **Edge case:** Yes — this is the mutation-test discipline from `.github/standards/testing/test-design-patterns.md`.

---

## Integration Tests

### /review surfaces a hand-rolled-fixture finding as a distinct category when run against a journey.js-touching story

- **Verifies:** AC3
- **Components involved:** `scripts/check-journey-fixture-usage.js` (new) ↔ `skills/review/SKILL.md` (existing, edited)
- **Precondition:** `skills/review/SKILL.md` has been edited to invoke the check script and surface its result as a named finding category (implementation detail left to the coding agent; this test asserts the observable outcome, not the exact wording).
- **Action:** Read `skills/review/SKILL.md`'s own source text.
- **Expected result:** The file's content references `check-journey-fixture-usage.js` (or the real script path) and contains language identifying it as a distinct finding category (e.g. a heading or bullet naming the check, not folded silently into an unrelated existing category's prose).

---

## NFR Tests

### Check completes in well under 1 second per file

- **NFR addressed:** Performance (story NFRs)
- **Measurement method:** Structural, not timing-based — assert the script's own source contains no network call (`require('http')`/`require('https')`), no database/connection-pool usage, and operates via synchronous or simple async file reads only (same reasoning as `tsir-s2`'s NFR test, avoiding the `pcr-s1` wall-clock-timing flakiness precedent).
- **Pass threshold:** No network/DB calls present in source.
- **Tool:** Source-text inspection test, same file as the Unit tests above.

---

## Out of Scope for This Test Plan

- Testing the check against `skills.js`/`products.js`/`journeys.js` consumers — out of scope for this story (see epic).
- Testing a `/definition-of-ready` hard-block version of this check — not built in this story; promotion is a next-slice decision per `decisions.md`.

---

## Test Gaps and Risks

None.
