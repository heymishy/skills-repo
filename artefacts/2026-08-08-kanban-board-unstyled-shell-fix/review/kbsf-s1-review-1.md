## Review: kbsf-s1 — Wrap kanban board HTML in the shared page shell

**Story:** artefacts/2026-08-08-kanban-board-unstyled-shell-fix/stories/kbsf-s1-wrap-kanban-html-in-shared-shell.md
**Reviewer:** Claude (agent), operator-directed
**Date:** 2026-08-08

---

### Category A: Traceability

PASS. Benefit linkage names the exact observed defect (unstyled kanban board), the exact commit/story that introduced the CSS without ever wiring it (`s2.1`, `2026-07-24-interactive-kanban-boards`), and the exact root cause confirmed via direct source inspection (`_sendKanbanHtml` sends `renderKanban()`'s raw fragment, bypassing `renderShell()`). No unconfirmed assumptions.

### Category B: Scope discipline

PASS. Out of scope names 3 explicit items (sidebar/breadcrumb nav-parity polish, any visual/interaction redesign, a dedicated Kanban nav entry), each with a one-line reason. Architecture Constraints explicitly state `kanban-view.js` is not touched — the fix is confined to the three route handlers in `products.js` that currently call `_sendKanbanHtml` with a raw fragment.

### Category C: AC quality

PASS. 4 ACs, each Given/When/Then, each independently testable:
- AC1–AC3 cover the three real call sites (product, org, tenant scope) individually rather than one combined AC — correct, since each is a separate route handler and a fix could accidentally miss one.
- AC4 is a regression guard naming the specific existing test files that must continue passing — appropriately scoped given the fix changes what wraps the same DOM elements those tests select against.

### Category D: Completeness

PASS. NFRs stated (performance negligible, security N/A — reusing an already-audited function, accessibility improves incidentally, audit N/A). Complexity rated 1 with justification. Dependencies section correctly states no upstream/downstream dependency (both `s2.1` and `kbc-s1` are already merged).

### Category E: Architecture compliance

PASS, with one guardrail explicitly checked and confirmed not triggered: `.github/architecture-guardrails.md` line 115 requires "any change to shared surface modules (`html-shell.js`, design tokens, navigation structure, shared CSS)" to go through a story. This fix modifies neither `html-shell.js` nor `kanban-view.js` — it only changes three call sites in `products.js` to correctly *consume* the existing, unmodified `renderShell()`, matching the same pattern already used by every other page in that file (`handleGetProductView`, `_renderRoadmapTab`, etc.). No shared surface module is being changed, so the guardrail's heavier process doesn't apply — but the story itself exists regardless, consistent with this repo's own artefact-first convention for any behavioural change.

---

### Verdict

**PASS — 0 HIGH findings.** Story is well-scoped, ACs are testable, root cause is confirmed via direct source inspection (not speculation), and the fix pattern matches an already-established, already-proven convention elsewhere in the same file. Cleared to proceed to `/test-plan`.
