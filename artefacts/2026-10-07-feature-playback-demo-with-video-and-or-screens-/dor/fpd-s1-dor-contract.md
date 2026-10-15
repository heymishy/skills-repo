# Contract Proposal — Produce a structured, DoD-sourced walkthrough document with AC-mapped screenshots

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s1-walkthrough-document-and-screenshots.md
**Date:** 2026-10-15

## What will be built

- `skills/feature-playback/SKILL.md` — a new pure-instruction skill file, following this repo's own established skill-authoring convention (entry-condition check, numbered steps, completion output).
- A corresponding entry added to `.github/scripts/check-skill-contracts.js`'s `CONTRACTS` array, naming this new skill's own required structural markers.
- `scripts/playback-capture.js` (new) — reads a feature's DoD artefact(s), generates `walkthrough.md`, drives Playwright screenshot capture at each AC's stable UI state.
- Output: `artefacts/[feature-slug]/playback/walkthrough.md` and `artefacts/[feature-slug]/playback/screenshots/`.

## What will NOT be built

- Video recording (`fpd-s2`) or the web-app viewer (`fpd-s3`/`fpd-s4`).
- Any engineer-review UI — "review confirmed" is a simple flag/field the engineer sets, not a dedicated review interface.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Fixture DoD artefact, assert generated doc sections match table rows | Unit |
| AC2 | Fixture Metric Signal section, assert doc section matches | Unit |
| AC3 | Mocked Playwright `page`, assert `.screenshot()` calls + embedding (unit); real capture (E2E, RISK-ACCEPT for execution) | Unit + E2E |
| AC4 | Fixture package, assert status before/after review confirmation | Unit |
| AC5 | Fixture non-DoD-complete feature, assert refusal + error message | Unit |

## Assumptions

- The DoD artefact's own AC Coverage table and Metric Signal section are reliably parseable in a consistent structure (this repo's own `templates/dod.md` shape).
- "Stable UI state" for a given AC is identifiable from the same interaction script the DoD's own verification/E2E evidence was built from — not a new, separately-authored script per AC.

## Estimated touch points

**Files:** `skills/feature-playback/SKILL.md` (new), `scripts/playback-capture.js` (new), `.github/scripts/check-skill-contracts.js` (new CONTRACTS entry), `tests/check-fpd-s1-*.js` (new)
**Services:** None
**APIs:** None

## H8-ext — Cross-story schema dependency check

**Dependencies block:** Upstream — None.
**schemaDepends:** N/A — no upstream story dependency declared, check does not trigger.
