## Story: Add a Playwright-recorded video walkthrough with machine-generated captions and transcript

**Epic reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/epics/feature-playback-video-accessibility.md
**Discovery reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/discovery.md
**Benefit-metric reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **feature engineer producing a playback package**,
I want **a screen-capture video walkthrough recorded automatically via Playwright, with captions and a transcript generated alongside it by default**,
So that **sponsors get a watchable demonstration of the feature without me manually recording my screen or narrating, and the package is accessible from day one, not retrofitted later**.

## Benefit Linkage

**Metric moved:** M1 — Acceptance loop closure rate (video is one of the 3 required package components; a package without it is incomplete); M3 — Demo preparation time (Playwright's own recording requires no manual screen-capture effort; auto-transcription removes narration-authoring entirely when narration is skipped)
**How:** Playwright's own built-in `recordVideo` browser-context option (already proven in this session's own `spikes/video-capture-mechanism-outcome.md`) captures the walkthrough with zero manual engineer effort beyond scripting the interaction sequence — the same sequence `fpd-s1`'s own screenshot capture already scripts from the DoD artefact. Shipping captions/transcript as a default, not an opt-in, removes a step sponsors would otherwise never get (per the Accessibility constraint).

## Architecture Constraints

- **Capture mechanism: Playwright's built-in `recordVideo`, not a new tool.** `spikes/video-capture-mechanism-outcome.md` — zero new npm dependency, reuses the exact tool already proven in this repo's E2E suite (ADR-018, ADR-026). One browser context per recording; each context is independent, so the engineer's own per-feature judgment call on video shape (one combined walkthrough vs. several per-AC/per-flow clips, per discovery's own amended MVP scope item 3) is supported identically by the same mechanism — no branching logic needed for either shape.
- **Output format: `.webm`, not MP4.** `[Corrected 2026-10-15, per /definition's own D2-platform gate]` — `ffmpeg` was confirmed unavailable in this session's own delivery sandbox; the `.webm`-to-MP4 encoding step originally proposed is dropped, not deferred (see `decisions.md`). Playwright's own native `.webm` output ships as-is — it satisfies the Constraints section's own "MP4 or equivalent" wording, playing natively in every modern browser's `<video>` element with no plugin.
- **Accessibility, non-negotiable (discovery Constraints section).** Every generated video ships with machine-generated, human-reviewable captions and a standalone text transcript — WCAG AA baseline, consistent with MC-A11Y-01/MC-A11Y-02. This is not conditional on narration being present: a silent recording still gets a transcript (sourced from the scripted interaction sequence / on-screen text, not from spoken audio that doesn't exist).
- **Narration optional, never generated.** If the engineer narrates, it is their own recorded voice; AI-synthesised narration is out of scope for the whole feature.

## Dependencies

- **Upstream:** `fpd-s1` (the same DoD-sourced interaction script that drives screenshot capture also drives the video recording sequence).
- **Downstream:** `fpd-4` plays this video back in the web-app viewer.

## Acceptance Criteria

**AC1:** Given a DoD-validated feature already producing a walkthrough document and screenshots (`fpd-s1`), When the skill's video-capture step runs, Then Playwright records the scripted interaction sequence via `recordVideo` and saves one or more `.webm` files to `artefacts/[feature-slug]/playback/video/`.

**AC2:** Given the engineer is producing the package, When they choose the video's own shape, Then the skill supports either a single combined walkthrough file or several files targeted at individual ACs/flows, with no difference in the underlying capture mechanism — this is an engineer judgment call per feature, not a skill-enforced rule.

**AC3:** Given any video file produced by this story, When the package is checked for completeness, Then a machine-generated caption file and a standalone text transcript both exist alongside it in `artefacts/[feature-slug]/playback/video/`, marked human-reviewable (not yet confirmed accurate) until the engineer explicitly reviews them.

**AC4:** Given a video recording with no narration (silent), When its transcript is generated, Then the transcript is still produced — sourced from the scripted interaction sequence and any on-screen text, not from spoken audio that doesn't exist — confirming captions/transcript are never skipped for a silent recording.

**AC5:** Given the package's own completion status, When captions or transcript are missing or still machine-unreviewed for any video file, Then the package is not marked complete — mirrors `fpd-s1`'s own AC4 editorial-review requirement, extended to accessibility artefacts.

## Out of Scope

- **AI-synthesised narration / voiceover** — out of scope for the whole feature per discovery.
- **The web-app viewer that plays this video back** — a separate epic (`feature-playback-web-viewer`).
- **In-browser video editing/trimming** — out of scope for the whole feature per discovery.
- **MP4 encoding via `ffmpeg`** — explicitly dropped, not deferred (see Architecture Constraints and `decisions.md`).
- **Caption/transcript accuracy guarantees** — this story ships the generation mechanism and the human-review gate (AC5), not a specific accuracy threshold.

## NFRs

- **Performance:** No specific SLA named in discovery; informed by M3's own 45-minute whole-package target.
- **Security:** Same posture as `fpd-s1` — video captures only what is already visible in the normal authenticated UI.
- **Accessibility:** WCAG AA baseline — captions + transcript on every video, non-optional (AC3–AC5). This is the story's own primary NFR, not an afterthought.
- **Audit:** None — read-only capture against an already-DoD-complete feature.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
