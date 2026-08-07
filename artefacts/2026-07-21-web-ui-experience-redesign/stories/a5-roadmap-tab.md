## Story: Surface discovery-only and ideation-only work in a Roadmap tab

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-a-product-view-redesign.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **Hamish King (Founder/Operator, planning what's coming next for a product)**,
I want to **see work that exists only as a discovery or ideation artefact, not yet a tracked story**,
So that **I have a real picture of what's planned or being explored, not just what's already been built — today this work is invisible because it has no entry in `pipeline-state.json`**.

## Benefit Linkage

**Metric moved:** Time to identify the least-healthy area of a large product (indirectly — this story completes the product view's overall completeness, ensuring the operator isn't missing early-stage work when assessing the product's full shape)
**How:** Confirmed during discovery: this repo has real discovery-only artefacts (e.g. `artefacts/2026-07-13-context-graph-primitive/`) that never appear anywhere in the product view today. Surfacing them closes that gap.

## Architecture Constraints

- Per discovery's confirmed Out of Scope: this story reads discovery/ideate artefacts directly at render time — it does NOT build the full sync/cache pipeline (a new `product_rollups` column computed by an extended `/product-sync`) that the eventual architecture calls for. That is deferred, explicitly, per /clarify.
- Must not write to or modify any artefact file — this is a read-only surface.

## Dependencies

- **Upstream:** None
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a repo with at least one `artefacts/[feature-slug]/discovery.md` that has no corresponding entry in `.github/pipeline-state.json`, When the operator opens the Roadmap tab, Then that feature appears with its title, a "Discovery" stage label, and the discovery artefact's `Created` date.

**AC2:** Given a repo with at least one `artefacts/[feature-slug]/ideate.md` (with or without a corresponding `discovery.md`), When the operator opens the Roadmap tab, Then that feature appears with an "Ideate only" stage label distinct from "Discovery approved".

**AC3:** Given a feature that has progressed to having a real entry in `pipeline-state.json` (i.e. it has moved past discovery), When the operator opens the Roadmap tab, Then that feature does NOT appear — the Roadmap tab only shows work with no tracked entry yet, not a duplicate view of already-tracked features.

**AC4:** Given a repo with zero discovery-only or ideate-only artefacts, When the operator opens the Roadmap tab, Then it shows a clear empty state ("Nothing in early-stage discovery right now") rather than an error or a blank page.

## Out of Scope

- The full sync/cache pipeline (new `product_rollups` column + extended `/product-sync`) — explicitly deferred per discovery's Out of Scope and the /clarify decision log.
- Editing or progressing a discovery/ideate artefact from this tab — this is a read-only view, not a workflow tool.
- Cross-product roadmap aggregation — this story scopes the Roadmap tab to the single product being viewed.

## NFRs

- **Performance:** Scanning the `artefacts/` directory for discovery-only/ideate-only folders completes in under 1 second for a repo with up to 100 feature folders (this repo's own current scale).
- **Security:** None identified — this reads local repo files already accessible to the operator via other means (e.g. direct file browsing); no new data exposure.
- **Accessibility:** Stage-label pills are never colour-only — accompanied by text, matching this session's established convention.
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
