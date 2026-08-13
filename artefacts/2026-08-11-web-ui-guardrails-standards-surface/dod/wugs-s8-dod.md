# Definition of Done: Request a product-level guardrail/standard be promoted to org level

**PR:** https://github.com/heymishy/skills-repo/pull/730 | **Merged:** 2026-08-13
**Merge commit:** e6619258
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s8-request-promotion.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s8-request-promotion-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s8-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: requestPromotion_newRequest_createsRowWithSnapshot` asserts the exact INSERT params, including that `content_snapshot` is the real, server-fetched current content (not client-submitted) | automated test (`tests/check-wugs-s8-request-promotion.js`) | None |
| AC2 | ✅ | `AC2: requestPromotion_existingPending_returnsExistingNotDuplicate` asserts no new INSERT fires and the existing `request_id` is returned | automated test | None |
| AC3 | ✅ | `AC3: handleGetGuardrailsView_pendingPromotion_showsIndicator` drives the real view handler end-to-end, regex-matches the "Promotion requested — pending approval" text | automated test | None |
| AC4 | ✅ | `AC4: requestPromotion_crossTenantProduct_rejected` asserts 404 (FORBIDDEN-vs-NOT_FOUND convention) and no row created for a cross-tenant request | automated test | None |

All 7 tests re-run fresh against merged `master` (post-merge, not just pre-merge CI) on 2026-08-13: `7 passed, 0 failed`. Sibling stories `wugs-s2` (11/11), `wugs-s3` (12/12), `wugs-s4` (7/7), `wugs-s5` (13/13), `wugs-s6` (18/18), `wugs-s7` (8/8) re-confirmed unaffected.

**No deviations on the 4 ACs themselves.**

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None shipped beyond the story's stated scope. Confirmed via diff review of the merged PR: no approve/reject logic (Out of Scope item — `wugs-s9`'s job) and no withdraw/cancel logic (Out of Scope item, not MVP) were added anywhere in the diff — the only trace of the future `approved`/`rejected` states is the `status` column's `CHECK` constraint enum, which legitimately needs to declare all three values now since the column can't be altered incrementally without a migration later.

Two additions beyond the original 4-task plan, found during code-quality review rounds and shipped in the same PR before merge: (1) error handling around the request-time content fetch — if the file was deleted between page-load and the "Request promotion" click, the request now fails with a clear 404 rather than an unhandled 500, mirroring `wugs-s6`'s established pattern; (2) the request-promotion path is validated against the same allowlist (`_isAllowedGuardrailPath`) `wugs-s6`'s write path already uses, preventing a request against an arbitrary out-of-scope path.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (plan baseline), plus 3 additional tests added during review rounds
**Tests passing in CI:** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: request creates row with content snapshot | ✅ | ✅ | 1 test |
| Review addition: file deleted since page-load → 404, no INSERT | ✅ | ✅ | 1 test, Task 1 review fix |
| Review addition: path outside allowlist → 400, no INSERT | ✅ | ✅ | 1 test, Task 1 review fix |
| AC2: duplicate pending request not re-created | ✅ | ✅ | 1 test |
| AC4: cross-tenant request rejected | ✅ | ✅ | 1 test |
| AC3: pending indicator shown on next render | ✅ | ✅ | 1 test |
| Wiring: POST /products/:id/guardrails/promote routed | ✅ | ✅ | 1 test |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — none specific | ✅ (N/A) | No performance target set by the story; no new heavy operation introduced |
| Security — tenant-scoping (AC4) is a hard requirement | ✅ | `AC4` test asserts both the 404 status and that no row was created for a cross-tenant request |
| Accessibility — "Request promotion" is a real button, keyboard-accessible | ✅ | Rendered markup confirmed as a real `<form>`/`<button type="submit">`, not a non-interactive element (verified in final story-level review) |
| Audit — covered fully by `wugs-s10`, not duplicated here | ✅ | Confirmed no audit-logging code was added in this story's diff |

---

## Metric Signal

**Measurement-ready gate:** Is measurement possible yet for this story? **Partially — the "request" half is live, approval isn't built yet.**

`m2` ("Product-to-org promotion-approval workflow usage") — this story delivers the "request submitted" half of the metric's minimum validation signal. A real tech lead can now click "Request promotion" and have a real, tenant-scoped, idempotent request created — but there is nothing yet to approve it (`wugs-s9`, not yet started) or audit-log it (`wugs-s10`, not yet started), so the workflow isn't end-to-end usable by a real tenant yet.

> **Product-to-org promotion-approval workflow usage**
> Signal: not-yet-measured
> Evidence note: the request-creation half is code-complete and tenant-scoped, but the metric's real usage signal requires the full request → approve/reject round-trip, which needs wugs-s9 to also ship.
> Date measured: null

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Product-to-org promotion-approval workflow usage | ✅ (0%) | After `wugs-s9` ships and a real request is both submitted and approved/rejected | Not independently measurable from this story alone — matches the story's own stated Benefit Linkage |

---

## Outcome

**COMPLETE**

No deviations, no follow-up actions outstanding for this story's own scope. All 4 ACs and the accessibility/security NFRs are covered by differentiating tests, both review-driven fixes (error handling, path validation) are confirmed still present post-merge, and the final story-level review confirmed the complete request-creation flow (click → snapshot → idempotent re-click → indicator → tenant rejection) is coherent.

---

## DoD Observations

1. **A dispatched implementer subagent got stuck mid-task waiting on a background `npm test` process it had spawned itself**, reporting it would "wait for the background task to complete on its own" — but subagents cannot receive background-task completion notifications the way the orchestrating session can; that notification would never arrive. Recovered by checking the worktree's actual `git status`/`git diff` directly (confirmed the implementation work was genuinely done, just uncommitted) rather than waiting indefinitely, then completing verification and the commit personally. No work was lost or needed redoing, but this is a new, previously-undocumented failure mode for dispatched agents in this pipeline (distinct from the already-documented "agent falsely believes IT will be notified" pattern — here the agent correctly understood it wouldn't act again until notified, it just had no way to ever receive that notification). Tag as a `/improve` candidate: `/subagent-execution`'s own dispatch instructions could explicitly forbid a dispatched implementer from launching its own background/detached processes, requiring all commands (including long-running ones like the full test suite) to run in the foreground within that single dispatch turn.
2. **This session's CI hit the same `deploy-group` concurrency-collision flake on 3 consecutive PRs** (`wugs-s3`, `wugs-s4`, `wugs-s8`) — root cause identified precisely: `/branch-complete`'s own sequence (push the feature branch, open the PR, then separately commit+push the branch-complete artefact once the real PR URL is known) structurally requires two pushes close together, and each push independently requests the same `deploy-group` slot the E2E workflow's `Scenario A`/`Scenario B` jobs also compete for. Confirmed via `gh api .../jobs` job conclusions (`cancelled`, not `failure`) each time, and a same-branch, ~20-30-second-apart second E2E trigger each time. Not a code defect in any of the three stories — re-running once after confirming the "cancelled" signature passed cleanly every time. Tag as a `/improve` candidate: the branch-complete artefact write is a good candidate to be a single bundled commit if a way can be found to know the PR URL before the code push (e.g. `gh pr create` supports creating from an unpushed ref in some flows) — otherwise, proactively re-running failed E2E checks immediately after every `/branch-complete` (rather than waiting for the operator to notice and report it, as happened for `wugs-s4`'s PR) should become a standard step in the skill's own instructions.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Request a product-level guardrail/standard be promoted to org level.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row correctly explain why full measurement isn't possible yet (dependency on wugs-s9), rather than just saying "TBD"?
4. Is the CHECK constraint enum (approved/rejected values, not yet used) correctly distinguished from scope creep?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```
