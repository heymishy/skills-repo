## Epic: A signed-in user has one real place to manage their account, billing, and (if admin) platform credits

**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`
**Slicing strategy:** Vertical slice

## Goal

A signed-in user reaches a single, coherently-designed Settings page from the sidebar and can see their linked sign-in methods and add another, see their plan status and reach Stripe's billing portal, and — if they're an admin — manage tenant credit balances, all in the shared design system rather than as three disconnected, unstyled orphan pages.

## Out of Scope

- Unlinking an already-linked sign-in method — only adding a second method is in scope; removal has its own edge cases (e.g. preventing someone unlinking their only working sign-in method) deferred to a separate story.
- Building new billing logic — this epic wires the existing `handleGetBillingPortal`/`handleGetBillingPlanState` routes into a real UI; it does not change Stripe integration behaviour.
- Building new credits logic — this epic restyles the existing `adminCreditsGet`/`adminCreditsPost` routes; it does not change balance-adjustment behaviour or add a deduct capability if one doesn't already exist.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Settings/account discoverability | 0% (reachable only by typing the exact URL) | 100% within one click from the sidebar | Ships a real Settings page linked from the sidebar (Epic B), surfacing all three existing capabilities |

## Stories in This Epic

- [ ] C1 — Settings page shell with Profile tab (identity + sign-in method linking)
- [ ] C2 — Billing tab (plan status + Stripe portal)
- [ ] C3 — Credits tab restyled into the shared design system (admin-only)

## Human Oversight Level

**Oversight:** Low
**Rationale:** Presentation-layer work over already-working, already-tested backend routes. No new business logic beyond what C1's account-linking handler already does.

## Complexity Rating

**Rating:** 1
**Rationale:** All three underlying capabilities exist and work today; this epic is UI/IA investment on top of confirmed-working handlers, matching a mockup already reviewed and approved by the operator.

## Scope Stability

**Stability:** Stable
