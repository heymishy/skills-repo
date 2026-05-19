## Story: Clarify side-trip — invoke /clarify mid-discovery from journey

**Epic reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/discovery.md
**Discovery reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/discovery.md
**Benefit-metric reference:** Benefit is reduction in context-switches out of the web UI during the outer loop.

## User Story

As an **operator working through a discovery stage in the web UI journey**,
I want to launch a /clarify skill session from within the journey stage panel,
So that I can sharpen the discovery artefact before advancing to /benefit-metric without switching to VS Code or a separate tab.

## Benefit Linkage

**Metric moved:** Outer loop task completion rate via web UI (first-session without dropping to VS Code).
**How:** Removing the need to leave the web UI to run /clarify keeps the operator in-flow and eliminates one of the most common "I'll finish this later in VS Code" escape points at the discovery stage.

## Architecture Constraints

- Side-trip must not mutate journey stage state — the main journey's current stage, turn history, and artefact commit status are read-only while the side-trip is active.
- D37 injectable adapter rule: any new adapter introduced for the side-trip must have a stub that throws (not returns empty).
- The /clarify session is opened as a standard skill session (uses existing `POST /api/skills/clarify/sessions` route) with the discovery artefact content injected as the first system-prompt context block.
- The side-trip session is linked to the parent journey via a `parentJourneyId` field so it can be found and closed correctly on return.
- ADR-019: no new persistent state beyond the existing session and journey stores.
- Path traversal guard applies to any file read used to load the discovery artefact content as context.

## Dependencies

- **Upstream:** ougl.1–ougl.7 (DoD-complete) — journey session infrastructure and skill chat session infrastructure both required.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a journey is at the discovery stage and a discovery.md artefact exists for the feature, when the operator views the stage panel, then a "Sharpen with /clarify" button is visible in the stage panel alongside the existing stage controls.

**AC2:** Given the operator clicks "Sharpen with /clarify", when the side-trip session opens, then the chat interface loads with the /clarify skill system prompt and the existing discovery.md content is pre-loaded as the initial context message (the first message the operator sees explains the pre-loaded context).

**AC3:** Given the side-trip session is open, when the operator commits a /clarify artefact output (optional — they may just use the chat), then the main journey stage status is unchanged — stage, turn count, and any prior artefact commit status are identical to before the side-trip was opened.

**AC4:** Given the side-trip session is open, when the operator clicks "Return to journey" (or dismisses the side-trip panel), then the journey returns to the discovery stage exactly where it was left — scroll position and stage state are restored.

**AC5:** Given the journey is not at the discovery stage (e.g. it is at benefit-metric or later), when the operator views the stage panel, then the "Sharpen with /clarify" button is not visible — the side-trip entry point is only shown at the discovery stage.

**AC6:** Given the side-trip is active and the operator reloads the page, when the page loads, then the journey is restored to the main journey at the discovery stage (the in-progress side-trip is abandoned cleanly — no orphaned session state).

## Out of Scope

- Auto-merging or applying the /clarify output back into discovery.md — that remains an operator manual action.
- Making /clarify available at stages other than discovery — per AC5.
- Running /clarify as a background job — it is always an interactive chat session.
- Any changes to the /clarify SKILL.md itself.

## NFRs

- **Performance:** Side-trip session opens (first model turn starts) within 3 seconds of clicking the button.
- **Security:** Discovery artefact content loaded as context must pass path traversal validation — the feature slug used to locate the file must resolve within the repo root.
- **Security:** `parentJourneyId` is an opaque server-side ID; it is never accepted from the client.

## Complexity Rating

**Rating:** 2 — journey↔session cross-linking is new; session state isolation needs care.
**Scope stability:** Stable.
