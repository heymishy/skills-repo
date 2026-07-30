## Story: Give bri-s3.5's billing E2E tenants unique per-run IDs so plan state doesn't leak across staging-deploy runs

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery
**Benefit-metric reference:** None — short-track skips benefit-metric

## User Story

As the **Platform operator**,
I want **`bri-s3.5-billing-journey.spec.js`'s 4 tenant IDs to be genuinely unique on every staging-deploy run**,
So that **a previous run's leftover paid/past_due/canceled plan state can never leak into the next run's "starts from trial" assumptions, and `promote-to-prod` can pass reliably**.

## Background / Investigation

`tcro-s1`'s merge (PR #645) fixed the confirmed root cause of AC4's `Expected: 402, Received: 200` failure — `withTenantCap()` now calls a real, remotely-settable override on the actual deployed server instead of writing to a file the server never sees.

The next staging-deploy run (`30509914086`) was expected to show AC4 (and possibly AC2) passing. Instead, **all 4** of `bri-s3.5-billing-journey.spec.js`'s tests failed — a regression from the prior run's 19/21-passing state:
- AC1: `Expected: trial, Received: paid`
- AC3: `Expected: paid, Received: trial`
- AC2: `Test timeout... apiRequestContext.post: Target page, context or browser has been closed`
- AC4: `Expected: paid, Received: trial`

Root cause (confirmed): this spec has always used 4 **hardcoded, static** tenant IDs (`e2e-bri-billing-upgrade`, `e2e-bri-billing-failure`, `e2e-bri-billing-capped`, `e2e-bri-billing-cancel`), shared across every run of this file, forever. Until `jlc-s1`, this was harmless — plan state lived in an in-memory `Map` that was wiped on every redeploy, so each staging-deploy run implicitly started from a clean slate regardless of the tenant IDs being static. `jlc-s1` replaced that Map with a real Postgres-backed `tenant_plan` table specifically so plan state would **survive** redeploys (a deliberate, correct fix for the original problem it solved) — but that same durability means a previous run's leftover state for these same static IDs now silently carries into the next run. AC1 and AC3's specific symptoms (`before.plan` already `paid` instead of `trial`; the reverse) are exactly what you'd expect from exactly this kind of cross-run pollution.

AC2's "target page/context closed" timeout is not yet explained by this same mechanism with full certainty — it may be a downstream cascade from another test's failure/state in the same file, or a separate issue. Not claimed as fixed by this story; flagged for observation on the next run, consistent with how AC2 was already flagged (and not fully resolved) after `tcro-s1`.

## Architecture Constraints

- No change to any production code path (`tenant-plan.js`, `server.js`, `billing.js`) — this is purely a test-fixture correctness fix, confined to `tests/e2e/bri-s3.5-billing-journey.spec.js`.
- Matches the unique-per-run-identity convention already established elsewhere this session: `bri-s3.2`'s and `bri-s3.4`'s own `uniqueEmail()` helpers append a per-run token so repeated runs never collide. This story applies the same pattern to tenant IDs rather than emails.
- Tenant IDs remain `e2e-`-prefixed (required by the server-side guard at `server.js`'s `/test/session` and `/test/tenant-cap` routes, `/^e2e-/i`).

## Dependencies

- **Upstream:** `tcro-s1` (merged) — this layer was only visible once tcro-s1's fix landed and exposed the next failure mode.
- **Downstream:** None expected. If AC2 persists after this fix, that is a distinct follow-up investigation, not blocked by this story.

## Acceptance Criteria

**AC1:** Given `bri-s3.5-billing-journey.spec.js`'s AC1 test ("checkout.session.completed upgrade"), When it runs on any staging-deploy run, Then it seeds and asserts against a tenant ID that has never been used by any prior run — no leftover state from an earlier run's residual plan state can affect the "starts from trial" assertion.

**AC2 (test-plan AC, not the spec's own AC2):** Given the same requirement, When applied to all 4 of the spec's test cases (AC1/AC2/AC3/AC4 tenant IDs), Then each of the 4 hardcoded tenant ID string literals is replaced with a per-run-unique value, and every place that ID is referenced (session seed, webhook payloads, cap-override calls) uses the same unique value consistently within that test.

**AC3:** Given the file's own top-of-file comment claiming full session/tenant isolation, When read after this fix, Then it accurately describes the isolation boundary — genuinely per-run for tenants (via this fix), not just per-scenario-within-a-run — with no lingering claim that cross-run isolation already existed.

**AC4 (regression guard):** Given these changes, When the existing unit test suite runs, Then it shows the same pre-existing baseline failure count (37 files) with zero new regressions.

## Out of Scope

- Root-causing AC2's `page.fill`/timeout failure with full certainty before this merges — flagged as "may or may not resolve as a side effect," consistent with how it was already flagged (and not resolved) by `tcro-s1`. If it persists on the next staging-deploy run, that is a distinct follow-up investigation.
- Adding an automated cleanup/expiry mechanism for old `tenant_plan` rows accumulated by past runs' now-abandoned static tenant IDs — those rows become permanently orphaned but harmless (never looked up again). Out of scope for this fix; a housekeeping concern, not a correctness one.
- Any change to `jlc-s1`'s Postgres persistence itself — that change is correct and intentional; this story adapts the test fixture to it, not the other way around.

## NFRs

- **Performance:** Negligible — no change to any runtime code path, only test-fixture identifiers.
- **Security:** None — test-only fixture data, already gated behind the existing `_isTestEndpointAllowed` mechanism.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable — test-only infrastructure. Note: this does leave 4 new permanently-orphaned rows per staging-deploy run in the real `tenant_plan` table (one per unique-per-run tenant ID) — acceptable given the table's small expected size and the alternative (state pollution) being strictly worse; not tracked as a formal NFR since it introduces no risk, only a bounded, ever-growing set of inert rows.

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
