# Definition of Done: Audit-log promotion request, approval, and rejection events

**PR:** https://github.com/heymishy/skills-repo/pull/732 | **Merged:** 2026-08-13
**Merge commit:** 19fb3448
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s10-audit-log-promotion-events.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s10-audit-log-promotion-events-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s10-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: requestPromotion_fires_guardrailPromotionRequested` asserts `_requestPromotion` fires `guardrail_promotion_requested` with exactly `tenantId`, `productId`, `requestId`, `filePath` — and only on the actual-INSERT branch, not the idempotent "existing pending" branch, confirmed by reading `_requestPromotion`'s early-return control flow | automated test (`tests/check-wugs-s10-audit-log-promotion-events.js`) | None |
| AC2 | ✅ | `AC2: approveRequest_fires_guardrailPromotionApproved` asserts `handlePostApprovePromotion` fires `guardrail_promotion_approved` with `tenantId`, `requestId`, `approvedBy`, `prNumber` — fires only after the PR-number UPDATE succeeds, on the true 200 path, unreachable from the 403/409/422/500 paths (confirmed by control-flow review, not just the passing test) | automated test | None |
| AC3 | ✅ | `AC3: rejectRequest_fires_guardrailPromotionRejected` asserts `handlePostRejectPromotion` fires `guardrail_promotion_rejected` with `tenantId`, `requestId`, `rejectedBy` — fires only on the true 200 path, unreachable from the 403/409 paths | automated test | None |
| AC4 | ✅ | Three dedicated tests (one per path — request/approve/reject), each injecting a mock PostHog client whose `.capture()` throws synchronously, asserting the underlying state change (request created / approved / rejected) still completes successfully | automated test | None |

All 7 tests re-run fresh against merged `master` (post-merge, not just pre-merge CI) on 2026-08-13: `7 passed, 0 failed`. Sibling stories `wugs-s8` (7/7), `wugs-s9` (10/10) re-confirmed unaffected — the injectable `posthog` parameter added to each handler is additive-optional and every existing production call site (`server.js`) omits it, falling back to the real `_posthog` module unchanged.

**No deviations on the 4 ACs themselves.**

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None shipped beyond the story's stated scope. Confirmed via diff review across all 3 merged commits: no dashboard was built (explicitly out of scope), no retroactive event backfill was attempted (explicitly out of scope, and correctly — no prior activity exists to backfill).

One implementation detail decided during Task 3, not directly specified by the plan's illustrative snippet: the `guardrail_promotion_rejected` event's `requestId` property is sourced from `claimed.request_id` (the atomic-claim UPDATE's own `RETURNING` value) rather than the raw `req.params.requestId`. Confirmed via spec-compliance review that these are always identical in production — `_resolvePromotionRequest`'s `UPDATE ... WHERE request_id = $3 ... RETURNING request_id` returns, by SQL equality semantics, the exact row matched by the input parameter — so this is a no-op substitution in real usage, made necessary only to satisfy the plan's own test mock (which intentionally returns a different `request_id` from the UPDATE than the input, specifically to prove which value the code actually captures).

Two review rounds across 3 tasks found no blocking issues — a first for this session's `wugs-s*` stories (every prior story had at least one blocking or scope-worthy finding). The only real findings were both non-blocking: (1) Task 1 had four lines of dead test-helper code (an unused `originalFetchRepoPath`) left over from copy-pasted boilerplate, cleaned up immediately; (2) Task 3's NFR-SEC test uses a regex (`[^}]*`) to isolate PostHog capture call blocks for a forbidden-field scan, which the code-quality reviewer noted would not correctly handle a hypothetical future capture call containing a nested object literal (it would silently stop matching at the nested object's own closing brace). This does not affect the 3 capture call sites that exist today — all are flat objects — so it was correctly left unfixed as a lower-priority future-hardening item rather than blocking this story's merge.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (plan baseline), plus 3 additional tests added during implementation (one fail-open test per path was already planned as part of AC4's own coverage requirement, not a review addition — the test plan's own Integration Tests section specified "Call each of the three handlers with the failing mock," which the implementation correctly expanded into three separate per-path unit tests rather than one combined test, plus the NFR-SEC static-source test)

**Tests passing in CI:** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: request creation fires `guardrail_promotion_requested` | ✅ | ✅ | 1 test |
| AC4 (request path): capture failure doesn't block request creation | ✅ | ✅ | 1 test |
| AC2: approval fires `guardrail_promotion_approved` | ✅ | ✅ | 1 test |
| AC4 (approve path): capture failure doesn't block approval | ✅ | ✅ | 1 test |
| AC3: rejection fires `guardrail_promotion_rejected` | ✅ | ✅ | 1 test |
| AC4 (reject path): capture failure doesn't block rejection | ✅ | ✅ | 1 test |
| NFR-SEC: no PII/credential content across all 3 capture call sites | ✅ | ✅ | 1 test, static source scan |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — capture calls are fire-and-forget, no hard latency target | ✅ | Confirmed `posthog-server.js`'s `capture()` is synchronous fire-and-forget over raw `https.request` with no returned Promise — no blocking `await` was introduced on any capture call |
| Security — no PII/credential content in event properties | ✅ | Dedicated NFR-SEC test statically scans all 3 real capture call sites in source for forbidden field names (`token`, `accessToken`, `content`, `content_snapshot`, `csrfToken`); flagged in review as having a theoretical future-hardening gap (nested-object regex fragility) but correctly guards all 3 call sites as they exist today |
| Accessibility — not applicable, no UI in this story | ✅ (N/A) | Confirmed no view/rendering code was touched in any of the 3 merged commits |
| Audit — this story IS the audit mechanism for the epic | ✅ | Confirmed via `benefit-metric.md`'s M2 definition — this story's 3 event names match verbatim |

---

## Metric Signal

**Measurement-ready gate:** Is measurement possible yet for this story? **Yes — this is the terminal story completing M2's measurement mechanism.**

`m2` ("Product→org promotion-approval workflow usage") lists `wugs-s8`, `wugs-s9`, `wugs-s10` as its primary contributing stories, with this story's own benefit linkage stating it plainly: "This story IS the measurement mechanism benefit-metric.md names for M2 — without it, M2 cannot be measured at all, regardless of whether `wugs-s8`/`wugs-s9` work correctly." With all three merged, a real tenant can now request, approve, or reject a promotion, and every one of those actions is captured as a real PostHog event the metric owner can query.

> **Product→org promotion-approval workflow usage**
> Signal: not-yet-measured
> Evidence note: the full request → approve/reject round-trip is code-complete and every state transition now fires a real, audit-logged PostHog event — `benefit-metric.md`'s stated measurement method (weekly manual PostHog query by the metric owner) is now fully executable. What remains is real usage occurring in production, not further instrumentation work.
> Date measured: null

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Product→org promotion-approval workflow usage | ✅ (0) | As soon as a real tenant submits a promotion request in production | Instrumentation complete as of this story; `benefit-metric.md`'s own Feedback loop (reassess discoverability/priority if zero requests occur within 4 weeks) is now the correct next checkpoint, not a further code change |

---

## Outcome

**COMPLETE**

No deviations on the 4 ACs, no follow-up actions outstanding for this story's own scope. All 4 ACs and the security/audit NFRs are covered by differentiating tests, confirmed still present post-merge. This story closes out Epic 3's walking skeleton — with `wugs-s8`, `wugs-s9`, and `wugs-s10` all merged, the full product→org promotion-approval workflow (request → approve/reject → audit log) is end-to-end complete and real-usage-measurable for the first time.

---

## DoD Observations

1. **This was the first story this session (of 10 shipped so far) where two full review rounds across all tasks found zero blocking findings.** Every prior story had at least one blocking finding (a missing CSRF guard on `wugs-s9`, a dropped mock-shape/allowlist check on `wugs-s8`, etc.). The most plausible reason: this story's entire implementation surface was additive-only (an optional trailing parameter plus a wrapped capture call) layered onto three already-reviewed, already-hardened handlers from `wugs-s8`/`wugs-s9` — there was very little new surface area for a defect to hide in, and the injectable-parameter convention it reused was already established and proven three times over in this same file. Worth noting as a positive signal for the "read the real, merged upstream code before designing a plan" discipline this session adopted from `wugs-s9` onward: it appears to correlate with cleaner review outcomes on stories that build directly on recently-shipped, recently-reviewed code.
2. **A test-plan-vs-plan-snippet reconciliation gap surfaced mid-Task-3 and was handled transparently rather than silently forced to match.** The plan's own "Final story-level check" section predicted "9 passed" for the completed test file, but the actual file only ever contained 7 checks (2+2+3 across the three tasks) — a simple miscount in the plan's own prose, not a missing test. Similarly, the plan's Step 2 prediction that "both AC4/AC3 tests fail" before Task 3's implementation turned out to be only half-true: the AC3 test failed as expected, but the AC4 (reject-path) test passed vacuously beforehand, because the unmodified handler ignored its unused 5th argument and always returned 200 regardless of whether posthog was wired — meaning the test wasn't yet exercising a real RED state for that specific check. The implementer's report caught and explained this discrepancy explicitly rather than silently reporting "matched the plan," which is exactly the kind of self-correcting transparency this session's process has been trying to reinforce (see `wugs-s9`'s own DoD Observation #1 about plans drifting from AC text). Tag as a `/improve` candidate: when an implementation plan predicts a specific pre-implementation test-failure count for a task, that prediction should be treated as a sanity check the implementer verifies and reports on, not a target to force — this story's dispatch got that right, worth reinforcing explicitly in `/subagent-execution`'s own dispatch instructions for future stories.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Audit-log promotion request, approval, and rejection events.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the requestId-source substitution (claimed.request_id vs req.params.requestId) correctly explained as behaviorally identical in production, not just asserted?
3. Does the metric signal row correctly state that M2 is now fully measurable (not still blocked on further code), consistent with this being the terminal story in Epic 3's walking skeleton?
4. Is the NFR-SEC regex fragility noted as a real but non-blocking future-hardening item, not silently omitted?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```
