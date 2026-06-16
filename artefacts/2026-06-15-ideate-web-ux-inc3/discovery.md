# Discovery: ideate-web-ux Increment 3 — Skill cadence + canvas output

**Feature slug:** 2026-06-15-ideate-web-ux-inc3
**Discovery date:** 2026-06-15
**Status:** Approved
**Approved by:** Hamish King

---

## Problem statement

Live sessions with /ideate revealed two connected UX problems:

**Problem 1 — Excessive question noise.** The skill asks too many sequential clarifying questions before making progress. In a 10-turn live session the model asked a confirmation question at nearly every step, even when the answer was derivable from prior context. Facilitators and product leads arrive with a clear idea in mind; they want the skill to move with them, not interrogate them.

**Problem 2 — Chat is the wrong surface for structured lens output.** Lens A opportunity maps, cluster trees, and prioritisation tables are streamed into the chat bubble as markdown text. The output is long, unnavigable, and disconnected from the visual spatial reasoning it's meant to support. The right panel's draft section exists but is used only for artefact content at the end of a session — it is empty during the lens itself.

These two problems compound: excessive questions create a back-and-forth rhythm that makes the chat stream even harder to follow, and the structured output that eventually arrives has no visual home.

---

## Why now

Both problems were observed in the first live verification session (2026-06-15). The core mechanics (streaming, assumption cards, condition cards) are working. The experience ceiling is now set by question cadence and rendering quality rather than missing functionality.

---

## Out of scope

- Real-time collaboration / multi-author
- External integrations (Teams live connection, etc.)
- New lens types
- Assumption card or condition card interaction changes
- Backend model or routing changes

---

## Stories

### inc3 — Reduce clarifying question frequency in /ideate

**Scope:** Modify `.github/skills/ideate/SKILL.md` (governed file). Add explicit guidance directing the model to:
- Make sensible inferences from context rather than asking for confirmation
- Reserve questions for genuinely ambiguous decision points (≤1 question per lens step)
- Proceed to the next step after a single clarification, not re-confirm

Same pattern as inc2.2: automated tests for instruction presence + live human-in-the-loop verification session.

**Constraint:** Additive instruction only — no modification of existing lens step content or assumptions.

---

### inc4 — Canvas output panel for lens structured content

**Scope:** Replace the right panel's artefact draft section with a live canvas that renders structured lens output (opportunity maps, cluster trees, prioritisation tables) as visual HTML rather than chat-bubble markdown. The model emits structured markers (`---CANVAS-JSON: {...}---`) that the streaming handler extracts and sends to the client as `canvasBlock` SSE events. The canvas panel renders blocks visually.

**Design gate:** A `/frontend-design` artefact is required before inc4 can reach definition-of-ready. The canvas layout, node types, and interaction model must be designed before implementation is scoped.

**Dependency:** inc3 should be delivered first (fewer questions improves the canvas experience by reducing the noise between structured outputs).

---

## T3M1 note

The gate-confirm trace for inc3 should go through the web UI gate-confirm button (not direct pipeline-state.json edit) to generate the first chain-hash trace entry for this feature, contributing to CDG T3M1 close.

---

## Deferred

Cluster 5 (structured input forms) remains deferred until a `/frontend-design` artefact exists. inc4 canvas work partially addresses the output side of Cluster 5's UX gap.

---

## Addendum (2026-06-16) — inc5 split out of inc4

inc4's original scope statement above describes the model emitting `---CANVAS-JSON: {...}---` markers as part of building the canvas panel. In practice, inc4 was implemented and reached definition-of-done covering only the client-side rendering infrastructure (`parseCanvasBlock`, `canvasBlock` SSE event, `#canvas-panel`, `renderCanvasBlock`) — the actual instruction telling the /ideate model to emit those markers was not included, leaving the panel with no live source of blocks.

### inc5 — Canvas-JSON marker instruction in /ideate SKILL.md

**Scope:** Add a canvas marker instruction block to `.github/skills/ideate/SKILL.md` directing the model to emit `---CANVAS-JSON: {...}---` markers for Lens A (cluster-tree), Lens D (table), and narrative lens output (text fallback). Instruction-only — no code changes; inc4's parser/renderer already exist and are unmodified.

**Dependency:** inc4 must be at definition-of-done (inc4's marker-consuming pipeline must exist before inc5's emitted markers have anywhere to go).

Full story detail: `artefacts/2026-06-15-ideate-web-ux-inc3/stories/inc5.md`.

---

## Approved By

- Hamish King — Engineering lead — 2026-06-15
