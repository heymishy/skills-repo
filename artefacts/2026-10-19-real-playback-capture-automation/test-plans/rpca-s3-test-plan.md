## Test Plan: Video capture wired for real, reusing the existing caption/transcript adapter

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s3-video-capture-wired-for-real.md
**Epic reference:** artefacts/2026-10-19-real-playback-capture-automation/epics/real-playback-capture-cli.md
**Review reference:** artefacts/2026-10-19-real-playback-capture-automation/review/rpca-s3-review-1.md (PASS, run 1)
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-19
**Test runner:** `node scripts/run-all-tests.js`

---

## Note on Step 2 (test context) and Step 3 (test data strategy)

**Test context:** Option 1 — this repo's own configured runner, no stack deviation.
**Test data strategy:** Option 6 — Mixed, same shape as `rpca-s1`. AC2's own wiring logic and AC3's own failure-cleanup behaviour are synthetic/mocked. AC1's own "a real `.webm` file is actually produced" claim needs the same real secret + real network as `rpca-s1`'s AC1/AC2 — carried forward, not a new independent gap.

---

## Note on Step 3a (E2E / browser-layout detection)

AC1 is external-dependency (real secret + real deployed instance), same class as `rpca-s1`'s own AC1/AC2 — not CSS-layout-dependent (no drag-drop, no coordinates, no stacking-context claim). AC2/AC3 are pure logic, no gap.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | A real `.webm` file is produced via Playwright's `recordVideo` | — | — | — | 1 scenario | External-dependency (same as `rpca-s1` AC1/AC2) | 🔴 |
| AC2 | `generateCaptionsForVideo` is invoked, output marked `reviewed: false` | 1 test | — | — | — | — | 🟢 |
| AC3 | No partial/corrupt file left on a mid-capture failure | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in this repo's own test runner | Handling |
|-----|----|----------|---------------------------------------------------|---------|
| A real video file is actually produced by Playwright's own `recordVideo` against a real session | AC1 | External-dependency | Same root cause as `rpca-s1`'s own AC1/AC2 — requires the real staging secret | Manual scenario, 🔴, same execution path as `rpca-s1`'s own manual scenarios — can be run in the same operator session that verifies AC1/AC2 there |

---

## Test Data Strategy

**Source:** Mixed — Synthetic for AC2/AC3; real staging + real secret for AC1
**PCI/sensitivity in scope:** No
**Availability:** AC2/AC3 available now. AC1 depends on the same operator-provided secret as `rpca-s1`.
**Owner:** Self-contained for AC2/AC3; operator-provided secret for AC1 (shared dependency with `rpca-s1`)

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Real `E2E_STAGING_AUTH_STUB_SECRET`, real AC URL | Operator-provided / real staging state | None | Same dependency as `rpca-s1` |
| AC2 | A fixture video file path, mocked `generateCaptionsForVideo` call | Synthetic | None | Asserts the call happens and the `reviewed: false` field is set — not that captions are linguistically correct (that's `fpd-s2`'s own, unchanged scope) |
| AC3 | A mocked Playwright browser context that throws mid-recording | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

AC1 — see Coverage gaps above. Acknowledged, not silently skipped.

---

## Unit Tests

### AC2 (unit): a successful video capture triggers caption generation marked unreviewed

- **Verifies:** AC2
- **Precondition:** A fixture video file path (not a real recording); `generateCaptionsForVideo` mocked
- **Action:** Call the wiring function that follows a successful `captureVideoRecording` call with the fixture path
- **Expected result:** `generateCaptionsForVideo` is called with the fixture path, and the resulting caption/transcript record has `reviewed: false`
- **Edge case:** No

### AC3 (unit): a mid-capture failure leaves no partial file on disk

- **Verifies:** AC3
- **Precondition:** A mocked Playwright browser context whose `.close()` (or equivalent) throws partway through a simulated recording; a target file path that does not yet exist
- **Action:** Call the video-capture wrapper function with the failing mocked context
- **Expected result:** The function surfaces the failure (doesn't silently swallow it), and `fs.existsSync(targetPath)` is `false` afterward — no partial file left behind
- **Edge case:** Yes — this is specifically the failure-cleanup boundary

---

## Integration Tests

None beyond what `rpca-s1`'s own integration test already covers for the shared auth mechanism — this story reuses that mechanism unchanged, not duplicating its own test.

---

## NFR Tests

None — confirmed with story owner. No new NFR beyond what `rpca-s1` already established; this story only wires existing functions to a real session.

---

## Out of Scope for This Test Plan

- Caption/transcript linguistic quality — `fpd-s2`'s own unchanged scope
- Real network/staging behaviour beyond AC1's own manual scenario

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| A real video file is actually produced (AC1) | Requires the real staging secret, same as `rpca-s1` | Manual scenario (🔴), run alongside `rpca-s1`'s own manual verification in the same operator session |
