## Definition of Ready: Required checks take their rules from master, and changes to gate files are visible

**Story reference:** artefacts/2026-11-17-gate-integrity/stories/gic-s1-required-checks-read-rules-from-master.md
**Test plan reference:** artefacts/2026-11-17-gate-integrity/test-plans/gic-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Track:** short

## Contract Proposal
See `artefacts/2026-11-17-gate-integrity/dor/gic-s1-dor-contract.md`.

## Contract Review
Contract review passed. All 5 acceptance criteria (AC) map to a named test or a live step. The exclusion list (ruleset, `CODEOWNERS`, the assurance gate's logic, the production environment) has zero assertions against it (B1/D1 check).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | "the operator who merges every pull request" |
| H2 | At least 3 ACs in Given / When / Then | Pass | 5 ACs |
| H3 | Every AC has a test | Pass | AC1 T1 and T4, AC2 T2 and T4, AC3 T3, AC4 T2, AC5 live |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | Closes the sharpest hole in the audit: one flag turns a required check into a pass |
| H6 | Complexity rated | Pass | 2, Unstable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | `schemaDepends: []`; AC5 live |
| H9 | Architecture Constraints populated | Pass | ADR-011 named; platform change policy followed |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | security, reliability, runtime |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | None introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | No UI change |

**Hard blocks: 19/19 passed** (5 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | Pending | AC5 and the first real report of the new workflow are live-only |
| W5 | Accepted | `pull_request_target` is a known risk surface: the workflow must read only through the API and never run pull-request code (AC2 test and NFR) |
| W6 | Accepted | Observe mode only; enforcing is a later operator decision |

## Standards injection
Domain tags `[ci] [governance]`: read `.github/workflows/e2e.yml`, `core-browser-tests.yml`, `pr-checks.yml`, `scripts/ci-test-regression-check.js`, `tests/check-a5-ci-gate-config.js`, `tests/check-b2-ci-gate-config.js` and the audit first.

## Oversight level
**Medium** - it edits the workflows of the required checks, so the operator reads the diff of those jobs before merging. No separate named sign-off.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-17-gate-integrity/stories/gic-s1-required-checks-read-rules-from-master.md
Test plan: artefacts/2026-11-17-gate-integrity/test-plans/gic-s1-test-plan.md
Contract: artefacts/2026-11-17-gate-integrity/dor/gic-s1-dor-contract.md
Goal: write T1 to T4 first and confirm they FAIL today; build the base-flag reader and switch the three jobs to it; add the observe-mode workflow and its list; make the baseline decision ignore additions.
Constraints:
- Required checks keep their names. Fail closed if the base ref cannot be fetched.
- The pull_request_target workflow must never check out, install or run pull-request code; API only; it never fails in observe mode.
- No ruleset change, no enforce mode, no new npm dependency, no YAML parser.
- Work in a worktree under .worktrees/gic-s1; verify the absolute path before every edit. Stage only the files you changed (never a directory in the main checkout). Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Medium - the operator reads the diff of the three required jobs.
```

## Sign-off
**Oversight level:** Medium; **Sign-off required:** No named sign-off; the operator's review of the workflow diff at merge.
