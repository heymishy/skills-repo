## Story: Reactive-vs-planned load rollup by pod

**Epic reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/epics/urpv-e1-reactive-work-visibility.md
**Discovery reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **team lead / EM**,
I want to **see a count of active reactive vs. planned items broken down by pod**,
So that **I can assess my team's real capacity split instead of only seeing the planned half of the picture**.

## Benefit Linkage

**Metric moved:** EM/team-lead real usage for load visibility; also the direct prerequisite for Rollup completeness (undercount risk), since that metric's spot-check has nothing to compare against without this rollup existing.
**How:** Today there is no reactive-vs-planned count anywhere — an EM has to manually reconcile two separate systems (or nothing at all for informal reactive work). This story gives them one real, at-a-glance number per pod, directly serving the stated EM need rather than leaving it as an inferred side-effect of card rendering.

## Architecture Constraints

- Reuses the existing pod-assignment mechanism (`src/web-ui/modules/pod-assignment-store.js`: `getFeaturePodAssignments`, `getProductDefaultPod`) — no new team/engineer identity concept introduced. "Per squad/engineer" (the discovery's original phrasing) is scoped concretely to "per pod" via this existing mechanism, not a new per-individual attribution system.
- A feature with no explicit `pod_assignments` row and no product-level default pod falls into a single "Unassigned" bucket — this is the correct, honest outcome for a personal-scope product (like this repo's own dogfooded product row) with no pod configured, not an error state.
- `product/constraints.md` #9: new rendered content — `hasDesignSystemTrack: true` required at DoR; reuses the existing health-filter-chip/tab visual pattern already shipped in `_renderConsolidatedFeaturesSection`, not a new filter UI.
- ADR-025 (multi-tenancy): pod lookups stay scoped by the same `tenantId`/`productId` already enforced on every other query in this file.

## Dependencies

- **Upstream:** urpv-s2 (track tag), urpv-s3 (decisions.md-sourced items) — this rollup counts both reactive-work sources those stories introduce.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a product's consolidated features view has items tagged `track: "short"` (reactive, from urpv-s2) and items sourced from `decisions.md` RISK-ACCEPT/SCOPE entries (reactive, from urpv-s3), When the rollup is computed, Then each is counted as reactive and every other item is counted as planned, with pod attribution resolved via `getFeaturePodAssignments` (falling back to the product's default pod, then "Unassigned").

**AC2:** Given a pod has both reactive and planned items, When the rollup renders, Then that pod's row shows both counts distinctly (e.g. "3 reactive / 12 planned"), not a single blended number that would hide the split this metric exists to reveal.

**AC3:** Given a product has no pods configured at all (the personal-scope case), When the rollup renders, Then a single "Unassigned" row shows the total reactive/planned split for the whole product — the feature still functions and shows real data, it just has one bucket instead of several.

**AC4:** Given the rollup is rendered, When a team lead views it, Then it is reachable from the existing consolidated features view without a page navigation away from the features list — consistent with this view's existing tab/chip pattern, not a separate standalone page.

## Out of Scope

- Historical/trend tracking of the reactive/planned ratio over time — this is a current-snapshot count only.
- Per-individual-engineer breakdown within a pod — scoped to pod-level per the Architecture Constraints above.
- Any change to how pods are created or members assigned — this story only reads existing pod-assignment data, it does not modify `pod-assignment-store.js`'s write paths.

## NFRs

- **Performance:** Rollup computation runs over the same already-fetched taxonomy/journey item list this page already builds — no new per-item query, aside from the existing `getFeaturePodAssignments` calls this page's existing pod-display logic already makes.
- **Security:** None beyond what's already enforced for the rest of this page — no new data exposure.
- **Accessibility:** Reactive/planned counts rendered as text, not colour-only, consistent with MC-A11Y-02.
- **Audit:** None identified.

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
