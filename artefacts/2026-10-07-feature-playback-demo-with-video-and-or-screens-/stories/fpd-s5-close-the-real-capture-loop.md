## Story: Close the real-capture loop — fix the two gaps blocking any real feature from using the viewer, and prove it end to end

**Epic reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/epics/feature-playback-web-viewer.md
**Discovery reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/discovery.md
**Benefit-metric reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **feature sponsor / business owner reviewing a delivered feature**,
I want **the playback viewer to actually show real evidence for a real, already-shipped feature — not just for synthetic test fixtures**,
So that **the acceptance loop fpd-1 through fpd-4 were built to close can actually close, for the first time, for something real**.

## Benefit Linkage

**Metric moved:** M1 — Acceptance loop closure rate; M2 — Sponsor feedback re-entry rate
**How:** fpd-1 through fpd-4 are all individually code-complete, but M1/M2 are both still at their 0%/not-yet-measured baseline because the capture mechanism has never been run for real, and even if it were, two structural gaps (found live during fpd-s4's own `/definition-of-done`, 2026-10-18) would stop the viewer from rendering real evidence for any feature that exists today. This story closes both gaps and runs a real capture, giving M1/M2 their first-ever real measurement opportunity.

## Architecture Constraints

- **Reuses `parseDodAcCoverage`'s own call sites — does not fork a second parser.** AC1 below widens what one shared function accepts; `fpd-s1`'s capture script, `fpd-s4`'s media resolution, and the viewer's own rendering all continue calling the same function (ADR-026 — reuse, don't duplicate).
- **Path-namespacing change (AC2) must stay backward-compatible with `fpd-s1`'s own `embedScreenshotPaths` and `fpd-s4`'s `resolve*` functions — both are modified together, not left to drift.** No feature currently has a real captured package (except this session's own hand-authored, non-production `web-ui-pm-flow` demo — see Out of Scope), so there is no production data migration concern.
- **Staging-deploy change (AC3) is a `.github/workflows/` change — governed infrastructure per CLAUDE.md's Platform change policy.** Narrows the existing `paths-ignore` (`sdsb-s1`'s own convention, `staging-deploy.yml`) to exclude `artefacts/*/playback/**` from the skip list; does not remove the bookkeeping-skip behaviour `sdsb-s1` established for any other path.

## Dependencies

- **Upstream:** `fpd-s1`, `fpd-s2`, `fpd-s3`, `fpd-s4` — all DoD-complete, this story fixes gaps found in their own completed work, not gaps in work still in progress.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a story whose DoD file uses the `## AC Verification` table shape (the real, pre-existing shape already used by other features in this repo, e.g. `pmf.3-dod.md`) rather than `## AC Coverage`, When that story's own section renders on the `/playback/<slug>` review page, Then its AC rows and evidence text appear exactly as they do today for a story using the `## AC Coverage` shape — not the "No AC Coverage data available" empty branch.

**AC2:** Given a feature with multiple stories whose own AC numbering each restarts at AC1 (e.g. `fpd-s1`'s AC1 and `fpd-s3`'s AC1 within `feature-playback-demo` itself), When screenshots or video are captured for each story, Then each story's own AC1 evidence is stored and resolved independently — no story's evidence file is ever silently shared with or overwritten by another story's same-numbered AC.

**AC3:** Given a push to `master` whose changed files are entirely within `artefacts/*/playback/**`, When the Staging Deploy workflow evaluates its trigger, Then the deploy still runs (not skipped) — while a push touching only other bookkeeping paths (`workspace/**`, other `artefacts/**` content, `.github/pipeline-state.json`) continues to skip the deploy exactly as today.

**AC4:** Given AC1–AC3 are implemented and deployed, When a real capture is run — via the actual `scripts/playback-capture.js` mechanism, not hand-authored — against a real DoD-complete feature with a real, qualifying per-story AC table, Then the resulting package is visible live at `/playback/<slug>` on staging, with at least one story's own AC section rendering a real screenshot inline (not the "No evidence captured" empty state) — confirmed by live observation, not test output alone.

## Out of Scope

- **Real video/captions/transcript capture.** `fpd-s2`'s own `captureVideoRecording` needs a real, authenticated Playwright browser session against staging — driving that requires entering credentials on a non-local host, which is outside what this session can do itself. AC4 is scoped to screenshots only; a real video capture pass is a follow-on the operator can run directly once this story ships, using the now-working infrastructure.
- **Migrating or re-authoring any other feature's existing DoD files** to adopt either table shape — AC1 makes the parser accept both shapes as they already exist; it does not change any feature's own DoD content.
- **The hand-authored `web-ui-pm-flow` demo package captured earlier this session** (`artefacts/2026-06-14-web-ui-pm-flow/playback/`) is not the AC4 target — it was written by hand specifically because it predates this story's own fix, and does not exercise the real capture mechanism this AC requires.

## NFRs

- **Performance:** None beyond what `fpd-s1`–`fpd-s4` already established — no new request-path computation.
- **Security:** None new. Reuses the same tenant-scoping posture already clarified and accepted in `fpd-s3`'s and `fpd-s4`'s own DoD (`pipeline-state.json`'s `features[]` has no tenant dimension in this app, consistently, repo-wide).
- **Accessibility:** None new — no new UI surface, only fixes to existing rendering/capture logic.
- **Audit:** None — no new mutating action.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
