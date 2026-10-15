# Contract Proposal — Viewer renders the actual screenshot gallery and plays video per AC

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s4-viewer-media-playback.md
**Date:** 2026-10-15

## What will be built

- Extend `fpd-s3`'s own per-AC section rendering (the same canonical traversal — see Architecture Constraints, ADR-028) to embed an `<img>` for a screenshot and a native `<video>` (with a `<track kind="captions">` wired to `fpd-s2`'s own caption file) for a video, per AC.
- A standalone transcript link/block per AC section, independent of whether the video is played.
- An explicit empty-state render for an AC with no captured evidence yet.

## What will NOT be built

- Any new traversal — this story renders media INTO `fpd-s3`'s existing per-AC sections, not a second structure.
- A custom video player, download button, or editing controls.
- Multiple format support.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Fixture AC section with a screenshot reference, assert `<img>` renders | Unit |
| AC2 | Fixture AC section with a video reference, assert native `<video>` renders | Unit |
| AC3 | Real captioned video, real playback (E2E, RISK-ACCEPT for execution) | E2E |
| AC4 | Fixture AC section with video + transcript, assert transcript reachable without playback | Unit |
| AC5 | Fixture AC section with no evidence, assert explicit empty state | Unit |

## Assumptions

- `fpd-s3`'s own per-AC section markup exposes a stable extension point (e.g. a predictable container element/class per AC) this story can render media into, without needing to modify `fpd-s3`'s own traversal logic itself.

## Estimated touch points

**Files:** `src/web-ui/routes/playback.js` (modify, from `fpd-s3`), `tests/check-fpd-s4-*.js` (new), `tests/e2e/fpd-s4-*.spec.js` (new)
**Services:** None
**APIs:** None — serves existing files directly

## H8-ext — Cross-story schema dependency check

**Dependencies block:** Upstream — `fpd-s1`, `fpd-s2`, `fpd-s3`.
**schemaDepends:** `[]` (empty)
**Rationale:** Depends on shipped files (`fpd-s1`'s screenshots, `fpd-s2`'s video/captions/transcript) and shipped code (`fpd-s3`'s own traversal/structure) — not a `pipeline-state.json` schema field from any of the three.
