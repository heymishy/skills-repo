## Test Plan: Extend journeys.js/products.js fixture adoption and DRY-extract the fixture-usage-check scripts

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s3-mechanical-fixture-dry-batch.md
**Epic reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/epics/test-infra-fast-follow-batch.md
**Test plan author:** Copilot
**Date:** 2026-11-01

**Test runner confirmed from `package.json`:** `"test": "node scripts/run-all-tests.js"` — plain Node, same convention as every prior walking-skeleton story in this lineage (`tfhc-s1/s2/s3/s7`).

**Test data strategy:** Synthetic — all new fixtures are tiny, self-contained Node scripts, same convention as the parent epic's own stories. No PCI/sensitive data, no real production data.

**E2E / browser-layout scan:** N/A — no rendered UI, pure test-infrastructure/script work.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | 3-5 `journeys.js` files migrated, assertions unchanged | — | 3-5 tests | — | — | — | 🟢 |
| AC2 | `products.js` walking skeleton + 1 migration | 3 tests | 1 test | — | — | — | 🟢 |
| AC3 | `products.js` structural check flags hand-rolled, passes migrated | 2 tests | — | — | — | — | 🟢 |
| AC4 | DRY refactor — `journey.js`/`journeys.js` existing coverage unchanged, `skills.js` gets new coverage created | 2 tests (new) | 0 regressions (existing) | — | — | — | 🟢 |
| AC5 | Shared factory retains the `journeys.js` windowed-match fix | 1 test (existing, re-run) | — | — | — | — | 🟢 |

**No gaps** — every AC in this story is directly testable, consistent with it being the epic's own lowest-risk, most-proven-pattern story (Complexity Rating 1).

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | 3-5 real `journeys.js`-touching files, chosen during implementation | Real repo files | None | Same migration pattern as `tfhc-s7` |
| AC2 | A new `tests/helpers/products-fixture.js`, self-test, structural check, 1 real migration | New synthetic files + 1 real file | None | Same walking-skeleton shape as `tfhc-s1/s3/s7` |
| AC3 | A hand-rolled `products.js` fixture file + the migrated compliant one | New synthetic fixtures | None | Mutation-test pair, same gold-standard shape |
| AC4 | The 3 existing scripts' own regression fixtures (2 of 3 already exist); a new pair for `check-skills-fixture-usage.js` | Existing + new synthetic fixtures | None | See decisions.md's 2026-11-01 SCOPE entry for why the `skills.js` pair is newly created here |
| AC5 | `tests/fixtures/tfhc-s7-hand-rolled-mockreq-session-not-first.js` (already exists) | Existing fixture | None | Re-run against the refactored shared factory |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `products-fixture.js` self-test: field coverage, fresh-object-per-call, overrides-merge

- **Verifies:** AC2
- **Precondition:** New `tests/helpers/products-fixture.js` module exists.
- **Action:** Call `productsFixture()` twice with no args, then once with an `overrides` object.
- **Expected result:** (a) the default session shape matches `products.js`'s own real session field usage (grounded in a direct read of the real handler code, same discipline as `journeys.js`'s own fixture); (b) the two no-args calls return distinct object instances (no shared mutable state); (c) the overrides are merged into the returned object, not replacing it wholesale.
- **Edge case:** No.

### `check-products-fixture-usage.js` flags a hand-rolled fixture and passes a migrated file

- **Verifies:** AC3
- **Precondition:** A fixture file with an inline hand-rolled session literal, and the real migrated file using `productsFixture()`.
- **Action:** Run the structural check against each.
- **Expected result:** Exits non-zero (flags it) for the hand-rolled fixture; exits zero for the migrated file.
- **Edge case:** Yes — this is the mutation-test pair proving the check has real detection power, same gold-standard shape as `tsir-s3`/`tfhc-s7`.

### `check-skills-fixture-usage.js`'s new regression-fixture pair (closing the pre-existing coverage gap)

- **Verifies:** AC4
- **Precondition:** A new hand-rolled-fixture file and a compliant-fixture file for the `skills.js` shape (mirroring the existing `journey.js`/`journeys.js` pairs' own structure).
- **Action:** Run `check-skills-fixture-usage.js` against each, before and after the DRY refactor.
- **Expected result:** Flags the hand-rolled one, passes the compliant one — both before the refactor (proving the new fixtures are valid) and after (proving the shared factory preserves this behaviour).
- **Edge case:** Yes — this is net-new coverage, not a re-run of something pre-existing.

---

## Integration Tests

### Each of the 3-5 migrated `journeys.js` files' own existing assertions pass unchanged

- **Verifies:** AC1
- **Components involved:** The migrated test file, `tests/helpers/journeys-fixture.js`
- **Precondition:** Each file's own pre-migration pass count recorded.
- **Action:** Run each migrated file directly.
- **Expected result:** Identical pass count to before migration, zero new failures.

### `products.js`'s 1 proof-of-pattern migration's own existing assertions pass unchanged

- **Verifies:** AC2
- **Components involved:** The migrated file, the new `products-fixture.js`
- **Precondition:** The file's own pre-migration pass count recorded.
- **Action:** Run the migrated file directly.
- **Expected result:** Identical pass count to before migration.

### `check-journey-fixture-usage.js`'s and `check-journeys-fixture-usage.js`'s existing regression fixtures produce identical verdicts after the DRY refactor

- **Verifies:** AC4 (the "no regression" half)
- **Components involved:** `scripts/lib/make-fixture-usage-check.js`, both scripts' own existing dedicated regression-fixture test files (`tests/check-tsir-s3-journey-fixture-usage-check.js`, `tests/check-tfhc-s7-journeys-fixture-usage-check.js`)
- **Precondition:** Both files pass today, before the refactor.
- **Action:** Run both after the refactor.
- **Expected result:** Both still pass, identical verdicts to before.

---

## NFR Tests

### Performance — self-test/structural-check execution time

- **NFR addressed:** Performance
- **Measurement method:** Timed manual run.
- **Pass threshold:** < 1 second per file, same precedent as every prior walking-skeleton story.
- **Tool:** Manual timing (plain object factory / grep-based pattern match, no network/DB access — inherently fast).

### Security — None identified

No new production code path. No NFR test written — confirmed with story owner.

### Accessibility — N/A

No UI.

### Audit — N/A

No audit-relevant surface.

---

## Out of Scope for This Test Plan

- Full completion of the `journeys.js` retrofit beyond the 3-5 file batch — out of scope per the story itself.
- `products.js`'s full retrofit beyond the 1 proof-of-pattern migration.

---

## Test Gaps and Risks

None — every AC in this story has direct, automated coverage.
