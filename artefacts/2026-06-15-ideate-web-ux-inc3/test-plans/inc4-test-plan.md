# Test Plan: inc4 — Canvas output panel

**Story:** inc4
**Feature:** 2026-06-15-ideate-web-ux-inc3
**Date:** 2026-06-15

---

## Tests

| Test | AC | Method | Description |
|------|-----|--------|-------------|
| T1 | AC1 | Automated | `parseCanvasBlock` returns non-null for valid marker; correct fields |
| T2 | AC1 | Automated | `parseCanvasBlock` returns null for invalid JSON |
| T3 | AC1 | Automated | `parseCanvasBlock` returns null for unknown type |
| T4 | AC2 | Automated | `handlePostTurnStreamHtml` emits `canvasBlock` SSE event for valid marker; session.canvasBlocks populated |
| T5 | AC2 | Automated | Canvas marker stripped from `chunk` display event |
| T6 | AC3 | Automated | `#canvas-panel` present in `renderChat` output with `role="region"` and correct `aria-label` |
| T7 | AC4 | Automated | `renderCanvasBlock` function present in inline script |
| T8 | AC4 | Automated | `renderCanvasBlock` handles `type:"cluster-tree"`, `type:"table"`, `type:"text"` |
| T9 | AC5 | Automated | `renderCanvasBlock` uses `escHtmlClient` for all text output |
| T10 | AC7 | Automated | All iwu and inc2.1 tests pass unmodified |

## Design gate

T7–T9 assertions depend on the `/frontend-design` artefact defining the block rendering structure. Test file cannot be fully written until design is complete.

## Test file

`tests/check-inc4-canvas-panel.js` — written after design gate cleared.
