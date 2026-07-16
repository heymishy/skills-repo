## Story: Persist tenant plan state so the paid-plan journey-cap bypass survives a restart

**Track:** Short-track (`/test-plan -> /definition-of-ready -> coding agent`)

## Correction notice (2026-07-16)

This story was originally scoped as "add a credit-balance-based journey-cap bypass, since none exists." That premise was wrong — it was based on reading a stale copy of `tenant-plan.js` from a local checkout that was ~14 commits behind `origin/master`. The real, current file (shipped by an earlier story, `bri-s3.5`) already has a paid-plan bypass: Stripe webhooks (`checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`, wired in `src/web-ui/routes/billing.js`) call `tenantPlan.setPlanState(tenantId, plan, status)`, and `checkJourneyCap` already bypasses the count cap entirely when `plan === 'paid' && status === 'active'`. This story is re-scoped to fix the real defect found: that plan state is stored in a plain in-memory `Map()` (`src/web-ui/modules/tenant-plan.js`'s `_planState`), with zero persistence. Any server restart (Fly.io deploy, crash, scaling event) wipes it, silently reverting every tenant to the default `{plan: 'trial', status: 'active'}` — re-applying the free/trial count cap to a legitimately paying tenant until their next Stripe webhook event fires. This is almost certainly what the operator hit directly: a real account with 6 in-flight features got blocked at the 5-journey trial cap.

## User Story

As a **paying tenant whose plan state was set to paid/active by a Stripe webhook**,
I want **that plan state to survive a server restart**,
So that **a deploy, crash, or scaling event doesn't silently revert me to the trial journey cap until I happen to trigger another billing event**.

## Benefit Linkage

**Metric moved:** Beta-readiness correctness — a real production defect the operator hit live.
**How:** Confirmed directly with the operator (2026-07-16): persist plan state to Postgres (not an in-memory Map), keeping the existing Stripe-webhook-driven plan/status model exactly as designed, just making it durable.

## Architecture Constraints

- Follow the exact same D37 injectable-adapter pattern as `src/web-ui/modules/credits.js` (this module now touches an external system — a DB — so it needs the adapter treatment `tenant-plan.js` didn't need before): `setPlanStateAdapter(pgPool)`, stub throws `"Adapter not wired: planStateDb"` when unwired.
- New table: `tenant_plan (tenant_id TEXT PRIMARY KEY, plan TEXT NOT NULL DEFAULT 'trial', status TEXT NOT NULL DEFAULT 'active', updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`, created via the same `CREATE TABLE IF NOT EXISTS` startup-migration convention already used by `journey-store-pg.js` (per this repo's established convention, not a new migration mechanism).
- `setPlanState(tenantId, plan, status)` becomes async (writes to Postgres via `INSERT ... ON CONFLICT (tenant_id) DO UPDATE`). `getPlanState(tenantId)` becomes async (reads from Postgres; returns the same default `{plan:'trial', status:'active'}` for an untracked tenant). `checkJourneyCap` becomes async as a result (it already calls `getPlanState`).
- Update every call site: `billing.js`'s 3 webhook handlers (already async, per Stripe webhook handler convention) must `await setPlanState(...)`; the `GET` plan-state route (`billing.js` ~line 337) must `await getPlanState(...)`; `journey.js`'s call site of `checkJourneyCap` (~line 357) must `await` it.
- **Fail-open requirement:** if the DB adapter is unwired, or a DB read genuinely errors, `getPlanState` must fall back to the safe default (`{plan:'trial', status:'active'}`) rather than throwing and 500-ing every journey-creation and billing-status request. This is the same fail-open discipline as the original (now-superseded) jlc-s1 scope — apply it here instead, since it's the actually-correct place for it.
- Do NOT touch `credits.js`'s own logic/schema, or the Stripe webhook signature-verification/event-routing logic in `billing.js` — only the `setPlanState`/`getPlanState` calls within the already-identified event branches.
- This closes an in-memory-state gap analogous to the one bri-s3.5's own decisions.md already flagged for a *different* module ("a minimal in-memory tenant plan-state store") — worth checking `artefacts/2026-07-09-beta-readiness-infra/decisions.md`'s bri-s3.5 entry for the original design rationale before changing it.

## Dependencies

- **Upstream:** `bri-s3.5` (already merged) — this story replaces its in-memory store with a persisted one, doesn't redesign the plan/status model itself.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a tenant whose plan state was set to `paid`/`active` via `setPlanState`, When the Node process is restarted (simulated in a test by re-requiring/resetting the in-memory module state but reading the same underlying Postgres table), Then `getPlanState(tenantId)` still returns `{plan:'paid', status:'active'}` — proving persistence survives what an in-memory Map would have lost.

**AC2:** Given a tenant with no plan-state row in the table, When `getPlanState(tenantId)` is called, Then it returns the default `{plan:'trial', status:'active'}` — unchanged default behavior.

**AC3:** Given the plan-state DB adapter is unwired, When `getPlanState` or `checkJourneyCap` is called, Then it falls back to the safe default / count-only behavior without throwing — proving fail-open, matching this repo's D37 standard.

**AC4:** Given `billing.js`'s 3 Stripe webhook branches (`checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`), When each fires, Then it correctly `await`s the now-async `setPlanState` call — proving the async signature change is fully wired at every call site, not left as an unresolved/ignored Promise.

**AC5:** Given `checkJourneyCap`'s existing plan-state-bypass logic (`paid`+`active` → cap lifted, anything else → existing count-cap logic), When re-verified against the persisted store, Then behavior is unchanged from the current in-memory version for every existing passing test — this story changes *where* the state lives, not the cap-decision logic itself.

## Out of Scope

- Any change to the plan/status values themselves (`trial`/`paid`, `active`/`past_due`/`canceled`) or to which Stripe events map to which state — that's `bri-s3.5`'s already-decided design.
- `credits.js`'s own balance mechanics — untouched.
- A UI for viewing/editing plan state beyond the existing `GET` route.

## NFRs

- **Performance:** One additional indexed DB read per journey-creation attempt and per plan-status check — same order of magnitude as `credits.js`'s existing pattern.
- **Security:** None — this fixes a durability bug, doesn't change any tenant-isolation boundary. Fail-open must fail open to the *safe default* (trial/active, count cap applies), never to unconditional unlimited access.
- **Accessibility:** Not applicable.
- **Audit:** None beyond existing logging.

## Complexity Rating

**Rating:** 2 — mechanically similar to `credits.js`'s existing pattern (well understood), but touches 4 call sites across 2 files that all need correct async wiring.
**Scope stability:** Stable.
