# Contract Proposal — Override drawflow's vendor-default node/port/connector colours with the app's own design tokens

**Story reference:** artefacts/2026-10-15-canvas-node-styling-fix/stories/cnsf-s1-canvas-node-token-styling.md
**Date:** 2026-10-15

---

## What will be built

In `src/web-ui/routes/journeys.js`'s existing style block (inside `handleGetJourneyCanvas`), 4 new CSS override rules, each scoped with an `#sw-drawflow-canvas` ancestor-ID selector (ID selectors always outrank any number of class selectors, so these win the cascade over drawflow's own vendor rules regardless of source order — no change to `<style>`/`<link>` ordering, no `!important`):

- `#sw-drawflow-canvas .drawflow-node{background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:8px}`
- `#sw-drawflow-canvas .drawflow-node.selected{background:var(--accent-soft);border-color:var(--accent)}`
- `#sw-drawflow-canvas .drawflow-node .input,#sw-drawflow-canvas .drawflow-node .output{background:var(--surface);border:2px solid var(--line)}`
- `#sw-drawflow-canvas .connection .main-path{stroke:var(--line);stroke-width:2px}`

No markup change, no JS change, no new file.

## What will NOT be built

- Node width, padding, position, or content (unchanged).
- Any change to `node_modules/drawflow` itself or the vendor CSS file served at `/vendor/drawflow.min.css`.
- Any change to the Customer-experience or Delivery views.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Rule-text assertion (selector + declarations present) | Unit |
| AC1 (wins cascade) | jsdom + `getComputedStyle` against the real vendor rule text | Integration |
| AC2 | Rule-text assertion | Unit |
| AC2 (wins cascade) | jsdom + `getComputedStyle` | Integration |
| AC3 | Rule-text assertion | Unit |
| AC3 (wins cascade) | jsdom + `getComputedStyle` | Integration |
| AC4 | Rule-text assertion | Unit |
| AC4 (wins cascade) | jsdom + `getComputedStyle` | Integration |
| AC5 | No hard-coded hex literal in the override rules | Unit |
| AC6 | Classification note, no test | N/A |

## Assumptions

- The real vendor CSS rule text (read fresh from `node_modules/drawflow/dist/drawflow.min.css` at test time) is the authoritative baseline for the cascade-specificity proof.
- `#sw-drawflow-canvas` always exists when at least one stage is present (confirmed: it's the drawflow mount point, rendered whenever `stages.length > 0`).

## Estimated touch points

**Files:** `src/web-ui/routes/journeys.js` (CSS-only addition), `tests/check-cnsf-s1-canvas-node-token-styling.js` (new)
**Services:** None
**APIs:** None

---

## H-GOV note (same gap as `pcr-s1`/`stis-s1`)

No discovery artefact exists for this short-track story — `definition-of-ready/SKILL.md`'s H-GOV check assumes one always exists, which is false for short-track by design (a known, already-logged skill gap, not specific to this story). Per the established precedent (`artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md` and `artefacts/2026-07-12-skill-turn-test-isolation/decisions.md`), H-GOV is treated as satisfied via the operator's own direct, explicit in-session request for this story, logged in `decisions.md` below — this is now the third occurrence of this exact gap.
