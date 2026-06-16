# Story: inc4 — Canvas output panel for lens structured content

**Story ID:** inc4
**Feature:** 2026-06-15-ideate-web-ux-inc3
**Date:** 2026-06-15

---

## User story

As a facilitator or product lead using /ideate, I want structured lens output (opportunity maps, cluster trees, tables) to render visually in the right panel canvas rather than as streamed markdown in the chat bubble, so that I can navigate and refer to the structure without scrolling through a long chat history.

---

## Acceptance criteria

**AC1 — `---CANVAS-JSON---` marker parsed:** `parseCanvasBlock(text)` extracts and validates `---CANVAS-JSON: {"type":"<type>","title":"<title>","content":<object>}---` markers. Invalid JSON or unknown type returns `null`.

**AC2 — `canvasBlock` SSE event emitted:** `handlePostTurnStreamHtml` emits `data: {"canvasBlock": {...}}\n\n` for each valid canvas marker found in the model stream. Marker is stripped from `chunk` display event.

**AC3 — Canvas panel present in shell HTML:** `#canvas-panel` section with `role="region"` and `aria-label="Canvas"` present in `renderChat` output. Panel replaces or augments the `#draft-content` section.

**AC4 — Block types rendered correctly:** Client-side `renderCanvasBlock(block)` renders at minimum: `type:"cluster-tree"` as a nested list with cluster nodes, `type:"table"` as an HTML table, `type:"text"` as a formatted text block.

**AC5 — HTML escaping:** All model-supplied text inside canvas blocks is HTML-escaped via `escHtmlClient` before DOM insertion.

**AC6 — Keyboard navigable:** Canvas blocks can be reached via Tab; block type label is visible as text (not colour-only).

**AC7 — Regression:** All existing iwu and inc2.1 tests pass unmodified.

---

## Architecture constraints

- Modify: `src/web-ui/routes/skills.js` (add `parseCanvasBlock`, canvas buffer, `canvasBlock` SSE emission, export)
- Modify: `src/web-ui/views/chat-view.js` (add `#canvas-panel` section, `renderCanvasBlock` inline script, CSS)
- New test file: `tests/check-inc4-canvas-panel.js`
- Append to package.json test chain
- **Design gate:** `/frontend-design` artefact must exist at `artefacts/2026-06-15-ideate-web-ux-inc3/design/inc4-canvas-design.md` before this story reaches definition-of-ready
- **Schema depends on:** inc3 (deliver first)

---

## DoD entry condition

Implementation only after design gate is cleared and inc3 is at DoD. Human verification: live session shows canvas blocks rendering for at least one lens output.
