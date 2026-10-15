## Test Plan: Viewer renders the actual screenshot gallery and plays video per AC

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s4-viewer-media-playback.md
**Review reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/review/fpd-s4-review-1.md (PASS, run 1)
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-10-15
**Test runner:** `node scripts/run-all-tests.js` (unit/integration); `npx playwright test` (E2E, ADR-018)

---

## Note on E2E detection (Step 3a)

Most ACs are DOM-presence checks (does a screenshot/video/transcript element exist in the right section), testable via this repo's own established rendering-test harness — no layout dependency. **AC3 is different:** "captions display, synced to the video" during real playback is genuine real-browser video behaviour, not DOM presence alone — jsdom does not actually play media or render caption tracks over time. Per CLAUDE.md's B2 rule, classified `CSS-layout-dependent`-equivalent (real-rendering-dependent): a real E2E test is written (Playwright can enable captions and assert the `<track>` element's own `mode` and `cues`, which *is* something Playwright's real browser engine supports, unlike jsdom), but — consistent with every other story this session — cannot execute in this sandbox (no local Postgres). RISK-ACCEPTed for execution, not for coverage: the spec itself is written, not skipped.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Screenshot renders in its own AC section | 1 test | — | — | — | — | 🟢 |
| AC2 | Native `<video>` player renders for an AC with video evidence | 1 test | — | — | — | — | 🟢 |
| AC3 | Captions display, synced, via native player controls | — | — | 1 test | — | Real-browser-dependent | 🟡 |
| AC4 | Standalone transcript accessible without playing the video | 1 test | — | — | — | — | 🟢 |
| AC5 | No-evidence AC shows a clear empty state, not a broken image | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

AC3's real-playback caption-sync behaviour cannot be executed in this session's sandbox (same gap as every other story this session, `decisions.md` D5). RISK-ACCEPTed for execution only — the E2E spec itself is written and confirmed syntactically valid.

---

## Test Data Strategy

**Source:** Synthetic — fixture `pipeline-state.json`/DoD content (reusing `fpd-s3`'s own fixtures), fixture screenshot (PNG) and video (`.webm`) file paths on disk for the rendering tests; real seeded fixtures via this repo's own established `seedJourneyWithStages`-style pattern for the E2E spec.
**PCI/sensitivity in scope:** No
**Availability:** Available now for unit/integration; the E2E spec needs a real `DATABASE_URL` environment.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fixture AC section with a screenshot file reference | Synthetic | None | |
| AC2 | Fixture AC section with a video file reference | Synthetic | None | |
| AC3 (E2E) | A real package with a real captioned video, run against a real/staging app | Real seeded data | None | Cannot execute in this sandbox — RISK-ACCEPT |
| AC4 | Fixture AC section with both a video and a standalone transcript file | Synthetic | None | |
| AC5 | Fixture AC section with no screenshot and no video reference | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

AC3's real-playback portion — see Coverage gaps above.

---

## Unit Tests

### AC1 (unit): screenshot renders in its own AC section

- **Verifies:** AC1
- **Precondition:** Fixture AC section with a screenshot file reference
- **Action:** Render the review page
- **Expected result:** An `<img>` element referencing that exact screenshot path renders inside that AC's own section
- **Edge case:** No

### AC2 (unit): native video player renders for an AC with video evidence

- **Verifies:** AC2
- **Precondition:** Fixture AC section with a `.webm` file reference
- **Action:** Render the review page
- **Expected result:** A native `<video>` element referencing that exact file path renders inside that AC's own section — no third-party player library markup
- **Edge case:** No

### AC4 (unit): standalone transcript accessible without playing the video

- **Verifies:** AC4
- **Precondition:** Fixture AC section with both a video file and a standalone transcript file reference
- **Action:** Render the review page
- **Expected result:** The transcript's own text (or a link to it) renders in that AC's own section, reachable independently of the `<video>` element — not only inside a caption track that requires playback
- **Edge case:** No

### AC5 (unit): no-evidence AC shows a clear empty state

- **Verifies:** AC5
- **Precondition:** Fixture AC section with no screenshot and no video reference
- **Action:** Render the review page
- **Expected result:** That AC's own section shows explicit text (e.g. "No evidence captured for this AC yet") — no `<img>` with a broken/missing `src`, no silently empty `<div>`
- **Edge case:** Yes — this is the edge case itself (mid-production packages are a real, expected state, not an error condition)

---

## Gap table

| Gap | Affected AC | Type | Why | Resolution |
|-----|-------------|------|-----|-----------|
| Real video playback with synced captions | AC3 | Real-browser-dependent | No local Postgres reachable in this session's sandbox (`decisions.md` D5); jsdom does not play media | E2E spec written, confirmed syntactically valid, RISK-ACCEPTed for execution |
