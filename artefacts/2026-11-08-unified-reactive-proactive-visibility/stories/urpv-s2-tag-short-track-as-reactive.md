## Story: Tag short-track features as reactive work in the consolidated features view

**Epic reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/epics/urpv-e1-reactive-work-visibility.md
**Discovery reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **delivery engineer**,
I want to **see which items in my product's consolidated features view are reactive (short-track) work versus planned (standard-track) work**,
So that **I can tell at a glance what's eating my time outside the planned backlog, instead of every item looking the same regardless of track**.

## Benefit Linkage

**Metric moved:** Reactive-work coverage on the surface
**How:** Short-track features already flow into `computeTaxonomyRollup`'s output today (it walks every `pipeline-state.json` feature regardless of `track`) — this story carries the already-available `feature.track` field through to the rendered item and adds a visible tag, closing the "rendered but indistinguishable" half of the coverage gap.

## Architecture Constraints

- Mandatory constraint MC-A11Y-02 (colour not sole indicator): the reactive/planned tag must include a text label (e.g. "Reactive" / "Planned"), not a colour swatch alone.
- `product/constraints.md` #9: this story touches rendered output in `src/web-ui/` — `hasDesignSystemTrack: true` required at DoR; tag styling must comply with `DESIGN.md` token usage (referenced via `context.yml: design.system_reference`), not ad-hoc inline colours.
- No change to `computeOverallHealthSignal` or any other existing health-derivation logic — this is additive metadata only.

## Dependencies

- **Upstream:** urpv-s1 (a product with no real synced data has nothing to tag).
- **Downstream:** urpv-s4 (the pod rollup counts reactive vs. planned using this story's tag).

## Acceptance Criteria

**AC1:** Given a connected product's `pipeline-state.json` contains at least one feature with `track: "short"` and at least one with `track: "standard"` (or no `track` field at all), When `computeTaxonomyRollup` processes that `pipeline-state.json`, Then each emitted item (grouped or ungrouped) carries a `track` field with the feature's real value, defaulting to `"standard"` only when the field is genuinely absent — never inferred from any other signal.

**AC2:** Given `mergeFeatureSources` merges taxonomy items with journey-sourced items, When a taxonomy item and a journey item represent the same `feature_slug`, Then the merged item's `track` comes from the taxonomy source (the richer, GitHub-synced record) — consistent with how `mergeFeatureSources` already resolves `name`/`epicName` on overlap.

**AC3:** Given `_renderConsolidatedFeaturesSection` renders an item with `track: "short"`, When the page is loaded, Then that item's card displays a visible "Reactive" text label distinguishable from a "Planned" (or unlabelled) standard-track item, in both the By Module and By Phase tab views.

**AC4:** Given a product whose connected repo has zero short-track features, When the page is loaded, Then every item renders as "Planned" (or unlabelled, matching this story's chosen default-display convention) and no item is incorrectly tagged "Reactive" — a genuine zero-reactive-work state is shown honestly, not hidden or defaulted to "Reactive".

## Out of Scope

- Any new filtering mechanism keyed on `track` — that is urpv-s4's job, which reuses this story's tag.
- Re-deriving `track` for journey-only items that never appear in taxonomy — those remain untagged (no track data exists for a pure in-flight journey item with no corresponding `pipeline-state.json` feature yet).

## NFRs

- **Performance:** No new query — `track` is already present on every `pipeline-state.json` feature object already being read; this is a pure pass-through field addition, no measurable overhead.
- **Security:** None identified — no new data exposure beyond a field already present in the synced `pipeline-state.json`, which the viewing tenant already owns.
- **Accessibility:** Tag must meet WCAG 2.1 AA text-contrast requirements per `DESIGN.md`; text label present per MC-A11Y-02 above.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
