# Contract Proposal: Give admins a real control to lift a tenant's journey cap, separate from credits

**Story reference:** artefacts/2026-08-06-tenant-plan-admin-control/stories/tpac-s1-admin-plan-state-control.md
**Date:** 2026-08-06

## What will be built

A new admin-only plan-state control on `/admin/credits`, alongside (not merged into) the existing credits-adjustment form: a small form/dropdown letting an admin set a tenant's `plan` (`trial`/`paid`) and `status` (`active`/`past_due`/`canceled`) directly, calling `tenant-plan.js`'s existing `setPlanState(tenantId, plan, status)`. The page's GET handler is extended to display the tenant's current plan/status as a visibly separate field from the credits balance. The "Journey limit reached" error text (`routes/journey.js`, `routes/products.js`) is edited to explicitly name "plan" as the cause.

## What will NOT be built

- Any change to the credits system itself (`adjustBalanceWithAudit`, the existing credit-adjustment form) — stays untouched, only a new adjacent control is added.
- A self-serve (non-admin) plan-change UI — real customers still only change plan via Stripe checkout.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Render `/admin/credits` for a fixture tenant, assert plan/status and credits appear as distinct HTML elements | Unit |
| AC2 | Call the new plan-state route, then `checkJourneyCap` for the same tenant, assert unrestricted | Unit + integration |
| AC3 | Call `adjustBalanceWithAudit` only, assert `checkJourneyCap` still restricted | Unit |
| AC4 | Render the "Journey limit reached" page, assert body text contains "plan" and doesn't imply credits | Unit |

## Assumptions

- `setPlanState`/`checkJourneyCap`/the `tenant_plan` table are already production-stable (confirmed: `jlc-s1`, `bri-s3.5`, already in live use on `wuce-staging`) — no changes to their internals, this story is purely a new caller.

## Estimated touch points

- **Files:** `src/web-ui/routes/admin-credits.js` (new form + GET display), `src/web-ui/routes/journey.js` and `src/web-ui/routes/products.js` (error message text only)
- **Services:** none new
- **APIs:** none new — reuses `tenant-plan.js`'s existing exported functions

## Schema dependency declaration (H8-ext)

**schemaDepends:** `[]`

Dependencies block states "None" — no upstream story dependency.

**Contract review:** ✅ PASSED — proposed implementation aligns with all 4 ACs.
