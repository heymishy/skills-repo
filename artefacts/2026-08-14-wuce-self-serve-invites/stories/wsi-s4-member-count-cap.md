## Story: Invite acceptance is blocked if the tenant is at its member-count cap

**Epic reference:** artefacts/2026-08-14-wuce-self-serve-invites/epics/epic-1-self-serve-invite-flow.md
**Discovery reference:** artefacts/2026-08-14-wuce-self-serve-invites/discovery.md
**Benefit-metric reference:** artefacts/2026-08-14-wuce-self-serve-invites/benefit-metric.md
**Domain:** [auth]

## User Story

As a **platform owner**,
I want **a basic cap on how many people can join a tenant on a given plan**,
So that **self-serve invite doesn't quietly remove the last practical limit on team size that an admin's own manual effort was implicitly providing until now**.

## Benefit Linkage

**Metric moved:** Share of new teammates added via self-serve invite (indirectly — this is a guardrail on the mechanism, not a driver of the metric itself)
**How:** This story doesn't move either metric directly; it prevents the self-serve mechanism `wsi-s1`/`wsi-s2` build from having an unbounded, unintended side effect (unlimited free team growth) that wasn't part of what was actually discovered or decided.

## Architecture Constraints

- **This is new prerequisite scope, not existing infrastructure being integrated with.** Verified at /definition: no seat/plan-quantity limit exists anywhere in wuce today — `billing.js`/`tenant-plan.js` track a plan TIER (`'trial' | 'paid'`, via `getPlanState(tenantId)`), never a seat COUNT. `product/roadmap.md` explicitly lists full Stripe per-seat billing as deferred — this story does NOT build that; it builds a minimal, interim count cap only (see `decisions.md`'s 2026-08-15 SCOPE entry).
- **Read the tenant's plan tier via the existing `tenant-plan.js`'s `getPlanState(tenantId)`** — do not invent a second plan-state read path.
- **Cap values are a simple, hardcoded per-tier constant** (e.g. `trial: 3, paid: 25` — exact numbers are an implementation decision, not fixed by this story's ACs) — not a per-tenant configurable value, not read from Stripe.
- **Member count is a live `COUNT(*) FROM team_memberships WHERE tenant_id = $1` query** — not a cached/denormalized counter, avoiding a second source-of-truth that could drift from the real membership table.
- Runs as part of `wsi-s2`'s own redemption logic (the same code path checks expiry, redemption status, and now the count cap together) — not a separate route or separate check invoked independently.

## Dependencies

- **Upstream:** `wsi-s2` (this story's check runs inside that story's own redemption logic), `tenant-plan.js`'s existing `getPlanState` (already merged, unrelated feature)
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a tenant on the `trial` plan that already has its cap's worth of `team_memberships` rows, When an invitee tries to accept a valid, unexpired invite for that tenant, Then the join is blocked with a clear message (e.g. "this team has reached its member limit") — no `team_memberships` row is created, and the invite's `redeemed_at` remains `NULL` (the invite is NOT consumed by a failed attempt, so it can still be accepted later if a seat frees up).

**AC2:** Given a tenant that is below its cap, When an invitee accepts a valid invite, Then the join proceeds normally (unaffected by this story) — this is a regression guarantee for the common case, not just the blocked-path's own correctness.

**AC3:** Given a tenant on the `paid` plan, When the cap is checked, Then a materially higher cap applies than the `trial` plan's own cap — the two tiers are genuinely different values, not the same number regardless of plan.

**AC4:** Given a tenant exactly AT its cap (count equals the limit, not yet over it), When an invitee tries to accept, Then the join is still blocked — the cap is an inclusive maximum ("at most N members"), not an off-by-one "N+1 allowed" boundary.

## Out of Scope

- **Full Stripe per-seat billing (metered quantity, per-seat pricing, seat add-on purchase flow)** — explicitly deferred per `product/roadmap.md`; this story builds only a basic, interim count cap.
- **Configurable-per-tenant cap values** — the cap is a fixed constant per plan tier, not something an admin or support person can adjust per-tenant.
- **Any UI showing the admin their current member count vs. their cap before they hit it** — the block only surfaces at the moment of a blocked acceptance; a proactive "you're approaching your limit" indicator is a future refinement.
- **Counting pending (unaccepted) invites toward the cap** — only actual `team_memberships` rows count; an admin can create more invites than remaining capacity, and whichever ones get accepted first succeed until the cap is hit (matches the epic's own acceptance-time-not-creation-time timing decision).

## NFRs

- **Performance:** A single `COUNT(*)` query per acceptance attempt — negligible overhead at expected beta scale (small teams, infrequent invite acceptance).
- **Security:** Not applicable beyond `wsi-s2`'s own existing tenant-scoping guarantees (ADR-025) — the count query is scoped by the invite's own stored `tenant_id`, never request-supplied.
- **Accessibility:** The "member limit reached" error message is real, readable text.
- **Audit:** A blocked-by-cap attempt is logged (`tenant_id`, `plan`, current count, cap, timestamp) — useful signal for whether the interim cap values need adjusting once real beta usage exists.

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
