# Decision Log: canvas-diagram-panel-layout-fix

**Feature:** Fix the design/definition canvas pane squeeze bug and the dead maximise-canvas button
**Story reference:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/stories/cdpl-s1-fix-canvas-panel-squeeze-and-maximise.md
**Last updated:** 2026-08-07

---

## Decision categories

| Code | Meaning |
|------|---------|
| `GAP` | Process gap acknowledged (e.g. short-track skipping discovery/review) |
| `SCOPE` | MVP scope added, removed, or deferred |

---

## Log entries

---
**2026-08-07 | GAP (H-GOV) | short-track**
**Decision:** This story proceeds via the short-track path (`/test-plan → /definition-of-ready → coding agent`), skipping discovery, benefit-metric, definition, and review — no `## Approved By` discovery section exists for H-GOV to check.
**Alternatives considered:** Running the full outer loop for a bounded, well-understood CSS/JS layout fix.
**Rationale:** This is a bounded UI bug fix (one file, isolated flex-layout issue plus a dead-function fix) discovered via live staging testing, directly analogous to the short-track path already used this session for `tpac-s1` and `npwe-s1`. A full discovery-through-review cycle would be disproportionate process weight for a Complexity-1, single-file fix.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** None — short-track is the appropriate weight for this class of fix.
---

---
**2026-08-07 | SCOPE | /discovery-equivalent (story-writing)**
**Decision:** This story's scope includes fixing the pre-existing dead `swExpandCanvas()` button (ideate 3-panel layout) alongside the reported artefact/canvas squeeze bug in the design/definition pane, rather than treating them as two separate stories.
**Alternatives considered:** A separate follow-up story for the dead-button fix, keeping this story scoped only to the reported squeeze issue.
**Rationale:** Both issues are the same underlying capability — a working "maximise a panel within `sw-chat-pane`" mechanism — and `swToggleArtefactFs()`/`.ad-fs` already provides one working implementation to reuse for both. Fixing them together avoids building a second, different maximise mechanism for the design/definition pane while leaving the ideate layout's identical-purpose button silently broken elsewhere in the same file. This matches this repo's own architecture-guardrails.md pattern: "Group instruction-text-only changes at the same exit point into a single story" (generalised here to "group trivially co-located fixes to the same shared mechanism").
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** None.
---

---
**2026-08-07 | SCOPE | coding-agent implementation (cdpl-s1)**
**Decision:** The DoR contract's touch-point list ("Scope is entirely `src/web-ui/views/chat-view.js` (plus new/extended test files) -- no other file should need to change") is amended to also include `src/web-ui/routes/skills.js`, with one specific, narrow change: deletion of that file's own pre-existing `window.swExpandCanvas = function() {...}` definition (previously hiding the ideate layout's Conditions/Assumptions sibling panels rather than truly maximising the canvas).
**Alternatives considered:** (1) Leave `skills.js`'s definition in place and only add the new mechanism to `chat-view.js`, accepting AC4 as unverifiable in a real browser. (2) Rename the new `chat-view.js` function so it does not collide, and update the ideate button's `onclick` to call the new name instead of `swExpandCanvas`.
**Rationale:** Real-browser E2E testing (AC4's own Playwright test, `ideateExpandCanvasButton_realClick_nowWorksInsteadOfThrowing`) revealed that `src/web-ui/routes/skills.js` already defines `window.swExpandCanvas` inside the client-side script it emits for every live chat page -- a script block that loads and executes AFTER `chat-view.js`'s own inline `<script>` on the same page, so it silently overwrote the new shared-mechanism function added to `chat-view.js`, leaving the button's real click behaviour unchanged (still hiding sibling panels, never actually reaching `.canvas-fs`/fullscreen). The DoR's own root-cause note ("`swExpandCanvas()` is referenced via `onclick` but never defined anywhere in this file") was accurate as scoped to `chat-view.js` alone but did not discover this second, cross-file definition -- so the DoR contract's touch-point list, written before this was found, did not anticipate it. Per this repo's own ADR-008 rule ("When additional scope is identified as genuinely necessary, the DoR contract must be amended before merge -- not silently included"), this decision records that amendment rather than silently bundling the extra file. Alternative (2) (rename to avoid the collision) was rejected because it would leave a second, independent fullscreen implementation live in production exactly as the story's own Architecture Constraint prohibits ("not a second separate implementation") -- deleting the stale definition is the only option consistent with that constraint. The change in `skills.js` is a pure deletion (plus an explanatory comment) with no new behaviour of its own; the single remaining `swExpandCanvas`/`swToggleCanvasFs` implementation now lives entirely in `chat-view.js`, matching the story's stated intent.
**Made by:** Coding agent (cdpl-s1 inner-loop execution) -- flagged transparently in the PR description; no RISK-ACCEPT required since this is a bug-fixing deletion, not a new production behaviour.
**Revisit trigger:** None -- this closes the gap the DoR contract's authors could not have known about without the real-browser E2E test that specifically surfaced it.
---
