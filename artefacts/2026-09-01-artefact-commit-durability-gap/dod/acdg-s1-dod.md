# Definition of Done: acdg-s1 — Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard)

**PR:** https://github.com/heymishy/skills-repo/pull/813 | **Merged:** 2026-09-02
**Story:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s1.md
**Test plan:** artefacts/2026-09-01-artefact-commit-durability-gap/test-plans/acdg-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-01-artefact-commit-durability-gap/dor/acdg-s1-dor.md (Revision 2)
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## AC Coverage

AC1 (regression-protection), AC2-revised (the fix), AC3-revised (regression-protection), AC4 (traceability) — see `stories/acdg-s1.md` for full text. AC2/AC2a were superseded during `/branch-setup`'s own investigation before any code was written; see `decisions.md` for the full trail.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Confirmed already-correct on unmodified code — test passed before any change, exactly as predicted in the story's own TDD note | `tests/check-acdg-s1-commit-guard.js` | None |
| AC2-revised | ✅ | Test failed on unmodified code, passes after the fix — the real bug, empirically reproduced and resolved, not inferred | `tests/check-acdg-s1-commit-guard.js`, full local suite (593 files), CI's assurance gate + traceability validation | None |
| AC3-revised | ✅ | Confirmed already-correct on unmodified code — regression-protected against this story's own change | `tests/check-acdg-s1-commit-guard.js` | None |
| AC4 | ✅ | Directly satisfied by AC2-revised's own test — no separate test needed, as scoped at DoR | `tests/check-acdg-s1-commit-guard.js` | None |

---

## Scope Deviations

**This story underwent a full mid-implementation revision, disclosed in detail rather than silently absorbed.** `/branch-setup`'s own DoR-mandated investigation step (reading `export-data-source.js` and `artefact-commit-writer.js` in full for the first time) found the original AC2/AC2a split — written before either file was read — didn't match the real code: `ownerRepoForFeature` never returns falsy without throwing (AC2a was unreachable), and it throws the identical error type for 4 structurally different reasons by design. Work stopped, returned to `/definition`, and was re-scoped with the operator choosing between three concrete options. Further investigation then found the real, precise, low-risk mechanism (`journey.productId`, already a fully-wired field) — smaller and more confident than either originally-presented option. Story ACs, test plan, verification script, and DoR were all revised and re-signed-off before implementation resumed. Full trail in `decisions.md` (3 dated entries for this story alone).

**No scope creep beyond the story's own (revised) boundary:** the fix touches only `journey.js`'s existing catch block — no changes to `export-data-source.js`, `artefact-commit-writer.js`, `journey-store.js`, or `journey-store-pg.js`, exactly as the revised DoR contract specified.

**Process note (disclosed, not hidden):** during the inner loop, several `pipeline-state.json` stage advances (`branch-setup` through `branch-complete`) were briefly applied to the main checkout instead of the `acdg-s1` worktree — a known, documented pitfall in this repo's own CLAUDE.md. Caught before pushing (via a `git status`/`git diff` check on the main checkout), corrected by re-applying the advances inside the worktree and discarding the stray uncommitted change in the main checkout. No incorrect state was ever committed or pushed.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 (test plan Revision 2 speced 3 unit + 2 integration + 1 automated NFR = 6; the security NFR is explicitly manual, not a counted test, per the test plan's own framing)
**Tests passing in CI:** 6/6 local + full local suite (593 files, 1 pre-existing known flake — `check-p3.5-validate-trace.js`, confirmed unrelated) + sibling regression (`das-s1`'s own 11 tests, `ep1-s1`–`ep1-s6`'s own 63 tests, all re-run unmodified) + CI's assurance gate, traceability validation, watermark gate, cross-tenant isolation, lint/typecheck/test/build, Playwright smoke, and both staging E2E scenarios — all passing (one transient concurrency-group cancellation on Scenario A, unrelated to this PR's content, resolved by re-running the job)

| Test area | Implemented | Passing | Notes |
|-----------|-------------|---------|-------|
| AC1 — commitArtefact throw after successful resolve | ✅ | ✅ | Passed on unmodified code (regression-protection) |
| AC2-revised — productId set, resolution fails | ✅ | ✅ | Failed on unmodified code, passes after the fix — the real bug |
| AC3-revised — productId unset, resolution fails | ✅ | ✅ | Passed on unmodified code (regression-protection) |
| Integration — linked feature never gains completedStages entry | ✅ | ✅ | |
| Integration — unlinked feature gains completedStages entry unchanged | ✅ | ✅ | |
| NFR — no wasted commitArtefact call when resolution already failed | ✅ | ✅ | |
| NFR — security (no new credential/content exposure) | Manual | ✅ | Verified by code-review diff of this PR against `journey.js`'s existing `req.session.accessToken` usage — no new parameter or content added to any error message |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No meaningful latency increase | ✅ | Fix adds one `if` check inside an already-synchronous catch block — no new I/O, no new round-trip; NFR test confirms `commitArtefact` is never wastefully invoked when resolution already failed |
| No new credential handling | ✅ | Diff touches only the existing catch block's control flow; `req.session.accessToken` usage unchanged |
| AC4's original (now AC3-revised's) skip-silently behaviour preserved for genuinely-unlinked features | ✅ | Dedicated regression test, passing unchanged |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — AC2 Guard Correctness | ✅ (mechanism now shipped) | Not yet measured in production — signal is the regression test suite itself (100% of the 3 outcome paths now tested and passing); production confirmation requires a real stage completion for a linked feature whose resolution genuinely fails, which is rare by design | Signal: not-yet-measured for production occurrence, but the DoD-level target (100% of paths tested) is met |

Metrics 2 and 3 (Distinguishable Signal Coverage, Manual-Audit Elimination) are `acdg-s2`'s own responsibility — not addressed by this story.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Continue to `acdg-s2` — the durability signal, now unblocked with `acdg-s1`'s confirmed failure mode (`ExportNotFoundError` from a `journeys`-table lookup miss) known for its `reason` field content.
2. Once `acdg-s2` ships, run `/metric-review` (or equivalent) once real production traffic exercises a linked-feature resolution failure, to move Metric 1 off its DoD-only signal.
3. Consider whether the underlying `journeys`-table/`journeyStore` sync gap (why `new-feature-af17f555`'s row was missing or stale despite continuous product linkage) warrants its own dedicated investigation — this story fixed the *symptom* (silent swallow) with high confidence, not the *original* data-sync cause, which remains only circumstantially understood (see `decisions.md`).

---

## DoD Observations

1. This story is a strong example of the "investigate before implementing" discipline paying off twice in one pass: the DoR-mandated investigation step first invalidated the original AC split (avoiding shipping tests for an unreachable code path and an indistinguishable-by-design error type), then a second round of investigation found a smaller, higher-confidence fix than either option presented to the operator assumed would be needed. Both findings were disclosed transparently in `decisions.md` rather than silently absorbed into "just fixed it."
2. The worktree-misdirection incident (state advances briefly landing in the main checkout) is exactly the failure mode CLAUDE.md's own guidance describes and warns to check for — it recurred here despite that documented warning, caught only by the same `git status`/`git diff` discipline the guidance recommends. Worth noting as a live confirmation that the warning is not hypothetical.
3. Same `/improve` feedback candidate as several stories in the just-shipped `new-feature-af17f555` epic: a story's own AC split can be invalidated by reading code that wasn't read at story-writing time — this is now a recurring pattern worth considering for `/definition`'s own process (e.g. requiring a quick read of any adapter/module an AC references, before the AC is finalized, not just before implementation).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for acdg-s1 — Fix the Silent
Artefact-Commit Failure in Stage-Completion (AC2 Guard).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the mid-implementation story revision (AC2/AC2a superseded, then a further simplification) disclosed clearly enough for a future reader to understand why the story's own git history looks like two rewrites?
3. Does the metric signal row correctly distinguish "the DoD-level target is met" from "production has actually observed this case"?
4. Is the worktree-misdirection process note appropriately disclosed as a caught-and-corrected process deviation, not silently omitted?
5. Is the outcome verdict (COMPLETE) correct given zero disclosed AC gaps?
6. Should the deferred journeys-table sync investigation (Follow-up action 3) become its own discovery, or is the current disclosure sufficient?
Report findings as HIGH / MEDIUM / LOW.
```
