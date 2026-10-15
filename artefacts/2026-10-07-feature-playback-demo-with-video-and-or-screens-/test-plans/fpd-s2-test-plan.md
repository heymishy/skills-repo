## Test Plan: Add a Playwright-recorded video walkthrough with machine-generated captions and transcript

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s2-video-walkthrough-and-accessibility.md
**Review reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/review/fpd-s2-review-1.md (PASS, run 1)
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-10-15
**Test runner:** `node scripts/run-all-tests.js` (unit/integration); `npx playwright test` (E2E, ADR-018)

---

## Note on E2E detection (Step 3a)

Same reasoning as `fpd-s1`: real video recording against a live app is real-browser-dependent, not executable in this session's sandbox. The capture script's own logic (which context options it sets, where it writes output, whether it generates captions/transcript) is unit-testable via a mocked Playwright `recordVideo` context. The genuine end-to-end recording gets a real E2E spec, RISK-ACCEPTed for execution per the established pattern.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Playwright `recordVideo` captures the scripted sequence, saves `.webm` | 1 test (script logic) | — | 1 test (real recording) | — | Real-browser-dependent | 🟡 |
| AC2 | Single-file or multi-file shape both supported, engineer's own choice | 1 test | — | — | — | — | 🟢 |
| AC3 | Captions + transcript exist alongside every video, marked human-reviewable | 1 test | — | — | — | — | 🟢 |
| AC4 | Silent recording still gets a transcript (from interaction sequence/on-screen text) | 1 test | — | — | — | — | 🟢 |
| AC5 | Package not complete while captions/transcript missing or unreviewed | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

AC1's real-recording portion cannot be executed in this session's sandbox (same gap as `fpd-s1`, `decisions.md` D5). RISK-ACCEPTed — the recording script's own logic is fully unit-tested; only the live end-to-end run is deferred.

---

## Test Data Strategy

**Source:** Synthetic — a fixture interaction sequence (the same one `fpd-s1`'s screenshot capture already scripts from), a mocked Playwright browser context recording `recordVideo` option calls, and a mocked caption/transcript generator (stubbed to return fixed text, not a real speech-to-text call — the generation mechanism's own provider is an implementation detail for `/definition-of-ready` to pin down, not re-litigated here).
**PCI/sensitivity in scope:** No
**Availability:** Available now for unit/integration; the E2E spec needs a real `DATABASE_URL` environment.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 (unit) | Mocked browser context recording `recordVideo` option values | Mocked | None | |
| AC1 (E2E) | A real DoD-validated feature, run against a real/staging app | Real seeded data | None | Cannot execute in this sandbox — RISK-ACCEPT |
| AC2 | Two fixture scenarios: engineer selects single-file, engineer selects multi-file | Synthetic | None | |
| AC3 | A fixture `.webm` file path; a stubbed caption/transcript generator | Synthetic + mocked | None | |
| AC4 | A fixture recording with no narration audio track | Synthetic | None | |
| AC5 | A fixture package with captions/transcript present but not yet marked reviewed | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

AC1's real-recording portion — see Coverage gaps above.

---

## Unit Tests

### AC1 (unit): recording script's own logic — correct context options, correct output path

- **Verifies:** AC1 (script-logic portion)
- **Precondition:** Mocked Playwright browser context
- **Action:** Run the video-capture script against a fixture interaction sequence
- **Expected result:** The browser context is created with `recordVideo: { dir: 'artefacts/[feature-slug]/playback/video/', size: {...} }`; the resulting file reference matches that directory
- **Edge case:** No

### AC2 (unit): single-file and multi-file shapes both work via the same mechanism

- **Verifies:** AC2
- **Precondition:** Two fixture scripts — one naming a single combined sequence, one naming 3 separate per-AC sequences
- **Action:** Run the video-capture script against each
- **Expected result:** The single-file fixture produces exactly 1 output file; the multi-file fixture produces exactly 3, one context/recording per sequence — no branching logic difference beyond the number of contexts created
- **Edge case:** Yes — the multi-file case is the less common path, explicitly covered rather than only testing the default

### AC3 (unit): captions and transcript exist alongside every video

- **Verifies:** AC3
- **Precondition:** A fixture `.webm` output path
- **Action:** Run the caption/transcript generation step
- **Expected result:** A caption file and a standalone transcript file both exist at the expected paths, both flagged `reviewed: false` until explicitly confirmed
- **Edge case:** No

### AC4 (unit): silent recording still produces a transcript

- **Verifies:** AC4
- **Precondition:** A fixture recording with no audio track (silent)
- **Action:** Run the transcript-generation step
- **Expected result:** A transcript file is still produced, sourced from the scripted interaction sequence's own step descriptions and any on-screen text — not left empty or skipped because there's no spoken audio
- **Edge case:** Yes — this is the edge case itself (the common assumption "no audio means no transcript" is explicitly disproven)

### AC5 (unit): package incomplete while captions/transcript unreviewed

- **Verifies:** AC5
- **Precondition:** A fixture package with captions/transcript generated but not yet marked reviewed
- **Action:** Check the package's own completion status
- **Expected result:** Status is not `"complete"`; after the engineer explicitly confirms review, it becomes `"complete"` — mirrors `fpd-s1`'s own AC4 pattern, extended to accessibility artefacts
- **Edge case:** No

---

## NFR Tests

### Accessibility — AC3/AC4/AC5 are the NFR tests; no separate test needed

- **NFR addressed:** Accessibility (WCAG AA baseline)
- **Measurement method:** AC3 (captions+transcript exist), AC4 (silent recordings aren't exempt), AC5 (package blocked until reviewed) together constitute this story's own primary NFR coverage
- **Pass threshold:** All 3 ACs pass
- **Tool:** Unit tests above

---

## Gap table

| Gap | Affected AC | Type | Why | Resolution |
|-----|-------------|------|-----|-----------|
| Real video recording against a live/staging app | AC1 | Real-browser-dependent | No local Postgres reachable in this session's sandbox (`decisions.md` D5) | E2E spec written, confirmed syntactically valid, RISK-ACCEPTed for execution |
