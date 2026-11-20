## Definition of Ready: The keyboard-navigation E2E spec checks the nav links the sidebar has today, so it passes instead of timing out

**Story reference:** artefacts/2026-11-21-wuce18-spec-repair/stories/wkrp-s1-wuce18-current-nav-labels.md
**Test plan reference:** artefacts/2026-11-21-wuce18-spec-repair/test-plans/wkrp-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Track:** short

## Contract Proposal
- `tests/e2e/wuce18-keyboard-nav.spec.ts` (AC1 to AC3): the label list becomes Org board, Pod Manager, Signals, Journeys, with a comment saying why; mechanism and second test unchanged.
- `tests/e2e/capability-matrix.json` (AC4): the spec's entry moves from `quarantined` to `extended` with a rewritten reason, only after the pull request's CI run shows both tests passing.
- `decisions.md` and a DoD.
- Not built: no `src/` change, no nav change, no other spec, no workflow change, no `core` move.

## Contract Review
Contract review passed. All 5 acceptance criteria map to the spec itself, a CI report read, or a recorded manual step. The spec and the matrix are the required touchpoints and appear in no exclusion list.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. The change is test-only and goes through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator of the platform |
| H2 | At least 3 ACs in Given / When / Then | Pass | 5 ACs |
| H3 | Every AC has a test | Pass | AC4 and AC5 are a CI read and a diff check |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | none added or changed |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | The label list is tied to the nav as it is today; a later nav change will fail this spec again, which is its purpose. A shared source of truth for the labels is out of scope. |
| W2 | Accepted | Local runs create real `artefacts/*e2e*` folders; the agent works in a worktree and removes it afterwards, staging exact paths only. |
| W3 | Accepted | The matrix move is a second commit on the pull request; CI must run on that final commit before the merge is requested (bmrp-s1 recorded a merge without it). |

## Oversight level
**Low** - a test-only change. The operator reviews the pull request and merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-21-wuce18-spec-repair/stories/wkrp-s1-wuce18-current-nav-labels.md
Test plan: artefacts/2026-11-21-wuce18-spec-repair/test-plans/wkrp-s1-test-plan.md
Goal: replace the stale label list with the current main-section nav labels; run the spec alone at least three times; open a draft pull request; move the matrix entry only after CI shows both tests passing, then wait for CI on the final commit.
Constraints: spec and matrix only; preserve CRLF line endings; stage exact paths; no product change.
```
