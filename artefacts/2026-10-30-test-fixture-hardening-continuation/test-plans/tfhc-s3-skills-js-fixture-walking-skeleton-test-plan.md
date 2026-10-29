## Test Plan: Extract a shared mockReq/mockRes fixture module for skills.js tests

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s3-skills-js-fixture-walking-skeleton.md
**Epic reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/epics/fixture-divergence-closure.md
**Test plan author:** Copilot
**Date:** 2026-10-30

**Test runner (confirmed from `package.json`):** `npm test` → `node scripts/run-all-tests.js` (plain Node.js `assert` + this repo's `test(name, fn)` convention). Run individually via `node tests/check-skills-fixture-self-test.js`.

**Precedent followed:** `tsir-s1`/`s2`/`s3` combined (fixture + self-test + structural check + `/review` wiring), applied to `skills.js` instead of `journey.js`. Real `req.session` field list independently confirmed via `grep -n "req\.session\." src/web-ui/routes/skills.js`: `tenantId`, `accessToken`, `userId`, `login`, `role` — identical field set to `journey.js`'s own fixture.

**Real migration target confirmed:** `tests/check-dic1-story-cards.js` (lines 169-179) hand-rolls a local `mockReq`/`mockRes` pair and calls `handleGetChatHtml(mockReq, mockRes)` — selected as the AC3 proof-of-pattern migration target.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Fixture module exports a factory with default session shape grounded in skills.js's real reads | 2 | — | — | — | — | 🟢 |
| AC2 | Self-test asserts default shape + overrides-merge behaviour | 1 | — | — | — | — | 🟢 |
| AC3 | One existing hand-rolled file migrated, assertions pass unchanged | — | 1 | — | — | — | 🟢 |
| AC4 | Structural check flags hand-rolled file, passes migrated file | 1 | — | — | — | — | 🟢 |
| AC5 | Check wired into /review as a new named finding category | — | 1 | — | — | — | 🟢 |

---

## Coverage gaps

None. Unlike `tsir-s2`'s own AC2, this story does not require a standing mutation-test-proof test (that discipline already exists for `check-journey-fixture-usage.js`'s sibling script in `tsir-s3`; `check-skills-fixture-usage.js` follows the exact same shape and is covered by the same reasoning, not re-derived here).

---

## Test Data Strategy

**Source:** Synthetic (fixture module itself) + Fixtures (migration target and structural-check fixture files).
**PCI/sensitivity in scope:** No.
**Availability:** Available now — no dependency on anything outside this story.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Real field list `skills.js` reads from `req.session`: `tenantId`, `accessToken`, `userId`, `login`, `role` (confirmed via grep, independent of `journey.js`'s own fixture — same field set, separately verified, not copy-pasted trust) | Synthetic, hardcoded in the fixture | None | |
| AC2 | An overrides object, e.g. `{ session: { tenantId: 'other-tenant' } }` | Synthetic | None | |
| AC3 | `tests/check-dic1-story-cards.js`'s existing hand-rolled `mockReq`/`mockRes` (lines 169-179), migrated in place | Fixtures (existing repo file) | None | |
| AC4 | `tests/fixtures/tfhc-s3-hand-rolled-mockreq.js` (new, non-compliant) and `tests/fixtures/tfhc-s3-shared-fixture-usage.js` (new, compliant) — same two-fixture shape as `tsir-s3`'s own test data | Fixtures (new, authored by this story) | None | |
| AC5 | `skills/review/SKILL.md`'s own source text | Fixtures (existing real file) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### skillsFixture() default session includes every field skills.js actually reads

- **Verifies:** AC1
- **Precondition:** `tests/helpers/skills-fixture.js` does not exist yet (fails to require).
- **Action:** `const { skillsFixture } = require('../tests/helpers/skills-fixture'); const req = skillsFixture();`
- **Expected result:** `req.session` has own properties `tenantId`, `accessToken`, `userId`, `login`, `role`, each a defined, non-null value.
- **Edge case:** No.

### skillsFixture() returns a fresh object on every call, not a shared reference

- **Verifies:** AC1 (robustness — same precedent as `tsir-s1`'s equivalent test)
- **Precondition:** None.
- **Action:** Call `skillsFixture()` twice, mutate the first result's `session.tenantId`, then re-read the second result.
- **Expected result:** The second call's `session.tenantId` is unaffected by the first call's mutation.
- **Edge case:** Yes.

### Self-test asserts default shape and overrides-merge semantics, independently re-derived from skills.js source

- **Verifies:** AC2
- **Precondition:** `tests/helpers/skills-fixture.js` exists (from this story's own AC1).
- **Action:** `node tests/check-skills-fixture-self-test.js` — internally, re-runs `grep -n "req\.session\." src/web-ui/routes/skills.js` independently (not trusting the fixture module's own field list) to confirm the field set, then asserts `skillsFixture().session` has all five fields, and that `skillsFixture({ session: { tenantId: 'override-value' } })` merges correctly without discarding the other four defaults.
- **Expected result:** All assertions pass; exit code 0.
- **Edge case:** No.

### Structural check flags a file that hand-rolls its own mockReq instead of using the shared fixture

- **Verifies:** AC4
- **Precondition:** `tests/fixtures/tfhc-s3-hand-rolled-mockreq.js` exists — a test file that requires `skills.js` and defines its own local `mockReq` without importing the shared fixture.
- **Action:** `node scripts/check-skills-fixture-usage.js tests/fixtures/tfhc-s3-hand-rolled-mockreq.js`
- **Expected result:** Non-zero exit code; output names the fixture file's path and `tests/helpers/skills-fixture.js` as the fix.
- **Edge case:** No.

### Structural check passes a file that correctly uses the shared fixture

- **Verifies:** AC4
- **Precondition:** `tests/fixtures/tfhc-s3-shared-fixture-usage.js` exists — a test file that requires `skills.js` and uses `skillsFixture(...)`.
- **Action:** `node scripts/check-skills-fixture-usage.js tests/fixtures/tfhc-s3-shared-fixture-usage.js`
- **Expected result:** Exit code 0, no findings reported.
- **Edge case:** No.

---

## Integration Tests

### Migrated check-dic1-story-cards.js passes unchanged after adopting the shared fixture

- **Verifies:** AC3
- **Components involved:** `tests/helpers/skills-fixture.js` (new) ↔ `tests/check-dic1-story-cards.js` (existing, migrated)
- **Precondition:** `tests/check-dic1-story-cards.js`'s hand-rolled `mockReq`/`mockRes` (lines 169-179) is replaced with `skillsFixture(...)` calls, preserving every override its existing assertions depend on.
- **Action:** `node tests/check-dic1-story-cards.js`
- **Expected result:** Exit code 0, same pass count as before migration.

### /review surfaces a hand-rolled-fixture finding as a distinct category when run against a skills.js-touching story

- **Verifies:** AC5
- **Components involved:** `scripts/check-skills-fixture-usage.js` (new) ↔ `skills/review/SKILL.md` (existing, edited)
- **Precondition:** `skills/review/SKILL.md` has been edited to invoke the check script and surface its result as a named finding category, mirroring Category F's own existing wording for `check-journey-fixture-usage.js` (`skills/review/SKILL.md:190-200`).
- **Action:** Read `skills/review/SKILL.md`'s own source text.
- **Expected result:** The file's content references `check-skills-fixture-usage.js` (or the real script path) and names it as a distinct finding category with its own applicability rule (e.g. "applies only when a story's touched files include a test file that requires `src/web-ui/routes/skills`"), not folded silently into Category F's existing journey.js-specific prose.

---

## NFR Tests

### Self-test and structural check both complete in well under 1 second

- **NFR addressed:** Performance (story NFRs)
- **Measurement method:** Structural, not timing-based — assert both files' own source contains no network call (`require('http')`/`require('https')`), no database/connection-pool usage, and operates via synchronous or simple in-memory logic only (same reasoning as `tsir-s2`/`tsir-s3`'s own NFR tests, avoiding the `pcr-s1` wall-clock-timing flakiness precedent).
- **Pass threshold:** No network/DB calls present in source.
- **Tool:** Source-text inspection test, same file as the Unit tests above.

### No new production code path is introduced

- **NFR addressed:** Security (story NFRs — "the module lives under `tests/helpers/` or `scripts/` only")
- **Measurement method:** Structural — assert `tests/helpers/skills-fixture.js` and `scripts/check-skills-fixture-usage.js` are the only new files, and neither is `require`d from any file under `src/`.
- **Pass threshold:** Zero `require` references to either new file from any file under `src/`.
- **Tool:** `grep -rl "skills-fixture\|check-skills-fixture-usage" src/` returning no results.

---

## Out of Scope for This Test Plan

- Testing the check against the other 11 hand-rolled `skills.js` files beyond the 1 proof-of-pattern migration — fast-follow (see discovery.md Out of Scope item 1).
- Testing a `/definition-of-ready` hard-block version of this check — trigger-based, not in scope (see discovery.md Out of Scope item 5).

---

## Test Gaps and Risks

None.
