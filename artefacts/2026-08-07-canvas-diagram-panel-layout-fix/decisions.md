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
