# Decision Log: test-fixture-hardening-continuation

**Feature:** Test Fixture Hardening Continuation
**Discovery reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/discovery.md
**Last updated:** 2026-10-30

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

**2026-10-30 | RISK-ACCEPT | /definition-of-ready**
**Decision:** Proceed to the inner coding loop for `tfhc-s1`/`tfhc-s2`/`tfhc-s3`/`tfhc-s4` without a pre-code domain-expert review of the 4 AC verification scripts (DoR Warning W4).
**Alternatives considered:** Pause DoR sign-off until the 4 verification scripts (`artefacts/2026-10-30-test-fixture-hardening-continuation/verification-scripts/`) are read and confirmed correct before coding starts.
**Rationale:** Same precedent as the `test-suite-infra-refactor` epic's identical RISK-ACCEPT (2026-10-29) — solo-operator posture, one entry covers the set rather than four separate ones. The scripts remain available to read at `/verify-completion` or as a post-merge smoke test; nothing about reviewing them pre-code vs. post-code changes what they check.
**Made by:** Hamish King, Platform Owner
**Revisit trigger:** If a `/verify-completion` run finds a verification scenario doesn't actually match the real behaviour (a sign the pre-code review would have caught something), revert to requiring pre-code review for future stories in this repo.

---

**2026-10-30 | RISK-ACCEPT | /branch-setup (tfhc-s1)**
**Decision:** Proceed with the `tfhc-s1` worktree despite one pre-existing baseline test failure: `tests/check-p3.5-validate-trace.js`'s `ps1-exits-0-on-valid-repo-with-ci-flag` sub-test (`validate-trace.ps1 --ci exited 1`).
**Alternatives considered:** Investigate and fix the failure before starting any implementation.
**Rationale:** Confirmed identical failure on `master` (ran `node tests/check-p3.5-validate-trace.js` in both the main checkout and the new worktree, same result) — this predates the worktree and is unrelated to `tfhc-s1`'s scope (a Playwright E2E fixture for `/test/seed-approval-journey`; this failing test is about the `validate-trace.ps1` CI script's own exit behaviour against the real repo). 811/812 other test files pass.
**Made by:** Copilot (branch-setup baseline check)
**Revisit trigger:** If a future `/trace` or CI run surfaces that `validate-trace.ps1 --ci`'s real exit-1 behaviour reflects an actual trace-health problem (not an environment artifact), investigate and fix separately from this epic.

---

**2026-10-30 | RISK-ACCEPT | /subagent-execution (tfhc-s1, Task 2)**
**Decision:** Confirmed the full local test suite has additional pre-existing, non-deterministic flakiness beyond the single documented `check-p3.5-validate-trace.js` failure — not caused by this story, no action taken within this epic.
**Alternatives considered:** Investigate and fix the flaky tests before continuing this story's remaining tasks.
**Rationale:** Task 2's implementer ran a clean baseline `npm test` on the pre-Task-2 commit (stash/pop) and found a *different* 2nd/3rd failing file each run (`check-pcr-s1-test-runner.js` — a perf-timing threshold assertion, "measured 768.6ms/file" vs a 749.8ms/file bound; `check-rtvap-s1-archived-test-plan-coverage.js` — `execvpe /bin/bash failed`, a local WSL/bash environment artifact), neither touching `tests/e2e/` or seed-journey code. This is environment-level suite flakiness (timing + WSL availability), unrelated to `tfhc-s1`'s scope, and pre-dates this story.
**Made by:** Copilot (subagent-execution, Task 2 implementer + orchestrator review)
**Revisit trigger:** If this flakiness starts affecting CI (not just local Windows/WSL runs) or starts implicating `tests/e2e/` files, raise a dedicated fast-follow ticket to either raise `check-pcr-s1-test-runner.js`'s perf tolerance or make `check-rtvap-s1-archived-test-plan-coverage.js` skip gracefully when `bash`/WSL is unavailable, matching this suite's existing pattern for `check-p3.5-validate-trace.js`'s own pwsh-unavailable skip.

---

**2026-10-30 | RISK-ACCEPT | /subagent-execution (tfhc-s1, Task 3)**
**Decision:** `tests/e2e/ep3-s1-regression.spec.js` was already failing before this story's migration touched it — a real, pre-existing product bug, not caused by or related to the seed-fixture work. AC3/AC4 are satisfied under the "pass/fail outcome unchanged by migration" reading (already the literal text of AC4 as revised at `/review`), not a literal "must be passing" reading, since the file was already failing beforehand.
**Alternatives considered:** Fix the underlying product bug as part of this task before committing the migration; or treat this as an AC3 failure and block the task.
**Rationale:** Task 3's implementer reproduced the failure 3x identically (`TimeoutError` on `page.waitForURL('**/skills/definition/sessions/**')` — the journey lands on a `discovery` session instead of `definition` after a regression-back action) both BEFORE and AFTER the fixture migration, proving the migration is behaviour-neutral. `git log --oneline -- tests/e2e/ep3-s1-regression.spec.js` shows exactly one commit ever touched this file (the original `ep3-s1` story, `50fd1fb5`) — nothing in this epic's scope created or could have created this bug. The defect sits in `handlePostJourneyRegress`/`handleGetJourneyResume` (`src/web-ui/routes/journey.js`), not in the seeding mechanism this story refactors.
**Made by:** Copilot (subagent-execution, Task 3 implementer + orchestrator review)
**Revisit trigger:** File a dedicated bug ticket/story for the `handlePostJourneyRegress`/`handleGetJourneyResume` redirect defect (stage-regression lands on the wrong stage's session) — out of scope for `test-fixture-hardening-continuation` to fix. Flag to Hamish King for prioritisation.
**Filed:** [#1042](https://github.com/heymishy/skills-repo/issues/1042) (2026-10-30).

---

**2026-10-30 | RISK-ACCEPT | /branch-complete (tfhc-s1, post-merge bookkeeping)**
**Decision:** After PR #1041 merged, left `testPlan.passing: 4` (of 5) in `pipeline-state.json` for `tfhc-s1` rather than setting it to 5, even though `scripts/check-pipeline-state-integrity.js`'s C3 rule treats `prStatus: "merged"` with `passing < totalTests` as a hard FAIL.
**Alternatives considered:** Set `passing: 5` to satisfy C3 and keep `npm test` green; or drop `totalTests` to 4 to exclude the known-failing test from the count.
**Rationale:** The one non-passing test (`ep3-s1-regression.spec.js`'s E2E case) fails for the same documented pre-existing, unrelated product bug as the Task 3 RISK-ACCEPT above — not anything this story introduced. Setting `passing: 5` would be a false claim this session has deliberately avoided throughout (see Problem Solving discipline in this epic's `/verify-completion` and `/subagent-execution` runs — testPlan.passing was never inflated for an AC that didn't literally pass). C3 itself has no carve-out for a documented, RISK-ACCEPT'd pre-existing failure — it assumes "merged" always means "all tests in totalTests now pass," which doesn't hold here. The honest `4/5` value is correct; the checker's assumption is the gap.
**Made by:** Hamish King (confirmed "Merged"), bookkeeping executed by Copilot
**Revisit trigger:** If `scripts/check-pipeline-state-integrity.js`'s C3 check gains a documented-exception carve-out (e.g. a `testPlan.knownFailing` count, or a decisions.md cross-reference), re-run C3 against this story to confirm it then passes cleanly. Logged as an `/improve` candidate in `workspace/capture-log.md`.

---

**2026-10-30 | RISK-ACCEPT | /branch-setup (tfhc-s2)**
**Decision:** Proceed with the `tfhc-s2` worktree despite 2 pre-existing baseline test failures: `scripts/check-pipeline-state-integrity.js` and `tests/check-pcr-s1-test-runner.js`.
**Alternatives considered:** Investigate and fix both before starting any implementation.
**Rationale:** Both are already documented, understood, and unrelated to `tfhc-s2`'s scope (retrofitting `journey.js`'s own fixtures). `check-pipeline-state-integrity.js`'s failure is the C3 flag from this epic's own `/branch-complete (tfhc-s1, post-merge bookkeeping)` RISK-ACCEPT above — a deliberate, honest `4/5` passing count, not a defect. `check-pcr-s1-test-runner.js` is the perf-timing-threshold flake already RISK-ACCEPTed during `tfhc-s1`'s own `/branch-setup` (Task 2 entry). Neither touches `src/web-ui/routes/journey.js` or this story's scope.
**Made by:** Copilot (branch-setup baseline check)
**Revisit trigger:** Same as the two originating entries above — if C3 gains a carve-out, or if the perf-timing flake starts affecting CI, raise a dedicated fast-follow ticket.

---

**2026-10-30 | RISK-ACCEPT | /branch-setup (tfhc-s3)**
**Decision:** Proceed with the `tfhc-s3` worktree despite 1 pre-existing baseline test failure: `scripts/check-pipeline-state-integrity.js`.
**Alternatives considered:** Investigate and fix before starting any implementation.
**Rationale:** Already documented, understood, and unrelated to `tfhc-s3`'s scope. This is the C3 flag from this epic's own `/branch-complete (tfhc-s1, post-merge bookkeeping)` RISK-ACCEPT above — a deliberate, honest `4/5` passing count, not a defect. `check-pcr-s1-test-runner.js`'s perf-timing flake (also previously RISK-ACCEPTed) did not fail on this particular run — consistent with its documented non-deterministic nature.
**Made by:** Copilot (branch-setup baseline check)
**Revisit trigger:** Same as the originating entry above — if C3 gains a carve-out, re-run against this story to confirm it then passes cleanly.

---

**2026-10-30 | SCOPE | /spike (tfhc-s5)**
**Decision:** `tfhc-s5`'s spike ("products.js/journeys.js fixture duplication") closed PROCEED. `journeys.js` walking-skeleton implementation (fixture + self-test + proof-of-pattern migration + structural checker + `/review` wiring, same bounded shape as `tfhc-s3`) is added to this MVP's in-scope work as a new follow-on story. `products.js`'s separately-confirmed duplication (27/32 files) is logged as a named, bounded fast-follow rather than folded into the same implementation cycle.
**Alternatives considered:** Implement both surfaces' fixtures together in one cycle; DEFER both as out of scope.
**Rationale:** Both surfaces show real, substantial duplication — `products.js` 27/32 (≈84%) and `journeys.js` 30/31 (≈97%), both proportionally higher than either closed precedent (`journey.js` 16/41, `skills.js` 12/45). `journeys.js`'s pattern is the more urgent: none of its 30 touching files share even a local hand-rolled factory — every one independently re-derives the same single-field (`req.session.tenantId`) session shape inline, per test. Sequencing `journeys.js` first and deferring `products.js` (a distinct 5-field shape: `accessToken`/`login`/`tenantId`/`plan`/`impersonation`) avoids repeating `discovery.md`'s own named risk of running too many differently-shaped stories under one epic at once (CI concurrency collisions on the shared `deploy-group`, already observed twice in this epic).
**Made by:** Copilot (spike investigation, full outcome in `spikes/tfhc-s5-outcome.md`)
**Revisit trigger:** If `journeys.js`'s implementation does not land within this MVP's own cycle for capacity reasons, its fast-follow status (not `products.js`'s) must be explicitly logged, per `discovery.md` Out of Scope item 2's own conditional wording.

---

**2026-10-30 | SCOPE | /spike (tfhc-s6)**
**Decision:** `tfhc-s6`'s spike ("parallelization git-commit-collision risk") closed PROCEED (conditional). `scripts/run-all-tests.js` parallelization is conditionally added to this MVP's in-scope work, gated on first stubbing `setSkillTurnGitCommitAdapter` in 14 precisely-named remaining-risk test files (not the originally-estimated, never-enumerated "64 subprocess-spawning files").
**Alternatives considered:** PROCEED with parallelization immediately, accepting the 14-file collision risk; REDESIGN/DEFER parallelization entirely.
**Rationale:** Investigated the real risk mechanism directly (`_skillTurnGitCommit`'s default `execSync` git-commit implementation, D37 adapter from `stis-s1`, gated by `handlePostTurnStreamHtml`'s `done && _artefactText` branch) rather than the vague, never-enumerated "64 files" estimate. Found 41 test files call the handler; 12 already stub the adapter (exactly matching the one previously-known figure in this epic's chain — validates the method); of the remaining 29, only 14 genuinely drive an artefact-completing turn (confirmed via `ARTEFACT-END` marker presence) and are therefore real, currently-active risk. 14 is a small, closeable list — meeting `discovery.md`'s own PROCEED condition. These 14 files are also very likely the exact source of the already-logged "skills.js fires a real git commit during tests" junk-commit-contamination bug (`workspace/learnings.md`), making the fix valuable independent of parallelization's own scheduling.
**Made by:** Copilot (spike investigation, full outcome in `spikes/tfhc-s6-outcome.md`)
**Revisit trigger:** If the 14-file stubbing fix is not completed before parallelization is implemented, this RISK-ACCEPT must be explicitly re-logged acknowledging the known collision risk is being shipped, not closed.

---

**2026-10-31 | SCOPE | /definition (tfhc-s7, tfhc-s8)**
**Decision:** Wrote `tfhc-s7` (journeys.js fixture walking skeleton) and `tfhc-s8` (stub the 14 remaining skill-turn git-commit test files) as new stories under this epic's existing `fixture-divergence-closure` epic, per the operator's explicit instruction to proceed with both spike-unlocked follow-ons.
**Alternatives considered:** None at this step — the scope decision itself was already made and logged at each spike's own completion (see the two SCOPE | /spike entries immediately above); this entry records the formal /definition write-up, not a new scope judgment.
**Rationale:** Both stories fall squarely within discovery.md's own pre-anticipated conditional-MVP framing (Out of Scope items 2 and 3), not scope drift — item 2 explicitly anticipated journeys.js implementation landing in-MVP on a PROCEED verdict, and item 3 explicitly anticipated parallelization's precondition landing in-MVP on a PROCEED(-conditional) verdict. Added journeys.js duplication (m8) and parallelization risk resolution, implementation half (m9) as two new benefit-metric entries; updated the epic's own Stories list, Benefit Metrics Addressed table, and Out of Scope section accordingly.
**Made by:** Copilot (/definition, operator-confirmed)
**Revisit trigger:** None — both stories now proceed through the standard pipeline (/review → /test-plan → /definition-of-ready → inner loop) like any other story in this epic.

---

**2026-10-31 | LEARNING | /review (tfhc-s8)**
**Decision:** Corrected `tfhc-s8`'s AC1 file list from 14 to 13 files. `tfhc-s6`'s spike had named `check-isc-s1-ideate-success-lens-cycling.js` as a 14th at-risk file; direct inspection at `tfhc-s8`'s own `/review` (finding 1-M1) found it never calls `handlePostTurnStreamHtml` in executable code — only in comments — so it cannot reach the `_skillTurnGitCommit` adapter call site at all. Spot-checked 8 of the other 13 files to confirm this was an isolated miss, not a pattern in the spike's own method.
**Alternatives considered:** Log a RISK-ACCEPT and proceed with the uncorrected 14-file list, fixing it later during implementation.
**Rationale:** The fix was unambiguous, free, and strictly improves accuracy — no reason to defer it. Fixed `tfhc-s8`'s story (title, AC1-AC4, Architecture Constraints, User Story/Benefit Linkage prose), `benefit-metric.md` m9's baseline, the epic's Benefit Metrics Addressed table, and `pipeline-state.json`'s `m9.baseline`, all from 14 to 13. This is also a methodology learning for future spikes: an `ARTEFACT-END`-marker grep alone is not sufficient evidence that a file reaches a gated code path — confirming an actual call to the real handler (not just a comment mentioning it, and not just a fixture-data accessor that happens to contain a similarly-shaped marker string) is necessary too.
**Made by:** Copilot (/review finding 1-M1, resolved same session)
**Revisit trigger:** None — resolved before /test-plan, as intended.

---

**2026-10-31 | RISK-ACCEPT | /definition-of-ready (tfhc-s7, tfhc-s8)**
**Decision:** Proceed with DoR sign-off for both stories despite W4 (verification script reviewed by a domain expert) being unmet — neither `tfhc-s7-verification.md` nor `tfhc-s8-verification.md` has been walked through by a human reviewer before coding begins.
**Alternatives considered:** Block sign-off until a human reviews both scripts.
**Rationale:** Same rationale as the existing tfhc-s1/s2/s3/s4 RISK-ACCEPT — solo-operator capacity, low-risk test-infrastructure-only work (no production code path), and the verification scripts themselves are available for post-merge smoke testing per the skill's own "three moments" design even if pre-code sign-off is skipped here.
**Made by:** Copilot (DoR warning check)
**Revisit trigger:** If either script's described behaviour turns out to be wrong once implemented, that is itself evidence this warning should have been resolved pre-code — note for retrospective, not an immediate action.

---

**2026-10-31 | SCOPE | /definition (tfhc-s9)**
**Decision:** Wrote `tfhc-s9` (parallelize `scripts/run-all-tests.js`'s sequential child-process execution) as a new story under this epic's existing `fixture-divergence-closure` epic, per the operator's explicit "scope next" instruction after `/trace` confirmed the full feature HEALTHY and `tfhc-s8` closed the git-commit-collision precondition.
**Alternatives considered:** None at this step — the scope decision was already made and anticipated at `tfhc-s6`'s own spike completion (discovery.md Out of Scope item 3: "Gated, not fast-follow, unless the spike's verdict is PROCEED"); this entry records the formal `/definition` write-up, not a new scope judgment.
**Rationale:** Falls squarely within discovery.md's own pre-anticipated conditional-MVP framing, not scope drift — item 6/item 3 explicitly anticipated this implementation landing in-MVP once its precondition closed. Added `run-all-tests.js` wall-clock runtime (m10) as a new benefit-metric entry, grounded in a fresh timed baseline run on this session's own machine (816 files, 485063ms sequential, 8 logical CPUs) rather than an estimate — the fresh run also re-confirmed the only 2 failures present are the same 2 already-known, already-RISK-ACCEPTed pre-existing failures. Updated the epic's Stories list (also corrected stale unchecked boxes for `tfhc-s1`–`tfhc-s8`, all of which are actually DoD-complete), Benefit Metrics Addressed table, Out of Scope section, and refreshed the Program Design canvas marker to include the new fixture/audit/runner nodes added by `tfhc-s7`, `tfhc-s8`, and this story.
**Made by:** Copilot (/definition, operator-confirmed)
**Revisit trigger:** None — this story now proceeds through the standard pipeline (/review → /test-plan → /definition-of-ready → inner loop) like any other story in this epic.

---

**2026-10-31 | RISK-ACCEPT | /review (tfhc-s9, finding 1-M1)**
**Decision:** Acknowledge AC4's single-run 40% wall-clock-reduction threshold as a real flakiness risk, but do not rewrite the AC — instead, direct `/test-plan` to design AC4's own verification as a multi-run average (or the existing DoD-time timed-run approach m10's own benefit-metric entry already specifies) rather than a hard single-run CI-gating assertion.
**Alternatives considered:** Rewrite AC4 now to remove the numeric threshold entirely; block /test-plan until a averaging mechanism is specified at story level.
**Rationale:** This repo has already hit the identical flakiness shape once (`tests/check-pcr-s1-test-runner.js`, logged in `workspace/capture-log.md`) and the fix pattern (don't gate CI on a single noisy wall-clock run) is already established precedent, not a new design question — cheaper to resolve at `/test-plan`'s own verification-method design than to rework the story's AC wording now.
**Made by:** Copilot (/review finding 1-M1)
**Revisit trigger:** If `/test-plan`'s own AC4 test design still ends up as a brittle single-run assertion, that is itself evidence this guidance should have been a story-level AC rewrite instead — note for retrospective.

---

**2026-10-31 | RISK-ACCEPT | /definition-of-ready (tfhc-s9)**
**Decision:** Proceed with DoR sign-off for `tfhc-s9` despite W4 (verification script reviewed by a domain expert) being unmet — `tfhc-s9-verification.md` has not been walked through by a human reviewer before coding begins.
**Alternatives considered:** Block sign-off until a human reviews the script.
**Rationale:** Same rationale as the existing tfhc-s1/s2/s3/s4/s7/s8 RISK-ACCEPT — solo-operator capacity, and the verification script remains available for post-merge smoke testing per the skill's own "three moments" design even if pre-code sign-off is skipped here. Medium oversight (per the epic's own rationale) is satisfied by the operator's own review of this DoR artefact, since the operator and nominal tech lead are the same person for this repo.
**Made by:** Copilot (DoR warning check)
**Revisit trigger:** If the script's described behaviour turns out to be wrong once implemented, that is itself evidence this warning should have been resolved pre-code — note for retrospective, not an immediate action.

---

**2026-11-01 | RISK-ACCEPT | /branch-setup (tfhc-s9)**
**Decision:** Proceed past a failing baseline in the `tfhc-s9` worktree. 2 failures present before any code is written: `scripts/check-pipeline-state-integrity.js` ([C3], the long-standing `tfhc-s1` flag tracked throughout this session) and `tests/check-pcr-s1-test-runner.js` (N1 perf NFR).
**Alternatives considered:** Investigate before deciding (chosen first — see below), fix `check-pcr-s1-test-runner.js`'s baseline now as a side task before proceeding.
**Rationale:** Investigated per explicit operator request rather than defaulting to acknowledge-and-proceed. [C3] is confirmed unrelated, already tracked. `check-pcr-s1-test-runner.js` was root-caused (not just pattern-matched as "a known flake"): its N1 check compares a positional `files.slice(0, 40)` sample against a baseline measured 2026-07-11 on a 224-file suite; the repo has grown to 816 files and the sampled slice's actual composition has silently drifted to a different, unrelated set of files (confirmed by printing the sampled file list — now the first 24 alphabetically-sorted `check-a*.js` files, none of which existed at baseline time). Failed 5/5 runs across both the worktree and the main checkout (778–1369ms/file vs. a 749.8ms/file threshold) — a stale baseline, not transient machine-load noise, and both failures are confirmed unrelated to `tfhc-s9`'s own scope (which touches only `run-all-tests.js`'s execution concurrency, not individual `check-*.js` files' own NFR logic, per the story's own Out of Scope section). Logged as an `/improve` candidate in `workspace/capture-log.md` (2026-11-01) rather than fixed inline, since re-baselining is itself a design decision (what should the new baseline be? sample differently?) not authorized as part of this story.
**Made by:** Copilot (/branch-setup baseline check, investigated per operator's explicit "1" then resolved per operator's explicit "2")
**Revisit trigger:** If `tests/check-pcr-s1-test-runner.js` continues to fail after this worktree's own work is merged (i.e. is still failing on master with no new early-alphabet files added since), that would indicate the root cause above is incomplete — otherwise, no action needed from this story.

---

**2026-11-01 | DESIGN | /subagent-execution (tfhc-s9, Task 1)**
**Decision:** Production concurrency for `runAll()` is `Math.max(1, os.cpus().length - 2)` (6 on the reference 8-core machine), not the raw `os.cpus().length` the story's own ACs/DoR contract originally specified.
**Alternatives considered:** (1) Ship with `os.cpus().length` as originally planned and RISK-ACCEPT the resulting contention; (2) `os.cpus().length - 1`.
**Rationale:** Task 1's implementer found that running at full core count (8 concurrent children) caused *other, unrelated* pre-existing tests with their own embedded wall-clock NFR assertions (`check-cat-s4-features-page-integration.js`, `check-rb-s3-harness-agnostic-instructions.js`) to fail intermittently under CPU contention — confirmed non-deterministic (a different failing set across 2 full-suite runs) and confirmed both files pass cleanly standalone, the classic signature of resource contention rather than a logic bug in the new pooling code. This is a broader instance of the same risk category as the already-logged AC4 RISK-ACCEPT (1-M1: don't gate on a single noisy wall-clock run) but wasn't anticipated to extend to *other* files' own timing NFRs at DoR time. Option 1 was rejected because it risks shipping a repo-wide CI-stability regression affecting unrelated stories, not just this one's own AC4 measurement. `-1` was rejected as insufficiently conservative without empirical evidence it would actually resolve the contention (saturating 7 of 8 cores still leaves very little headroom); `-2` is a more conservative first attempt, re-verified by the same implementer before committing. The ≥40% wall-clock-reduction target (AC4/m10) remains safely achievable at 6-way parallelism — 40% reduction only requires ~1.67x effective speedup, well below 6x theoretical.
**Made by:** Copilot (/subagent-execution Task 1 implementer finding, operator decision via option "2")
**Revisit trigger:** If re-verification after this change still shows contention-induced flakiness in other files, the cap may need to go lower still (e.g. `/2` instead of `-2`) — that would be a second iteration of this same decision, not a new one.

---

**2026-11-01 | DESIGN | /subagent-execution (tfhc-s9, Task 1) — supersedes part of the diagnosis above**
**Decision:** Add a `SEQUENTIAL_EXCLUSIVE_LIST` to `scripts/run-all-tests.js` — a small, named list of files that `runAll()` runs sequentially (via `runFilesConcurrently(exclusiveFiles, { concurrency: 1, ... })`) in a separate phase, before/outside the main concurrent pool, rather than modifying the files themselves.
**Alternatives considered:** (1) Add a lock/mutex to the 2 affected test files directly, acquired before and released after their rename-away/rename-back window — rejected: hand-rolled file-locking (polling, stale-lock recovery if a process crashes mid-window) is fiddly and carries its own deadlock risk for a 2-file problem. (2) Point the tests at a sandboxed temp path instead of the real one — rejected after reading the production code: `src/web-ui/content/learnings-count.js`'s real path is hardcoded, not injectable, by deliberate design (its own header comment explains why — `workspace/learnings.md` is never part of the deployed bundle, so the function must check the real repo-root path specifically). Pointing the test elsewhere would not test the real behaviour; making the path injectable would mean modifying production `src/` code, a materially larger change than "fix a test file."
**Rationale:** Re-verification after the `-2` concurrency cap (the DESIGN entry immediately above) still showed `tests/check-lcdf-s1-build-time-learnings-count.js` and `tests/check-rb-s3-harness-agnostic-instructions.js` failing, consistently across 2 runs — not varying as the original (uncapped) run's failures did, which was the clue that this wasn't pure CPU contention. Directly isolating `check-lcdf-s1-build-time-learnings-count.js` together with `tests/check-lccf-s1-fail-open-learnings-count.js` (nothing else, concurrency 2) reproduced the exact failure 1 of 3 tries: both files rename the real, shared `workspace/learnings.md` away and back to simulate "file missing," with no coordination between them — a genuine, deterministic (given the right wave-pairing) race on real repo-root state, not a timing flake. This also carries a small real-file-corruption risk if a process were killed mid-window (a timeout or crash) rather than cleanly reaching its `finally` restore step — a data-safety concern, not just test flakiness, which is why this is fixed now rather than deferred as a logged fast-follow per the story's own general "don't fix other files' test logic inline" Out of Scope clause. The fix stays within that clause's letter: `scripts/run-all-tests.js` is the one file this entire story already modifies; neither `check-lcdf-s1-*.js` nor `check-lccf-s1-*.js` is touched. `check-rb-s3-harness-agnostic-instructions.js`'s own failure is a separate, genuine contention-sensitivity issue (a real 2-second wall-clock NFR budget around its own subprocess-spawning assembly step, using properly-sandboxed temp paths elsewhere in the file) — re-verified separately after this fix lands; if it continues to flake under the `-2` cap, it is the same class of finding as `pcr-s1`'s own already-accepted flaky-NFR precedent (RISK-ACCEPT, not a code fix), not a correctness bug like the file race.
**Made by:** Copilot (/subagent-execution Task 1, root-caused via direct 2-file isolation, operator-approved)
**Revisit trigger:** If any other file is later found racing on the same real `workspace/learnings.md` path (the other 6 files found referencing it at `/branch-setup`'s own capture-log investigation were not checked individually), add it to `SEQUENTIAL_EXCLUSIVE_LIST` too — this is a maintained, explicit list, not a dynamically-detected one, by the same design precedent as `GRANDFATHER_LIST`.

---

**2026-11-01 | DESIGN | /subagent-execution (tfhc-s9, Task 1) — further revises the concurrency cap above**
**Decision:** Production pool concurrency for `runAll()` is `Math.max(1, Math.ceil(os.cpus().length / 3))` (3 on the reference 8-core machine), down from `Math.max(1, os.cpus().length - 2)` (6).
**Alternatives considered:** Leave the cap at `-2` and RISK-ACCEPT `check-rb-s3-harness-agnostic-instructions.js` as a known, always-failing-under-concurrency NFR (rejected — re-verification after the `SEQUENTIAL_EXCLUSIVE_LIST` fix landed showed `rb-s3` failing **3/3** full-suite runs at the `-2` cap, not intermittently; an always-red check in every future CI run is a materially worse outcome than an occasional flake and not something to wave through as routine).
**Rationale:** Directly tested the real pool file set (815 files) at `concurrency: 3` via `runFilesConcurrently` — `rb-s3` passed, and only the 2 originally-expected pre-existing failures remained (`check-pipeline-state-integrity.js` [C3], `check-pcr-s1-test-runner.js` N1). Elapsed time at this lower concurrency: 199683ms for the pool (plus a couple of seconds for the 2 sequentially-run exclusive files) — still a ~59% reduction from the confirmed 485063ms sequential baseline, comfortably clearing AC4/m10's ≥40% target (≤291000ms) with large headroom. Since the speedup target is met either way, there is no real tradeoff in choosing the more conservative value once it's confirmed to work — no reason to risk a tighter cap that only sometimes avoids `rb-s3`'s contention sensitivity. Not empirically tested at every value between 3 and 6; 3 is the verified-safe point, not necessarily the highest value that would also work.
**Made by:** Copilot (/subagent-execution Task 1, empirically verified via direct pool-level test, operator-approved)
**Revisit trigger:** If a future machine with a different core count still shows `rb-s3` failing at this same proportional cap, the formula (not just the constant) may need revisiting — this value is grounded in the reference 8-core dev machine, same framing as the original `os.cpus().length` choice in the story's own AC2.

---

**2026-11-01 | RISK-ACCEPT | /subagent-execution (tfhc-s9, Task 1) — stops the concurrency-tuning cycle**
**Decision:** Finalise production pool concurrency at `Math.max(1, Math.ceil(os.cpus().length / 3))` (the DESIGN entry immediately above). Any further single, unrelated pre-existing test that fails only under concurrent load because of its own tight embedded wall-clock NFR budget (passes cleanly standalone) is accepted as a known, residual risk — same precedent as `pcr-s1`'s own already-accepted flaky-NFR class — not something this story chases file-by-file.
**Alternatives considered:** Lower concurrency further to try to eliminate every such occurrence. Rejected after a second full-suite run at `concurrency: 3` surfaced a *third* distinct file (`tests/check-cat-s1-core-trace-builder.js`, a 50ms directory-walk budget measured at 66.4ms under load, confirmed passing cleanly standalone at 32.2ms) that had not appeared in any prior run at any concurrency level tried (8, 6, or 3's own first run). This is not a small, enumerable, fixable set like the `lcdf-s1`/`lccf-s1` file race was (2 files, a real correctness bug) — it is an open-ended category of pre-existing tests across this 800+ file suite whose wall-clock NFR budgets were only ever safe because the old sequential runner gave every test exclusive CPU access. No concurrency value short of 1 (which defeats this story's own purpose) can guarantee zero collisions with an unknown-sized set of such tests.
**Rationale:** `concurrency: 3` already comfortably clears AC4/m10's ≥40% target (~59% measured) and already fixed the one genuine correctness bug found (the shared-file race). Continuing to lower it further chases diminishing, uncertain returns against an open-ended risk category, at real cost to the speedup this story exists to deliver. The residual risk (an occasional, unrelated test flaking under load, confirmed to pass standalone) is exactly the same shape this repo already has a standing, accepted practice for (`pcr-s1`). Logged as a dedicated `/improve` candidate in `workspace/capture-log.md` (2026-11-01): a broader sweep of tight embedded wall-clock NFR budgets across the suite, same fix family as the already-logged `pcr-s1` stale-baseline finding — clearly out of scope for this one story to resolve exhaustively.
**Made by:** Copilot (/subagent-execution Task 1, operator-approved after 2 rounds of further isolated verification)
**Revisit trigger:** If this residual risk manifests frequently enough in real CI usage to be disruptive (not just occasionally), that is itself evidence the `/improve` candidate above should be prioritised sooner rather than left as a backlog item.

---

**2026-11-01 | DESIGN | /subagent-execution (tfhc-s9, Task 3)**
**Decision:** The AC1-integration seam test's fixture repo (a `tempRoot` created by the test itself) now also creates stub versions of every `GRANDFATHER_LIST` path, not just the 3 `check-*.js` fixtures it originally planned. `scripts/run-all-tests.js` itself (`getAllTestFiles`, `GRANDFATHER_LIST`) is NOT modified.
**Alternatives considered:** (1) Fix `getAllTestFiles` to filter `GRANDFATHER_LIST` entries by existence (`.filter(fs.existsSync)`) before use — rejected: this directly modifies `getAllTestFiles`, which the story's own Out of Scope section explicitly names as untouched ("The test-file discovery mechanism itself... untouched; this story only changes how discovered files are *executed*, not which files are discovered"). The fix is small and arguably a genuine latent-defect correction, but it is still a production-code change this story did not authorize touching, for a defect that has never manifested in the real repo (all 16 grandfather files genuinely exist there) and was only exposed by this test's own artificial, non-representative fixture setup. (2) Loosen the test's assertion to expect the inflated count (`19 file(s) run, 17 failed`) — rejected: bakes a confusing, unrealistic number into a test whose entire point is a clean, small, controlled seam check; the extra 16 spurious failures have nothing to do with what the test is verifying.
**Rationale:** Task 3's implementer found that `getAllTestFiles(repoRoot)` builds the grandfather portion unconditionally (`GRANDFATHER_LIST.map(f => path.join(repoRoot, f))`, no existence check) — unlike the dynamic `check-*.js` glob, which only returns files that actually exist via `readdirSync`. This is a real, pre-existing latent defect (confirmed by direct code read), exposed only because this story's own integration test is the first thing to ever call `getAllTestFiles`/`runAll` against a `repoRoot` other than the real repo. The correct fix, given the story's own explicit scope boundary, is to make the TEST's fixture environment realistic (contain every file `getAllTestFiles` expects to find, exactly as the real repo does) rather than changing the untouchable function. `GRANDFATHER_LIST` is already exported from `scripts/run-all-tests.js`, so the test derives the expected file list programmatically rather than hardcoding a duplicate copy of it (avoids future staleness if `GRANDFATHER_LIST` changes). Also corrected a simple arithmetic miscount in the plan's own Step 5 expected output (said "11 check(s) OK", should be 13 — 6 from Tasks 1–2 plus 7 new).
**Made by:** Copilot (/subagent-execution Task 3, root-caused via direct code read, consistent with the story's own explicit scope boundary — no operator escalation needed since the DoR contract's own out-of-scope wording already settled which side of this decision was correct)
**Revisit trigger:** The underlying `getAllTestFiles` latent defect (grandfather entries not existence-checked) remains unfixed in production code — log as a `/improve` candidate if a future story ever needs `getAllTestFiles`/`runAll` to work correctly against a non-real `repoRoot` again.

---

**2026-11-01 | LEARNING | /subagent-execution (tfhc-s9, Task 3, code-quality finding)**
**Decision:** Redesigned AC6's test (`AC6-hung-file-killed-without-blocking-siblings`) to use `concurrency: 2` (genuine queueing — 3 files, 2 slots) with 2 sleep-marker siblings whose timestamped START/END log events directly prove the 2nd sibling's slot refills promptly when the 1st sibling finishes, not when the hung file eventually times out. The original version is corrected, not merely patched.
**Alternatives considered:** Just widen the `elapsedMs < 1000` threshold or pick a "better" constant — rejected, since the finding was that NO total-elapsed threshold has discriminating power with this scenario's original shape (`concurrency: 3 == files.length`, so nothing ever queues at all; `pass-fast` siblings finish in a few ms either way). A tighter or looser number on the same structurally-non-discriminating test would still be vacuous.
**Rationale:** Code-quality review empirically proved (not just argued) that the original AC6 test passed identically under a fully-serialized replay of the same 3 fixtures (482ms serialized vs. 350ms real-concurrent, both comfortably under the 1000ms threshold) — exactly the "test genuinely proves what it claims" failure mode this story's own injected testing standard (`.github/standards/testing/test-design-patterns.md`) warns about, caught the same way that standard's own precedent cases were: by actually reverting/replaying the mechanism under test and confirming the test's own assertions still (wrongly) pass. The corrected version measures the real property AC6's own name claims — "doesn't block siblings" — via direct timestamp evidence from the queueing mechanism itself, not an inference from total wall-clock time.
**Made by:** Copilot (/subagent-execution Task 3, code-quality reviewer's empirical finding, root-caused and redesigned by the orchestrator before re-dispatch)
**Revisit trigger:** None — this is a direct test-quality fix, not a scope or design trade-off requiring future reconsideration.

---

**2026-11-01 | LEARNING | /subagent-execution (tfhc-s9, Task 3, second correction to the same AC6 test)**
**Decision:** Changed the AC6 fix's own `-second-sibling-not-queued-behind-hang` metric from a relative gap (2nd sibling's START minus 1st sibling's END) to an absolute offset (2nd sibling's START minus the test's own `testStart` timestamp, captured immediately before calling `runFilesConcurrently`). Threshold set to 450ms.
**Alternatives considered:** Keep the relative-gap metric and just widen its threshold — rejected after the implementer empirically checked it against a `concurrency: 1` comparison run (the orchestrator's own suggested verification method) and found the gap stays in the same ~80-136ms band regardless of concurrency value, because it's dominated by Node child-process spawn/boot overhead, not by whether a slot was stuck behind the hung file — no threshold on that metric would discriminate.
**Rationale:** The implementer's own comparison data shows the ABSOLUTE offset does cleanly separate the two scenarios: ~300-320ms when the 2nd sibling starts as soon as the 1st sibling's slot frees (the correct, real behaviour), vs. ~800ms+ when serialization forces every file to wait its turn (the regression this assertion exists to catch). 450ms sits with wide margin on both sides and well under the hang file's own 500ms timeout. This is the second iteration of fixing the same test in the same session — a reminder that a "this proves discrimination" claim needs to be verified against real numbers before being trusted, exactly as the implementer did here by refusing to force the first attempt's prediction to look right when the data didn't support it.
**Made by:** Copilot (/subagent-execution Task 3, the implementer's own refusal to force a result, root-caused by the orchestrator)
**Revisit trigger:** None.

---
