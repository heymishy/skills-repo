# Decisions: Feature-detail page UX redesign

---

## RISK-ACCEPT: W4 — AC verification scripts not walked through by a domain expert before DoR sign-off

**Date:** 2026-09-05
**Context:** `/definition-of-ready`'s W4 check requires the AC verification scripts (`fpux.1-verification.md`, `fpux.2-verification.md`) to be reviewed by a domain expert before sign-off. Neither has been walked through scenario-by-scenario in this session.
**Decision:** Proceed to DoR sign-off without a pre-code walkthrough; the scripts remain available for use as the post-merge smoke test and delivery-review script (their other two designed purposes), and can still be walked through before implementation starts if desired.
**Rationale:** Solo-operator context — the operator (also the sole domain expert) has been directly reviewing every upstream artefact (discovery, benefit-metric, design, epic, stories, review findings) throughout this same session, substantially reducing the risk this check exists to catch (a script drifting from what the operator actually wants). Risk accepted rather than adding a redundant review pass.

---

## Visual-language direction resolved: incremental token extension, not a new visual language

**Date:** 2026-09-05
**Context:** The optional `/design` pass (deferred from `/clarify`, run after `/definition` at the operator's request — "should go back and do /design") reviewed the existing `.sw-card`/`.sw-section-title` CSS in `html-shell.js` directly (subtle borders, 8px radius, muted uppercase section labels, accent focus rings on inputs).
**Decision:** The redesign extends the existing token system via two new shared classes (`.sw-epic-group`, `.sw-story-row`) rather than introducing a materially new visual language. See `design.md`'s Key Technical Decisions table for the full rationale.
**Rationale:** The existing token system was found already credible against the "Apple/SaaS-tier" bar — the defect is that one component (the epic/story accordion) never adopted it, not that the tokens themselves are inadequate. Inventing a second, parallel visual language would risk reintroducing the exact inconsistency this feature exists to remove. `fpux.1`'s Architecture Constraints and Complexity Rating were updated to reference this concrete design instead of an open question.

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
