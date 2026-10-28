## Test Plan: Derive capture target (URL + selector) from a story's own E2E spec

**Story reference:** artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s1-derive-capture-target-from-e2e-spec.md
**Date:** 2026-10-28
**Test runner:** confirmed from `package.json`'s `scripts.test` — `node scripts/run-all-tests.js` (this repo's own convention; every `tests/check-*.js` file is a standalone Node script, no Jest/Mocha).
**Test data strategy:** Synthetic — fixture spec-file text strings constructed in test setup (same convention `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` already uses). No real E2E spec files are read in this story's own tests; actr-s2/actr-s3 are where real repo content enters via the adapter.

## AC Coverage

| AC | Description | Verification method |
|----|-------------|---------------------|
| AC1 | Selector-half parity with existing `deriveSelectorFromSpec` | Unit test: run the new function and the existing `deriveSelectorFromSpec` against the same fixture, assert identical `selector` |
| AC2 | URL derived from nearest preceding `page.goto('/relative/path')` | Unit test: fixture with `goto` in a `beforeEach`-shaped block above the AC-tagged locator, assert `url` matches |
| AC3 | Absolute/non-relative `goto` value rejected | Unit test: fixture with `page.goto('https://evil.example.com/x')` preceding the AC tag, assert `url: null` |
| AC4 | No AC tag match returns `null`, never throws | Unit test: fixture with no matching AC tag, assert return value is `null` and no exception is thrown |
| AC5 | No regression in existing `rpca-s2` suite after relocation | Run `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` unchanged against the relocated module, assert all existing assertions still pass |

## Unit Tests

1. **`derivesSelectorMatchingExistingBehaviour`** (AC1) — Precondition: fixture spec text with `// (actr-fixture AC1)` followed by `page.locator('.actr-target')`. Action: call `deriveCaptureTargetFromSpec(fixture, 'AC1')`. Expected: `{ acId: 'AC1', url: null, selector: '.actr-target' }` when no `goto` is present (selector-only case, matching today's behaviour exactly).
2. **`derivesUrlFromPrecedingGoto`** (AC2) — Precondition: fixture with `test.beforeEach(async ({ page }) => { await page.goto('/playback/actr-fixture'); });` followed later by the AC1 tag + locator. Action: same call. Expected: `url: '/playback/actr-fixture'`, `selector` unchanged from test 1.
3. **`derivesUrlFromNearestGotoWhenMultiplePresent`** (AC2, edge case) — Precondition: fixture with two `goto` calls for two different tests, each preceding its own AC tag. Action: call for each `acId`. Expected: each AC gets the `goto` nearest to (preceding) its own tag, not the first `goto` in the file.
4. **`rejectsAbsoluteGotoUrl`** (AC3) — Precondition: fixture with `page.goto('https://evil.example.com/x')` preceding the AC1 tag. Action: same call. Expected: `url: null` — the absolute value is never returned.
5. **`rejectsProtocolRelativeGotoUrl`** (AC3, edge case) — Precondition: fixture with `page.goto('//evil.example.com/x')`. Action: same call. Expected: `url: null` — protocol-relative is not "relative" for this guard's purposes (it still changes host).
6. **`returnsNullForUnmatchedAc`** (AC4) — Precondition: fixture with no `(actr-fixture AC9)` tag anywhere. Action: call with `acId: 'AC9'`. Expected: `null`, no exception.
7. **`relocatedModuleMatchesExistingSuite`** (AC5) — Action: re-point `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`'s import at the new shared module's exported selector-only path (or confirm `scripts/playback-capture.js` re-exports the relocated function under its old name for that suite). Expected: all existing assertions in that file still pass unchanged.

## Integration Tests

None — this story is pure parsing logic with no seam to another component. Integration coverage belongs to `actr-s2` (web-ui route + adapter) and `actr-s3` (bulk flow).

## NFR Tests

- **NFR-Security (relative-path guard):** covered by AC3's own tests 4 and 5 above — no separate NFR test needed; the AC tests already assert the exact security-relevant outcome (absolute/protocol-relative URLs never pass through).
- **NFR-Performance:** None — confirmed no threshold applies (pure in-memory parsing).

## Gap Table

No gaps. All 5 ACs have at least one test; AC2 and AC3 each have an edge-case test beyond their primary case.
