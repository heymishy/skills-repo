# Spike Outcome: Post-release CX/UX visual gap review (Customer experience tab, post jcx-s1–s5 + hotfixes)

**Opened:** 2026-10-13 | **Scope:** Standard | **Steps taken:** 4 (live Chrome walkthrough of the shipped Customer experience/Delivery/Canvas tabs on `wuce-staging.fly.dev`, re-check of the prior `cjm-best-practice` spike's own findings, 1 fresh web search on journey-map visual design specifics, direct DB-schema cross-check against what's actually rendered)
**Done condition met:** Yes
**Artefact path:** `artefacts/2026-10-11-journey-cx-redesign/spikes/post-release-cx-visual-gap-outcome.md`
**Trigger:** Operator, after the full epic shipped and both headline mechanisms (emotion curve, persona card) went live: "do a ux/cx spike against current state... cx still seems poor."

---

## Outcome: REDESIGN (of the Customer experience tab's own layout, not a new data model)

### What was found

All 5 stories in `journey-map-and-placeholder-trigger` shipped and their individual ACs pass — the emotion curve exists, the persona card exists and now genuinely persists (post `jcx-hotfix2`). The gap is not functional; it is that **every new element was added on top of the pre-existing vertical-stack-of-boxes layout rather than restructuring it into the swimlane/timeline format the original `cjm-best-practice` spike itself identified as the single most load-bearing finding.** That finding was never actually acted on — jcx-s3/jcx-s4 closed their own literal ACs (curve exists, persona exists) without changing the surrounding layout those elements live inside.

1. **No horizontal timeline / swimlane grid.** Stages render as a vertical stack of individually-bordered boxes (`Evaluate` / `Discover` / `Purchase`, top to bottom), identical in structure on both the Customer experience AND Delivery tabs. A fresh web search on journey-map visual design (see Sources) confirms the standard pattern is a left-to-right chronological grid with swimlanes (actions, emotional state, touchpoints, pain points, opportunities) as labeled horizontal rows, content aligned vertically across lanes — none of which is present here. This directly re-confirms the original spike's own finding 1, which was findings-only and never implemented.

2. **The emotion curve — the single highest-leverage element per the original spike — carries no stage labels on the chart itself.** Visually it is 3 small dots joined by a thin grey line, with a text label ("positive"/"No data yet") floating below each dot but no stage name anywhere on the chart. A viewer must count dot position against the separately-scrolled stage list below to know "1st dot = Evaluate." The chart container is also mostly empty whitespace (3 stages occupy roughly the left third of a full-width box, zoomed and confirmed directly). There's no vertical axis or emotion-level scale either.

3. **Persona card is a plain bordered text block** ("Name: / Role: / Goal:" as bold-label lines), not a card — no avatar/illustration placeholder, no typographic hierarchy (name isn't visually larger/more prominent than the metadata around it), reads like a form-confirmation summary rather than the empathy-anchor element the original spike's finding 4 called "core/essential."

4. **Customer experience and Delivery tabs are structurally identical**, confirmed by viewing both directly — same box layout, same `Edit stage / Map feature / Add placeholder` button row, only the data fields inside differ. The original spike's own central distinction (journey map = empathy artefact vs. flow/delivery view = system-state artefact, finding 3) exists in the data shown but not in the presentation, which undercuts the redesign's own stated goal of making the CX tab "the real, standards-compliant journey map."

5. **Captured stage data isn't fully surfaced.** Direct cross-check against this session's own earlier reads of `customer_journey_stages`'s schema confirms it stores `customer_actions`, `touchpoints`, and `channel` in addition to `emotion`/`pain_points`/`opportunities` — but the Customer experience tab renders only the latter three. Per the fresh search, "user actions" and "touchpoints" are standard swimlanes, not optional extras; their total absence here is a structural gap in the view, not just a styling one.

6. **Pipeline/delivery chrome (red "No coverage" ✕, amber "Needs metrics" ⚠, "Map feature"/"Add placeholder" buttons) sits undifferentiated among the empathy-oriented content** (persona, emotion, pain points) — same box borders, same button styling, no visual layer separating "customer research data" from "pipeline bookkeeping." Appropriate that both coexist on this page (a deliberate, scoped departure from generic CJM practice for this tool's own engineering-delivery audience, per the original spike's "what remains unknown" section) — but right now there's no visual hierarchy making that distinction legible at a glance.

7. **No per-stage illustration** — correctly still a non-issue. The original spike explicitly scoped this as supplementary, not foundational (finding 4); nothing found here changes that call. Named only so it isn't mistaken for a newly-discovered gap.

### Reasoning

The operator's own read ("cx still seems poor") is consistent with what a structural review predicts: closing an AC ("a connected emotion curve exists," "a persona card exists") is not the same as closing the gap to the 3 reference examples, because the reference examples' own quality bar was never primarily about *whether* those elements exist — it was about the *swimlane/timeline structure* they're embedded in (original spike finding 1, re-confirmed by fresh search just now). `jcx-s3`/`jcx-s4` were scoped and delivered correctly against their own ACs; the gap is one layer up, in the original spike's finding 1 never becoming its own story.

---

## If REDESIGN

**What needs to change:** The Customer experience tab's own layout — not its data model, not its underlying routes/handlers (`handleGetJourneyCanvas`, `checkPlaceholderConversions`, persona save/scan — all functionally correct and should be reused as-is). This is a presentation-layer redesign of one existing view.

**Suggested direction, prioritized:**

- **P0 — Restructure into a real timeline + swimlane grid.** Stage headers laid out left-to-right (not stacked top-to-bottom) with swimlane rows beneath: emotion curve as one row (see next point), then actions/touchpoints, then pain points, then opportunities — each row labeled on the left, content aligned vertically under each stage column, consistent row heights, subtle background/border separation between lanes (direct application of the fresh search's documented pattern).
- **P0 — Put stage names directly on the emotion curve's own x-axis**, and give the chart real visual weight (fill the available width proportionally to stage count, add a 4-level emotion-scale baseline/grid, consider a light background color band per emotion zone). Still pure inline SVG — no new chart dependency needed, consistent with `jcx-s3`'s own existing architecture constraint.
- **P1 — Surface `customer_actions`, `touchpoints`, and `channel`** as their own swimlane rows; this data already exists and is already queried (`handleGetJourneyCanvas`'s own stage SELECT already includes all three columns) — this is a rendering-only gap, not a data gap.
- **P1 — Visually distinguish Customer experience from Delivery.** Even a light-touch pass (different background tint or stage-name typography scale on the CX tab; de-emphasizing or relocating the delivery-chrome buttons) would make the empathy-vs-pipeline split legible without a full re-architecture.
- **P2 — Upgrade the persona card's visual treatment**: larger/bolder name, a simple avatar-placeholder icon, card-style elevation (shadow/border-radius) distinguishing it from a plain data block.
- **P2, explicitly still deferred** — per-stage illustration. No new finding changes the original spike's own call on this; re-affirmed, not re-opened.

**Not recommended:** Reopening the canvas-vs-CX-tab convergence question — the original spike's own structural reasoning (finding 3: journey map vs. flow diagram are different tool categories) still holds and nothing found here contradicts it. The canvas should stay a stage-structure/flow view; this redesign is scoped entirely to the Customer experience tab's own internal layout.

**Return to:** Operator decision on scope before any new story is written — this spike does not itself authorize implementation. See the question posed to the operator below.

---

## What remains unknown

The 3 original reference examples (Spotify flow, supermarket shopping map, Hustle Badger template) were shared with the operator directly in an earlier session and are not available to re-inspect pixel-for-pixel in this one — this spike's visual critique is grounded in the original spike's own textual findings plus fresh general best-practice research, not a direct side-by-side against the actual reference images. If a pixel-level comparison matters before committing to the P0 swimlane-grid redesign, re-sharing those 3 examples would sharpen it further.

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | Partial | The CX redesign epic closed its own literal scope (emotion curve + persona card exist) without closing the original spike's own structural finding (swimlane/timeline layout) — that finding needs its own story, not a re-litigation of the whole epic |
| MVP scope | Yes, if the operator proceeds | A new, tightly-scoped story: restructure the Customer experience tab's own layout into a timeline + swimlane grid, reusing all existing data/routes unchanged |
| Assumptions | No | No new assumptions surfaced |
| Known risks | Yes | A layout-only restructure still touches CSS-layout-dependent ACs (visual alignment, responsive behavior) — per CLAUDE.md's own B2 rule, any such AC must be classified at DoR time with either an automated visual-regression test or an explicit RISK-ACCEPT + manual smoke script, not left implicit |
| Technical constraints | No | No new technical constraint found; inline SVG (no new chart library) remains sufficient per the original spike's own architecture constraint |

**Discovery re-run needed?**
- [ ] No — this is scoped tightly enough to go directly to a new story under the same epic/feature, if the operator wants to proceed
- [x] Operator decision needed first — see below

---

## Question for the operator

This spike found a real, specific layout gap (vertical stack vs. the swimlane/timeline structure the very first spike recommended but was never built). Before writing a new story:
1. Proceed with a new story scoped to the P0 items (swimlane/timeline restructure + labeled emotion curve) now?
2. Scope smaller — just the labeled emotion-curve fix (cheapest, most isolated win) — and revisit the full swimlane restructure later?
3. Re-share the 3 original reference examples first, so the redesign can be checked against them directly rather than general best practice alone?

---

## Decision log reference

Not yet logged — pending operator's answer above. Will be added to `artefacts/2026-10-11-journey-cx-redesign/decisions.md` once a direction is chosen, following the same DESIGN-entry convention as the original `cjm-best-practice` spike.

---

## Sources

- [Building Effective Swimlanes — UXcel](https://app.uxcel.com/courses/customer-journey-mapping/v-visualize-656/building-effective-swimlanes-7147)
- [Visual Customer Journey Map — UXPressia](https://uxpressia.com/blog/visual-customer-journey-map)
- [The Importance of Design in a Customer Journey Map — Clearworks](https://clearworks.net/blog/importance-of-design-in-a-customer-journey-map/)
