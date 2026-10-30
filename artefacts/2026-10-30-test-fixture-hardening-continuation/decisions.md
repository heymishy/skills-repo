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
