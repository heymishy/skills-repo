# DoR Contract — dviz.1-pipeline-adapter

**Feature:** `2026-04-18-dashboard-v2`
**Story:** `dviz.1`
**Status:** Signed-off ✅

---

## File touchpoints

| # | File | Action | Justification |
|---|------|--------|---------------|
| 1 | `dashboards/pipeline-adapter.js` | CREATE | Core adapter exposing window.CYCLES and window.EPICS from pipeline-state.json |
| 2 | `dashboards/index.html` | MODIFY | Add script tag for adapter; remove inline mock CYCLES/EPICS/STORIES arrays |
| 3 | `tests/check-dviz1-adapter.js` | CREATE | Automated governance check — T1-T10 from dviz.1-test-plan.md |
| 4 | `package.json` | MODIFY | Add check-dviz1-adapter.js to test chain |

---

## Out-of-scope constraints (do NOT touch)

- `pipeline-viz.html` — not part of this feature
- `dashboards/extra-data.js` — secondary views; separate future story
- `dashboards/artefact-content.js` — unrelated
- `dashboards/md-renderer.js` — unrelated
- `dashboards/pipeline.html` — separate view; out of scope
- `.github/pipeline-state.json` and `.github/pipeline-state.schema.json` — read-only inputs; do not modify schema
- `artefacts/` — pipeline artefacts are protected; no modifications
- `.github/skills/`, `.github/templates/` — infrastructure; do not modify
- Any file not in the explicit touchpoint list above

---

## Schema dependencies

| Field | Used as | Source |
|-------|---------|--------|
| `features[].id` | Cycle id | pipeline-state.json |
| `features[].name` | Cycle name | pipeline-state.json |
| `features[].stage` | Derive current phase | pipeline-state.json |
| `features[].health` | Cycle and story state | pipeline-state.json |
| `features[].epics[].id` | Epic id | pipeline-state.json |
| `features[].epics[].name` | Epic name | pipeline-state.json |
| `features[].epics[].stories[].id` | Story id | pipeline-state.json |
| `features[].epics[].stories[].stage` | Story phase derivation | pipeline-state.json |
| `features[].epics[].stories[].health` | Story state derivation | pipeline-state.json |
| `features[].epics[].stories[].dodStatus` | Story done state | pipeline-state.json |

All fields verified present in the current schema. No new fields required.

---

## Security constraints

- MC-SEC-02: No credentials, API keys, tokens, or personal identifiers in `pipeline-adapter.js`
- No innerHTML usage for rendering
- No external network calls beyond `fetch('.github/pipeline-state.json')` relative path

---

## Dependency on other dviz stories

- dviz.1 has no dependency on dviz.2 or dviz.3; can be implemented independently.
- dviz.3 (governance check) may extend the test it writes to cover `pipeline-adapter.js`, but dviz.3 does not block dviz.1.
