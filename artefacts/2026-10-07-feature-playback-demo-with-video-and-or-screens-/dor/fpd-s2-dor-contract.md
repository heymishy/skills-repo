# Contract Proposal — Add a Playwright-recorded video walkthrough with machine-generated captions and transcript

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s2-video-walkthrough-and-accessibility.md
**Date:** 2026-10-15

## What will be built

- Extend `scripts/playback-capture.js` (from `fpd-s1`) with a video-recording step: Playwright `recordVideo` browser-context option, one context per recording (single or multi-clip, engineer's own choice).
- A new D37 adapter module (e.g. `src/adapters/caption-transcript.js` or equivalent) exporting `generateCaptionsAndTranscript(videoPath)` / `setGenerateCaptionsAndTranscript(impl)` / `getGenerateCaptionsAndTranscript()`, with the unwired default throwing the exact D37 stub error.
- A real implementation wired in `server.js` (or the equivalent wiring module) only when `NODE_ENV !== 'test'`, matching every existing D37 adapter in this codebase.
- Output: `artefacts/[feature-slug]/playback/video/*.webm` plus a caption file and a standalone transcript file per video.

## What will NOT be built

- AI-synthesised narration/voiceover.
- The web-app viewer that plays this back (`fpd-s3`/`fpd-s4`).
- `ffmpeg`/MP4 encoding — explicitly dropped (`decisions.md`, D2-platform gate).
- In-browser video editing.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mocked browser context, assert `recordVideo` option values (unit); real recording (E2E, RISK-ACCEPT for execution) | Unit + E2E |
| AC2 | Single-file and multi-file fixtures, assert context count matches | Unit |
| AC3 | Fixture `.webm` path, assert caption + transcript files exist, `reviewed: false` | Unit |
| AC4 | Fixture silent recording, assert transcript still produced | Unit |
| AC5 | Fixture package with unreviewed captions/transcript, assert not complete | Unit |
| AC6 | Wired adapter with 2 distinct fixture inputs, assert differing traceable output (integration); unwired adapter throws exact stub error (unit) | Unit + Integration |

## Assumptions

- The caption/transcript generation mechanism's own underlying provider (which speech-to-text/transcription library or API) is an implementation detail the coding agent selects at build time, consistent with this story's own D37 adapter boundary — the ACs constrain behaviour (differing, traceably-correct output; non-optional; silent-recording-safe), not the specific provider.
- The adapter's production wiring runs only outside `NODE_ENV=test`, matching every existing D37 adapter in this codebase.

## Estimated touch points

**Files:** `scripts/playback-capture.js` (modify, from `fpd-s1`), a new adapter module under `src/adapters/` (new), `server.js` (modify — wiring), `tests/check-fpd-s2-*.js` (new)
**Services:** Whichever external speech-to-text/transcription provider the coding agent selects — named and documented in the adapter module itself at implementation time.
**APIs:** One new outbound call (the transcription provider), reached only through the D37 adapter.

## H8-ext — Cross-story schema dependency check

**Dependencies block:** Upstream — `fpd-s1`.
**schemaDepends:** `[]` (empty)
**Rationale:** This story's upstream dependency is on shipped code (the interaction script `fpd-s1`'s capture logic produces) and files on disk (the same `artefacts/[feature-slug]/playback/` directory) — not on any `pipeline-state.json` schema field `fpd-s1` wrote. No schema field dependency exists to declare.
