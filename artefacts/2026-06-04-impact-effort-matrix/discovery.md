# Discovery: Impact/Effort Matrix Workshop Tool

**Status:** Draft — pending approval
**Feature slug:** 2026-06-04-impact-effort-matrix
**Discovery date:** 2026-06-04
**Artefact path:** `artefacts/2026-06-04-impact-effort-matrix/discovery.md`

---

## Problem statement

Workshop facilitators running impact/effort prioritisation sessions face three compounding problems: the post-workshop write-up takes 2–3 hours; participants cannot verify that their contributions were captured accurately; and the debate context — the reasoning behind why an item landed in a particular quadrant — is almost entirely lost by the time any document is produced. When this output is used to seed a delivery pipeline (the outer loop), the missing rationale forces the pipeline to operate on names and positions alone, with none of the discussion that produced them.

## Who it affects

**Facilitators** are the primary persona. They run the workshop, manage the discussion, and currently own the 2–3 hour post-workshop synthesis. They want to reduce that burden and produce a richer, more accurate output.

**Product leads, SMEs, and participants** attend the workshop and contribute ideas and debate. They currently have no visibility into whether their input survived the facilitator's note-taking and synthesis. They want confidence that their voice is reflected in the final output.

## Why now

The outer loop pipeline is now capable of consuming structured context inputs. A workshop tool that produces markdown-formatted output with item names, quadrant positions, and debate rationale gives the pipeline the context it needs to generate higher-quality discovery artefacts — reducing the outer loop preparation cycle. Without this tool, the pipeline receives thin, decontextualised inputs.

## MVP scope

A single-session 2×2 grid web application with four capabilities:

1. **Create idea cards** — add named items to the canvas as draggable cards
2. **Place and move cards** — position each card on the impact/effort grid; repositioning is free throughout the session
3. **Capture debate notes per item** — a free-text field per card records the rationale and discussion behind its placement
4. **Export to markdown** — a single export action produces a markdown document containing each item's name, quadrant position, and captured notes, formatted for direct use in an outer loop run

The smallest useful thing: a facilitator can run a full workshop, capture debate notes, and export a markdown artefact ready to paste into a `/discovery` session — in under 15 minutes of post-workshop time.

## Out of scope

1. **Real-time collaboration and multi-author editing** — the MVP is single-author; concurrent multi-user editing introduces conflict resolution complexity that exceeds MVP scope. Deferred explicitly by the operator.
2. **Third-party integrations** — no Jira, Miro, Confluence, or external tool sync in MVP. The export mechanism is markdown text only. Deferred explicitly by the operator.
3. **Persistent session storage** — workshops are not saved to a server or user account in MVP; the session exists for its duration, and the export is the persistent record.
4. **Print/PDF export, visual formatting, and presentation modes** — the output is plaintext markdown, not a styled document.

## Assumptions and risks

[ASSUMPTION] The markdown export is a copy/paste mechanism — the operator described "text / markdown" output; whether this involves a direct pipeline API call or a copy-to-clipboard action is unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] Session data does not require server-side persistence — the operator described single-workshop use without mentioning save/resume capability; if facilitators need to return to a workshop across multiple sessions, this assumption is violated and a storage design decision is required.

[ASSUMPTION] The tool is a standalone web application, not a feature embedded in the existing skills platform web UI — the operator described "a web app" generically; whether this ships as a new standalone app or as a new route/surface in the existing platform is unconfirmed, requires /clarify before architecture decisions are made.

**Key risk — workshop replacement:** The operator named a success condition inversion: if workshops stop happening as a result of this framework, the tool would not be worth building. This is a constraint on design direction — the tool must augment human debate, not replace it. Any feature that allows participants to vote asynchronously without a live discussion would undermine the core value proposition and should be refused at scope review.

## Success indicators

**Write-up time:** Baseline: 2–3 hours (facilitator-stated). Target: under 15 minutes. Measured via: facilitator self-report at session export; session timestamp from workshop open to export action.

**Participant confidence:** Baseline: [UNKNOWN BASELINE] — no current measurement exists. Target: participants can confirm their named contributions appear in the exported markdown before it is used. Measured via: participant review step before export, or post-export confirmation prompt in the tool.

**Outer loop context quality:** Baseline: [UNKNOWN BASELINE] — current ad hoc notes contain names and positions only; debate rationale is lost in transit. Target: each exported item includes a name, quadrant position, and at least one sentence of captured rationale; a `/discovery` session seeded with the export produces a complete draft artefact without facilitator supplementation. Measured via: facilitator assessment of `/discovery` output quality across three workshop runs.

## Constraints

None identified by the operator.

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] The markdown export is a copy/paste mechanism — the operator described "text / markdown" output; whether this involves a direct pipeline API call or a copy-to-clipboard action is unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] Session data does not require server-side persistence — the operator described single-workshop use without mentioning save/resume capability; if facilitators need to return to a workshop across multiple sessions, this assumption is violated and a storage design decision is required.
- [ASSUMPTION] The tool is a standalone web application, not a feature embedded in the existing skills platform web UI — the operator described "a web app" generically; whether this ships as a new standalone app or as a new route/surface in the existing platform is unconfirmed, requires /clarify before architecture decisions are made.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

---

## Attribution

**Contributors:**
- Pending

**Reviewers:**
- Pending

**Approved By:**
- Pending