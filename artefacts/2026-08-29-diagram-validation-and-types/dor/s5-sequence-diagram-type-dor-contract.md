# Contract Proposal: Add the Sequence diagram type, conditionally emitted

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s5-sequence-diagram-type.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-29

---

## What will be built

- Add a new "Canvas markers — Sequence diagram" section to `skills/design/SKILL.md`, alongside the existing System Architecture section (Step 2, Solution architecture), following the exact same structure: format, fields, a worked example, and an explicit **conditional emission** instruction (unlike System Architecture's unconditional "emit exactly one" instruction) — the model should only emit a sequence marker when the feature's own subject matter genuinely involves a multi-step component interaction worth diagramming.
- Add `"sequence"` to `TYPE_ALLOW` in `parseCanvasBlock` (`src/web-ui/routes/skills.js`).
- Add one more `else if (type === "sequence")` branch in the shared `renderCanvasBlock` function (within `_CANVAS_RENDER_FN_LINES`), calling the existing `buildDiagramBodyHtml("Sequence", content)` — no new rendering code.

## What will NOT be built

- No `compareSequence` function or any drift-comparator support — explicitly out of scope.
- No instruction added to `skills/definition/SKILL.md` (see Assumptions below).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1, AC2 | Manual verification (model judgment, not automatable) — see verification script 🔴 scenarios | Manual |
| AC3 | Render a valid `sequence`-type block; assert shared dispatch and "Sequence" label | Unit |
| AC4 | Render the same block through the read-only history script; assert identical output | Unit |
| AC5 | Parse a `sequence`-type marker; assert not rejected | Unit |

## Assumptions

- **Contract clarification (resolved, not left ambiguous):** the story says "during `/design` or `/definition`" — this could mean the instruction needs to live in both SKILL.md files. Resolved: the instruction is added to `skills/design/SKILL.md` only, alongside System Architecture (the closest existing precedent — both are technical/architectural diagram types authored during Solution Architecture design), not `skills/definition/SKILL.md` (which already hosts Data Model and Program Design, both structurally different concerns — data shape and file-tree/call-stack, not interaction-over-time). Since `/design` is optional (Step 2.5 in the pipeline overview) and sequence emission is itself conditional, a feature that skips `/design` simply never gets a Sequence diagram — this is consistent with the story's own "conditional, not unconditional" framing, not a gap.
- The render-site inventory check (per `.github/standards/web-ui/web-ui-patterns.md`) has already been performed as part of this story's own definition: `renderCanvasBlock`'s dispatch and the read-only history script's shared `_CANVAS_RENDER_FN_LINES` array are the only two render call sites for any canvas-block type — confirmed via the ADR-026 compliance check `check-csd-s2-canvas-diagram-rendering.js` already enforces (4 occurrences total across both scripts, not 8). No third site exists.

## Estimated touch points

Files: `skills/design/SKILL.md` (new section), `src/web-ui/routes/skills.js` (`parseCanvasBlock`'s `TYPE_ALLOW`, `renderCanvasBlock`'s dispatch branch within `_CANVAS_RENDER_FN_LINES`). Services: none. APIs: none — internal marker-type addition only.
