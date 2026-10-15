# Contract Proposal — Viewer route lists a DoD-validated feature and navigates its scope/benefit/per-story AC structure

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s3-viewer-route-and-traceability-structure.md
**Date:** 2026-10-15

## What will be built

- A new route under `src/web-ui/routes/` (e.g. `playback.js`) with a list handler (DoD-validated features with a package) and a per-feature review-page handler.
- **ADR-028 reuse check (mandatory first implementation task, not optional):** before writing new feature/epic/story/AC traversal logic, search `/trace`'s own implementation and `dashboards/pipeline-viz.html`'s own feature-card rendering for an existing, reusable traversal. Reuse it if found; build a new one only if neither covers this shape.
- The review page renders: discovery's problem statement + benefit-metric's named metrics (read directly, not re-authored), then one section per story with that story's own ACs from its DoD's AC Coverage table.

## What will NOT be built

- Screenshot/video rendering (`fpd-s4`).
- Any change to `dashboards/pipeline-viz.html` itself.
- Any mutating action — this route is entirely read-only.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Fixture features (with/without a package), assert list contents | Unit |
| AC2 | Fixture discovery/benefit-metric content, assert verbatim rendering | Unit |
| AC3 | Fixture DoD AC Coverage table, assert per-story AC sections | Unit |
| AC4 | Fixture non-alphabetical epic/story order, assert real order preserved | Unit |
| AC5 | Fixture DoD-complete feature with no package, assert excluded from list | Unit |
| ADR-028 compliance | Source-level check: one traversal, reused or newly-canonical | Integration |

## Assumptions

- `pipeline-state.json`'s own `epics[].stories[]` array order is the authoritative "real" order for AC4's own check.
- A feature "has a package" is determined by the presence of `artefacts/[feature-slug]/playback/walkthrough.md` (the one file every package is guaranteed to have, per `fpd-s1`'s own AC1) — not requiring video to already exist (which may not be built yet for a feature still mid-package, consistent with the walking-skeleton framing).

## Estimated touch points

**Files:** `src/web-ui/routes/playback.js` (new), `src/web-ui/server.js` (modify — route registration), `tests/check-fpd-s3-*.js` (new)
**Services:** None
**APIs:** None — reuses existing session authentication

## H8-ext — Cross-story schema dependency check

**Dependencies block:** Upstream — `fpd-s1`.
**schemaDepends:** `[]` (empty)
**Rationale:** Depends on `fpd-s1`'s own file output (`artefacts/[feature-slug]/playback/walkthrough.md` existing), not a `pipeline-state.json` schema field.
