## Definition of Ready: drh-s1 — Diagrams generated during a live /ideate session never appear when resuming/viewing that stage's history

**Story:** artefacts/2026-08-10-resume-diagram-history-fix/stories/drh-s1-resume-history-diagram-rendering.md
**Review artefact:** artefacts/2026-08-10-resume-diagram-history-fix/review/drh-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-10-resume-diagram-history-fix/test-plans/drh-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/routes/skills.js` — export `parseCanvasBlock` (or add and export a new `extractCanvasBlocksFromTurns(turns)` helper built on top of it, scanning all turns' `content` with a global marker regex, one `parseCanvasBlock`-equivalent call per match).
- `src/web-ui/routes/journey.js` — `handleGetJourneyStageView`: when `_useChatSplit` and `stageName` is one of `ideate`/`design`/`definition`, call the new extraction helper against `_dshTurns`; if it returns ≥1 block, pass the REAL `stageName` (not the `'ideate-history'` sentinel) plus the extracted blocks into `renderChat`'s `data` (new field, e.g. `data.historyCanvasBlocks`), and include the mermaid asset script tag in the response.
- `src/web-ui/views/chat-view.js` — `renderChat`: add a narrow, read-only-safe script variant. When `data.readOnly && data.historyCanvasBlocks && data.historyCanvasBlocks.length`, emit a minimal inline `<script>` containing just `renderCanvasBlock`'s existing logic (extract/reuse from the current interactive script, don't reimplement), an append-to-`#canvas-panel` loop over `window.__SW_INITIAL_CANVAS_BLOCKS__`, and a single `mermaid.run()` call — omit everything else the interactive script currently has (condition items, assumption cards, confirm handlers, lens pips).
- New test file: `tests/check-drh-s1-resume-history-diagram-rendering.js`.

**Files explicitly out of scope (must not be touched):**
- `skills/ideate/SKILL.md` and the other skills' emission instructions — untouched.
- The live chat page's own diagram rendering (`skills.js`'s `_renderChatPage`, `supportsCanvas`, `canvasBlocksInitScript` for the live/non-history case) — already correct, not touched.
- `chat-view.js`'s existing interactive `scriptHtml` (used when `!data.readOnly`) — untouched; the new read-only script variant is additive, not a replacement.
- Any change to `readOnly`'s suppression of the footer/input-form — untouched; AC4 explicitly requires this stays suppressed.

### Architecture Constraints

No new architectural decision — reuses the existing `window.__SW_INITIAL_CANVAS_BLOCKS__` init-variable pattern (already proven for the live page's own analogous resume-after-redeploy case) and the existing `parseCanvasBlock`/type-allowlist mechanism. No ADR required.

**Correctness note for the coding agent:** `renderCanvasBlock`'s current implementation lives as a string inside the interactive `scriptHtml` block (`skills.js` ~line 3585). Extract it into a small, standalone JS snippet string constant so both the interactive script and the new read-only script variant can each embed it without duplicating the diagram-type-branch logic (data-model/system-architecture/program-design/cluster-tree/table/text/drift-signal) inline in two places.

### Human oversight

**Medium** — a real, operator-identified gap in a stated product differentiator, touching client-side script generation across two files with a real constraint to preserve (readOnly must not regain interactivity). Not High: the fix is read-only/display-only, no write paths, no new data mutation, reuses proven patterns.

### Coding Agent Instructions

1. In `skills.js`, export `parseCanvasBlock` and add `extractCanvasBlocksFromTurns(turns)`:
   ```javascript
   function extractCanvasBlocksFromTurns(turns) {
     var MARKER_RE_G = /---CANVAS-JSON:\s*(\{[\s\S]*?\})\s*---/g;
     var blocks = [];
     (turns || []).forEach(function(t) {
       var text = String(t.content || '');
       var m;
       while ((m = MARKER_RE_G.exec(text)) !== null) {
         var parsed = parseCanvasBlock('---CANVAS-JSON: ' + m[1] + '---');
         if (parsed) blocks.push(parsed);
       }
     });
     return blocks;
   }
   ```
   Export both from `module.exports`.
2. In `journey.js`'s `handleGetJourneyStageView`, after `_dshTurns` is fetched and `_useChatSplit` is determined true, and `stageName` is `ideate`/`design`/`definition`: call `extractCanvasBlocksFromTurns(_dshTurns)`. If non-empty, use the real `stageName` (not `'ideate-history'`) when building the `renderChat` call, add `historyCanvasBlocks: <extracted blocks>` to its `data`, and append the mermaid asset script tag (`<script src="/vendor/mermaid.min.js"></script>`) to the response body alongside the existing navigator/chat HTML.
3. In `chat-view.js`'s `renderChat`, extract `renderCanvasBlock`'s logic (currently inline in the interactive `scriptHtml`, ~line 3585 of `skills.js` — note this may need to move into `chat-view.js` itself or be passed in, since `renderChat` is the function emitting `scriptHtml`) into a shared snippet. Add: when `data.readOnly && Array.isArray(data.historyCanvasBlocks) && data.historyCanvasBlocks.length`, emit a minimal script (append blocks to `#canvas-panel` via `renderCanvasBlock`, then `mermaid.run()`) instead of the current unconditional `''`.
4. Write the 6 unit/integration tests per the test plan.
5. Run the new test file plus existing `chat-view.js`/`journey.js`/`dsh-s3`-related test suites unmodified — zero regression to the existing readOnly-suppresses-everything behaviour for stages/cases with no diagrams (AC6).
6. Post-merge smoke step (not a blocking test, but worth doing): visit a real completed `/ideate` stage with known diagrams on staging and visually confirm the fix.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Medium)
- [x] No CSS-layout-dependent AC left unclassified (none — diagram presence/script-generation is DOM-structure-level, not visual-layout-dependent; the actual mermaid SVG rendering itself was already manually confirmed working this session)

**PROCEED: Yes**
