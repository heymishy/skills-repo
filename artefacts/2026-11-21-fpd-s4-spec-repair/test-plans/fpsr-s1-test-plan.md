## Test Plan: The caption-sync E2E spec opens a playback page that exists, so it passes instead of failing to find a video

**Story reference:** artefacts/2026-11-21-fpd-s4-spec-repair/stories/fpsr-s1-playback-spec-real-feature.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. The E2E spec is not in the chain (ADR-018); run with `NODE_ENV=test E2E_LOCAL_SUITE=true npx playwright test tests/e2e/fpd-s4-caption-sync.spec.js`. No new node check is written: the spec is the test, and the existing `check-actr-s1-capture-target-derivation.js` real-file test covers the spec's URL and selector.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Risk |
|----|-------------|------|-------------|-----|--------|------|
| AC1 | Spec fails on master, passes after, 3 of 3 runs | - | - | existing (1 test) | M1: run before and after | 🟡 |
| AC2 | Only the goto URL and a comment changed | - | - | - | M2: diff read | 🟢 |
| AC3 | The actr-s1 real-file test and the rpca-s2 check pass | existing (`check-actr-s1`, 11 tests; `check-rpca-s2`, 8 tests) | - | - | M3: run both | 🟢 |
| AC4 | Spec passes in CI; matrix move; CI on the final commit | - | - | CI report | M4: read `pw-report-json`; M6: CI on the final commit | 🟡 |
| AC5 | Changed files as stated, on the pull request and on master | - | - | - | M5: diff check | 🟢 |

## Red first

On master the spec fails (measured 2026-11-21): `.playback-ac__video` not found. `check-actr-s1` T-AC2 (real file) is changed together with the spec: with only the spec changed it fails (expects the old URL), so it is the red check that the expectation follows the spec; after both changes 11 of 11 pass.

## Manual steps

- **M1:** run the spec alone on master (fails) and after the change (3 runs, all pass).
- **M2:** read the spec diff: URL line and comment only.
- **M3:** run `check-actr-s1-capture-target-derivation.js` and `check-rpca-s2-selector-derivation-from-e2e-specs.js`.
- **M4:** after the draft pull request's CI run, read the E2E report: `fpd-s4` 1 of 1.
- **M5:** list changed files on the pull request and on master after the merge.
- **M6:** confirm a CI run exists on the final commit before the merge is requested.

## Gaps

The spec depends on committed evidence under `artefacts/2026-10-11-journey-cx-redesign/playback/jcx-s3/`; if that evidence is moved or removed the spec fails loudly. Chromium plays the WebM in this local run; CI is the authoritative measurement for its own browser build.
