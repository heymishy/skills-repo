## Story: Collapse stage creation into one guided action — the edit panel opens automatically after naming a new stage

**Epic reference:** artefacts/2026-10-14-journey-authoring-experience/epics/journey-authoring-guided-creation.md
**Discovery reference:** artefacts/2026-10-14-journey-authoring-experience/discovery.md
**Benefit-metric reference:** artefacts/2026-10-14-journey-authoring-experience/benefit-metric.md
**Domain:** [web-ui, ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead)**,
I want **the stage-edit panel to open automatically, right where I am, the moment I finish naming a new stage**,
So that **I don't have to separately discover and click the small "Edit stage" link afterward — collapsing today's two-step, two-different-interaction-type flow (name, then separately find-and-open the editor) into one guided action, directly closing this feature's own M1 (time-to-first-complete stage) and M3 (operator CX judgment of the authoring flow)**.

## Benefit Linkage

**Metric moved:** M1 — Time-to-first-complete stage (primary); M3 — Operator CX judgment of the authoring flow (secondary — this IS the headline "guided creation" mechanism the discovery artefact names)
**How:** Removing the separate discovery step for the edit panel (today, a user must notice and click a small, easy-to-miss link after naming a stage) collapses two interactions into one, directly reducing the time and friction `jae-s1`'s benefit-metric row already names.

## Architecture Constraints

- **Constraint — reuse over invention (ADR-026).** This story reuses `jcx-s7`'s own already-shipped `openPanel(stageId)` function and DOM-patch success handler verbatim — it adds exactly one new call (`openPanel(resp.id)`) to the END of that existing `.then()` block, after the DOM patch. No new panel markup, no new open mechanism, no new route.
- **No data model change, no new route.** Purely a client-side sequencing change to the EXISTING stage-add success handler in `journeys.js`.
- **Must not regress `jcx-s7`'s own AC2 (no `window.location.reload()`, view unchanged after save)** — the panel opening automatically must not reintroduce a reload or a view-reset; the DOM-patch-then-open-panel sequence must happen entirely client-side, in the currently active view.
- **Must not regress the panel's own existing focus-trap/Escape-to-close/Tab-cycling behaviour (`jcx-s1`'s own AC5)** — auto-opening the panel is just an earlier call to the SAME `openPanel` function that already handles focus correctly; no new focus-management code is introduced.
- **`openPanel` must reset the save-indicator on every open (found during `/review`, run 1, finding 1-H1).** `jcx-s7`'s own save-indicator states are fully persistent by design (no auto-hide timer) — but `openPanel` never clears `panelSaved`'s own text/classes today. Making the panel auto-open on every stage creation (this story's own AC1) converts a rare pre-existing edge case (a stale indicator from a prior stage showing on a later manual open) into something hit routinely. Fix: `openPanel` clears `panelSaved.textContent`, removes `sw-stage-panel-saved--error`, and removes `sw-stage-panel-saved--visible` at the START of every open — a small, targeted addition to `openPanel` itself, not a new mechanism.

## Dependencies

- **Upstream:** `jcx-hotfix4` (DoD complete — the Add-stage input is visible/focusable in every view) and `jcx-s7` (DoD complete — the DOM-patch success handler and `openPanel` both already exist in their current, correct form) must both be merged. `jae-s1` is not a hard dependency (template-seeded stages don't go through this success handler at all — they're inserted server-side in bulk — but this story's own behaviour applies identically to a template-seeded stage's own FIRST manual edit, same `openPanel` call either way).
- **Downstream:** `jae-s3` (field suggestions) populates content INSIDE the panel this story opens — sequenced after, not blocking.

## Acceptance Criteria

**AC1:** Given the operator clicks "+ Add stage," types a name, and saves it (blur or Enter — the existing, unchanged mechanism), When the save succeeds, Then the stage-edit panel opens automatically for that exact newly-created stage — the operator does not need to separately click "Edit stage."

**AC2:** Given the panel opens automatically per AC1, When it opens, Then focus moves to the first editable field (`description`) — exactly as the existing `openPanel` function's own current focus behaviour already does for a manually-triggered open, not a new or different focus target.

**AC3:** Given the panel is now open automatically, When the operator presses Escape or clicks the panel's own close button without filling in any further field, Then the panel closes and the stage remains saved with just its name — closing the panel is never blocked or required to "complete" the stage; naming it alone is already a valid, saved state, exactly as it is today.

**AC4:** Given the auto-open behaviour from AC1, When the panel opens, Then the active canvas view (Canvas / Customer experience / Delivery) remains unchanged, and `window.location.reload()` is still never called — this story must not regress `jcx-s7`'s own AC2.

**AC5 (added per `/review` finding 1-H1):** Given a stage whose panel was previously opened and left in a "Saved" or "Failed to save — Retry" state (from editing a DIFFERENT, earlier stage), When `openPanel` is called for a NEW stage — whether via this story's own auto-open (AC1) or any existing manual trigger — Then the save-indicator's text and classes (`sw-stage-panel-saved--error`, `sw-stage-panel-saved--visible`) are all reset/cleared before the panel becomes visible — no stale save-outcome text from a previous stage is ever shown for a stage that hasn't been edited yet.

## Out of Scope

- **Any change to the panel's own 8 fields or their save mechanism** — `jcx-s7` already closed these; this story only changes WHEN the panel opens (and, per AC5, resets the indicator's own stale-carryover state on open) — not what's inside the fields or how each field saves.
- **Auto-opening the panel for a template-seeded stage (`jae-s1`) at journey-creation time** — those 5 stages are created in a bulk server-side insert with no individual client-side success handler to hook into; this story only changes the manually-triggered "+ Add stage" flow. A template-seeded stage's panel still opens via the normal mechanism (a later, explicit click/keyboard-activation on it).
- **Forcing the operator to fill any field before the panel can be closed** — explicitly rejected per AC3; a name-only stage remains a valid, complete save.
- **Any change to the Add-stage button's own visibility across views** — already fixed by `jcx-hotfix4`, unchanged here.

## NFRs

- **Performance:** None — this is a sequencing change to already-executing client-side code, no new network calls.
- **Security:** None — no new input surface; reuses the already-tenant-scoped POST response `jcx-s7`'s own DOM-patch already consumes.
- **Accessibility:** WCAG 2.1 AA — AC2's focus-move must be verified as real (not just "should work because `openPanel` already does it elsewhere") — a dedicated test asserting `document.activeElement` after the auto-open, not an assumption.
- **Audit:** None — no new mutating action.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
