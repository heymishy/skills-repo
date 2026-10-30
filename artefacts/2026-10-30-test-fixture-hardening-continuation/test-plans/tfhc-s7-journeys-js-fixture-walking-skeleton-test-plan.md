## Test Plan: Extract a shared mockReq/mockRes fixture module for journeys.js tests

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s7-journeys-js-fixture-walking-skeleton.md
**Epic reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/epics/fixture-divergence-closure.md
**Test plan author:** Copilot
**Date:** 2026-10-31

**Test runner (confirmed from `package.json`):** `npm test` → `node scripts/run-all-tests.js`. Run individually via `node tests/check-journeys-fixture-self-test.js` and `node tests/check-ep3-s2-journey-health.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Fixture module exports a factory with a default session shape grounded in journeys.js's real reads | 1 | — | — | — | — | 🟢 |
| AC2 | Self-test asserts default shape + overrides merge correctly | 2 | — | — | — | — | 🟢 |
| AC3 | Proof-of-pattern migration preserves existing assertions | — | 1 | — | — | — | 🟢 |
| AC4 | Structural check correctly distinguishes hand-rolled vs migrated files | 2 | — | — | — | — | 🟢 |
| AC5 | Check wired into /review as Category H, correctly updated at both category-count locations | — | 1 | — | — | — | 🟢 |

---

## Coverage gaps

None. All 5 ACs are mechanically verifiable — this story's own shape (fixture module, self-test, one migration, structural checker, `/review` wiring) mirrors `tsir-s1`/`s2`/`s3` and `tfhc-s3`'s already-proven, already-testable pattern exactly.

---

## Test Data Strategy

**Source:** Fixtures (existing real files) — the subject matter is the real `journeys.js` route handlers (`src/web-ui/routes/journeys.js`) and the real test file chosen for proof-of-pattern migration.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained — this story produces the fixture module and self-test itself.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `journeys.js`'s real `req.session` reads (confirmed via `grep -n "req\.session\." src/web-ui/routes/journeys.js`: exactly one field, `tenantId`, across all 13 handler sites) | Fixtures (existing real file) | None | `csrfToken` is read by a separate CSRF middleware wrapping CSRF-guarded routes, not by `journeys.js`'s own handlers — correctly excluded from the fixture's default shape, matching `journey-fixture.js`'s own precedent (which also excludes `csrfToken` from its default) |
| AC2 | The fixture module's own exported function, once written | Fixtures (the module itself) | None | |
| AC3 | `tests/check-ep3-s2-journey-health.js` (chosen as the proof-of-pattern candidate: exactly 1 inline session literal, `{ tenantId: 't1' }`, no `csrfToken` complexity — confirmed by direct read; 6 tests, all passing today) | Fixtures (existing real file) | None | |
| AC4 | Two small fixture test-data files mirroring the `tsir-s3`/`tfhc-s3` precedent pair (a hand-rolled-literal sample, a shared-fixture-usage sample) | Fixtures (new, created by this story) | None | |
| AC5 | `skills/review/SKILL.md`'s own source text | Fixtures (existing real file) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Factory returns a mockReq with journeys.js's real default session shape

- **Verifies:** AC1
- **Precondition:** `tests/helpers/journeys-fixture.js` does not exist yet.
- **Action:** Once written, call `journeysFixture()` with no arguments.
- **Expected result:** Returns an object with `session.tenantId` set to a non-empty default string, and no other session fields beyond what `journeys.js`'s own route code reads (confirmed: `tenantId` only).
- **Edge case:** No.

### Self-test re-derives journeys.js's real session fields from source, not hardcoded

- **Verifies:** AC2
- **Precondition:** Fixture module exists.
- **Action:** `tests/check-journeys-fixture-self-test.js` greps `src/web-ui/routes/journeys.js`'s own source for `req\.session\.([a-zA-Z]+)` at test-run time (same independently-re-derived-at-test-time technique `tfhc-s3`'s own self-test introduced over the earlier `journey-fixture` precedent), then asserts `journeysFixture().session` has every field found.
- **Expected result:** Every independently-re-derived field (`tenantId`) is present and non-empty in the fixture's default session.
- **Edge case:** Yes — a false pass would be a self-test that hardcodes the field list instead of re-deriving it from source; this test's own structure prevents that by construction.

### Self-test confirms overrides merge without discarding other defaults

- **Verifies:** AC2
- **Precondition:** Fixture module exists.
- **Action:** Call `journeysFixture({ params: { id: 'j1' } })`.
- **Expected result:** Returned object has `params.id === 'j1'` AND `session.tenantId` still set to the default — overrides merge additively, not by replacing the whole object.
- **Edge case:** Yes — a false pass would be an override that silently drops the default session entirely.

### Structural check flags a hand-rolled inline session literal

- **Verifies:** AC4
- **Precondition:** `scripts/check-journeys-fixture-usage.js` exists; a fixture test-data file with a hand-rolled `const req = { session: { tenantId: ... } }` inline literal exists (mirrors `tests/fixtures/tsir-s3-hand-rolled-mockreq.js`'s own precedent pair).
- **Action:** Run the check against the hand-rolled fixture file.
- **Expected result:** Exits non-zero; names `tests/helpers/journeys-fixture.js` as the fix.
- **Edge case:** Yes — the detection regex must match an ad-hoc inline literal (`(?:const|var|let)\s+req\s*=\s*\{[^}]*session\s*:`), not just a named `mockReq` factory function — this is the broadened pattern `tfhc-s5`'s own spike found necessary, since 0 of the 30 real `journeys.js` consumers use even a local factory.

### Structural check passes a file using the shared fixture

- **Verifies:** AC4
- **Precondition:** Check script exists; a fixture test-data file importing and using `journeysFixture()` exists.
- **Action:** Run the check against the compliant fixture file.
- **Expected result:** Exits 0, no findings.
- **Edge case:** No.

---

## Integration Tests

### Migrated file's existing assertions pass unchanged

- **Verifies:** AC3
- **Components involved:** `tests/check-ep3-s2-journey-health.js` ↔ `tests/helpers/journeys-fixture.js` (new)
- **Precondition:** Baseline run of `tests/check-ep3-s2-journey-health.js` recorded (6 passed, 0 failed, confirmed fresh 2026-10-31).
- **Action:** Replace the file's inline `{ session: { tenantId: 't1' }, params: { id: 'j1' } }` literal with `journeysFixture({ params: { id: 'j1' } })`, then re-run the file.
- **Expected result:** 6 passed, 0 failed — identical outcome to the pre-migration baseline.

### Category H wired into /review at both required locations

- **Verifies:** AC5
- **Components involved:** `scripts/check-journeys-fixture-usage.js` ↔ `skills/review/SKILL.md`
- **Precondition:** Check script exists; `skills/review/SKILL.md` currently has Categories A-G (7 categories), per the current entry-point text.
- **Action:** After the edit, grep `skills/review/SKILL.md` for the category-count/letter-range string at (a) the Step 1 announcement line and (b) the `rssp-s1` operational instruction.
- **Expected result:** Both locations read "8 categories (A-H)" (or equivalent), not just one — this is the exact two-location requirement `tfhc-s3`'s own Critical code-quality finding caught being missed in only one of the two places.

---

## NFR Tests

### Self-test and structural check both complete in well under 1 second

- **NFR addressed:** Performance
- **Measurement method:** Timed as part of `node scripts/run-all-tests.js`'s own per-file timing output.
- **Pass threshold:** < 1 second each.
- **Tool:** Node.js built-in (no load-testing tool needed — plain object factory / grep-based pattern match, no network or DB access).

---

## Out of Scope for This Test Plan

- Testing the substantive correctness of any `journeys.js` behaviour beyond fixture usage — this story changes test infrastructure, not production code.
- Migrating any of the other 29 hand-rolled `journeys.js` files — out of scope per the story's own Out of Scope section.
- `products.js`'s separately-confirmed duplication — a distinct fast-follow, not this story's concern.

---

## Test Gaps and Risks

None. Every AC in this story is mechanically testable using the same proven shape as `tsir-s1`/`s2`/`s3` and `tfhc-s3`, all 4 of which have already shipped and passed their own equivalent test plans cleanly.
