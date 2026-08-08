# Discovery: Landing Page Hero Features

**Status:** Draft — awaiting approval
**Created:** 2026-08-08
**Approved by:** [Name + date — filled in after human review]
**Author:** Claude (agent), operator-directed

---

## Problem Statement

The landing page at `/` was deliberately scoped minimal at MVP (`lab-s1.2`, 2026-07-01) to unblock auth/billing bring-up — a badge, one headline, one value-prop paragraph, straight into the sign-in panel. That scoping decision was correct at the time (auth/billing didn't exist yet, so there was nothing real to show), but it has not been revisited since. The page has no product demonstration, no feature breakdown, and nothing that shows what running the pipeline actually looks like. A prospective visitor who doesn't already know what "governed software delivery pipeline" means has nothing to anchor that phrase to before being asked to authenticate — they either already know what they want (return visitor, referral) or bounce, with no in-between path to understanding. Meanwhile, there is now a large body of genuinely shipped, traceable work (100+ merged PRs, multiple full discovery-through-DoD chains) available to demonstrate with, rather than describe abstractly.

## Who It Affects

- **Engineering/tech lead evaluating for team adoption** — wants proof the governance is real, not compliance-theatre wrapped around an AI coding tool. Needs to see the mechanism, not just read a claim about it.
- **Individual developer** — wants to see it work end-to-end before installing anything or creating an account.

## Why Now

Auth/billing exists now (shipped since the original minimal-scope decision), so the landing page no longer needs to stay minimal to unblock anything else. There is now a large, real body of shipped, traceable work in this repo to demonstrate with — the constraint that justified the original minimal scope no longer applies.

## MVP Scope

Four hero features on the redesigned `/` page, each answering a distinct objection a skeptical evaluator already has:

1. **Golden trace** (signature/hero element) — a real, curated 4-frame narrative: **prompt → discovery.md snapshot → DoR snapshot → the shipped, working feature**, using an actual completed feature from this repo's own history (not a fabricated example). *Answers: "show me it's real, not a slide deck."* Two candidate features were evaluated by running their actual, current output (screenshots taken from the live local build, not mockups):
   - `2026-07-24-interactive-kanban-boards`, story `s3.1` (drag-to-advance) — a real operator complaint ("I've noticed the kanban boards are not styled... they're read-only") resolved into a working drag-and-drop board. (Evaluating this candidate surfaced a real, separate production defect — the board was rendering completely unstyled because its output was never wrapped in the shared page shell that defines the design-system CSS tokens. This was fixed as its own short-track story, `kbsf-s1`, PR #682, independent of this discovery.)
   - `2026-07-25-code-shape-diagrams`, story `csd-s2` — a rendered system-architecture diagram, thematically the tightest fit with golden trace itself (both argue "governance/visibility by demonstration, not by prose promise").

   **Decision procedure, not a locked choice:** rather than lock one candidate from static screenshots, the 4-frame demo content is built as swappable (a simple per-candidate content/config block, not hardcoded), so both can be compared side-by-side in the actual running page before the final candidate is locked pre-launch. This is a build-time content decision, not a live visitor-facing A/B test (see Out of Scope).

2. **Scope-contract enforcement** — the DoR artefact locks exact file touchpoints before any code is written; the assurance gate checks the merged diff against that contract at merge time. *Answers the #1 fear anyone with agentic-coding scars already has: "how do I stop the agent from quietly doing more than I asked?"*

3. **Cryptographic instruction-set verification** — every governed action commits a recomputable hash of the exact instruction set that governed it. *Answers the compliance/risk-lead question: "prove which standard was actually in context when this was written."*

4. **Self-improving harness** — `/improve` and the improvement-agent turn real delivery failures into proposed SKILL.md diffs, gated by human review every time. *Answers: "does this get better, or is it static tooling I have to maintain myself?"* Quantifiable: 246 real entries currently in `workspace/learnings.md`.

## Out of Scope

- **Live, real-time querying against the actual pipeline state or live LLM generation for the golden-trace demo.** MVP uses a curated, pre-baked snapshot of a real chain rendered at build/deploy time — not a live API hitting `pipeline-state.json` or GitHub for an unauthenticated visitor, and not a visitor-typed prompt triggering real-time discovery generation. Both are meaningfully bigger scope (new public read-only endpoints or live LLM-call cost/abuse exposure) and aren't needed to prove the concept.
- **CMS integration or operator-editable hero content** — copy and the demo snapshot(s) are authored directly in the template/build step, same convention as the existing landing page (`lab-s1.2`).
- **A/B testing of hero copy, layout, feature order, or the golden-trace demo candidate in production.** The swappable-content mechanism described in MVP Scope is a pre-launch comparison tool used to make one final decision before shipping — it is not a live, visitor-facing experiment.
- **Any content beyond the single `/` route** — still no blog/docs/marketing pages; this stays a single-page redesign, per the original landing-page scope boundary (`lab-s1.2`).
- **Multi-language support.**
- **New instrumentation beyond the existing `landing_page_viewed`/`cta_clicked` PostHog events** — per-hero-feature engagement tracking (e.g. which of the 4 hero cards gets scrolled to or clicked) is a good follow-on but not required to ship the redesign itself.

## Assumptions and Risks

[ASSUMPTION] The chosen demo content (whichever of the two candidates is ultimately locked, or both while being compared) contains nothing sensitive or proprietary that shouldn't be shown to a prospective customer — unconfirmed, requires a content read-through before final lock.
[ASSUMPTION] The redesigned landing page keeps the existing auth panel (GitHub/Google/email sign-in) as the CTA anchor after the new hero content, rather than replacing it — unconfirmed.

**Risk:** if the final demo candidate is too small or mundane, the golden-trace hero risks reading as unremarkable rather than impressive — the side-by-side comparison step exists specifically to manage this risk before launch, not just to pick a favourite.

## Directional Success Indicators

- **Landing page → signup conversion rate.** Baseline: `[UNKNOWN BASELINE]` — the existing `landing_page_viewed`/`cta_clicked` PostHog events exist but current conversion numbers have not yet been pulled. Target: directional improvement, exact figure set once baseline is pulled. Measured via: existing PostHog funnel (`landing_page_viewed` → `cta_clicked` → signup completion).
- **Time-on-page for unauthenticated visitors.** Baseline: `[UNKNOWN BASELINE]` — not currently instrumented. Target: meaningful increase, signalling visitors are engaging with hero content rather than bouncing. Measured via: a new PostHog scroll-depth/time-on-page event (a follow-on, not required for MVP, but the metric itself belongs here for /benefit-metric).

## Constraints

None beyond what's already named in `product/constraints.md`. No new time, budget, or regulatory constraint applies to this feature.

## Contributors

- Hamish King — Founder/Operator

## Reviewers

- [Name — Role]

## Approved By

[Name — Role — Date]

---

## /clarify recommendation

This discovery contains 2 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- The chosen demo content (whichever candidate is locked, or both while being compared) contains nothing sensitive or proprietary that shouldn't be shown to a prospective customer.
- The redesigned landing page keeps the existing auth panel as the CTA anchor after the new hero content, rather than replacing it.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

---

**Next step:** Human review and approval → /benefit-metric
