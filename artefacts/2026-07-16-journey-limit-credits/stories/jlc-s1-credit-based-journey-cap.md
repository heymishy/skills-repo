## Story: Journey cap bypass for tenants with a positive credit balance

**Track:** Short-track (`/test-plan -> /definition-of-ready -> coding agent`)

## User Story

As a **paying tenant with a positive credit balance**,
I want **the flat journey-count cap to not block me as long as I have credits**,
So that **my ability to create features is governed by what I've actually paid for (credits), not an arbitrary count set for free/trial accounts**.

## Benefit Linkage

**Metric moved:** Beta-readiness correctness — the current gate (`checkJourneyCap` in `src/web-ui/modules/tenant-plan.js`) applies `MAX_JOURNEYS_PER_TENANT` (currently 5) identically to every tenant regardless of billing status, with zero connection to the existing `credits.js` balance system. A real paying account was blocked with "Journey limit reached... contact the operator" despite having no relationship to their actual usage/payment. This is a real, in-production defect discovered live by the operator (6 in-flight features on one account), not a hypothetical.
**How:** Short-track, no formal benefit-metric artefact — confirmed directly with the operator (2026-07-16): free/trial tenants keep the existing count-based cap; any tenant with a positive credit balance bypasses the count cap entirely, gated only by running out of credits (matching credits.js's existing `getBalance`/`adjustBalance` mechanism, already used elsewhere for per-turn deduction).

## Current, verified state (2026-07-16)

Confirmed by direct code read, not assumption:
- `src/web-ui/modules/tenant-plan.js`'s `checkJourneyCap(tenantId, currentCount, repoRoot)` resolves a cap from (in order) an injected test reader, `{repoRoot}/tenant-caps.json`, or `MAX_JOURNEYS_PER_TENANT` env var (`.env.example` sets this to `5`). No code path reads `credits.js`'s balance at all.
- `src/web-ui/modules/credits.js` is a real, Postgres-backed per-tenant balance (`getBalance`/`adjustBalance`, table `credits`), already used elsewhere (per-turn deduction), completely disconnected from this gate.
- No `plan`/`tier`/`subscription_status` field exists anywhere in the codebase — "paid" has no explicit representation today. Per the operator's decision, a positive credit balance IS the paid signal; no new plan-tier field is being introduced by this story.

## Architecture Constraints

- Reuse `credits.js`'s existing `getBalance(tenantId)` — do not introduce a new adapter or a new "plan tier" concept. This story's entire mechanism is: "if `getBalance(tenantId) > 0`, `checkJourneyCap` always returns `allowed: true`."
- `credits.js`'s adapter is D37-injectable and its stub throws when unwired (`setCreditsAdapter` must be called first). `checkJourneyCap` becoming async (it must now await a DB call) is a real, necessary signature change — update the one call site in `journey.js` (`routes/journey.js` line ~357) to `await` it.
- If `credits.js`'s adapter is unwired when `checkJourneyCap` is called (e.g. a test or environment that never wired it), do NOT let that throw block journey creation for every tenant — catch the specific "Adapter not wired" error and fall back to the existing count-only behavior (fail open to the pre-existing behavior, not fail closed to a 500 error). This preserves every existing test/environment that doesn't wire credits.
- Do not touch `credits.js`'s own logic, schema, or `billing.js`'s Stripe webhook handling — this story only adds a new *caller* of the existing `getBalance` function.

## Dependencies

- **Upstream:** None — `credits.js` (existing) and `tenant-plan.js` (existing) are both already merged.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a tenant with a positive credit balance (`credits.getBalance(tenantId) > 0`), When they attempt to create a new journey beyond the existing `MAX_JOURNEYS_PER_TENANT` count cap, Then journey creation succeeds (the count cap does not apply) — proving the credit-based bypass works for a tenant genuinely over the old limit.

**AC2:** Given a tenant with a zero or negative credit balance, When they attempt to create a journey beyond `MAX_JOURNEYS_PER_TENANT`, Then journey creation is still blocked with the existing HTTP 402 "Journey limit reached" response — proving free/trial tenants are unaffected (zero regression).

**AC3:** Given a tenant with a positive credit balance who is also under the count cap, When they create a journey, Then it succeeds exactly as it did before this story (credits being positive never blocks a request that the old cap would have allowed anyway) — proving no new restriction is introduced.

**AC4:** Given the `credits.js` adapter is unwired (not called via `setCreditsAdapter`) in the current process, When `checkJourneyCap` is invoked, Then it falls back to the pre-existing count-only behavior (does not throw, does not 500, does not silently allow unlimited journeys) — proving this story fails open to old behavior, not closed to an error, when credits isn't wired.

**AC5:** Given `checkJourneyCap` is now async, When the one existing call site in `routes/journey.js` invokes it, Then the call site correctly `await`s the result — proving the signature change is fully wired, not left as a silent `Promise` object being treated as truthy/falsy (which would incorrectly always evaluate `allowed` as `true` since a Promise object is truthy).

## Out of Scope

- Any new plan-tier/subscription-status field or admin UI for managing it — the credit balance itself is the only signal this story introduces.
- Changing how credits are earned, purchased, or deducted — `credits.js`'s own mechanics are unchanged.
- Retroactively raising `MAX_JOURNEYS_PER_TENANT`'s default value — the free/trial cap number itself (currently 5) is unchanged; this story only adds a bypass path for tenants with credits.

## NFRs

- **Performance:** `checkJourneyCap` now makes a DB read when credits is wired — negligible (`credits` table, indexed by `tenant_id`, same query pattern as existing `getBalance` callers).
- **Security:** None — this loosens a gate for paying tenants, does not weaken any tenant-isolation boundary. AC4's fail-open behavior must fail open to the *old, already-shipped* behavior (count cap), never to "unlimited for everyone."
- **Accessibility:** Not applicable — no UI change (the existing HTTP 402 page is unchanged for AC2's case).
- **Audit:** None beyond existing logging (`console.error` on cap-reached, unchanged for AC2's path).

## Complexity Rating

**Rating:** 2 — some ambiguity (the async signature change touches one call site; the fail-open behavior needs to be right), but the mechanism itself (reuse an existing, already-merged balance read) is well understood.
**Scope stability:** Stable.
