# DoR Contract: inc5 — Canvas-JSON marker instruction in /ideate SKILL.md

**Story:** inc5
**Feature:** 2026-06-15-ideate-web-ux-inc3
**Contract date:** 2026-06-16
**Signed off by:** Hamish King — Engineering lead

---

## What will be built

A new instruction block added to `.github/skills/ideate/SKILL.md` directing the model to:
- Emit a `---CANVAS-JSON: {"type":"cluster-tree", ...}---` marker when producing Lens A opportunity-map output
- Emit a `---CANVAS-JSON: {"type":"table", ...}---` marker when producing Lens D strategy-table output
- Emit a `---CANVAS-JSON: {"type":"text", ...}---` marker for narrative/prose lens output (Lens C, Lens E)
- Emit exactly one marker per lens output (cadence guidance)
- Follow the exact schema `{"type":"cluster-tree"|"table"|"text","title":"<string>","content":<object>}`, with one worked example per type, matching the schema already validated by inc4's `parseCanvasBlock`

## What will NOT be built

- No new canvas block types beyond `cluster-tree`, `table`, `text` (inc4's type allowlist is unchanged)
- No changes to `src/web-ui/routes/skills.js` or `src/web-ui/views/chat-view.js` — `parseCanvasBlock`, the `canvasBlock` SSE event, `#canvas-panel`, and `renderCanvasBlock` are already in production from inc4 and are not touched
- No changes to any SKILL.md other than `/ideate`
- No changes to existing lens step content, assumption cards, or condition cards

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Lens A cluster-tree marker | T1 (static text proximity check) + Scenario 1 (live session) | Unit + Manual (blocking DoD gate) |
| AC2 — Lens D table marker | T2 (static text proximity check) + Scenario 2 (live session) | Unit + Manual (blocking DoD gate) |
| AC3 — Text fallback | T3 (static text check: `text` type + narrative/prose scoping) | Unit |
| AC4 — Marker schema compliance | T4 (≥3 well-formed CANVAS-JSON examples, one per type) | Unit |
| AC5 — Marker stripped from chat stream | Regression: `tests/check-inc4-canvas-panel.js` T5 unmodified pass + Scenario 5 | Unit (existing, inc4) + Manual |
| AC6 — Cadence: one block per lens output | T5 (static cadence-language check) + Scenario 3 (live session) | Unit + Manual (non-blocking) |

## Assumptions

1. **inc4 dependency wording vs. actual state:** The story header and Dependencies section say "inc4 at definition-of-done," but inc4's pipeline-state stage is `verify-completion` — inc4 has never had its own `/definition-of-done` run. This is not a blocking discrepancy: inc4's code is fully merged (`prStatus: merged`, all 5 tasks `tddState: green`), which is the actual functional prerequisite for inc5 (inc4's `parseCanvasBlock`/`canvasBlock` pipeline must exist, not that inc4's paperwork is closed). inc4's own DoD entry condition was intentionally deferred pending inc5 — inc5's "Definition of done entry condition" note states inc5's verification artefact also satisfies inc4's deferred entry condition. This DoR proceeds on the satisfied functional dependency.
2. Model behaviour at inference time is non-deterministic — automated tests (T1, T2, T5) can confirm the instruction text exists and is well-formed, never that the model reliably obeys it. This gap is permanent for this class of story (captured in `workspace/capture-log.md`, 2026-06-16 entry) and is why AC1/AC2/AC6 carry manual verification scenarios.
3. `tests/check-inc5-canvas-skill-instruction.js` (written at `/test-plan`, currently red) is wired into `package.json`'s `test` chain in the same commit as the SKILL.md implementation — not before — matching the established convention from inc3 and inc4 (confirmed via `git log -p` history of both stories' implementation commits).

## Estimated touch points

**Files:** `.github/skills/ideate/SKILL.md` (modify, additive only), `package.json` (modify, at implementation time only)
**Services:** None
**APIs:** None

## Schema dependencies (H8-ext)

Dependencies block names inc4 as upstream → `schemaDepends: ["stage", "dodStatus"]`. Both fields exist in `.github/pipeline-state.schema.json` at story level (`stage`: string; `dodStatus`: enum `["not-started","complete"]`). H8-ext passes.

## Human oversight

High — governed file (`.github/skills/ideate/SKILL.md`). Human review and merge required. Signed off by Hamish King — Engineering lead, 2026-06-16.
