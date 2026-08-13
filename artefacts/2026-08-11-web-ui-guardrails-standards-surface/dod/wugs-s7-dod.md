# Definition of Done: Surface pending/merged PR state in the guardrails/standards view

**PR:** https://github.com/heymishy/skills-repo/pull/728 | **Merged:** 2026-08-13
**Merge commit:** 9da4b358
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s7-surface-pr-state-in-view.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s7-surface-pr-state-in-view-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s7-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: handleGetGuardrailsView_pendingPr_showsIndicatorAndLink` asserts the "Pending review" text indicator and the real PR URL both appear | automated test (`tests/check-wugs-s7-surface-pr-state-in-view.js`) | None |
| AC2 | ✅ | `AC2: handleGetGuardrailsView_mergedPr_clearsIndicatorShowsNewContent` asserts no pending text, the new merged content shown via the normal live-read path, and the tracking row cleared | automated test | None |
| AC3 | ✅ | `AC3: handleGetGuardrailsView_closedPr_revertsCleanly` asserts no pending text, the original pre-edit content shown, and the tracking row cleared — no orphaned pending state | automated test | None |
| AC4 | ✅ | `AC4: handleGetGuardrailsView_multiplePendingPrs_eachShowsOwnCorrectState` — two tracked PRs with different live outcomes (one open, one merged), asserts each resolves independently and only the merged one is cleared | automated test | None |

All 8 tests re-run fresh against merged `master` (post-merge, not just pre-merge CI) on 2026-08-13: `8 passed, 0 failed`. Sibling stories `wugs-s3` (12/12), `wugs-s2` (11/11), `wugs-s5` (13/13), `wugs-s6` (18/18) re-confirmed unaffected.

**No deviations on the 4 ACs themselves.**

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None shipped beyond the story's stated scope. Confirmed via diff review of the merged PR: no websocket/real-time push updates when a PR merges (Out of Scope item), no PR-merge notifications (Out of Scope item).

One addition beyond the original 5-task plan, found during code-quality review rounds and shipped in the same PR before merge: `_trackPendingPr`'s call in `server.js`'s write-adapter closure is wrapped in its own try/catch so a transient tracking-insert failure (after a real GitHub PR has already opened successfully) never masks a successful write or risks a duplicate PR on user retry. Similarly, `_resolveAllPendingPrs`'s per-row `checkPrStatus` call is wrapped in its own try/catch so one row's live-status-check failure can't crash the whole guardrails/standards view — the other rows still resolve correctly. Both fixes mirror this feature's established pattern of isolating failures at the smallest reasonable boundary (`_fetchGuardrailsSectionPiece`'s existing per-piece isolation from `wugs-s2`).

**Merge-conflict note (not a scope deviation, a delivery-mechanics event):** this story's worktree branched from master before `wugs-s3` (org-level view, merged first) landed. When `wugs-s7`'s PR was ready to merge, a real content conflict existed in `products.js`/`server.js` — both stories independently modified `_renderGuardrailsSection`, `handleGetProductGuardrailsView`, and the `server.js` products import/wiring. Resolved by hand-merging both stories' logic together (not auto-resolving blindly): `wugs-s3`'s `_renderPieceContent` DRY refactor was combined with `wugs-s7`'s `pendingByPath`/badge logic in `_renderGuardrailsSection`; `pendingByPath` resolution was combined with `orgRow`/`orgSectionHtml` resolution in `handleGetProductGuardrailsView`; both stories' `module.exports` entries and `server.js` destructured imports were combined. Verified via a conflict-marker scan (D40) before staging, then both stories' full test suites plus the complete `npm test` suite (512 files, 33 pre-existing baseline failures, 0 new) before pushing the resolved merge commit.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (plan baseline) + 1 NFR, plus 3 additional tests added during review rounds
**Tests passing in CI:** 8 / 8

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Tracking-row creation on write | ✅ | ✅ | 2 tests (INSERT assertion + wiring test) — infrastructure task, not a numbered AC but required for AC1-AC4 to have anything to resolve |
| AC1: pending indicator + link | ✅ | ✅ | 1 test |
| Error isolation (review addition) | ✅ | ✅ | 1 test — one row's status-check failure doesn't crash the view or prevent other rows from resolving |
| AC2: merged clears indicator, shows new content | ✅ | ✅ | 1 test, lock-in (passed on first try against Task 2's implementation) |
| AC3: closed-without-merge reverts cleanly | ✅ | ✅ | 1 test, lock-in |
| AC4: multiple independent pending PRs | ✅ | ✅ | 1 test, lock-in |
| NFR-A11Y: text label, not colour alone | ✅ | ✅ | 1 test |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — one additional GitHub API call per pending PR, sequential, accepted MVP tradeoff | ✅ (as scoped) | `_resolveAllPendingPrs` checks sequentially; confirmed in final review this matches the story's own explicitly accepted tradeoff, no premature optimization added |
| Security — none new beyond `wugs-s6`'s existing token handling | ✅ | `checkPrStatus` reuses `_ghRequest`'s existing token-passing pattern from the same adapter file; no new session fields or endpoints |
| Accessibility — state conveyed via text, not colour alone (MC-A11Y-02) | ✅ | `_renderPendingPrBadge` renders a real "Pending review — PR #N" text string; `NFR-A11Y` test asserts this directly |
| Audit — none new, read-only status check | ✅ (N/A) | Confirmed no new audit-logging code added — matches the story's own stated NFR |

---

## Metric Signal

**Measurement-ready gate:** Is measurement possible yet for this story? **Yes, as of this story's merge.**

`m1` ("Guardrail/standard visibility in the web UI") — this story completes the round-trip the epic promises: a tech lead can now add/edit AND see the outcome (pending → merged/closed) without leaving the platform.

> **Guardrail/standard visibility in the web UI**
> Signal: not-yet-measured
> Evidence note: the full write → track → live-status-resolve → indicator round-trip is now code-complete, but requires a real tenant to actually submit a guardrail/standard edit through wugs-s6's write path for the first real signal to appear.
> Date measured: null

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Guardrail/standard visibility in the web UI | ✅ (0%) | After a real tenant submits an edit and revisits the view while the PR is pending/after it resolves | Epic 2's write-and-track round-trip is now fully code-complete |

---

## Outcome

**COMPLETE**

No deviations, no follow-up actions outstanding. All 4 ACs and the accessibility NFR are covered by differentiating tests, both review-driven isolation fixes are confirmed present post-merge, and the merge-conflict resolution with `wugs-s3` was verified via both stories' full test suites plus the complete suite before this PR was allowed to merge.

---

## DoD Observations

1. **Two stories in the same feature (`wugs-s3`, `wugs-s7`) modifying the same shared render pipeline concurrently produced a real, expected merge conflict** when their PRs landed close together — not a process failure, but worth flagging explicitly: `wugs-s7`'s worktree branched from master before `wugs-s3` merged (per its own DoR, `wugs-s7` only depends on `wugs-s6`, not `wugs-s3` — the two stories were correctly implemented independently and in parallel). Resolving this required understanding both stories' full intent well enough to combine their logic correctly, not just mechanically pick one side. Tag as a `/improve` candidate: when two stories in the same feature are both known to touch the same named functions (visible from either story's Architecture Constraints or File Map sections in their implementation plans), the operator could be warned at `/implementation-plan` time that a merge conflict is likely regardless of implementation order, so it's anticipated rather than discovered at merge time.
2. **A dispatched implementer subagent hit an API/session-limit error mid-task during Task 2** and terminated with partial, uncommitted work. Recovered correctly by checking the worktree's actual `git status`/`git diff` state directly (not the agent's own truncated self-report) before dispatching a fresh agent to finish only the remaining part — no rework was needed, no work was lost. Confirms the "verify actual state, not the agent's self-report" discipline (already documented in `CLAUDE.md` for completed-and-self-reported agents) extends equally to agents that terminate abnormally mid-task, not just ones that report done.
3. **A PR's E2E checks (`Scenario A`/`Scenario B`) failed on first CI run for a reason unrelated to the code change** — a documented concurrency-collision pattern in this repo's own `e2e.yml` workflow (`deploy-group` concurrency lock, exacerbated by many rapid master pushes during this session's own bookkeeping commits). Confirmed via the workflow's own inline comments (`cif-s1`/`cif-s2`) that this is a known, previously-diagnosed flake class, not a new one — re-running the failed jobs in isolation passed cleanly on the same commit, consistent with that precedent. Not a `/improve` candidate (already documented and understood); noted here as evidence the existing diagnosis holds.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Surface pending/merged PR state in the guardrails/standards view.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Is the merge-conflict resolution with wugs-s3 described specifically enough to audit (not just "resolved conflicts")?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```
