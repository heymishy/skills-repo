# Decisions: Feature-detail page UX redesign

---

## Visual-language direction deferred to an optional /design pass

**Date:** 2026-09-05
**Context:** During `/discovery` and `/clarify`, whether this redesign should be an incremental restyle of the existing `.sw-card`/token system or a materially new visual language (to credibly hit the "Apple-level"/SaaS-grade bar named as the persona's expectation) was an open, unconfirmed assumption blocking `/definition`'s ability to slice this as one bounded story vs. requiring design exploration first.
**Decision:** The choice is not locked at discovery time. An optional `/design` pass (pipeline step 2.5) runs between `/benefit-metric` and `/definition` to propose the visual direction; `/definition` slices the implementation story against whatever `/design` produces (or, if `/design` is skipped, defaults to the incremental-restyle path against the existing token system).
**Rationale:** Locking this decision without design exploration risks either under-delivering (a "clean but still dated" restyle that doesn't move the perceived-quality needle this feature exists to address) or over-scoping (implementation work starting before the visual direction is validated). Deferring to `/design` matches the pipeline's own intended use of the optional design step for exactly this kind of ambiguity.

---

## Benefit metric will target a design-quality proxy, not a direct client-conversion claim

**Date:** 2026-09-05
**Context:** During `/clarify`, the operator confirmed that whether prospective clients actually view this specific `/features/:slug` page during beta evaluation is believed likely but not directly confirmed — no analytics or user-research evidence exists yet.
**Decision:** `/benefit-metric` will define its primary metric against the measurable proxy already named in Success Indicator 2 (a design-quality self-review bar, "would a design-conscious evaluator consider this on par with a modern SaaS product") rather than a direct client-conversion or retention causal claim.
**Rationale:** Claiming a metric this initiative cannot actually measure (real client conversion attributable to one page) would produce a benefit metric that fails on its own terms the moment it's scrutinised. A proxy metric the team can actually observe is honest about the current evidence level, while the underlying business risk (client drop-off from average UX during beta) remains the documented motivation in the discovery artefact's Why Now section.
