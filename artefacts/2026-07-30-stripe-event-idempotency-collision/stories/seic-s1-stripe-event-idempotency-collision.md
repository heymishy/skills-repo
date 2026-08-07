## Story: Give bri-s3.5's webhook event IDs unique per-run values so the AC5 idempotency guard doesn't silently skip processing

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery
**Benefit-metric reference:** None — short-track skips benefit-metric

## User Story

As the **Platform operator**,
I want **`bri-s3.5-billing-journey.spec.js`'s webhook events to be processed on every staging-deploy run, not silently treated as already-seen duplicates**,
So that **the "webhook returns 200 but plan state never changes to paid" symptom found via `tpwd-s1`'s diagnostics is finally resolved, unblocking `promote-to-prod`**.

## Background / Investigation

`btii-s1` fixed cross-run tenant-ID pollution, and the very next run exposed a different symptom: AC1/AC3/AC4 all failed with `Expected: "paid", Received: "trial"` right after their `checkout.session.completed` webhook call, even though the webhook itself returned 200. `tpwd-s1` added temporary diagnostic logging to `tenant-plan.js`'s `setPlanState`/`getPlanState` to localize the fault.

The next staging-deploy run's logs (captured promptly via `flyctl logs`) showed the answer clearly: multiple `[tenant-plan][diag] getPlanState ... rows=0` lines for the "before" and "after" reads of the same tenant, but **zero** `setPlanState` diagnostic lines anywhere — not even the pre-existing failure log. `setPlanState` was never being called at all.

Root cause (confirmed via code review of `billing.js`'s `handlePostStripeWebhook`, lines 293–305): the AC5 idempotency guard does `INSERT INTO stripe_events (stripe_event_id) VALUES ($1) ON CONFLICT DO NOTHING`, then checks `insertResult.rowCount === 0` — if the exact same `stripe_event_id` was already recorded, it returns `200` immediately **without ever reaching the event-type switch statement** (and therefore never calling `setPlanState`). `bri-s3.5-billing-journey.spec.js`'s webhook payloads use hardcoded, static event IDs (`evt_e2e_ac1`, `evt_e2e_ac3_upgrade`, `evt_e2e_ac3_failure`, `evt_e2e_ac4_upgrade`, `evt_e2e_ac4_cancel`) — exactly the same class of bug `btii-s1` fixed for tenant IDs, but applied to a *different* real, unbounded, never-cleared Postgres table (`stripe_events`, confirmed via `server.js`'s auto-migration block, no TTL or cleanup). From the second time this spec ever ran successfully onward, every webhook POST in this file has been silently treated as an already-processed duplicate.

## Architecture Constraints

- No change to any production code path (`billing.js`'s idempotency guard is correct and intentional — this is a test-fixture correctness fix only, confined to `tests/e2e/bri-s3.5-billing-journey.spec.js`).
- Reuses the exact same `RUN_SUFFIX` token already introduced by `btii-s1` for tenant IDs — no new uniqueness mechanism, just applied to a second field that needed it.
- Removes `tpwd-s1`'s temporary diagnostic logging from `tenant-plan.js` now that the root cause is confirmed — per that story's own deferred-removal scope.

## Dependencies

- **Upstream:** `btii-s1` (merged) and `tpwd-s1` (merged) — this root cause was only identifiable once tpwd-s1's diagnostic logging ran against real staging traffic.
- **Downstream:** None expected. This is believed to be the final layer in this investigation chain — the "paid state never applied" symptom should now resolve, and AC1/AC3/AC4 should pass consistently on every future run.

## Acceptance Criteria

**AC1:** Given `bri-s3.5-billing-journey.spec.js`'s 5 webhook payloads (AC1's checkout, AC3's upgrade + failure, AC4's upgrade + cancel), When constructed, Then each `id` field is suffixed with the same per-run-unique `RUN_SUFFIX` token already used for tenant IDs — no hardcoded static event ID remains anywhere in the file.

**AC2:** Given these changes, When the next staging-deploy run executes this spec, Then `billing.js`'s AC5 idempotency guard treats every webhook POST as a genuinely new event (`rowCount` > 0 on insert) and the event-type switch statement runs, calling `setPlanState` as intended.

**AC3:** Given `tpwd-s1`'s temporary diagnostic logging in `tenant-plan.js`, When this story merges, Then that logging is fully removed — `setPlanState`/`getPlanState` are restored to their pre-diagnostic form with no behavioural change beyond the log lines' removal.

**AC4 (regression guard):** Given these changes, When the existing unit test suite runs, Then it shows the same pre-existing baseline failure count with zero new regressions.

## Out of Scope

- Any change to `billing.js`'s idempotency mechanism itself — it is correct and required for real Stripe webhook delivery (Stripe may redeliver the same event); the bug is entirely in the test fixture reusing static IDs, not in the guard's design.
- Adding automated cleanup/expiry for old `stripe_events` rows accumulated by this spec's now-abandoned static event IDs — orphaned but harmless, a housekeeping concern rather than a correctness one, same reasoning as `btii-s1`'s equivalent exclusion for `tenant_plan`.
- Auditing other spec files for the same static-webhook-event-ID pattern — scoped strictly to `bri-s3.5`, the only confirmed instance found so far.

## NFRs

- **Performance:** Negligible — no change to any runtime code path; test-fixture identifiers only, plus removal of a small number of diagnostic log lines.
- **Security:** None — test-only fixture data.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable — test-only infrastructure. As with `btii-s1`, this leaves a bounded, ever-growing set of inert orphaned rows in `stripe_events`; acceptable given the alternative (silent idempotency collisions) being strictly worse.

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
