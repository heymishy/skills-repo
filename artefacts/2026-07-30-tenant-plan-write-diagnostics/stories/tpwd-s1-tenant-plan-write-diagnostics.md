## Story: Add temporary diagnostic logging to identify why bri-s3.5's paid-plan writes aren't taking effect

**Epic reference:** None — short-track (bug investigation, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery
**Benefit-metric reference:** None — short-track skips benefit-metric

## User Story

As the **Platform operator**,
I want **the next staging-deploy smoke-test run to reveal whether `setPlanState`'s write, or the immediately-following `getPlanState` read, is the point of failure**,
So that **the still-unsolved "webhook returns 200 but the tenant stays on trial" symptom found right after `btii-s1` can finally be root-caused and fixed, unblocking `promote-to-prod`**.

## Background / Investigation

`btii-s1`'s merge (giving `bri-s3.5-billing-journey.spec.js`'s tenants unique per-run IDs) confirmed and fixed the cross-run state-pollution bug — the next staging-deploy run's AC1 "before" check now correctly showed `trial` for a brand-new tenant ID, with no leftover state from a prior run.

But that same run exposed a different, previously-masked failure: AC1, AC3, and AC4 all now fail with `Expected: "paid", Received: "trial"` immediately **after** their `checkout.session.completed` webhook call — the paid-state write appears to have no effect at all, for tenant IDs that have never been used before.

Static code review confirms `billing.js`'s webhook handler correctly `await`s `tenantPlan.setPlanState(...)` before responding — this rules out a fire-and-forget race in the application code itself. `setPlanState` and `getPlanState` both **fail open** (catch and either log-and-swallow, or silently return the default `trial`, respectively) by original design (jlc-s1 AC3: a DB hiccup must never 500 an unrelated request or grant unconditional access) — which means a genuine DB write/read failure or timeout would silently manifest as exactly this symptom, with no visible error to the caller. The same staging-deploy run's own logs show direct evidence of DB-side stress: `purge-e2e-tenants failed (non-blocking): purgeE2eTenants timed out after 60000ms`. Multiple CI jobs (Scenario A/B E2E, the 20x cross-tenant-isolation repeat, and this smoke test) run concurrently against the single shared `wuce-staging` machine and its Postgres database, so DB contention under concurrent load is a plausible cause — but this is a hypothesis, not a confirmed finding, and a genuine write-path or read-path bug has not been ruled out.

## Architecture Constraints

- **Diagnostic only — this story does not fix the underlying failure.** It adds `console.log`/`console.error` lines inside `tenant-plan.js`'s existing `setPlanState` and `getPlanState` functions, scoped to `e2e-`-prefixed tenant IDs only (so no production tenant activity is logged), confirming: (a) whether the write itself completed without error, (b) how many rows a subsequent read finds, and (c) the exact error message if the read throws.
- No secrets are logged — tenant IDs in this spec are already synthetic, non-sensitive test identifiers (`e2e-bri-billing-*`); plan/status values are non-sensitive enum strings.
- No behavioural change to either function's control flow, return values, or existing fail-open error handling — purely additive logging.

## Dependencies

- **Upstream:** `btii-s1` (merged) — this failure was only cleanly visible once btii-s1's cross-run pollution fix removed the confounding "before" check failure.
- **Downstream:** A follow-up story to actually fix the identified root cause (DB load/timeout tuning, a genuine write/read bug, or something else the logs reveal), and to remove this diagnostic logging once no longer needed.

## Acceptance Criteria

**AC1:** Given `setPlanState`, When it is called with an `e2e-`-prefixed `tenantId` and the write succeeds, Then a `console.log` line is emitted confirming the write completed, including the tenant ID and the plan/status values written.

**AC2:** Given `getPlanState`, When it is called with an `e2e-`-prefixed `tenantId`, Then a `console.log` line is emitted reporting how many rows were found for that tenant ID — distinguishing "no row found" (write never landed under this exact tenant ID) from any other outcome.

**AC3:** Given `getPlanState`'s read genuinely throws, When this happens for an `e2e-`-prefixed `tenantId`, Then a `console.error` line is emitted with the tenant ID and the real error message — closing the previously-silent blind spot where a read failure produced no log trace at all.

**AC4:** Given these changes, When the existing behaviour of both functions is inspected, Then all existing fail-open semantics (write errors swallowed, read errors default to trial/active) are unchanged — this story only adds logging, never changes control flow or return values.

**AC5:** Given the next `staging-deploy` workflow run after this merges, When `bri-s3.5-billing-journey.spec.js`'s AC1/AC3/AC4 fail again with the same symptom, Then `flyctl logs --app wuce-staging` (captured promptly, before the machine auto-suspends) contains enough `[tenant-plan][diag]` log lines to determine whether the fault is in the write path, the read path, or neither (i.e. a DB-level issue invisible to both).

## Out of Scope

- Actually fixing the identified root cause once found — that is a follow-up story, scoped once the diagnostic evidence is in hand.
- Removing this diagnostic logging — deferred to the same follow-up story, once no longer needed.
- Any change to DB connection pooling, timeout configuration, or Postgres capacity — premature without confirmed evidence this is the actual cause.

## NFRs

- **Performance:** Negligible — one or two `console.log`/`console.error` calls per plan-state operation, scoped only to `e2e-`-prefixed tenant IDs (never production tenants).
- **Security:** No secrets logged; tenant IDs and plan/status values are already non-sensitive synthetic test data.
- **Accessibility:** Not applicable.
- **Audit:** This log line IS the audit mechanism for this story's purpose.

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
