# Spike Brief: CX/UX pattern for self-service DoD evidence review

**Opened:** 2026-10-26
**Blocking:** `/review` on `ppc-s5` (video capture) and `ppc-s6` (dashboard-shell UX/CX parity)
**Status:** Investigating

---

## Question

What's the best-practice CX/UX pattern for a SaaS tenant-facing "prove this feature is done" flow — select a DoD-complete feature → see its scope/benefit summary → see progressively-detailed evidence (screenshots, annotations, video) mapped to each AC → reach a sign-off decision — and does the `ppc-s5`/`ppc-s6` design as currently scoped match that pattern, using this app's own existing style/design-system conventions (`_htmlShell`, `/playback`'s summary+coverage layout)?

## Type

3 — Design decision (comparing already-written `ppc-s5`/`ppc-s6` ACs against external best practice, not an open-ended UX redesign).

## Scope

Standard — up to 6 steps. External pattern research (SaaS onboarding/audit-trail/evidence-review UX conventions) + comparison against this repo's own existing design conventions already confirmed in `ppc-s6`'s own `/definition` research (`_htmlShell.renderShell`, `/playback`'s summary/coverage layout, progressive disclosure of AC evidence).

## Done condition

A short set of named CX/UX patterns (e.g. summary-before-detail ordering, progressive disclosure per AC, evidence-type hierarchy screenshot→annotation→video, explicit sign-off CTA placement, empty/partial-coverage states) with each one checked against what `ppc-s5`/`ppc-s6`'s ACs already specify — producing PROCEED (current ACs already match best practice), REDESIGN (specific AC wording/additions needed, named), or DEFER (needs a human design review before continuing).

## Out of scope

- Not auditing specific named competitor products — general pattern research only
- Not a visual/pixel design pass (color, typography, spacing) — no style guide exists yet in this repo (`CLAUDE.md`'s "Style guide" row is still `[FILL IN]`), so this spike works from generic SaaS CX conventions + this app's own existing layout precedent only
- Not re-opening video-production tooling choices (ffmpeg, captions) — those stay deferred per existing `decisions.md` entries
- Not building a prototype or mockup — desk research and AC comparison only

## Outcome options

- **PROCEED:** `ppc-s5`/`ppc-s6` ACs already reflect best practice → resume straight into `/review` as planned
- **REDESIGN:** specific AC changes needed (e.g. reordering, missing empty-state, missing sign-off CTA AC) → update the story files before `/review`
- **DEFER:** finding requires a human design judgment call that can't be made from research alone → log as a named open question

## Discovery context (Step 0)

**Problem statement:** Tenants have no self-service way to validate a DoD-complete feature actually behaves as claimed in production — today it's either trust-the-artefact or an engineer manually re-demoing it.

**Relevant discovery risk:** "if driving live browser automation... turns out to need materially more plumbing than the 'mostly auth-scoping' MVP sizing assumes, the cost/value case weakens" — this spike extends that same early-sanity-check instinct to the CX/UX layer, now that a real page exists and was judged "terrible" against a side-by-side comparison with `/playback`.

**Relevant discovery deferred items:** video capture, presentation polish (ffmpeg annotation) — both named as fast-follow in discovery, now partly in scope via `ppc-s5`.
