## Story: Add shared session-origin derivation and show it on the product feature-list page

**Epic reference:** artefacts/2026-09-08-session-origin-badge/epics/session-origin-visibility.md
**Discovery reference:** artefacts/2026-09-08-session-origin-badge/discovery.md
**Benefit-metric reference:** artefacts/2026-09-08-session-origin-badge/benefit-metric.md
**Domain:** [web-ui]

## User Story

As **Hamish King, Platform Owner, triaging the feature backlog**,
I want to **see whether a feature's completed stages were driven through a real web session or authored via CLI/agent, directly on the product feature-list page**,
So that **I don't have to open each feature individually to learn whether there's a live conversation worth resuming.**

## Benefit Linkage

**Metric moved:** List-view session-origin visibility
**How:** This story delivers the shared derivation logic and the first of three surfaces at 100% coverage, moving the metric from its 0% baseline to the minimum validation signal defined in benefit-metric.md.

## Architecture Constraints

- **Bulk per-board-render lookup seam** (`.github/architecture-guardrails.md`, Approved Patterns): per-item data not present in the row's own base query must be read via a single injectable `_getXBulk`/`setGetXBulk` seam, keyed by the full set of IDs for that render — never N per-row lookups. This story adds `_getSessionOriginBulk`/`setGetSessionOriginBulk` in `src/web-ui/routes/products.js`, mirroring the existing `_getArtefactCountsBulk`/`setGetArtefactCountsBulk` (s2.2) exactly, backed by a new `getSessionOriginForJourneys(journeyIds)` function in `src/web-ui/adapters/journey-store-pg.js` (a sibling to the existing `getArtefactCountsForJourneys`).
- **The bulk call's ID list must be built from `mergedItems` (the taxonomy+journey merge from `mergeFeatureSources`), not the raw `rows` array** the existing `_getArtefactCountsBulk(rows.map(j => j.journey_id))` call uses. Taxonomy-only entries in `mergedItems` carry no `journeyId` field at all (verified directly against `product-rollup.js`'s `mergeFeatureSources`), so the call must be `_getSessionOriginBulk(mergedItems.filter(item => item.journeyId).map(item => item.journeyId))` — reusing the `rows`-based precedent verbatim would silently exclude taxonomy-merged journey IDs and break AC4's classification. (1-M1, review run 1)
- **Graceful degradation on bulk-read failure**: if the bulk lookup fails or the adapter is unwired, the page must still render successfully with the indicator simply omitted — matching `_enrichColumnsWithArtefactCounts`'s existing AC5 precedent. Never let this feature block or break the page.
- **Accessibility**: colour alone must not be the only indicator of state (`.github/architecture-guardrails.md`, Mandatory Constraints > Accessibility) — every state needs a text-equivalent (`title`/`aria-label`).
- **Single source of truth for the derivation rule**: the tri-state logic (`deriveSessionOrigin`) must live in exactly one place and be imported by every consumer — not reimplemented per surface (`.github/architecture-guardrails.md`, Anti-Patterns > duplicating a fixed sequence in two files).
- **Function contract must distinguish "no real journey" from "journey exists with zero completed stages" as separate inputs**, not infer one from an empty array — the two are visually different states (AC4 vs AC5) and collapsing them into one boolean would make the "no completed stages yet" case unrepresentable. Signature: `deriveSessionOrigin({ hasJourney, completedStages })` — `hasJourney: false` always yields "no session" regardless of `completedStages`; `hasJourney: true` with an empty `completedStages` yields "no indicator" (null); `hasJourney: true` with a non-empty `completedStages` yields the tri-state from AC1–AC3. This contract is required so sob-s2 can correctly classify `/journey`'s synthesized (non-real-journey) entries from `_mergeStateFeaturesIntoJourneyList`, which carry no `completedStages` array at all despite representing a feature with real pipeline progress.

## Dependencies

- **Upstream:** None
- **Downstream:** sob-s2 and sob-s3 both import and reuse `deriveSessionOrigin` (this story's own output) without re-deriving the tri-state logic

## Acceptance Criteria

**AC1:** Given a feature on the product feature-list page whose real journey has every completed stage carrying a real `sessionId`, When the page renders, Then that feature's row displays the "fully session-backed" indicator.

**AC2:** Given a feature whose real journey has at least one completed stage with a `sessionId` and at least one without, When the page renders, Then that feature's row displays the "mixed" indicator.

**AC3:** Given a feature with a real journey where none of its completed stages carry a `sessionId`, When the page renders, Then that feature's row displays the "no session" indicator.

**AC4:** Given a taxonomy-only feature with no real journey record at all (a CLI-authored feature merged in via `mergeFeatureSources`), When the page renders, Then that feature's row displays the same "no session" indicator as AC3.

**AC5:** Given a feature with zero completed stages (still on Idea/ideation), When the page renders, Then no session-origin indicator is shown for that row — this is a distinct state from "no session", not a fourth visual state.

**AC6:** Given a product feature-list page with multiple features, When the page renders, Then `_getSessionOriginBulk` is called exactly once for the whole render, not once per row.

**AC7:** Given `_getSessionOriginBulk` throws or the underlying adapter is unavailable, When the page renders, Then the page still renders successfully with no session-origin indicator shown for any row, and no error surfaced to the operator.

**AC8:** Given any of the three indicator states, When rendered, Then the element carries a `title` or `aria-label` naming the exact state in words (not colour alone).

**AC9:** Given `deriveSessionOrigin({ hasJourney: true, completedStages: [] })` (a real journey with zero completed stages) and `deriveSessionOrigin({ hasJourney: false, completedStages: [] })` (no real journey) called directly as unit tests, Then the first returns `null` ("no indicator") and the second returns `"no-session"` — proving the two states are distinguishable from the function's own contract, not just from page-level fixtures.

## Out of Scope

- Wiring the indicator into `/journey` or org kanban — sob-s2 and sob-s3.
- Any click/drill-down interaction on the indicator — glance-only in this story.
- Surfacing "no session" for org-kanban-style journeys-only queries that structurally cannot represent a zero-journey row — not applicable to this story (the product page's taxonomy merge already covers the zero-journey case here).

## NFRs

- **Performance:** Exactly one additional query (or zero, if reusable data already loaded) per page render, regardless of feature count — no per-row query (AC6).
- **Security:** None identified — read-only derivation over already-authorized data, no new data exposed beyond what the page already renders (journey existence and stage completion are not sensitive).
- **Accessibility:** Indicator states are distinguishable without colour alone (AC8), matching WCAG-adjacent guidance already applied elsewhere on this page.
- **Audit:** None identified — no new write action to log.

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
