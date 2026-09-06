## Story: Classify every divergence case the audit found, not just the common one

**Epic reference:** artefacts/2026-09-06-canonical-artefact-trace/epics/canonical-artefact-trace.md
**Discovery reference:** artefacts/2026-09-06-canonical-artefact-trace/discovery.md
**Benefit-metric reference:** artefacts/2026-09-06-canonical-artefact-trace/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Tech lead**,
I want **the trace to distinguish "unregistered document," "orphaned registration," and "not yet synced" as three different states, each with its own honest label**,
So that **I know exactly what kind of gap I'm looking at and what action (if any) it needs — moving the "unregistered documents visible without a bug report" metric from 0% to 100%**.

## Benefit Linkage

**Metric moved:** Unregistered documents visible without a bug report
**How:** This story implements the actual detection logic behind the metric's own definition — without it, `cat-s4`'s UI flag would have nothing correct to display.

## Architecture Constraints

- Resolved via `/clarify`, recorded in `decisions.md`: inference is attempted where disk patterns support it, but the "Unregistered" flag is always shown regardless of whether inference succeeded — never implying false confidence the data doesn't support.
- MC-A11Y-02 (color not sole indicator) — while this story is the classification logic (not the rendering), the states it produces must carry a distinct label/name, not just an internal severity number, so `cat-s4`'s rendering can satisfy this guardrail without inventing labels itself.

## Dependencies

- **Upstream:** cat-s1 (core trace builder produces the raw structure this story classifies).
- **Downstream:** cat-s4 (renders the classification as the visible flag).

## Acceptance Criteria

**AC1:** Given a document on disk with no matching entry anywhere in `pipeline-state.json` (the `phase4` case), when the trace classifies it, then it is marked with a distinct `unregistered` state, and — if its filename/directory pattern matches another already-classified document's inferred grouping — it is also attached to that inferred story grouping, never left fully ungrouped when a reasonable inference exists.

**AC2:** Given a registered story slug in `pipeline-state.json` with no matching file anywhere on disk (the `ougl`/dot-dash-mismatch class, and the 1 fully-orphaned feature registration found in the audit), when the trace classifies it, then it is marked with a distinct `orphaned-registration` state — never the same state value as AC1's `unregistered`, since the two need different operator actions (investigate why the file is missing/misnamed, vs. decide whether to register it).

**AC3:** Given the multi-tenant case where a tenant's disk checkout has not yet synced (per `cat-s1`'s own AC5), when the trace classifies the feature, then every document that would otherwise be evaluated is instead marked `not-yet-synced` at the feature level — this state takes precedence over per-document `unregistered`/`orphaned-registration` classification, since the underlying data isn't trustworthy yet either way.

**AC4:** Given a document that correctly matches a registered story (the common, non-divergent case — ~65% of features per the audit), when the trace classifies it, then it is marked `registered`, with no flag rendered for it downstream.

## Out of Scope

- Any UI rendering of these classifications — that is `cat-s4`. This story only produces the classification data.
- Auto-correcting an `orphaned-registration` case (e.g. auto-renaming a file to match) — classification only, never a write-back action.

## NFRs

- **Performance:** Classification runs as part of the same single-pass walk `cat-s1` already performs — no additional directory traversal.
- **Security:** None identified.
- **Accessibility:** Not applicable — data-layer only.
- **Audit:** Not applicable — read-only classification, no state change.

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
