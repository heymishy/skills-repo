## Epic: The playback package includes a screen-capture video walkthrough that ships with captions and a transcript from day one

**Discovery reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/discovery.md
**Benefit-metric reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

When this epic is complete, the Feature Playback Package skill also produces a video walkthrough — captured via Playwright's own built-in `recordVideo` (zero new npm dependency, `spikes/video-capture-mechanism-outcome.md`), encoded to MP4 via `ffmpeg`, with narration optional and machine-generated captions plus a standalone text transcript shipped alongside every recording as a non-negotiable WCAG AA baseline — not a later enhancement. Video output shape (one combined walkthrough, or several clips targeted at individual ACs/flows) is an engineer judgment call per feature.

## Out of Scope

- **AI-synthesised narration / voiceover** — out of scope for the whole feature per discovery; narration, if present at all, is the engineer's own recorded voice, never generated.
- **The web-app viewer that plays this video back** — a separate epic (`feature-playback-web-viewer`); this epic's own output is still files on disk.
- **In-browser video editing/trimming** — out of scope for the whole feature per discovery.
- **Caption/transcript accuracy guarantees beyond "machine-generated, human-reviewable"** — this epic ships the generation mechanism and the human review step; it does not guarantee a specific accuracy threshold.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| M1 — Acceptance loop closure rate | 0% | ≥80% within 5 business days | Video is one of the 3 required package components (discovery MVP scope item 3) — a package without it is incomplete, so this epic is required for M1, not optional |
| M3 — Demo preparation time | ~2–4h (estimate) | ≤45 min engineer input time | Playwright's own `recordVideo` requires no manual screen-recording effort from the engineer; auto-transcription removes the narration-authoring step entirely when narration is skipped |

## Stories in This Epic

- [ ] Add a Playwright-recorded, ffmpeg-encoded video walkthrough with machine-generated captions and transcript — `fpd-s2`

## Human Oversight Level

**Oversight:** High
**Rationale:** Per `architecture-guardrails.md`'s "Solo operator / W4 RISK-ACCEPT posture" — oversight defaults to High for every story in this repo's operating model, not because this epic's own complexity demands it.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
