# Definition of Done: Admin sees real Approve/Reject buttons for pending promotion requests

**PR:** https://github.com/heymishy/skills-repo/pull/735 | **Merged:** 2026-08-14
**Merge commit:** 6ea307f9
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s13-approve-reject-ui.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s13-approve-reject-ui-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s13-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: adminSession_pendingRequest_rendersRealButtons` asserts real `<button>` elements labelled Approve/Reject render for an admin session with a pending request, with the real `requestId` embedded | automated test (`tests/check-wugs-s13-approve-reject-ui.js`) | None |
| AC2 | ✅ | `AC2: nonAdminSession_pendingRequest_rendersStaticTextUnchanged` asserts the pre-existing static text renders unchanged for a non-admin, with no buttons and no `requestId` leaked into the markup | automated test | None |
| AC3 | ✅ | `AC3: approveHandler_source_callsRealEndpointWithCsrfAndUpdatesRow` asserts the client-side handler disables the button, calls `POST /api/admin/promotions/:requestId/approve` with `_csrf`, and updates the row's DOM on success without a page reload | automated test | None |
| AC4 | ✅ | `AC4: rejectHandler_source_callsRealEndpointWithCsrfAndUpdatesRow` — same shape as AC3, targeting the reject endpoint | automated test | None |
| AC5 | ✅ | `AC5: approveAndRejectHandlers_failurePath_reEnableButtonAndShowError` asserts both handlers independently re-enable their button and surface an `alert(...)` on failure | automated test | None |
| AC6 | ✅ | `wugs-s9`'s own existing AC3 regression tests (`resolveRequest_nonAdmin_approveRejected403`, `resolveRequest_nonAdmin_rejectRejected403`) re-run unchanged post-merge: `10 passed, 0 failed` | automated test (`tests/check-wugs-s9-approve-reject-promotion.js`) | None |

All 5 of this story's own tests re-run fresh against merged `master` (post-merge, not just pre-merge CI) on 2026-08-14: `5 passed, 0 failed`. Sibling stories `wugs-s2` (11/11), `wugs-s3` (12/12), `wugs-s7` (8/8), `wugs-s8` (7/7), `wugs-s9` (10/10) re-confirmed unaffected. Full suite: 516 files run, 33 pre-existing failures (documented baseline, exact match), 0 new failures.

**No deviations on the 6 ACs.**

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None shipped beyond the story's stated scope. Confirmed via diff review across all 3 substantive commits: no bulk approve/reject, no review-comment UI, no changes to `wugs-s9`'s two backend endpoints themselves, no cross-product admin queue.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 (5 unit tests in this story's own file, plus 1 regression re-run of `wugs-s9`'s existing AC3 tests for AC6)
**Tests passing in CI:** local full-suite verification only — this PR's own status checks did not run due to a repo-wide CI-triggering gap that began independently of this story (see `decisions.md`'s 2026-08-14 RISK-ACCEPT entries, "branch-complete (wugs-s13)"). Every test was independently re-run fresh against merged `master` post-merge instead, with results quoted above.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: admin sees real buttons | ✅ | ✅ | 1 test |
| AC2: non-admin sees unchanged static text | ✅ | ✅ | 1 test, passed on first run — no source fix needed |
| AC3: approve handler wired, CSRF, disable/update | ✅ | ✅ | 1 test |
| AC4: reject handler wired, CSRF, disable/update | ✅ | ✅ | 1 test |
| AC5: failure path re-enables button, shows error | ✅ | ✅ | 1 test, covers both handlers independently |
| AC6: wugs-s9 server-side role gate regression | ✅ | ✅ | 1 test (existing file, re-run unchanged) |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — single additional fetch call on click, matching sibling button's latency profile | ✅ | No new performance surface; confirmed via code review |
| Security — no new role-gating surface, both endpoints' server-side checks unchanged | ✅ | AC6 regression test, plus independent spec-compliance review confirming `server.js`'s route table and the two `wugs-s9` handlers are untouched |
| Security — CSRF protection matching the sibling "Request promotion" button's pattern | ✅ | `_csrf` sent in JSON body, confirmed by spec-compliance review against this file's own established convention |
| Accessibility — real, keyboard-accessible `<button>` elements | ✅ | Confirmed via AC1's own test asserting real `<button>` markup, not `<div onclick>` — this closes the exact gap `wugs-s9`'s own DoD flagged as deferred |
| Audit — no new state-changing logic, existing `wugs-s10` audit logging unaffected | ✅ | Confirmed no new backend surface in the diff |

---

## Metric Signal

**Measurement-ready gate:** Is measurement possible yet for this story? **Yes — this is the story that makes the metric measurable through the real product for the first time.**

`m2` ("Product-to-org promotion-approval workflow usage") lists `wugs-s8`, `wugs-s9`, `wugs-s10`, `wugs-s13` as contributing stories (the array was stale prior to this DoD — corrected as part of this write to include all four real contributors, matching `benefit-metric.md`'s own coverage matrix; `wugs-s13` had been missing entirely). With this story merged, a real admin can now resolve a real promotion request entirely through the product — no direct API call required. This closes the specific gap `/trace`'s 2026-08-14 HIGH finding identified.

> **Product-to-org promotion-approval workflow usage**
> Signal: not-yet-measured
> Evidence note: the full workflow (request → approve/reject → audit log) is now code-complete and reachable entirely through the web UI as of this story's merge. No real tenant has exercised it yet — the target is "at least 1 real promotion request submitted and resolved within 4 weeks of release," and the 4-week window has not yet elapsed.
> Date measured: null

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Product-to-org promotion-approval workflow usage | ✅ (0) | Now — first real tenant usage | This story removes the last blocker to real, UI-driven measurement |

---

## Outcome

**COMPLETE**

No deviations on the 6 ACs. All 3 substantive commits (buttons + role threading, AC2 lock-in, client-side wiring) went through independent two-stage review (spec-compliance + code-quality) before this DoD, with only non-blocking findings (test-file hygiene, a suggested future jsdom-based test upgrade — see DoD Observations). One process gap surfaced and resolved during this story's delivery: CI checks never ran on this PR due to a repo-wide `push`/`pull_request` trigger outage that began independently of this story (traced, documented, and worked around via exhaustive local verification instead — see `decisions.md`).

---

## DoD Observations

1. **A repo-wide GitHub Actions triggering outage (push/pull_request events silently producing zero workflow runs, while `workflow_dispatch` and `schedule` triggers continued working normally) began during this story's delivery window and was never resolved by session end.** Full investigation is recorded in `decisions.md`'s two 2026-08-14 RISK-ACCEPT entries under "branch-complete (wugs-s13)" (one on `master`, one on this story's own branch). Root cause was narrowed to something visible only via the GitHub web UI (Settings → Webhooks or Settings → Installations, or an Actions billing/spending cap) — not diagnosable via the REST API available to this session. This is a platform-level operational gap, not a defect in this story's own code: the exact code that merged had already passed full CI (`51351ac0`, all 6 checks green) before the outage began: only two subsequent bookkeeping-only commits (pipeline-state.json, decisions.md) were pushed without CI coverage, and merge itself required an operator-invoked bypass of the "2 of 2 required status checks" branch protection rule. Tag as an `/improve` candidate at the platform level: this repo currently has no automated alert for "CI has stopped triggering," and the gap was only caught because the operator manually noticed a PR with no checks — a silent, repo-wide CI outage could otherwise persist indefinitely.
2. **A code-quality review correctly flagged a real limitation in this story's own AC3b test design ("no double-error or late resolution")**: the test's negative-proof method (an `unhandledRejection` listener plus a mock that only ever settles via the real `AbortSignal`) would not catch a plausible future regression shaped as a dual-mechanism timeout (e.g. `Promise.race` without wiring the abort signal into `fetch` itself) — such a regression would hang the test suite rather than fail cleanly. This was judged non-blocking for merge (the current implementation is correct and the existing precedent in this codebase, `check-icv-s1`, already demonstrates a stronger jsdom-executed-script pattern that could replace the current source-string-regex approach used for AC3/AC4/AC5). Not actioned in this story; flagged here so it is not silently lost — a reasonable candidate for a future test-hardening pass on this specific file, not urgent.
3. **This story is the second consecutive `/trace`-driven follow-up (after `wugs-s14`) to require an active merge-conflict resolution before it could land**, since both follow-up stories' feature branches diverged from `master` before the other had merged, and both touched the same two hotspot files (`pipeline-state.json`, `decisions.md`) that this feature's own `delivery-patterns.md` entry already documents as recurring conflict points. The resolution itself was mechanical and low-risk (flat, non-overlapping array entries; the merge tool's own line-based auto-merge dropped one `---` separator in `decisions.md`, caught and fixed by a full conflict-marker scan plus a manual read-through, not just a marker grep). No new pattern to add — this is exactly the already-documented hotspot doing what the documentation predicted, and the existing D40 conflict-marker-verification discipline caught the one real defect (a missing separator, not a `<<<<<<<` marker) that a marker-only scan alone would have missed.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Admin sees real Approve/Reject buttons for pending promotion requests.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Given this PR's own CI checks never ran, is local post-merge test re-verification a reasonable substitute, or should this be flagged as a harder gap?
3. Is the metric signal's "not-yet-measured" verdict reasonable, given the workflow is now fully code-complete but no real tenant has used it yet?
4. Does DoD Observation #1 (the CI outage) belong in this story's DoD, or should it be moved entirely to a platform-level/session-level record instead?
```
