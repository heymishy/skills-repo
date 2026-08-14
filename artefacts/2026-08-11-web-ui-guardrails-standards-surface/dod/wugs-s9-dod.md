# Definition of Done: Admin approves or rejects a promotion request

**PR:** https://github.com/heymishy/skills-repo/pull/731 | **Merged:** 2026-08-13
**Merge commit:** dd24e035
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s9-approve-reject-promotion.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s9-approve-reject-promotion-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s9-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: approveRequest_pending_invokesWriteAdapterAndRecordsPr` asserts the write adapter is called with the org repo's owner/repo (not the product repo), the claimed row's own `file_path`/`content_snapshot`, and that a second UPDATE records the returned `pr_number` | automated test (`tests/check-wugs-s9-approve-reject-promotion.js`) | None |
| AC2 | ✅ | `AC2: rejectRequest_pending_setsStatusNoWrite` asserts the atomic claim sets `status='rejected'` and that the write adapter is never invoked | automated test | None |
| AC3 | ✅ | Two dedicated tests — `AC3: resolveRequest_nonAdmin_approveRejected403` and `AC3: resolveRequest_nonAdmin_rejectRejected403` — cover both endpoints per the story's own "approve or reject" wording, each asserting 403 and zero state change | automated test | None |
| AC4 | ✅ | `AC4: resolveRequest_noOrgRepo_blockedWithClearError` asserts a 422 with an explicit message before any atomic claim is attempted, so a doomed approval never burns the claim | automated test | None |
| AC5 | ✅ | `AC5: resolveRequest_concurrentCalls_onlyFirstUpdateSucceeds` simulates two admins racing the same request: the mock models Postgres's real `UPDATE ... WHERE status='pending'` semantics (only the first conditional UPDATE finds a row), asserts the first call gets 200, the second gets 409, the write adapter fires exactly once, and (added during code-quality review) that both admins' requests genuinely reach the claim UPDATE — the DB's WHERE clause decides the winner, not application-level locking | automated test | None |

All 10 tests re-run fresh against merged `master` (post-merge, not just pre-merge CI) on 2026-08-13: `10 passed, 0 failed`. Sibling stories `wugs-s3` (12/12), `wugs-s6` (18/18), `wugs-s8` (7/7) re-confirmed unaffected.

**No deviations on the 5 ACs themselves.**

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None shipped beyond the story's stated scope. Confirmed via diff review of the merged PR: no withdraw/cancel logic and no audit-logging (`wugs-s10`'s job, per the story's own Out of Scope list) were added.

One design decision made during implementation planning, not directly specified by any AC but required to make AC1 coherent: **write-adapter failure after a successful atomic claim reverts the request's status back to `pending`** (a compensating `UPDATE`, safe because the reverting call already exclusively owns the row via the first claim). Without this, a transient GitHub API failure would leave a request permanently stuck in `approved` status with no PR number and no way to retry. This is recorded in the plan's own design notes as a deliberate choice, not an oversight, and is covered by a dedicated test (`review: approveRequest_writeAdapterFails_revertsToPendingWith500`).

Three additions beyond the original 4-task plan, all found during two rounds of spec-compliance + code-quality review and shipped in the same PR before merge:
1. **CSRF guard** — the original Task 1 implementation omitted `_csrf.csrfGuard`, breaking this file's own established convention (every other mutating POST handler in `products.js` has one). Flagged as blocking by the code-quality reviewer, fixed immediately, and covered by `review: approveRequest_missingCsrf_rejected403NoStateChange`.
2. **`GuardrailPrConflictError` → 409 distinction** — the write-failure catch block originally treated every failure as a generic 500, dropping the same stale-SHA-conflict handling `handlePostOrgRepoSettings` (wugs-s3) already established. Fixed to match, covered by `review: approveRequest_writeAdapterConflict_409NotGeneric500`.
3. **AC3 test coverage extended to the reject endpoint** — the plan's own Task 3 draft only tested the non-admin case against `handlePostApprovePromotion`, but the story's AC3 text explicitly says "attempts to approve **or reject**." Caught while dispatching Task 3, corrected before the test was written rather than after.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (plan baseline), plus 5 additional tests added during review rounds
**Tests passing in CI:** 10 / 10

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: approval invokes write adapter, records PR number | ✅ | ✅ | 1 test |
| Review addition: missing CSRF token rejected, no state change | ✅ | ✅ | 1 test, Task 1 review fix |
| Review addition: write-adapter failure reverts to pending, 500 | ✅ | ✅ | 1 test, Task 1 review fix |
| Review addition: write-adapter conflict → 409, not generic 500 | ✅ | ✅ | 1 test, Task 1 review fix |
| AC2: rejection sets status, no write | ✅ | ✅ | 1 test |
| AC3: non-admin rejected 403 (approve) | ✅ | ✅ | 1 test |
| AC3: non-admin rejected 403 (reject) | ✅ | ✅ | 1 test, review-driven coverage-gap fix |
| AC4: no org repo blocks approval with clear error | ✅ | ✅ | 1 test |
| AC5: concurrent resolution, only first wins | ✅ | ✅ | 1 test, strengthened during review to assert both admins reach the claim UPDATE |
| Wiring: both admin routes routed to handlers | ✅ | ✅ | 1 test |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — server-side role enforcement is a hard requirement, "must be covered by a dedicated test, not implied" (story's own NFR wording) | ✅ | Two dedicated AC3 tests (approve + reject), each asserting both the 403 and zero state change |
| Security — CSRF protection consistent with every other mutating POST handler in this file | ✅ | Added as a review fix, covered by a dedicated test |
| Concurrency safety — atomic resolution, no duplicate PRs | ✅ | AC5 test asserts the write adapter fires exactly once across two racing admin calls |
| Accessibility — approve/reject are real, keyboard-accessible buttons | ⚠️ Deferred to UI wiring | This story ships the two backend endpoints only; the story's Architecture Constraints scope the admin-facing button UI as a display concern for a later story in this epic (consistent with `wugs-s8`'s own "request" button having shipped its UI in the same story it was built — `wugs-s9`'s UI counterpart was not called out as in-scope in the story text and no UI diff exists in the merged PR). Flagged here rather than silently assumed complete. |
| Audit — covered fully by `wugs-s10`, not duplicated here | ✅ | Confirmed no audit-logging code was added in this story's diff |

---

## Metric Signal

**Measurement-ready gate:** Is measurement possible yet for this story? **Functionally yes — request → approve/reject round-trip is now code-complete; observable/measurable signal still needs `wugs-s10`.**

`m2` ("Product-to-org promotion-approval workflow usage") lists `wugs-s8`, `wugs-s9`, `wugs-s10` as its primary contributing stories. With this story merged, a real tech lead can now request a promotion (`wugs-s8`) and a real admin can approve or reject it (`wugs-s9`) end-to-end — the functional workflow is live. What's still missing is `wugs-s10`'s audit logging, which is what the metric's own "what we measure" definition depends on to produce a counted, observable usage signal rather than an inferred one.

> **Product-to-org promotion-approval workflow usage**
> Signal: not-yet-measured
> Evidence note: request-creation (`wugs-s8`) and resolution (`wugs-s9`) are both code-complete and the round-trip is functionally usable by a real tenant, but the metric's defined measurement method requires `wugs-s10`'s audit log to produce a real usage count.
> Date measured: null

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Product-to-org promotion-approval workflow usage | ✅ (0%) | After `wugs-s10` ships audit logging | Functional round-trip complete as of this story; measurement instrumentation is `wugs-s10`'s job |

---

## Outcome

**COMPLETE**

No deviations on the 5 ACs, no follow-up actions outstanding for this story's own scope. All 5 ACs and the security NFRs are covered by differentiating tests, both review-driven fixes (CSRF guard, conflict-error distinction) and the review-driven coverage-gap fix (AC3 dual-endpoint testing) are confirmed still present post-merge. One NFR (accessible button UI) is explicitly flagged as deferred rather than silently assumed — not a defect in this story, since no UI was in its stated scope, but worth carrying forward so a later story in the epic doesn't silently skip it.

---

## DoD Observations

1. **The implementation plan's own AC3 test design had a spec-compliance gap that a later re-read of the story text caught before it shipped.** The plan's Task 3 snippet (written before any code existed) only exercised `handlePostApprovePromotion` for the non-admin-403 case, but the story's AC3 acceptance criterion explicitly reads "attempts to **approve or reject** a request" — plural coverage was required from the start. This was caught while briefing the Task 3 dispatch (re-reading the story text against the plan's draft test, not from a review round), and corrected before the test was written rather than discovered afterward. Tag as a `/improve` candidate: when an implementation plan is written well ahead of a task's actual dispatch (as happened here — the full plan was drafted before Task 1 even started), it's worth a final AC-text sanity pass immediately before each task's dispatch, not just once at plan-writing time, since later tasks' snippets can silently drift from the AC's exact wording.
2. **This is the fourth story this session shipping cleanly with zero E2E concurrency-collision flakes** (`wugs-s6`, `wugs-s5`... — but specifically the fourth *consecutive clean run* since the flake was diagnosed on `wugs-s3`/`wugs-s4`/`wugs-s8`). This story's `pipeline-state.json` bookkeeping write happened to land as a separate commit directly to `master` rather than needing a second push to the *feature branch itself* — the feature branch only received a single push (the code), so there was no second same-branch trigger competing for the `deploy-group` slot this time. This is circumstantial, not a structural fix (the `/improve` candidate from `wugs-s8`'s DoD — bundling the branch-complete artefact commit before the PR-URL is known, or a structural single-push design — is still open and still worth pursuing), but worth noting as a data point: when the bookkeeping write can be deferred to a direct-to-master commit instead of a feature-branch push, the flake does not reproduce.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Admin approves or rejects a promotion request.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Is the accessible-button-UI NFR deferral reasonable, or should it have blocked this story's completion?
4. Does the metric signal row correctly explain why full measurement still depends on wugs-s10, rather than just saying "TBD"?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```
