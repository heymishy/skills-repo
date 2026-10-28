## Test Plan: Derive capture target (URL + selector) from a story's own E2E spec

**Story reference:** artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s1-derive-capture-target-from-e2e-spec.md
**Date:** 2026-10-28
**Test runner:** confirmed from `package.json`'s `scripts.test` — `node scripts/run-all-tests.js` (this repo's own convention; every `tests/check-*.js` file is a standalone Node script, no Jest/Mocha).
**Test data strategy:** Synthetic — fixture spec-file text strings constructed in test setup (same convention `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` already uses). No real E2E spec files are read in this story's own tests; actr-s2/actr-s3 are where real repo content enters via the adapter.

## AC Coverage

| AC | Description | Verification method |
|----|-------------|---------------------|
| AC1 | Selector-half parity with existing `deriveSelectorFromSpec` | Unit test: run the new function and the existing `deriveSelectorFromSpec` against the same fixture, assert identical `selector` |
| AC2 | URL derived from a `page.goto('/relative/path')` call appearing after the AC's own tag | Unit test: fixture matching the real `fpd-s4-caption-sync.spec.js` shape (tag, then `goto`, then `locator`, in that order), assert `url` matches |
| AC2b | Scan is bounded — a later AC's own `goto` is never attributed to an earlier AC in the same file | Unit test: fixture with two AC-tagged sections, each with its own `goto`; assert the first AC's result carries only its own `goto` value |
| AC3 | Absolute/non-relative `goto` value rejected | Unit test: fixture with `page.goto('https://evil.example.com/x')` after the AC tag, assert `url: null` |
| AC4 | No AC tag match returns `null`, never throws | Unit test: fixture with no matching AC tag, assert return value is `null` and no exception is thrown |
| AC5 | No regression in existing `rpca-s2` suite after relocation | Run `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` unchanged against the relocated module, assert all existing assertions still pass |

## Unit Tests

1. **`derivesSelectorMatchingExistingBehaviour`** (AC1) — Precondition: fixture spec text with `// (actr-fixture AC1)` followed by `page.goto('/playback/actr-fixture')` then `page.locator('.actr-target')` (matching the real `fpd-s4-caption-sync.spec.js` ordering: tag, then goto, then locator). Action: call `deriveCaptureTargetFromSpec(fixture, 'AC1')`. Expected: `selector: '.actr-target'` — identical to what `deriveSelectorFromSpec` returns against the same fixture.
2. **`derivesUrlFromGotoAfterTag`** (AC2) — Precondition: same fixture as test 1. Action: same call. Expected: `url: '/playback/actr-fixture'`.
3. **`doesNotFindUrlWhenGotoPrecedesTag`** (AC2, regression guard for the corrected design) — Precondition: fixture with a `page.goto('/should-not-be-used')` call placed BEFORE the AC1 tag (the originally-assumed, now-disproven direction), and no `goto` after the tag. Action: same call. Expected: `url: null` — a preceding `goto` must never be picked up; this is the direction correction itself, made explicit as a test rather than left implicit.
4. **`boundsScanToThisAcsOwnSection`** (AC2b) — Precondition: fixture with two AC-tagged sections in one file, each with its own tag, `goto`, and `locator` (mirroring `jcx-s3-emotion-curve.spec.js`'s multi-test shape but with literal, resolvable `goto` calls in both sections). Action: call for `AC1` and separately for `AC2`. Expected: `AC1`'s result carries AC1's own `goto`/`locator` values only; `AC2`'s result carries AC2's own values only — neither leaks into the other.
5. **`rejectsAbsoluteGotoUrl`** (AC3) — Precondition: fixture with `page.goto('https://evil.example.com/x')` after the AC1 tag. Action: same call. Expected: `url: null` — the absolute value is never returned.
6. **`rejectsProtocolRelativeGotoUrl`** (AC3, edge case) — Precondition: fixture with `page.goto('//evil.example.com/x')` after the tag. Action: same call. Expected: `url: null` — protocol-relative is not "relative" for this guard's purposes (it still changes host).
7. **`returnsNullForUnmatchedAc`** (AC4) — Precondition: fixture with no `(actr-fixture AC9)` tag anywhere. Action: call with `acId: 'AC9'`. Expected: `null`, no exception.
8. **`realFpdS4FixtureResolvesBothUrlAndSelector`** (AC2, real-file confirmation) — Precondition: read the real `tests/e2e/fpd-s4-caption-sync.spec.js` file content. Action: call `deriveCaptureTargetFromSpec(content, 'AC3')`. Expected: `{ acId: 'AC3', url: '/playback/some-dod-complete-feature-with-a-real-package', selector: '.playback-ac__video' }` — the design's own motivating real-world case, not just synthetic fixtures.
9. **`relocatedModuleMatchesExistingSuite`** (AC5) — Action: re-point `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`'s import at the new shared module's exported selector-only path (or confirm `scripts/playback-capture.js` re-exports the relocated function under its old name for that suite). Expected: all existing assertions in that file still pass unchanged.

## Integration Tests

None — this story is pure parsing logic with no seam to another component. Integration coverage belongs to `actr-s2` (web-ui route + adapter) and `actr-s3` (bulk flow).

## NFR Tests

- **NFR-Security (relative-path guard):** covered by AC3's own tests 4 and 5 above — no separate NFR test needed; the AC tests already assert the exact security-relevant outcome (absolute/protocol-relative URLs never pass through).
- **NFR-Performance:** None — confirmed no threshold applies (pure in-memory parsing).

## Gap Table

No gaps. All 6 ACs (including AC2b) have at least one test; AC2 has 3 tests (primary case, the explicit direction-correction regression guard, and a real-file confirmation against `fpd-s4-caption-sync.spec.js`), AC3 has 2 edge-case tests.
