## Story: Video capture wired for real, reusing the existing caption/transcript adapter

**Epic reference:** artefacts/2026-10-19-real-playback-capture-automation/epics/real-playback-capture-cli.md
**Discovery reference:** artefacts/2026-10-19-real-playback-capture-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-19-real-playback-capture-automation/benefit-metric.md
**Domain:** [none identified — reuses rpca-s1's own auth/CLI plumbing, no new domain surface]

## User Story

As an **operator / engineer**,
I want **`captureVideoRecording` to produce a real video clip through the same authenticated session the screenshot capture already uses**,
So that **a feature's playback package can include real video evidence, not just screenshots, without a second manual capture pass**.

## Benefit Linkage

**Metric moved:** M1 — Real capture coverage on new DoD-complete features; M2 — Manual capture time per feature
**How:** `fpd-s2`'s own video-recording mechanism (`captureVideoRecording`, `generateCaptionsForVideo`) has only ever been unit-tested against mocked Playwright, the exact same gap class as the screenshot mechanism `rpca-s1`/`rpca-s2` already closed. Wiring it for real closes the remaining half of the capture mechanism, not just the screenshot half.

## Architecture Constraints

- **Reuses `fpd-s2`'s own existing `captureVideoRecording` and `generateCaptionsForVideo` functions unchanged (ADR-026)** — this story wires them to a real authenticated session; it does not rewrite or replace their own logic.
- **D37 injectable adapter pattern already followed by `generateCaptionsForVideo`** — its own stub default already throws rather than returning a safe-looking empty value (confirmed in `scripts/playback-capture.js`'s existing code); this story's own wiring must not weaken that.
- **Reuses `rpca-s1`'s own auth mechanism** — no second, separate authentication path for video capture.

## Dependencies

- **Upstream:** `rpca-s1` (auth/CLI foundation).
- **Downstream:** `rpca-s4`'s own skill-documentation update describes both screenshot and video capture as real, not just screenshots.

## Acceptance Criteria

**AC1:** Given a successful authenticated session (reusing `rpca-s1`'s own mechanism), When the CLI is invoked with a video-capture target, Then `captureVideoRecording` produces a real `.webm` file via Playwright's own `recordVideo`, saved to `artefacts/[feature-slug]/playback/[story-slug]/video/` — the exact path convention already established.

**AC2:** Given a real captured video file, When the CLI completes that capture, Then `generateCaptionsForVideo` is invoked against the real file and produces real caption and transcript files, marked `reviewed: false` until explicit confirmation — reusing `fpd-s2`'s own existing unreviewed-until-confirmed convention, not a new one.

**AC3:** Given the CLI's own video capture fails partway through (e.g. the browser context closes unexpectedly), When this happens, Then no partial or corrupt video file is left in the final `artefacts/` path — a failed capture leaves no file, not a broken one.

## Out of Scope

- **Caption/transcript quality improvements** — epic-level Out of Scope; `generateCaptionsForVideo` itself is unchanged.
- **Choosing one-combined-walkthrough vs. several-per-AC-clips** — per `feature-playback-demo`'s own discovery (amended 2026-10-15), this remains an engineer judgment call per feature, not something this story's own automation decides.
- **A visual regression check on the video's own content** — this story proves a real file is produced, not that its visual content is correct frame-by-frame.

## NFRs

- **Performance:** None beyond what Playwright's own `recordVideo` already costs — not newly introduced by this story.
- **Security:** None new — reuses `rpca-s1`'s own session, no new credential surface.
- **Accessibility:** Captions/transcript generation already satisfies the accessibility requirement `fpd-s2` established; this story doesn't change that requirement, only makes it real.
- **Audit:** None — read-only capture.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
