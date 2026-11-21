## Definition of Ready: The first post-deploy auth call gets a cold-start budget, and the /admin/credits call records what it needs to explain its flake

**Story reference:** artefacts/2026-11-21-staging-flake-fixes/stories/sfx-s1-a1-cold-start-and-admin-credits-diagnostics.md
**Test plan reference:** artefacts/2026-11-21-staging-flake-fixes/test-plans/sfx-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Track:** short

## Contract Proposal
- `tests/e2e/fixtures/latency-budget.js` (new, AC1, AC2): `evaluateBudgets({ coldMs, warmMs })`, `COLD_START_BUDGET_MS` 15000, `WARM_BUDGET_MS` 5000, failing closed on a missing timing.
- `tests/e2e/fixtures/admin-credits-diagnostics.js` (new, AC3): `summariseAdminCreditsCall`, `countTenantRows`.
- `tests/e2e/a1-staging-auth-stub.spec.js` (AC1): AC1 times a first and a second stub login; judged by `evaluateBudgets`; its other assertions unchanged.
- `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js` (AC3): one diagnostics line per `/admin/credits` call, error logged and rethrown; assertions unchanged.
- `tests/e2e/flake-ledger.json` (AC4): the `bri-s3.3` note gains the 2026-11-21 occurrence; dates unchanged.
- `tests/check-sfx-s1-staging-flake-fixes.js` (F1 to F18), `decisions.md`, and the feature registered in `.github/pipeline-state.json` on this branch (bundled; no master push).
- Not built: no change to `src/`, `playwright.config.js`, any workflow, the NFR itself, or the pull request Scenario A and B jobs; no retry inside the test; no batching of the `/admin/credits` queries; no ledger deletion or renewal.

## Contract Review
Contract review passed. All 5 acceptance criteria map to a named assertion, the real local spec run or the CI read. The two specs, the two fixtures and the ledger are required touchpoints and appear in no exclusion list; `src/` and the workflows are excluded and have no assertion in the new check beyond reading the ledger and running the existing checks.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. Test changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator reviewing the flake ledger |
| H2 | At least 3 ACs in Given / When / Then | Pass | 5 ACs |
| H3 | Every AC has a test | Pass | AC5 is a local spec run plus the CI read |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no pipeline-state schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | safety and evidence stated |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | no adapter |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | The cold-start budget (15 s) is a judgment: it is larger than any observed cold call and is a ceiling, not an exemption. If cold starts get slower than that the first call fails and the number is revisited with data. |
| W2 | Accepted | The `bri-s3.3` change records evidence only; if the evidence points at the per-tenant plan lookups, a separate story batches them (product code, its own tests). |
| W3 | Accepted | The ledger entries' dates are unchanged: the operator still reviews them by 2026-12-05, after which `check-flk-s1` fails unless they are fixed, removed or renewed. |
| W4 | Accepted | The `a1` spec cannot run without the staging secret locally; it runs on the next post-deploy confirmation. |
| W5 | Accepted | Feature registered in the branch (no master push); CI on the final commit; remote head verified after every push; exact paths staged; worktree removed junction-first; merging this supersedes any waiting promotion, so the agent says so before asking for the merge. |

## Oversight level
**Low** - test-only changes with unchanged assertions. The operator reviews the pull request and merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-21-staging-flake-fixes/stories/sfx-s1-a1-cold-start-and-admin-credits-diagnostics.md
Test plan: artefacts/2026-11-21-staging-flake-fixes/test-plans/sfx-s1-test-plan.md
Goal: write the node check first and confirm it fails on the unchanged specs; add the two fixtures; change a1 AC1 and bri-s3.3 AC1; add the ledger note; mutation-check; run the real bri-s3.3 spec locally; run the new check, sfr-s1, flk-s1 and the full npm test with the regression script; open a draft pull request naming artefacts/2026-11-21-staging-flake-fixes/; wait for CI on the final commit.
Constraints: specs, the two fixtures, the ledger note, the new check and artefacts only; no assertion weakened; preserve CRLF; stage exact paths; no push to master; verify the remote head after every push.
```
