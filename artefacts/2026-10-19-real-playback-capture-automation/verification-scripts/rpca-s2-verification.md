# AC Verification Script: Selector derivation generalises beyond one AC, with a manual fallback for ACs with no E2E coverage

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s2-selector-derivation-from-e2e-specs.md
**Technical test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s2-test-plan.md
**Script version:** 1
**Verified by:** Claude Sonnet 5 (session) | **Date:** 2026-10-19 | **Context:** [x] Pre-code (verified post-implementation, pre-merge)

**Discrepancy note (found at /verify-completion):** Scenarios 1-4 below, as originally written, describe "run the CLI against a feature" and read its own output — this assumes `buildCaptureList` is wired into `runCaptureForFeature`'s own call path. Per the DoR contract's own explicit Assumption ("this story only builds the capture-list logic itself, it does not yet wire it into the CLI's own `runCaptureForFeature` call path — that wiring, if needed beyond this story's own integration test, is implicit groundwork for `rpca-s4`, not a new AC here"), that wiring was deliberately out of scope for this story. Running the real CLI as literally described here would only exercise `rpca-s1`'s own unchanged hardcoded single-AC path and prove nothing about AC1-AC4. All 4 scenarios are instead verified via direct cross-reference to the automated test suite, which exercises `deriveSelectorFromSpec`/`loadManualFallback`/`buildCaptureList` directly — consistent with the test plan's own Gap type "None" / Risk 🟢 classification for all 4 ACs (no manual scenario required). `/improve` candidate: the batched `/test-plan` pass that wrote verification scripts for `rpca-s2`/`s3`/`s4` together wrote CLI-level manual scenarios without checking each story's own DoR assumptions about what's actually wired — worth a per-story check before templating scenario steps across a batch.

---

## Setup

**Before you start:**
1. Pick a real feature with at least one AC that has a matching `tests/e2e/*.spec.js` file (e.g. `fpd-s4`, which has `tests/e2e/fpd-s4-caption-sync.spec.js`)
2. Create or locate a feature with an AC that has no E2E spec, to see the skip/warning behaviour

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: An AC with a real E2E spec gets its selector automatically

**Covers:** AC1

**Steps:**
1. Run the CLI against `fpd-s4` (or another feature with a real E2E spec naming an AC)
2. Check the CLI's own output for how it resolved `AC3`'s own selector

**Expected outcome:**
> The CLI reports it found `AC3`'s own selector from `tests/e2e/fpd-s4-caption-sync.spec.js` (or names the real file it used) — not a manual-fallback message, not a skip.

**Result:** [x] Pass (via automated-test cross-reference)
**Notes:** Not run as a live CLI scenario — see discrepancy note above. Verified instead by `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`'s "AC1 (unit): derives a selector from a real-shaped E2E spec fixture" test, using a fixture modelled directly on `fpd-s4-caption-sync.spec.js`'s own real header-comment convention (`// fpd-s4-caption-sync.spec.js -- E2E for caption sync during real video playback (fpd-s4 AC3)`). Test passes: `deriveSelectorFromSpec` correctly returns `{acId: 'AC1', selector: '.fixture-selector'}` from a fixture spec using that exact convention, and returns `null` when the AC isn't named in the file at all.

---

### Scenario 2: An AC with a manual fallback entry uses it

**Covers:** AC2

**Steps:**
1. Create a `selectors-manual.json` file for a feature with one AC that has no E2E spec, giving it a real `{url, selector}` entry
2. Run the CLI against that feature

**Expected outcome:**
> The CLI reports it used the manual fallback entry for that AC and produces a real screenshot for it.

**Result:** [x] Pass (via automated-test cross-reference)
**Notes:** Not run as a live CLI scenario — see discrepancy note above. Verified instead by `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`'s "AC2" tests: `loadManualFallback` correctly reads a real `selectors-manual.json` fixture and returns the exact `{url, selector}` entry for the matching AC; and correctly returns `null` (not a throw) when the file doesn't exist at all.

---

### Scenario 3: An AC with neither source is skipped, not crashed

**Covers:** AC3

**Steps:**
1. Run the CLI against a feature with an AC that has no E2E spec and no manual fallback entry
2. Watch the CLI's own output and confirm it finishes

**Expected outcome:**
> The CLI completes the whole run (doesn't crash), and its output names the specific AC it skipped, with a clear reason ("no E2E spec, no manual fallback" or equivalent).

**Result:** [x] Pass (via automated-test cross-reference)
**Notes:** Not run as a live CLI scenario — see discrepancy note above. Verified instead by `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`'s "AC3" test: `buildCaptureList` does not throw for an AC in neither source, returns it in the `skipped` count (not in `captured`), and emits a `console.warn` naming the specific AC id (asserted by spying on `console.warn`).

---

### Scenario 4: A mixed run reports accurate counts

**Covers:** AC4

**Steps:**
1. Run the CLI against a feature with a mix of E2E-derivable, manual-fallback, and uncovered ACs
2. Read the final summary line

**Expected outcome:**
> The summary states the exact number of ACs captured versus skipped, matching what you set up (e.g. "3 captured, 1 skipped").

**Result:** [x] Pass (via automated-test cross-reference)
**Notes:** Not run as a live CLI scenario — see discrepancy note above. Verified instead by `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`'s "AC4" integration test: a fixture feature with 4 ACs (2 E2E-derivable, 1 manual-fallback, 1 in neither) produces exactly 3 captured entries and 1 skip, with `summary` equal to the exact string `"3 captured, 1 skipped"`.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1 — E2E-derived) | Pass (automated-test cross-reference) | |
| Scenario 2 (AC2 — manual fallback) | Pass (automated-test cross-reference) | |
| Scenario 3 (AC3 — skip, not crash) | Pass (automated-test cross-reference) | |
| Scenario 4 (AC4 — accurate counts) | Pass (automated-test cross-reference) | |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| N/A | Scenarios 1-4 described a live-CLI check that assumes `buildCaptureList` is wired into `runCaptureForFeature` | Not wired in this story, per the DoR's own explicit assumption | LOW | Accept — the batched verification-script template didn't account for this story's own "logic only, not wired yet" scope; logged as an `/improve` candidate above, not a gap against this story's own ACs |
