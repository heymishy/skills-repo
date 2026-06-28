# Story: Phase row model with locked future-phase rows

**Epic reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Discovery reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Benefit-metric reference:** artefacts/2026-06-28-definition-canvas/benefit-metric.md

## User Story

As a **platform operator (primary)**,
I want the story map to display one row per discovery phase, with future-phase rows visually locked and refusing drops,
So that I can see the planned phase structure at a glance and cannot accidentally place a current-phase story into a future-phase row.

## Benefit Linkage

**Metrics moved:** M2 (future-phase placement guard holds across all code paths).
**How:** This story introduces the server-side phase-row model and the client-side drop guard that prevents story placement into non-current phase rows. Without this story, the guard tested by M2 does not exist. dic.2 is the single authoritative point of enforcement for future-phase placement — dic.3 (add-story), dic.4 (touch), and dic.5 (canvas-edit dispatch) each extend that guard rather than re-implement it.

## Architecture Constraints

- Phase names and sequence are parsed from the session feature's `discovery.md` at session start by a new server-side helper `parsePhaseModel(discoveryPath)`. Returns `[{name, isCurrent}]`. If the discovery.md has no parseable phases section, returns `[{name: 'Phase 1 (current)', isCurrent: true}]` as the single-row fallback.
- `renderDefinitionMap()` receives the phase model and renders one `<tr class="phase-row">` per phase. The current-phase row has `data-phase-current="true"`. Future-phase rows have `data-phase-current="false"` and `class="phase-row phase-row--locked"`. Locked rows include a `<div class="phase-lock-label">Not yet defined — awaits Phase N's Definition pass</div>` overlay.
- The drop guard introduced in dic.1 is extended: a story card's `drop` handler additionally checks `event.currentTarget.closest('[data-phase-current]').dataset.phaseCurrent === 'true'`. If not current, `event.preventDefault()` is not called and the card snaps back.
- No new JS file. Phase model is serialised into the rendered HTML as a `data-` attribute on the story map root. The client reads it from the DOM — no additional SSE event or API call.
- The `parsePhaseModel` helper is an injectable adapter (D37 rule applies): `let _parsePhaseModel = defaultParsePhaseModel; function setParsePhaseModel(fn) { _parsePhaseModel = fn; }`. Stub default throws.

## Dependencies

- **Upstream:** dic.1 — the drag-and-drop event listeners and within-column drop validation logic that dic.2 extends.
- **Downstream:** dic.3 (add-story) must honour phase-row locking (no add affordance in locked rows). dic.4 (touch) must apply the same current-phase guard to the tap-to-place interaction. dic.5 (canvas-edit dispatch) server-side guard must independently reject placement into a non-current phase (belt-and-braces; the client guard is first but not trusted alone).

## Acceptance Criteria

**AC1:** Given the session feature has a `discovery.md` with a phases section (e.g. `## Phases / - Phase 1 (current) / - Phase 2 / - Phase 3`), when `renderDefinitionMap()` is called at session start, then the story map renders one `<tr class="phase-row">` per phase in discovery order. The first phase has `data-phase-current="true"`. All subsequent phases have `data-phase-current="false"` and `class="phase-row phase-row--locked"`.

**AC2:** Given a future-phase row is rendered with `data-phase-current="false"`, when the operator inspects the row, then: (a) each cell in the row displays the lock overlay (`<div class="phase-lock-label">Not yet defined — awaits Phase N's Definition pass</div>` where N is the phase sequence number); (b) the row has a visually distinct hatched or greyed style that clearly signals it is not editable; (c) the overlay text is announced to screen readers (role="note" or aria-label on the lock div).

**AC3:** Given the operator drags a story card and holds it over a cell in a locked future-phase row (`data-phase-current="false"`), when `dragover` fires on that cell, then the drop is rejected — `event.preventDefault()` is not called, the visual drop target indicator is not shown, and the card snaps back to its origin on `dragend`. No state change occurs and no pending change is recorded.

**AC4:** Given the session feature has a `discovery.md` with no parseable phases section (section absent, or present but empty), when `renderDefinitionMap()` is called, then the story map renders a single phase row labelled "Phase 1 (current)" with `data-phase-current="true"` and no locked rows. No error or warning is displayed.

**AC5:** Given the operator has multiple phases in discovery and is working in the current phase, when they drag a story card within the current-phase row of its epic column, then the drag succeeds (existing dic.1 AC2 behaviour is preserved — the phase guard does not block within-column, within-current-phase reorder).

**AC6:** Given the story map has rendered with phase rows, when the server delivers a new artefact draftChunk that causes the story map to re-initialise, then: (a) the phase model is re-derived from the same `discovery.md` (no re-parse from SSE); (b) future-phase rows remain locked; (c) the current-phase row remains interactive; (d) pending changes accumulated before the refresh are cleared (the re-initialisation is a full map reset).

**AC7:** The `parsePhaseModel` injectable adapter is wired to the real implementation in the route initialisation block. A test covers the adapter wiring: calling `parsePhaseModel(discoveryPath)` with a real discovery.md fixture returns the expected phase array. A second test verifies the stub-throw default fires if the adapter is not wired.

## Out of Scope

- Chain forking (returning to a closed phase) — separate workstream per discovery.md
- Cross-column drag (epic reassignment) — dic.1 out-of-scope item
- Phase editing or renaming on the canvas — no affordance is provided; phases come from discovery.md
- Drag between phase rows (moving a story from current phase to a different phase row) — the drop guard prevents this; there is no affordance for inter-phase story movement in the MVP

## NFRs

- **Accessibility:** The phase-lock overlay text must be readable by screen readers. The locked row must not receive keyboard focus as a drop target.
- **Performance:** Phase model parsing (`parsePhaseModel`) runs once at session start (or on map re-initialisation). It is not called on every drag event. The parsed result is cached in session state for the duration of the session.
- **Regression:** All dic.1 and prior existing tests continue to pass.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
**Rationale:** The phase model parsing is the only novel piece. The drop guard extension to dic.1 is a one-line check. The main uncertainty is whether discovery.md phase format is consistent enough to parse reliably — mitigated by the single-row fallback (AC4).
