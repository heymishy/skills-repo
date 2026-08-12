# Definition of Done: Build the branch + PR creation adapter for guardrail/standard edits

**PR:** https://github.com/heymishy/skills-repo/pull/726 | **Merged:** 2026-08-12
**Merge commit:** 2aaa8fa7
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s6-branch-pr-creation-adapter.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s6-branch-pr-creation-adapter-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s6-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: createGuardrailPr_newFile_createsBranchCommitsAndOpensPr` passes; asserts exactly 5 sequential calls, no `sha` in the PUT payload for a new file, and the commit lands on the new branch (not default/main) | automated test (`tests/check-wugs-s6-branch-pr-creation-adapter.js`) | None |
| AC2 | ✅ | `AC2: createGuardrailPr_existingFile_usesShaForUpdate`, `AC2: createGuardrailPr_staleSha_throwsConflictError`, `AC2: createGuardrailPr_nonConflictPutFailure_throwsGenericErrorNotConflict` pass | automated test | None |
| AC3 | ✅ | `AC3: createGuardrailPr_success_returnsPrNumberAndUrl` asserts the real mocked PR number/URL are returned, not a placeholder | automated test | None |
| AC4 | ✅ | 4 tests, one per failure step: `branchShaFails`, `createRefFails`, `fileCommitFails`, `prCreationFails` — each asserts the `GuardrailPrError.step` names the correct failing step | automated test | None |
| AC5 | ✅ | `AC5: guardrailPrAdapter_unwired_throwsExplicitError` asserts the exact D37 "not wired" error message from the real, unwired default | automated test | None |
| AC6 | ✅ | `AC6: realWiring_twoDifferentContentChanges_produceTwoDifferentCorrectPrs` — calls the real handler twice through a mocked GitHub API, asserts two distinct PR titles each referencing the correct submission's real path (differentiating-outcome assertion per D37 requirement 4, not just "a setter was called") | automated test | None |

All 18 tests re-run fresh against merged `master` (post-merge, not just pre-merge CI) on 2026-08-13: `18 passed, 0 failed`. Sibling stories `wugs-s5` (13/13) and `wugs-s2` (11/11) re-confirmed unaffected. Full suite (`npm test`): 510 files run, 33 pre-existing baseline failures (unchanged), 0 new.

**No deviations on the 6 ACs themselves.** See the Outcome section below for a process deviation (skipped pre-merge manual step) that is not an AC deviation but is recorded per this repo's "record every deviation, even a process one" convention.

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None shipped beyond the story's stated scope. Confirmed via diff review of the merged PR: PR merging itself was not automated (Out of Scope item, correctly left to the tenant's own review process), no PR-conflict auto-resolution logic added (Out of Scope item), no retry/backoff logic added (Out of Scope item — single-attempt-with-clear-error as specified).

One addition beyond the original 7-task plan, found during a code-quality review round and shipped in the same PR before merge: server-side hardening on `handlePostGuardrailsForm` (`src/web-ui/routes/products.js`) — a CSRF guard, a tenant-scoped 404 guard (preventing cross-tenant PR creation), and a path allowlist restricting writes to `.github/architecture-guardrails.md` or `standards/`. This was scoped as a review-driven fix to the AC6 wiring task (Task 7), not new out-of-plan feature work — the wiring task's own AC6 requires the real POST route to be production-safe, and these three gaps were genuine security holes in that route as originally wired (any authenticated user of any tenant could otherwise submit against another tenant's repo, or write to an arbitrary path in the repo). Covered by 4 additional `AC6` test cases beyond the plan's original single wiring test.

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12 (plan baseline), plus 6 additional tests added during review rounds
**Tests passing in CI:** 18 / 18

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC5: unwired adapter throws | ✅ | ✅ | 1 test |
| AC1: new file — branch, commit, PR | ✅ | ✅ | 1 test |
| AC2: existing file SHA update + conflict | ✅ | ✅ | 3 tests (2 in plan + 1 added in review: non-conflict PUT failure must throw a generic error, not misclassify as a conflict) |
| AC3: success returns PR number/URL | ✅ | ✅ | 1 test |
| AC4: per-step failure naming | ✅ | ✅ | 4 tests, one per step |
| NFR-SEC: token never logged | ✅ | ✅ | 1 test |
| NFR-AUDIT: PostHog capture on success | ✅ | ✅ | 2 tests (1 in plan + 1 added in review: audit event must never fire before success, i.e. on a failed PR creation) |
| AC6: real wiring, differentiating outcome | ✅ | ✅ | 4 tests (1 in plan + 3 added in review: tenant-mismatch rejection, CSRF-token rejection, path-allowlist rejection, and conflict-error 409 response shape) |

**Gaps (tests not implemented):** None automatable. See Outcome — one manual (non-automatable) verification step was required by the DoR and not performed before merge.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no hard target, GitHub API multi-call latency accepted | ✅ (as scoped) | No performance regression test required by the story; matches the story's own stated NFR |
| Security — operator's own session token used, never a broader service-account token | ✅ | `createGuardrailPr(req.session.accessToken, ...)` in the `server.js` wiring; `NFR-SEC: createGuardrailPr_run_neverLogsToken` confirms the raw token never appears in any `console.log`/`console.error` output |
| Accessibility — not applicable (no UI in this story) | ✅ (N/A) | Confirmed — this story is adapter/wiring only |
| Audit — PR creation audit-logged via PostHog | ✅ | `NFR-AUDIT: createGuardrailPr_success_capturesPostHogEvent` confirms `guardrail_pr_opened` fires with `tenant_id`/`product_id`/`repo`/`pr_number`; `NFR-AUDIT: createGuardrailPr_prCreationFails_neverCapturesEvent` (review addition) confirms it never fires before success |

---

## Metric Signal

**Measurement-ready gate:** Is measurement possible yet for this story? **Yes, as of this story's merge.**

`m1` ("Guardrail/standard visibility in the web UI") and the promotion-approval-workflow metric — this story is the actual write mechanism both metrics depend on. With `wugs-s5`'s form (merged) and this adapter (now merged and wired), a tenant can, for the first time, submit a real edit and have it land as a real PR against their connected repo.

> **Guardrail/standard visibility in the web UI**
> Signal: not-yet-measured
> Evidence note: the write path is now technically live end-to-end (form → validation → adapter → real GitHub PR), but no real tenant submission has occurred yet as of this DoD. First real signal requires either a real tenant use, or the manual sandbox verification below being run and recorded — whichever happens first establishes the first non-synthetic evidence that the full path works against the real GitHub API, not just mocks.
> Date measured: null

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Guardrail/standard visibility in the web UI | ✅ (0%) | After a real tenant successfully submits an edit, or after `wugs-s7` ships and surfaces PR state in the UI | Write path is code-complete; first real signal still pending |
| Product-to-org promotion-approval workflow usage | ✅ (0%) | After Epic 3's promotion flow (reuses this adapter) ships | Not independently measurable from this story alone |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Deviation:** The DoR's own REQUIRED pre-merge step — a real manual test against a disposable sandbox GitHub repo confirming the branch-ref/Contents/Pulls API response shapes match what the tests mock (CLAUDE.md's mock-shape-verification rule, `tir-s5` precedent) — was not performed before PR #726 merged. The PR description's checklist item for this step remained unchecked and no outcome was ever recorded. This is a process deviation, not an AC deviation: all 6 ACs and both NFRs are fully covered by automated tests exercising a hand-authored mock of the GitHub API, but `realCreateGuardrailPr` has never actually been exercised against the real GitHub API. Logged as a RISK-ACCEPT in `decisions.md` (2026-08-13 entry) immediately on discovery, once the operator confirmed the step had not been run.

**Follow-up actions:**
1. **Not yet done as of this DoD — operator action:** run the manual sandbox verification. Runnable procedure at `artefacts/2026-08-11-web-ui-guardrails-standards-surface/reference/wugs-s6-manual-verification.md` (script: `wugs-s6-manual-verification.js` in the same directory). Record the outcome in `decisions.md`'s RISK-ACCEPT entry and in a comment on PR #726 (a placeholder comment flagging the gap has already been posted: https://github.com/heymishy/skills-repo/pull/726#issuecomment-5271972819).
2. If the manual verification finds a real API shape mismatch: treat it as a live production bug in `src/web-ui/adapters/guardrail-pr-adapter.js`, filed as a short-track story — not a silent hotfix.

---

## DoD Observations

1. **A background subagent completed all 7 implementation tasks unattended past the session's last checkpoint write**, and a full round of code-quality-review-driven security hardening (CSRF, tenant-scope, path-allowlist, conflict handling) was also completed and sitting correctly in the worktree — but none of it had been committed, pushed, or turned into a PR when the next session resumed. The prior checkpoint's `state.json` record (3 of 7 tasks) significantly undersold actual progress. Resuming correctly required two independent checks the checkpoint alone could not substitute for: (a) reading the implementation plan's actual task list against `git log --oneline` in the worktree, and (b) separately checking `git status` for uncommitted work. Both were needed — checking only one would have missed either the completed-but-unrecorded tasks or the completed-but-uncommitted review fixes. Tag as a `/improve` candidate: `/checkpoint`'s resume path (or `/branch-setup`'s resume instructions) should explicitly instruct the next session to re-derive actual task state from `git log` + `git status` rather than trusting the checkpoint's own task-count as ground truth, since a background agent can legitimately outrun the last checkpoint write.
2. **The DoR's own REQUIRED pre-merge manual step was not enforced anywhere mechanical** — nothing blocked the PR from merging without it; the only trace of the requirement was a markdown checkbox in the PR description, easy to overlook once the automated test suite was green. Tag as a `/improve` candidate: consider whether `branch-complete`'s gate validation (`validateBranchComplete` in `src/enforcement/cli-outer-loop.js`) should be extended to check for a DoR-flagged "required manual step" marker and require an explicit acknowledgment field in the branch-complete artefact (e.g. `manualVerificationRequired: true` + `manualVerificationRecorded: <url-or-null>`) before the gate can pass, rather than relying entirely on human diligence reading an unchecked markdown box.
3. This story's `pipeline-state.json` update needed a direct JSON edit for one field (`tasks[6].tddState`) because `skills advance`'s dot-notation only supports single-level `parent.child` paths, not array indexing. Confirmed via `node scripts/check-pipeline-state-integrity.js` that no new integrity failures were introduced (the 14 pre-existing failures found are unrelated to this feature). Not a new gap — `cdg.6`'s documented exceptions already anticipate cases the harness doesn't cover — but worth noting as a recurring friction point if nested-array task-state updates keep coming up across stories.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Build the branch + PR creation adapter for guardrail/standard edits.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Is the skipped manual sandbox-verification step (Outcome section) clearly flagged as still outstanding, not silently treated as resolved?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```
