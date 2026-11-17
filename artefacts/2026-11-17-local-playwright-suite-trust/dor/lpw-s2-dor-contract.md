# Contract Proposal - A small required core of browser tests, chosen by capability and measured coverage

**What will be built:**
- `scripts/measure-playwright-spec-coverage.js` (per-spec run, pure helpers, JSON and Markdown report), `scripts/capability-matrix.js` (`validateMatrix`), `scripts/select-core-specs.js` (`selectCore`), `scripts/list-core-specs.js`.
- `.github/workflows/playwright-spec-coverage.yml`: runs the measurement; triggers only on a pull request that changes the workflow or the script, and on manual start; pinned `c8`; at most 60 minutes.
- `tests/e2e/capability-matrix.json`: every spec file once, with capability, lane and (for quarantined) reason, owner, entry date and review date.
- `.github/workflows/core-browser-tests.yml` (new): a job `Core browser tests` (blocking, no `continue-on-error`, 15 minutes, runs the files from `list-core-specs.js`, uploads the report), gated by `audit.core_browser_tests` in `context.yml`. `e2e.yml` is not changed.
- Four guard tests named in the test plan.
- Spec, fixture or fake-database fixes for the kanban, model-session and pod groups where one shared environment cause is found and confirmed in CI.
- `evidence/per-spec-coverage.md`, `evidence/core-coverage.md`, and `decisions.md` entries (lanes, retire candidates, the fold decision, the two CI runs).

**What will NOT be built:**
- No ruleset change and no making any job required. No folding of journeys into Scenario A or B. No deletion or retirement of any spec and no weakened assertion. No production behaviour change, no change to real Postgres code paths, no new npm dependency, no server request log.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1, T5, one CI measurement run | unit + CI |
| AC2 | the recorded evidence file | live |
| AC3 | T2 on the real matrix and on cases | unit |
| AC4 | T3, and the recorded selection | unit + recorded |
| AC5 | the recorded evidence file; core at least 95% of union | live |
| AC6 | T4, T5, CI run | unit + CI |
| AC7 | T2 lane rules, CI results per fixed spec | unit + CI |
| AC8 | two CI runs on one commit | live |

**Assumptions:** one `c8` JSON report per spec directory can be read for statement hit counts; a spec run alone on a fresh server (Playwright `webServer` with `LPW_SERVER_COVERAGE_DIR`) behaves as it does in the whole-suite run except where it relied on earlier specs' state (recorded as a difference in AC2); `tests/check-a5-ci-gate-config.js` and the b2 check inspect only the `e2e` job block, so a new job in the same file does not change their count (verified before the job is added).

`schemaDepends: []`. **Estimated touch points:** Files: about 20 (four scripts, one matrix, two workflows, four tests, evidence, a handful of specs and fixtures). Services: GitHub Actions. APIs: none.

**Exclusion list check (B1/D1):** the excluded items (ruleset, Scenario jobs, spec deletion, production code, request log) have no test assertion against them; T5 asserts on `e2e.yml` and the new workflow, which are in scope.
