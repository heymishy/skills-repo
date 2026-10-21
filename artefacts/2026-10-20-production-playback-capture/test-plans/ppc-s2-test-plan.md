## Test Plan: Extend to full-feature capture loop with timing validation

**Story reference:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s2.md`
**Epic reference:** `artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md`
**Test plan author:** Claude (session)
**Date:** 2026-10-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Loop capture across all ACs that have a stored target | 1 | 2 | — | — | — | 🟢 |
| AC2 | Loading state; blocks a second concurrent trigger | — | 1 | — | — | — | 🟢 |
| AC3 | Real elapsed time measured and recorded as DoD evidence | 1 | 1 | — | — | — | 🟢 |
| AC4 | A >60s run logs a SCOPE note, doesn't silently ship | 1 | 1 | — | — | — | 🟢 |
| AC5 | One AC's failure doesn't discard the rest; failed AC gets a retry option | 1 | — | — | — | — | 🟢 |
| AC6 | ACs with no stored target are skipped with a named reason | 1 | 1 | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mixed
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A feature with 3+ ACs, a mix of targeted/untargeted | Synthetic fixture | None | |
| AC2 | A capture-all run already marked in-progress | Synthetic fixture | None | |
| AC3 | A real (unmocked) timer for one integration test; a controllable injected clock for the unit test | Mixed | None | |
| AC4 | An injected clock returning a duration > 60000ms | Mocked | None | |
| AC5 | A 3-AC run where one capture call is injected to throw | Mocked | None | |
| AC6 | A feature with at least one untargeted AC | Synthetic fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Builds the capture-all list from only ACs with a stored target

- **Verifies:** AC1, AC6
- **Precondition:** A feature fixture with 4 ACs — 3 have a stored capture target, 1 does not.
- **Action:** Call `buildCaptureAllList(feature)`.
- **Expected result:** Returns the 3 targeted ACs for capture; the 4th is returned separately in a skipped list with a stated reason ("no capture target set").
- **Edge case:** No.

### Computes real elapsed time for a capture-all run

- **Verifies:** AC3
- **Precondition:** Known start and end timestamps.
- **Action:** Call `measureCaptureDuration(start, end)`.
- **Expected result:** Returns the correct elapsed milliseconds between the two timestamps.
- **Edge case:** No.

### Flags a run exceeding 60 seconds without failing the run itself

- **Verifies:** AC4
- **Precondition:** A measured duration of 65000ms.
- **Action:** Call `checkTimingThreshold(duration)`.
- **Expected result:** Returns `{ exceedsThreshold: true }`; this does not itself mark the capture run as failed — ACs that succeeded still report success.
- **Edge case:** Yes — also assert the boundary: exactly 60000ms does not trigger the flag (threshold is strictly greater-than 60s).

### One AC's capture failure doesn't discard the others' results

- **Verifies:** AC5
- **Precondition:** A 3-AC capture-all run where the second AC's capture call is injected to throw.
- **Action:** Run the capture-all loop.
- **Expected result:** The result set contains 2 successful screenshot entries and 1 failed entry carrying a retry flag — the loop does not throw an uncaught exception that aborts the whole run.
- **Edge case:** Yes.

### Progress indicator markup includes an `aria-live` region

- **Verifies:** NFR — Accessibility
- **Precondition:** A capture-all run in progress.
- **Action:** Render the progress status component.
- **Expected result:** The rendered markup includes an `aria-live="polite"` (or equivalent) attribute on the progress status element.
- **Edge case:** No.

---

## Integration Tests

### Capture-all runs sequentially across all targeted ACs and persists each screenshot

- **Verifies:** AC1
- **Components involved:** Route handler, injected (mocked) `captureAcScreenshots`, Postgres
- **Precondition:** A feature with 3 ACs, each already carrying a stored capture target.
- **Action:** Trigger "Capture all evidence" for the feature.
- **Expected result:** 3 screenshot records are persisted, one per AC, using the same session-reuse mechanism established in `ppc-s1` (never a service credential).

### A second concurrent capture-all trigger for the same feature is blocked

- **Verifies:** AC2
- **Components involved:** Route handler, in-progress lock flag
- **Precondition:** A capture-all run already marked in-progress for a given feature.
- **Action:** Trigger "Capture all evidence" again for the same feature before the first run completes.
- **Expected result:** The second request is rejected with a clear "already in progress" response — not queued, not silently ignored, not run in parallel.

### Capture-all records real elapsed time, not an estimate

- **Verifies:** AC3
- **Components involved:** Route handler, real (unmocked) timer
- **Precondition:** A real fixture feature with a small number of ACs.
- **Action:** Run capture-all against it.
- **Expected result:** A duration value is persisted/returned that reflects genuine elapsed wall-clock time — assert it is a positive number sourced from an actual timer call, not a hardcoded or default value.

### A timing-threshold breach is logged, not silently absorbed

- **Verifies:** AC4
- **Components involved:** Route handler, injected decisions-log writer
- **Precondition:** An injected clock causing the measured duration to exceed 60 seconds.
- **Action:** Complete a capture-all run under that injected clock.
- **Expected result:** The injected decisions-log writer is called with a SCOPE-note payload referencing the exceeded threshold — the run itself still completes and reports its successful ACs.

### Skipped (untargeted) ACs are surfaced with a named reason, not silently

- **Verifies:** AC6
- **Components involved:** Route handler
- **Precondition:** A feature with 2 targeted ACs and 1 untargeted AC.
- **Action:** Trigger capture-all for the feature.
- **Expected result:** The response/result includes a skipped-ACs list explicitly naming the untargeted AC and the reason ("no capture target set").

---

## NFR Tests

### Progress indicator is exposed to assistive technology, not purely visual

- **NFR addressed:** Accessibility
- **Measurement method:** Manual verification (no automated accessibility tooling configured in this repo) in addition to the automated `aria-live` presence check in Unit Tests above.
- **Pass threshold:** A screen reader announces progress updates during a capture-all run without the user needing to look at the screen.
- **Tool:** Manual — see verification script.

### Security — inherits `ppc-s1`'s session-handling constraint unchanged

- **NFR addressed:** Security
- **Measurement method:** No new test — this story reuses `ppc-s1`'s session-reuse mechanism in a loop; `ppc-s1`'s own NFR tests ("`session_id` never appears in any response body", "never invokes the test-bypass path") already cover the property for every call this loop makes.
- **Pass threshold:** N/A — covered by `ppc-s1-test-plan.md`.
- **Tool:** N/A.

### Audit — None identified

- **NFR addressed:** Audit
- **Measurement method:** Not applicable — no audit requirement identified for this story.
- **Pass threshold:** N/A
- **Tool:** N/A — stated explicitly, no test written.

---

## Out of Scope for This Test Plan

- Rate limiting the capture-trigger endpoint — covered by `ppc-s3`'s own test plan.
- Building an async job queue — only ever in scope if AC4's trigger condition is hit in real usage and a new story is written; nothing to test here.
- Video capture, automated redaction, ffmpeg presentation polish — epic-level out of scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real-world full-feature capture timing (beyond the fixture used in the integration test) is unknown until this story is actually built against a real tenant's own feature | This is the story's own stated purpose — AC3 exists precisely to establish the real number, not assume one | Treat the fixture-based integration test as a correctness check on the measurement mechanism itself, not a substitute for real-world timing data gathered at DoD |
