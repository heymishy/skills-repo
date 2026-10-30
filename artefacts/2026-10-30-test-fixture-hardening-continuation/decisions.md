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
