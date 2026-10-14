# Design: Journey Authoring Experience — Guided Creation, Smarter Defaults, Templates

**Status:** Draft
**Feature:** 2026-10-14-journey-authoring-experience
**Contributors:** Hamish King — Platform Owner; Claude (session) — drafted from already-reviewed stories, the published mockup, and the `whole-journey-experience-across-views` spike
**Date:** 2026-10-14
**Prior artefacts:** discovery.md, benefit-metric.md, epics/journey-authoring-guided-creation.md, stories/jae-s1.md, jae-s2.md, jae-s3.md, spikes/whole-journey-experience-across-views-outcome.md

**Note on sequencing:** this artefact is produced AFTER `/definition` and `/review` (both already complete and passed), not before, at the operator's own explicit request following the mockup review. It documents the architecture/UX decisions the 3 already-reviewed stories already encode — it does not re-open or change any of them.

---

## Summary

Three small, already-scoped changes to the existing journey-authoring flow in `src/web-ui/routes/journeys.js`: a new journey can seed a default 5-stage outline instead of starting blank (`jae-s1`), naming a new stage automatically opens its edit panel instead of requiring a separate click to find it (`jae-s2`), and the panel offers click-to-fill field suggestions drawn from a linked feature's own discovery artefact where one exists (`jae-s3`). The core UX pattern across all 3: reuse an existing mechanism (the stage-insert shape, the `openPanel` function, the persona-suggestion scanner) rather than building something new, and never force a save — every stage remains valid with just a name, every suggestion remains optional and reviewable before it becomes real content.

---

## Solution Architecture

### Overview

No new service, no new route, no new table. All 3 stories touch the same single file (`src/web-ui/routes/journeys.js`) that already owns journey/stage creation and the stage-edit panel:

- `jae-s1` adds a `seedDefaultStages` boolean to the existing `POST /journeys` body and, when true, loops `handlePostJourneyStage`'s own existing single-insert shape 5 times inside the same transaction.
- `jae-s2` adds one new call (`openPanel(resp.id)`) to the end of the existing stage-add success handler, and a small reset step inside `openPanel` itself (clearing the save-indicator's stale text/classes on every open — found during `/review`, not part of the original proposal).
- `jae-s3` adds one new sibling function to `src/web-ui/adapters/persona-scanner.js` (`extractProblemStatement`, mirroring `extractWhoItAffects` exactly) and one new route-level function (`getFieldSuggestions`, mirroring `getPersonaSuggestions` exactly), surfacing 2 new suggestion buttons inside the existing panel markup.

```
flowchart LR
    MODAL[New-journey modal: seedDefaultStages checkbox]
    ROUTE[routes/journeys.js]
    SCANNER[adapters/persona-scanner.js]
    PANEL[Stage edit panel: openPanel]
    MODAL -->|POST /journeys| ROUTE
    ROUTE -->|loop existing stage-insert shape x5| ROUTE
    ROUTE -->|addBtn success handler, DOM patch| PANEL
    PANEL -->|getFieldSuggestions| SCANNER
    SCANNER -->|extractProblemStatement, extractWhoItAffects| SCANNER
```

### Integration points

| System | Interaction type | Direction | Notes |
|--------|-----------------|-----------|-------|
| `customer_journeys` / `customer_journey_stages` (Postgres) | DB, existing tables | both | No schema change — `jae-s1` reuses the existing single-stage INSERT 5 times |
| `journeys` (legacy table, product→feature_slug lookup) | DB, existing | read-only | `jae-s3`'s `getFieldSuggestions` reuses the exact same query `getPersonaSuggestions` already performs |
| `artefacts/[feature_slug]/discovery.md` (local filesystem) | File read, existing mechanism | read-only | `jae-s3` reuses `jcx-s4`'s own established discovery-artefact-scan pattern — a new sibling extraction function, same file-access shape |

### Data and state

No new table, no new column, no new state machine. `jae-s1`'s seeded stages are ordinary rows in `customer_journey_stages` — indistinguishable from a manually-created stage except that 5 of them share one journey's `position` sequence (0-4) and arrive in the same request. `jae-s2`/`jae-s3` introduce no persisted state at all — both are purely client-side sequencing (when the panel opens) and read-only suggestion surfacing.

### Hosting and runtime

Unchanged — same existing Node.js web-UI process (`src/web-ui/server.js` routing into `journeys.js`), client-side behaviour runs in the same existing inline `<script>` block the stage panel already uses. No new service, no new client-side bundle, no new dependency.

### Key technical decisions

| Decision | Choice made | Rationale |
|----------|-------------|-----------|
| Template storage | Hardcoded 5-name constant in `journeys.js`, not a `templates` table | Confirmed via `/clarify`: exactly one default skeleton for MVP, no selection UI — a table/library is a deferred extension, not needed for a single fixed value |
| Suggestion mechanism | Deterministic discovery-artefact scan, reusing `jcx-s4`'s own pattern | Confirmed via `/clarify`: ships first as the bounded MVP slice; real LLM generation is an explicit, separate fast-follow story, not built here |
| Editing model | Keep the existing side-panel; only change WHEN it opens | Confirmed via `/clarify`: the bigger inline-in-grid redesign (editing fields directly in the swimlane grid) is a deliberately deferred, bigger idea — out of scope for this feature |
| Panel entry across views | Single shared `openPanel` function, called from the CX grid header cell, the drawflow canvas node, AND now this story's own auto-open — never a view-specific duplicate | Per the `whole-journey-experience-across-views` spike: the 3 views (Canvas/Customer experience/Delivery) are confirmed as the right structure (tab-vs-toggle research, Miro's own lack of a clean equivalent); `jae-s2`'s guided creation therefore works identically from Canvas or Customer experience with zero extra code, because it hooks into the one shared mechanism rather than a CX-specific one |

### Non-functional requirements

| Requirement | Target | Source |
|-------------|--------|--------|
| Template-seeding latency | No perceptible delay (5 sequential INSERTs in one existing transaction) | `jae-s1` NFR |
| Suggestion-scan latency | Same cost profile as `jcx-s4`'s own already-proven persona scan | `jae-s3` NFR |
| Accessibility | WCAG 2.1 AA — native checkbox, verified real focus-move on auto-open, reused accessible suggestion-button markup | `product/constraints.md` #9, all 3 stories' own NFR sections |

---

## UX / Interaction Design

### Entry point

Two entry points, matching the "skeleton → story → plan" narrative the `whole-journey-experience-across-views` spike names: (1) the existing "+ New journey" modal, now carrying one new checkbox; (2) the existing "+ Add stage" button, reachable identically from the Canvas and Customer-experience views (per `jcx-hotfix4`).

### Primary flow

1. Operator opens "+ New journey," sees "Start with a default stage outline" checked by default, submits.
2. Journey is created with 5 named stages (Evaluate → Discover → Purchase → Onboard → Retain), every other field empty — rendered with the muted empty-state treatment `jcx-s7` already shipped.
3. Operator clicks "+ Add stage" (from either Canvas or Customer-experience view), types a 6th stage's name, saves it.
4. The edit panel opens automatically — no separate click needed — focus lands in `Description`.
5. If a feature is linked to the journey's product with its own readable `discovery.md`, suggestion buttons appear under `Customer actions` and `Pain points`; clicking one fills the field's raw text, which the operator can edit before it autosaves on blur, exactly like any other field.

### Edge cases and error states

| Scenario | User-facing behaviour |
|----------|-----------------------|
| Operator unchecks "Start with a default stage outline" | Journey created empty, exactly as today (`jae-s1` AC3) |
| No linked feature, or linked feature has no readable `discovery.md` | No suggestion button appears for either field — empty result, not an error (`jae-s3` AC3) |
| A field already has a real value (template, prior edit, or earlier accepted suggestion) | No suggestion offered for that field — never presented as an option to overwrite real content (`jae-s3` AC4) |
| A field's save fails | The indicator shows `Failed to save — Retry`, danger-colored, distinct from the success color — and, per `jae-s2`'s own AC5 (added at `/review`), never carries over stale text from a different, previously-edited stage |
| Operator closes the auto-opened panel without filling anything further | Stage remains saved with just its name — closing is never blocked (`jae-s2` AC3) |

### Design system

No design-token system exists in this repo (confirmed consistent with every prior UI story this session) — literal CSS values, matching the established convention. Reused components: the existing stage-panel markup/CSS, the existing `sw-persona-suggestion-btn` button pattern (now with a second, parallel use for field suggestions), the existing `sw-stage-reorder-error`/`sw-feature-mapping-warning` danger-color convention (reused by `jcx-s7` for the save-indicator's error state, which `jae-s2` builds on top of).

A visual mockup of the 3-screen flow (new-journey checkbox → seeded skeleton → guided creation with suggestions) was published and reviewed before this artefact: https://claude.ai/artifact/VpsjdVCjNrLvVY8AxYBhPg

### Accessibility

WCAG 2.1 AA. The new checkbox is a native, labeled `<input type="checkbox">`. The auto-open panel's focus-move is verified directly (`document.activeElement`), not assumed because `openPanel` already does this elsewhere for a manual trigger. Suggestion buttons reuse `jcx-s4`'s own already-accessible native-`<button>` pattern exactly, no custom widget.

---

## Constraints

Carried forward unchanged from `discovery.md`: WCAG 2.1 AA (hard floor), no new npm dependency unless justified by direct comparison (none needed — all 3 stories are pure reuse of existing patterns), multi-tenancy enforced at the application layer (ADR-025, each story's own cross-tenant AC verifies this directly rather than assuming reuse preserves it).

---

## Open questions

| # | Question | Owner | Blocking definition? |
|---|----------|-------|----------------------|
| 1 | Does the deterministic discovery-scan suggestion mechanism have enough real coverage in practice (most new journeys may not yet be linked to a feature with its own `discovery.md`)? | Platform Owner, post-release | No — already named as a risk in `discovery.md`; M2's own measurement is the mechanism that answers this, not a pre-build decision |
| 2 | Should the Delivery view receive the same design-review treatment the other 2 views have had this session? | Platform Owner | No — explicitly named as a separate, future spike candidate in `whole-journey-experience-across-views-outcome.md`, not blocking this feature |

---

## Deferred decisions

- **A selectable template library** (vs. the single default skeleton shipped here) — deferred per `/clarify`; revisit only if usage data shows the one skeleton doesn't fit how operators actually build different journey shapes.
- **Real LLM-based field generation** — deferred as an explicit, named fast-follow story per `/clarify`; not a "someday," a sequenced next step once `jae-s3`'s own deterministic mechanism has real usage data.
- **Inline-in-grid editing** (replacing the side panel) — deferred per `/clarify`; the bigger, reference-grounded redesign named in the `cx-interaction-design-polish` spike's own "Not recommended" section, revisit only if guided creation alone doesn't close the operator's own M3 gap.
- **A dedicated Delivery-view design pass** — deferred to its own future spike/discovery, per `whole-journey-experience-across-views-outcome.md`'s own finding 3 (the one view never design-reviewed this session).
