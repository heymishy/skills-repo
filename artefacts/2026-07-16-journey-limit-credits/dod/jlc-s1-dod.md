# Definition of Done: Persist tenant plan state so the paid-plan journey-cap bypass survives a restart

**PR:** https://github.com/heymishy/skills-repo/pull/485 | **Merged:** 2026-07-16
**Story:** artefacts/2026-07-16-journey-limit-credits/stories/jlc-s1-credit-based-journey-cap.md
**Test plan:** artefacts/2026-07-16-journey-limit-credits/test-plans/jlc-s1-credit-based-journey-cap-test-plan.md
**DoR artefact:** artefacts/2026-07-16-journey-limit-credits/dor/jlc-s1-dor.md
**Assessed by:** Claude (agent) — retroactive DoD, 2026-07-16, per operator decision to require DoD for all short-track stories going forward
**Date:** 2026-07-16

---

## Correction notice carried forward

This story was originally scoped as "add a credit-balance-based journey-cap bypass, since none exists." That premise was invalidated mid-implementation: the operator's own live account hit "Journey limit reached" with 6 in-flight features, and initial investigation (based on a stale main-checkout file read, ~14 commits behind `origin/master`) wrongly concluded no bypass existed at all. The dispatched coding agent caught the discrepancy itself and the story was re-scoped before implementation to fix the real defect: `bri-s3.5`'s already-shipped paid-plan bypass stored its state in a plain in-memory `Map`, with zero persistence across a server restart. All ACs below are the corrected, final scope.

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Plan state survives a simulated restart | ✅ | New D37 adapter (`setPlanStateAdapter`), `tenant_plan` Postgres table, `CREATE TABLE IF NOT EXISTS` migration in `server.js`. Verified via IT1 (fresh module instance reading from a shared backing store) and, separately, by driving a real running server end-to-end: created 5 journeys, hit the real 402 page, fired a real `checkout.session.completed` webhook, confirmed the 6th journey then succeeded. | Automated test (IT1, IT3) + live manual end-to-end drive against a running server | None |
| AC2 — Untracked tenant defaults to trial/active | ✅ | `getPlanState` returns `{plan:'trial', status:'active'}` for any tenant with no row. | Automated test (U1) | None |
| AC3 — Adapter unwired fails open to safe default | ✅ | `getPlanState`/`checkJourneyCap` catch any adapter error (unwired or a genuine DB failure) and fall back to the pre-existing count-only behavior — verified live: with a real cap configured and the adapter unwired, `checkJourneyCap` correctly returned `{allowed:false}`, never unconditional access, never a throw. | Automated test (U2, U3) + live direct verification | None |
| AC4 — All 3 Stripe webhook branches correctly await the now-async `setPlanState` | ✅ | `billing.js`'s 3 event branches and its GET plan-state route updated to `await`. Verified via IT2 (delayed-adapter mock proving the handler waits for the write before responding) and live: fired a real webhook against a running server, confirmed the write completed before the 200 response. | Automated test (IT2) + live end-to-end drive | None |
| AC5 — Cap-decision logic unchanged when plan state is healthy | ✅ | `checkJourneyCap`'s paid/active bypass and trial/past_due/canceled restriction logic confirmed byte-identical to the pre-existing in-memory version's behavior (U4, U5). | Automated test | None |

## Scope Deviations

None from the corrected scope. The original (pre-correction) scope was fully superseded, not partially implemented — no credit-balance-based mechanism was added, matching the corrected story's explicit decision to fix the real defect instead.

---

## Test Plan Coverage

**Tests from plan implemented:** 21 / 21 (U1-U5 + IT1-IT3, individual assertion count)
**Tests passing:** 21 / 21

Also confirmed: 3 modified pre-existing test files (`check-bri-s3.5-usage-gate.js`, `check-bri-s3.5-billing-webhook.js`, `check-s2.1-preflight-gate.js`) all still passing, zero regression.

**Test gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — one additional indexed DB read per journey-creation attempt | ✅ | Negligible — same query pattern as `credits.js`'s existing `getBalance` callers. |
| Security — fail-open must never grant unconditional access | ✅ | Directly verified live: unwired adapter + configured cap correctly falls back to the safe count-cap, confirmed via direct `node -e` testing against the actual module, not just unit-test mocks. |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None (full re-scope, not partial implementation)
Test gaps: None

**Retroactive DoD note:** This DoD was written 2026-07-16, after the operator decided all short-track stories should retroactively receive a DoD artefact. This story is a strong example of why direct code verification against a fresh checkout matters — the original diagnosis (based on a stale local file) would have shipped a redundant, overlapping bypass mechanism instead of fixing the actual, more serious restart-durability defect.
