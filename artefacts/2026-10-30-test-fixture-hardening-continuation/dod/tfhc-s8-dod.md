# Definition of Done: Stub the real git-commit adapter in the 13 remaining skill-turn test files

**PR:** https://github.com/heymishy/skills-repo/pull/1047 | **Merged:** 2026-10-31
**Story:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s8-skill-turn-git-commit-adapter-stubbing.md
**Test plan:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s8-skill-turn-git-commit-adapter-stubbing-test-plan.md
**DoR artefact:** artefacts/2026-10-30-test-fixture-hardening-continuation/dor/tfhc-s8-dor.md
**Assessed by:** Copilot
**Date:** 2026-10-31

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | All 13 named files call `setSkillTurnGitCommitAdapter` positioned before every artefact-completing test — re-spot-checked fresh on merged master (`check-dcuf-s1-github-commit-real-completion-point.js`'s 4 sites, `check-wsap-s1-story-scoped-artefact-paths.js`'s 1 site) | integration-real-code | None |
| AC2 | ✅ | `node scripts/check-skill-turn-git-commit-stubbing.js` → `PASS: 0 unstubbed files found`, re-run fresh on merged master | integration-real-code | None |
| AC3 | ✅ | Full suite re-run fresh on merged master: 816 files, 2 failures — both pre-existing and unrelated (see Scope Deviations / DoD Observations below for detail), no new or different failure | integration-real-code | None |
| AC4 | ✅ | `workspace/learnings.md`'s closure note re-confirmed present fresh on merged master, citing `tfhc-s8` and the `tfhc-s8-review-1.md` finding 1-M1 artefact | integration-real-code | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

No deviations found on re-verification.

---

## Scope Deviations

None. The 12 already-safe files, the 15 non-risk files, and `scripts/run-all-tests.js` parallelization implementation itself (explicitly gated on this story, not bundled with it) were all confirmed untouched — `git diff` against the pre-story baseline shows exactly the 15 expected files (1 new script, 13 modified test files, `workspace/learnings.md`), zero `src/` changes.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| New check flags an unstubbed artefact-completing file | ✅ | ✅ | |
| New check passes an already-stubbed file | ✅ | ✅ | |
| `workspace/learnings.md` reflects closure with a cross-reference | ✅ | ✅ | |
| All 13 named files stub the adapter before any artefact-completing turn | ✅ | ✅ | |
| Full suite shows no new failures and no behavioural change to the 13 files' own assertions | ✅ | ✅ | See note below on 2 pre-existing failures |

**Gaps (tests not implemented):** None.

**Note on the full-suite failures (not a gap, recorded for the audit trail):** the fresh post-merge full-suite run on master shows 2 failures — `scripts/check-pipeline-state-integrity.js` (the long-standing, already-RISK-ACCEPTed `[C3]` flag for `tfhc-s1`, unrelated to this story) and `tests/check-p3.5-validate-trace.js` (a local-environment-only failure: `validate-trace.ps1 --ci` flags `artefacts/ep3-s1-e2e-1793351683253/` as an unregistered artefact directory — this is pre-existing test-run byproduct noise in the main checkout, not git-tracked, and not caused by or related to this story's own diff; confirmed via direct inspection, same root cause independently diagnosed earlier in this session during an unrelated performance-benchmark investigation). Neither failure is new or caused by this story.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Test-infrastructure-only change, no runtime behavioural change to measure |
| Security | ✅ | Closes a risk (uncontrolled real `git add`/`git commit` during test runs) rather than introducing one — confirmed by the adapter stub preventing the real `execSync` call path |
| Accessibility | ✅ N/A | No UI |
| Audit | ✅ N/A | No audit-relevant surface |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Parallelization risk resolution, implementation half (m9) | ✅ | 2026-10-31 (now) | Baseline 13/41 unstubbed (corrected from `tfhc-s6`'s originally-named 14 at this story's own `/review`); target 0/41 — now met |

**Measurement-ready gate:** Yes — measurement is possible now.

**Signal:** on-track
**Evidence:** `scripts/check-skill-turn-git-commit-stubbing.js` passes repo-wide with 0 of 41 calling files unstubbed, re-confirmed fresh on merged master — exactly meets the target. This closes the real "skills.js fires a real git commit during tests" junk-commit-contamination bug and is the confirmed precondition for a future, separate `scripts/run-all-tests.js` parallelization story (not implemented here).
**Date measured:** 2026-10-31

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. (Not blocking this story) Scope the `scripts/run-all-tests.js` parallelization implementation itself as a new, separate story, now that this story has confirmed the precondition is closed — per the user's own explicit sequencing decision, this is the next scoping step after both `tfhc-s7` and `tfhc-s8` reach DoD.
2. (Logged, not blocking) The `journeys.js` walking-skeleton's own fast-follow — migrating the remaining 29 hand-rolled files, and `products.js`'s separately-confirmed duplication — remain named fast-follows from `tfhc-s5`'s spike, unrelated to this story.

---

## DoD Observations

1. A genuine detection-logic bug was found and fixed during implementation (Task 1): the structural auditor's naive substring matching was comment-blind, producing a false positive on `check-isc-s1-ideate-success-lens-cycling.js` (which only mentions the handler in comments, never calls it). The implementer correctly stopped and escalated rather than silently adjusting the expected file list — exactly the right response to an unexpected result. A second review round then found and fixed a related robustness gap (the comment-stripper could have stripped `//` inside a string literal, risking a future silent false negative) before merge.
2. During Task 2, the implementer correctly distinguished which of several code blocks within a single file genuinely needed stubbing (by reading the real fixture content and call sites) rather than stubbing every block indiscriminately — independently verified by both spec-compliance and code-quality reviewers, including cross-referencing the real adapter call site in `src/web-ui/routes/skills.js`.
3. The DRY observation from `tfhc-s7` (3 near-identical fixture-usage-check scripts) does not apply to this story — `check-skill-turn-git-commit-stubbing.js` is a repo-wide auditor with a genuinely different shape (scans the whole `tests/` directory rather than taking a single target file as a CLI argument), not a 4th copy of that same pattern.
4. The now-understood CI `deploy-group` concurrency-cancellation pattern recurred on this story's own PR as well (confirmed via GitHub's own job annotation, resolved via `gh run rerun`) — consistent with the already-logged, deferred `/improve` candidate from `workspace/capture-log.md`, not re-logged here.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Stub the real git-commit adapter in the 13 remaining skill-turn test files.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
