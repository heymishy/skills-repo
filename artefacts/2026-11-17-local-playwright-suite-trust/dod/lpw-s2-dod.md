# lpw-s2 Definition of Done

Date: 2026-11-17. Story: a small required core of browser tests, chosen by capability and measured coverage. PR #1139, merged to master on 2026-11-17 at 06:59 UTC (`d30308896`). The change is two workflows, four scripts, a capability matrix, four guard tests, one context flag and the story's evidence; no application source changed.

## Result: COMPLETE (with one honest shortfall, recorded below)

All 8 acceptance criteria (AC) were verified by 24 automated tests, the measurement run and two CI runs of the core job. The coverage the core reaches is below the `lpw-s1` whole-suite baseline, which the story did not require it to match but the operator cares about; see "Coverage" below.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (per-spec measurement tool and workflow) | ✅ | `scripts/measure-playwright-spec-coverage.js` and `playwright-spec-coverage.yml`; triggers (pull request on its own files, manual start, never push or schedule) asserted by T5d; the workflow ran on the pull request | automated + CI | the script needed two fixes after the first run (a hung spec left its server on port 3999, and the untouched-files list needed the files on disk); both fixed on the branch |
| AC2 (measurement recorded) | ✅ | `evidence/per-spec-coverage.md`: 89 specs alone, 28.7 minutes, 36909 of 57062 statements (64.7%), 31 of 201 files untouched by any spec, specs that differ from the `lpw-s1` runs | live (CI) | the first measurement run was invalid and is documented, not used |
| AC3 (matrix and guard) | ✅ | `tests/e2e/capability-matrix.json`: 95 spec files (27 core, 33 extended, 6 scenario, 29 quarantined); `check-lpw-s2-capability-matrix` (8 tests) fails on every defect listed in the AC | automated | the story text said 95 "including `tests/e2e/local/`"; that directory is untracked in the operator's checkout, so 95 tracked files |
| AC4 (selection rule in a script) | ✅ | `scripts/select-core-specs.js`; `check-lpw-s2-select-core` (6 tests); the chosen list and order in `evidence/core-coverage.md` | automated | the first selection was wrong: a CRLF parsing defect in the throwaway matrix builder made the failed-before list empty, so four specs that fail in the whole suite were chosen; found by the first core run and fixed before merge |
| AC5 (coverage comparison) | ✅ | `evidence/core-coverage.md`: core 34567 statements (60.58%) is 99.30% of what all passing specs reach (34812); gaps named; per-spec table of what non-core specs protect | live | see Coverage below |
| AC6 (core job) | ✅ | `.github/workflows/core-browser-tests.yml`: job `Core browser tests`, no `continue-on-error`, 15 minutes, runs `scripts/list-core-specs.js`, uploads the report; T4 and T5a to T5c | automated + CI | a separate workflow file rather than a job in `e2e.yml`, because `tests/check-b2-ci-gate-config.js` pins that file's job list |
| AC7 (failing specs fixed or quarantined) | ✅ | all 29 failing or order-dependent spec files are lane `quarantined` with reason, owner (operator) and review date 2026-12-15; none deleted, no assertion weakened | automated (T2) | none fixed in this story; the reasons were checked by running specs and a local server and by reading code, and one was corrected (see Observations) |
| AC8 (core green twice on one commit) | ✅ | commit `2ab229061`: 106 passed, 3 skipped, 0 failed in both attempts (job 1m42s and 1m08s); also green on the final commit `9cdc72967` | live (CI) | an earlier core run failed on four specs that should not have been chosen (the AC4 defect); that is what AC8 exists to catch |

## Coverage

- The core covers 60.58% of server statements; all 89 specs run alone cover 64.68%; the `lpw-s1` whole-suite baseline was 63.3%. The core is therefore 2.7 points below that baseline, and 4.1 below the all-specs union. The AC required 95% of the passing-spec union (met: 99.30%), not parity with the baseline.
- Nothing is lost from the CI signal: the non-blocking `Playwright E2E smoke tests` job still runs every spec. What the core does not protect is listed per spec in `evidence/core-coverage.md`; the largest single loss is `ep2-s2-stage-visibility` (1119 statements nothing else covers).
- Capabilities with no passing core spec (gaps): pods, reference-and-stories, kanban-interaction, feature-creation.

## Source Issue Closure

No source issue.

## Observations and follow-ups

- **A wrong finding of mine was corrected.** I first recorded that the kanban specs fail because the board "no longer renders `data-journey-id`". That was wrong (a search cut short). Checked afterwards: staging's org board renders 8 columns and 40 visible cards; locally most board tests pass alone and fail only in the whole suite; the real failures are the three tests that click Advance (`{advanced: true}` but the card stays in its column) and an invalid `psh-s6`. `decisions.md` carries the correction.
- **The three "retire candidates" are not to be retired.** `reference-upload`, `dsda-s1` and `iwu2-right-panel-layout` test live features whose flows changed; each needs a rewrite. The reference modal has no UI entry (a product follow-up).
- **Staging capability walk** (`evidence/staging-capability-walk.md`): dashboard and nav, kanban board, skill launcher, journey canvas, completed-session pages, the signals list and (by the operator's own check) the artefact viewer are confirmed on staging; tenant isolation, in-progress session controls, and the sign-up and billing journeys cannot be checked read-only.
- **Review date risk.** Every quarantine entry has a review date of 2026-12-15 and the guard test fails once a date is past, so the unit suite will fail for every pull request after that date unless the entries are fixed, un-quarantined or re-dated. The gap stories below are meant to clear them first.
- **Not done, operator's:** adding `Core browser tests` to the ruleset, after it has been green on real pull requests.
- **Gap stories to scope:** `lpw-s3` (the Advance question, order-dependent board specs, `psh-s6`, feature creation, `bmau-s1`), `lpw-s4` (seed a team member so the pod specs run), `lpw-s5` (mock gateway for model-session specs, and the `ep2-s2` browser crash), and rewrites for the three live-feature specs.

## Scope Deviations

- A separate workflow file for the core job (see AC6).
- No journeys folded into Scenario A or B (decision recorded; different harness, no coverage gain).
- The "routes no browser test requested" list from `lpw-s1` was replaced by the per-file untouched list (31 of 201 files).
- No spec was fixed here; all failing specs were quarantined with checked reasons.
- T1 to T5 were written first and failed before the code, except that two later additions (`untouchedFiles`, its test T1f) were written alongside the fix.
