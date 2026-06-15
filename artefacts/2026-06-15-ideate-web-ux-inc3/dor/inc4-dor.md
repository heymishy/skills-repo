# Definition of Ready: inc4 — Canvas output panel

**Story:** inc4
**Feature:** 2026-06-15-ideate-web-ux-inc3
**DoR completed:** 2026-06-15
**Signed off by:** Hamish King
**Design gate:** CLEARED — design artefact at `artefacts/2026-06-15-ideate-web-ux-inc3/design/inc4-canvas-panel.html`
**Prerequisite:** inc3 at definition-of-done ✅

---

## H1–H9 checklist

H1 ✅ User story format present (see stories/inc4.md)
H2 ✅ 7 ACs defined (AC1–AC7)
H3 ✅ Test plan written (test-plans/inc4-test-plan.md)
H4 ✅ Out of scope: no change to existing SKILL.md, existing iwu tests, conditions panel, assumptions panel
H5 ✅ Benefit linkage: M2 (canvas render fidelity)
H6 ✅ Complexity 3 — new marker type, SSE event, client canvas renderer, HTML/CSS from design spec
H7 ✅ Review PASS, 0 HIGH (inc4-review-1.md)
H8 ✅ No uncovered ACs
H9 ✅ Architecture constraints fully defined below

---

## Design gate: cleared

Design artefact: `artefacts/2026-06-15-ideate-web-ux-inc3/design/inc4-canvas-panel.html`
Approved by: Hamish King, 2026-06-15

Design specifies:
1. **Canvas panel position:** Right panel, replaces `#draft-content` flex slot. Five lens cards (A–E) + Synthesis (S), each with coloured left-border accent from design system palette. Progress pips (A–E) in section head.
2. **Block type allowlist:** `cluster-tree` (nested list), `table` (HTML table), `text` (formatted text). One extension token: `--teal`/`--teal-soft` for Lens E card accent.
3. **Rendering spec:** Lens cards use `.sw-surface` with `border-left: 3px solid <accent>`. Cluster nodes as nested `<ul>` with marker dots. Tables use standard `<table>` with system border/background tokens. Text blocks as `<p>` elements. Assumption quadrant (Lens B) reuses `session.assumptionCards` data as SVG-like 2×2 grid.
4. **Keyboard navigation:** Block container reachable via Tab. Block type label rendered as text inside `.canvas-type-tag` element. No colour-only information.
5. **Impact on iwu2 `#draft-content` tests:** `#draft-content` is removed from `renderChat`. iwu2 AC8 must be reassessed — `#draft-content` assertion in check-iwu2 should be updated to `#canvas-panel`. Note as known regression to verify.

---

## Architecture constraints

**Files to modify:**
- `src/web-ui/routes/skills.js` — add `parseCanvasBlock(text)` (extracts `---CANVAS-JSON: {...}---`, validates type, returns null on invalid); add canvas buffer in `handlePostTurnStreamHtml` parallel to assumption/condition buffers; emit `canvasBlock` SSE event per valid block; strip canvas markers from `chunk` display event; export `parseCanvasBlock` and `setCanvasBlockHandler`
- `src/web-ui/views/chat-view.js` — add `#canvas-panel` section with `role="region"` and `aria-label="Canvas"` replacing `#draft-content`; add `renderCanvasBlock(block)` inline script handling `cluster-tree`, `table`, `text` types; add `.canvas-type-tag` CSS; add `--teal: #0F766E; --teal-soft: #CCFBF1` extension tokens; all model text through `escHtmlClient`

**New files:**
- `tests/check-inc4-canvas-panel.js` — 10 tests (T1–T10 per test plan)

**Package.json:** append `&& node tests/check-inc4-canvas-panel.js` to test chain

**Schema:** `---CANVAS-JSON: {"type":"cluster-tree"|"table"|"text","title":"<string>","content":<object>}---`

**Marker format:** same `---<NAME>-JSON: {...}---` convention as ASSUMPTION-JSON and CONDITION-JSON

---

## DoD Entry Condition

Human verification: live /ideate session shows at least one canvas block rendering in `#canvas-panel` for a lens output. Verification artefact at `artefacts/2026-06-15-ideate-web-ux-inc3/verification/inc4-canvas-verification.md`.

---

## Coding Agent Instructions

```
Proceed: Yes
Prerequisite gate: inc3 at definition-of-done ✅

Modify:
  src/web-ui/routes/skills.js
  src/web-ui/views/chat-view.js

New files:
  tests/check-inc4-canvas-panel.js  (10 tests T1–T10)

Append to package.json: && node tests/check-inc4-canvas-panel.js

Key implementation notes:
- parseCanvasBlock: regex /---CANVAS-JSON:([\s\S]*?)---/g, JSON.parse content field,
  validate type in ['cluster-tree','table','text'], return null on any parse/validate error
- Canvas buffer in handlePostTurnStreamHtml: same pattern as _assumBuf / _condBuf
- SSE event: data: {"event":"canvasBlock","block":{...}}\n\n
- #canvas-panel replaces #draft-content; update any iwu2 test that checks #draft-content
- renderCanvasBlock dispatches on block.type:
    cluster-tree → recursive <ul>/<li> from content.clusters array
    table        → <table> with content.headers / content.rows
    text         → <p> elements from content.paragraphs array
- All user-supplied strings through escHtmlClient before DOM insertion
- Extension CSS tokens --teal / --teal-soft scoped to :root in chat-view inline style
- .canvas-type-tag must be visible text label (not icon-only) for AC6
```
