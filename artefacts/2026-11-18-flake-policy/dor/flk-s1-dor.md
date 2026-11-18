## Definition of Ready: A flake is a tracked, owned, time-limited entry in one ledger, and a rerun that passes is not a result until it is recorded

**Story reference:** artefacts/2026-11-18-flake-policy/stories/flk-s1-flake-ledger-and-rerun-rule.md
**Test plan reference:** artefacts/2026-11-18-flake-policy/test-plans/flk-s1-test-plan.md
**Assessed by:** Claude Haiku 5.5
**Date:** 2026-11-18
**Track:** short

## Contract Proposal
- `tests/FLAKE-POLICY.md` (AC1), `tests/e2e/flake-ledger.json` (empty, AC6), `scripts/flake-check.js` (AC2 to AC5), `tests/check-flk-s1-flake-policy.js` (T1 to T6), a `decisions.md` entry and a DoD.
- Not built: no change to `playwright.config.js`, the workflows, the capability matrix, or any spec; no CI step.

## Contract Review
Contract review passed. All 6 acceptance criteria map to a named test or a check run. The exclusion list has no test assertion against it.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | "the operator who merges on a green core suite" |
| H2 | At least 3 ACs in Given / When / Then | Pass | 6 ACs |
| H3 | Every AC has a test | Pass | see the test plan |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | `schemaDepends: []` |
| H9 | Architecture Constraints populated | Pass | advisory where enforcement is not possible, stated |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | the date is an argument, not an adapter |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | new script under `scripts/` with a story artefact (artefact-first rule) |
| H-DESIGN | Design-token gate | Pass (N/A) | |

**Hard blocks: 19/19 passed** (6 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | Accepted | Nothing enforces the rerun rule in CI; the policy says so and the check is advisory until the operator decides otherwise |
| W5 | Accepted | The ledger is empty on day one; the repository's history of flakes is not reconstructed |

## Oversight level
**Low** - documentation, one ledger file and one check script.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-18-flake-policy/stories/flk-s1-flake-ledger-and-rerun-rule.md
Test plan: artefacts/2026-11-18-flake-policy/test-plans/flk-s1-test-plan.md
Goal: write tests/check-flk-s1-flake-policy.js first and confirm it fails at require; then write scripts/flake-check.js, the empty ledger and tests/FLAKE-POLICY.md.
Constraints:
- Do not change playwright.config.js, any workflow, the capability matrix or any spec.
- The ledger stays empty; no entry without evidence.
- Check the absolute path contains .worktrees/flk-s1/ before every edit.
```
