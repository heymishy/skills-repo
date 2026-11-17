# Contract Proposal - Required checks take their rules from master, and changes to gate files are visible

**What will be built:**
- `scripts/read-base-flag.js` (reads one `audit.*` flag from the base branch's `.github/context.yml`, fails closed).
- `.github/workflows/e2e.yml` (Scenario A and Scenario B jobs) and `.github/workflows/core-browser-tests.yml`: the flag step calls the script after fetching the base ref; nothing else changes.
- `.github/workflows/gate-files-changed.yml` (`pull_request_target`, observe mode, API-only, one updated comment) and `scripts/gate-files-changed.js` (`findGateFileChanges`, summary and comment text).
- `.github/gate-files.json`: the protected list and `mode: observe`.
- `scripts/ci-test-regression-check.js`: an optional base baseline; additions ignored and reported, removals honoured; `.github/workflows/pr-checks.yml` supplies master's baseline file.
- Four tests named in the test plan; if the `check-a5` and `check-b2` guards assert on the flag steps, matching edits to them, visible in the diff.
- `artefacts/2026-11-17-gate-integrity/decisions.md` and a Definition of Done.

**What will NOT be built:**
- No enforce mode, no ruleset change, no `CODEOWNERS`, no new identity for agent pull requests, no change to what the assurance gate checks, no change to the production environment, no new npm dependency, no YAML parser.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1, T4 | unit + real temporary git repositories |
| AC2 | T2, T4 | unit + workflow text |
| AC3 | T3 | unit |
| AC4 | T2 | unit |
| AC5 | this pull request's CI and the Definition of Done | live |

**Assumptions:** the base ref is fetchable in each job with `git fetch origin <base> --depth=1` (the jobs already have network access to the repository); `github.base_ref` is set on `pull_request` events; the pull-request files API gives the changed paths without checking out code; the existing guard tests assert on text this story changes (to be confirmed in the first task, since editing a guard is exactly the visible kind of change the story is about).

`schemaDepends: []`. **Estimated touch points:** Files: about 14 (two scripts, one json, three workflows, one new workflow, `pr-checks.yml`, the regression check, four tests, artefacts). Services: GitHub Actions. APIs: GitHub pull-request files and issue comments.

**Exclusion list check (B1/D1):** the excluded items (the ruleset, `CODEOWNERS`, the assurance gate's logic, the production environment) have no test assertion against them.
