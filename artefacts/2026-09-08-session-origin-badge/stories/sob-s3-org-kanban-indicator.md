## Story: Show the session-origin indicator on the org kanban board

**Epic reference:** artefacts/2026-09-08-session-origin-badge/epics/session-origin-visibility.md
**Discovery reference:** artefacts/2026-09-08-session-origin-badge/discovery.md
**Benefit-metric reference:** artefacts/2026-09-08-session-origin-badge/benefit-metric.md
**Domain:** [web-ui]

## User Story

As **Hamish King, Platform Owner, triaging the feature backlog**,
I want to **see the same session-origin indicator on the org kanban board**,
So that **the signal covers all three surfaces named in the benefit-metric target, including the board view used for cross-product triage.**

## Benefit Linkage

**Metric moved:** List-view session-origin visibility
**How:** Completes coverage of the third and final surface named in the metric's target — this story is what takes the metric from 2/3 to 3/3 surfaces covered.

## Architecture Constraints

- **Reuse `deriveSessionOrigin` from sob-s1 unchanged**, and **reuse the exact same `_getSessionOriginBulk`/`setGetSessionOriginBulk`/`getSessionOriginForJourneys` seam sob-s1 built** — do not add a second bulk-lookup function. This story adds `_enrichColumnsWithSessionOrigin(columns)` in `products.js`, mirroring the existing `_enrichColumnsWithArtefactCounts` shape exactly (same pattern, second consumer of the same underlying bulk read).
- **Every card `handleGetOrgKanban` renders already has a real journey by construction** — its query (`SELECT journey_id, feature_slug, ... FROM journeys WHERE product_id = $1 AND tenant_id = $2`) only ever returns journey-backed rows; there is no taxonomy merge on this surface (confirmed by reading `handleGetOrgKanban` directly during `/design`). This means the "no session" state is structurally unreachable on org kanban today — the indicator here will only ever show "fully session-backed" or "mixed" in practice. This is a verified, documented limitation (see design.md Open Question #2), not a gap this story is expected to close.
- **Graceful degradation** matching sob-s1's AC7 precedent — a bulk-read failure omits the indicator without breaking the board render.
- **Accessibility**: same text-equivalent requirement as sob-s1 and sob-s2.

## Dependencies

- **Upstream:** sob-s1 must be DoD-complete — this story reuses its `deriveSessionOrigin` function and its `_getSessionOriginBulk` seam without modification.
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given an org kanban card whose journey has every completed stage session-backed, When the board renders, Then that card shows the "fully session-backed" indicator, visually identical to sob-s1 and sob-s2's treatment.

**AC2:** Given an org kanban card with a mix of session-backed and non-session-backed completed stages, When the board renders, Then that card shows the "mixed" indicator.

**AC3:** Given the org kanban board renders with multiple products and multiple cards, When rendered, Then `_getSessionOriginBulk` (sob-s1's seam) is called via `_enrichColumnsWithSessionOrigin`, never a second, independently-implemented bulk function.

**AC4:** Given `_getSessionOriginBulk` throws or is unavailable, When the board renders, Then the board still renders successfully with no session-origin indicator shown on any card, matching `_enrichColumnsWithArtefactCounts`'s existing AC5 precedent.

**AC5:** Given org kanban's own query only ever returns journey-backed rows (no taxonomy merge, confirmed in Architecture Constraints above), When any real board is rendered, Then the "no session" state is never observed on this surface in practice — verified by a code-level test asserting `handleGetOrgKanban`'s query has no taxonomy-merge call, documenting the limitation is real and current, not silently assumed.

## Out of Scope

- Adding a taxonomy merge to `handleGetOrgKanban` so CLI-authored, zero-journey features become visible on this surface — a separate, larger change (see epic Out of Scope and design.md Open Question #2); not this story.
- Any click/drill-down interaction on the indicator.

## NFRs

- **Performance:** Reuses sob-s1's existing bulk seam — zero new queries beyond what sob-s1 already introduced.
- **Security:** None identified.
- **Accessibility:** Same as sob-s1/sob-s2 — text-equivalent required, not colour alone.
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
