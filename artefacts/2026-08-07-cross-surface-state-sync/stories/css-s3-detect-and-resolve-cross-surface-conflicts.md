## Story: Detect a genuine cross-surface conflict, resolve it to pipeline-state.json's value, and log it

**Epic reference:** artefacts/2026-08-07-cross-surface-state-sync/epics/css-e1-cross-surface-state-sync.md
**Discovery reference:** artefacts/2026-08-07-cross-surface-state-sync/discovery.md
**Benefit-metric reference:** artefacts/2026-08-07-cross-surface-state-sync/benefit-metric.md
**Domain:** [data, web-ui] — advisory, see domain tag check note below

## User Story

As a **Platform maintainer relying on this sync mechanism**,
I want to **have the sync process detect when both surfaces have advanced differently since the last sync, automatically correct the journey's record to match `pipeline-state.json`, and log the conflict**,
So that **disagreements between the two surfaces are visible and resolved consistently, rather than silently overwritten or left permanently inconsistent**.

## Benefit Linkage

**Metric moved:** Conflict-resolution correctness (no silent overwrites)
**How:** This story is the entire mechanism the metric measures — without it, "correctness" has nothing to be measured against; css-s1/css-s2 establish propagation, this story establishes what happens when propagation reveals a genuine disagreement.

## Architecture Constraints

- **ADR-003 (schema-first):** if a "last synced" marker or conflict-log field is added to `pipeline-state.json`, it must be added to `pipeline-state.schema.json` in the same commit — no field used by this mechanism may be absent from the schema.
- **D37 (injectable adapter rule):** any new conflict-detection/resolution adapter follows the same stub-throws / explicit wiring AC / separate wiring task / behavioral wiring test discipline as css-s1/css-s2's adapters.

## Dependencies

- **Upstream:** css-s1, css-s2 — conflict detection requires both directions already propagating; there is nothing to conflict without both mechanisms in place.
- **Downstream:** css-s4 (full-vocabulary coverage reuses this story's conflict-resolution mechanism across all gate types).

## Acceptance Criteria

**AC1:** Given a feature whose `pipeline-state.json` gate value and web-UI journey stage value have both changed independently since the last successful sync, When the sync mechanism next runs (triggered by either side's phase-boundary advance), Then it detects this as a genuine conflict — not simply applies whichever write happened most recently without checking for divergence.

**AC2:** Given a detected conflict, When it is resolved, Then the web-UI journey's Postgres record is corrected to match `pipeline-state.json`'s value (the canonical source, per `decisions.md`'s ARCH entry) — never the reverse.

**AC3:** Given a detected conflict, When it is resolved, Then a log entry is created recording: the feature slug, the two divergent values (pipeline-state.json's and the journey's), which value won, and a timestamp — queryable by the platform maintainer.

**AC4:** Given no conflict exists (only one side advanced since the last sync), When that single-sided advance propagates via css-s1 or css-s2's mechanism, Then no conflict log entry is created — the conflict log is reserved for genuine disagreements, not every ordinary sync event.

## Out of Scope

- Automatic conflict avoidance (e.g. locking one surface while the other is mid-advance) — this story only detects and resolves after the fact, it does not prevent conflicts from arising.
- A dedicated UI surface for browsing the conflict log — AC3 only requires the log entry exist and be queryable; a browsing UI is a separate, later story if ever needed.

## NFRs

- **Performance:** conflict detection adds no more than a small, bounded overhead to either side's normal advance path (css-s1's synchronous update, css-s2's in-request write).
- **Security:** conflict log entries contain no credentials or tokens.
- **Accessibility:** Not applicable — no UI surface in this story.
- **Audit:** this story's entire purpose is audit correctness — every genuine conflict is logged, zero silent overwrites, which is the metric's own correctness invariant.

## Data Model

This story reuses the `sync_log` entity introduced by css-s2 (no schema change — `entry_type = 'conflict'` distinguishes conflict entries from css-s2's `'gap'` entries) and corrects the existing `journeys` table's `data` JSONB on conflict resolution (no schema change — an existing field's value is corrected, not a new column added).

---CANVAS-JSON: {"type":"data-model","title":"Data model","content":{"mermaid":"erDiagram\n    JOURNEYS {\n        varchar journey_id PK\n        varchar tenant_id\n        varchar owner_id\n        varchar feature_slug\n        timestamptz created_at\n        jsonb data\n    }\n    SYNC_LOG {\n        serial id PK\n        varchar feature_slug\n        varchar tenant_id\n        varchar entry_type\n        jsonb pipeline_state_value\n        jsonb journey_value\n        jsonb resolved_value\n        timestamptz created_at\n    }\n    SYNC_LOG }o--|| JOURNEYS : \"correlated by feature_slug\""}}---

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
