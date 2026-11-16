## Definition of Ready: Stop opening an incident PR per production error issue; record the incident in the fix PR instead

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/inc-s2-record-incidents-in-the-fix-pr.md
**Test plan reference:** artefacts/2026-11-16-ci-regression-review/test-plans/inc-s2-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-ci-regression-review/dor/inc-s2-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Four files touched (one workflow, one new script, one new test, one edited test); all 8 acceptance criteria (AC) map to a named test, the full suite, or a live scenario. The exclusion list (the bridge, the existing CLI and library, the recorder, deletions, auto-merge, dependencies, other workflows) has zero test assertions against it, and the touched files are exactly those the tests need (B1/D1 check: `check-coha-s7-error-issue-incident.js` asserts the workflow and is a listed, required touchpoint).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 8 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T4, AC5 T5, AC6 T6, AC7 full suite, AC8 live |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Removes unreviewed bot PRs and about 23% of PR gating runs |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC8 live-only |
| H9 | Architecture Constraints populated | ✅ | ADR-011 named; ADR-009 deviation noted; platform change policy |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Security, reliability, performance |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | ⚠️ Pending operator | AC8 needs the next natural production error; no deliberate error is created |
| W5 | ⚠️ Accepted | Incidents nobody acts on are no longer recorded automatically; the issue remains the record. The operator accepted this on 2026-11-16 (none of the automatic records had ever landed) |
| W6 | ⚠️ Accepted | The local script needs the bridge author's login (`--author` or `ERROR_BRIDGE_AUTHOR`); it is deliberately not read from the issue, so a forged issue cannot vouch for itself |

## Standards injection
Domain tags `[ci, incident-handling]`: no matching standards file; the agent reads `.github/architecture-guardrails.md` and the coha-s7 artefacts (the incident-record story's decisions.md under `artefacts/`, found by searching for `coha-s7`).

## Oversight level
**Low** - removes a trigger and adds a local helper over an existing recorder. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-ci-regression-review/stories/inc-s2-record-incidents-in-the-fix-pr.md
Test plan: artefacts/2026-11-16-ci-regression-review/test-plans/inc-s2-test-plan.md
Contract: artefacts/2026-11-16-ci-regression-review/dor/inc-s2-dor-contract.md
Goal: write tests/check-inc-s2-record-incident-locally.js (T1 to T6) first and confirm T1, T2 and T3 FAIL for the right reason (issues trigger present, no header, script missing); then edit the workflow trigger and header, add the script, and change coha-s7 W1.
Constraints:
- The script reuses scripts/error-issue-incident.js (plan, then build) through child processes; do not copy its logic. Never default the author to the issue's own author. No git command, no gh pr, only the one read `gh api` call.
- Workflow: remove only the `issues` trigger and extend the header; keep jobs, permissions, concurrency and inputs as they are (W2 to W5 must pass unchanged).
- Edit tests/check-coha-s7-error-issue-incident.js W1 only; list the edit in the evidence.
- Stage only the files you changed (never `git add -A` on artefacts/ after a full-suite run). No new npm dependencies.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
