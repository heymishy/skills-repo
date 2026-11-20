## Definition of Ready: The bulk-assign E2E spec opens the collapsed group it clicks in, so it passes instead of timing out

**Story reference:** artefacts/2026-11-21-bmau-s1-spec-repair/stories/bmrp-s1-bmau-s1-opens-collapsed-group.md
**Test plan reference:** artefacts/2026-11-21-bmau-s1-spec-repair/test-plans/bmrp-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Track:** short

## Contract Proposal
- `tests/e2e/bmau-s1-bulk-assign-rerender.spec.js` (AC1 to AC4): open the Unclassified group and assert `aria-expanded="true"` before the checkboxes are used; replace the stale header comment; every original assertion kept.
- `tests/e2e/capability-matrix.json` (AC5): the spec's entry moves from `quarantined` to `extended` with a rewritten reason, only after the pull request's CI run shows it passing.
- `decisions.md` and a DoD.
- Not built: no `src/` change, no fake-database change, no other spec, no workflow change, no `core` move.

## Contract Review
Contract review passed. All 6 acceptance criteria map to the spec itself, a CI report read, or a recorded manual step. The spec and the matrix are the required touchpoints and appear in no exclusion list.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. The change is test-only and goes through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator of the platform |
| H2 | At least 3 ACs in Given / When / Then | Pass | 6 ACs |
| H3 | Every AC has a test | Pass | AC5 and AC6 are a CI read and a diff check |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no layout AC; the spec only waits for the group to open |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | none added or changed |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | The spec has never passed on CI, so it may fail further on after the first fix (the second half, the re-render, has not run before in this harness). If it does, the next cause is diagnosed and recorded, and the spec stays quarantined until it passes. |
| W2 | Accepted | Local runs create real `artefacts/*e2e*` folders; the agent works in a worktree and removes it afterwards, staging exact paths only. |

## Oversight level
**Low** - a test-only change. The operator reviews the pull request and merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-21-bmau-s1-spec-repair/stories/bmrp-s1-bmau-s1-opens-collapsed-group.md
Test plan: artefacts/2026-11-21-bmau-s1-spec-repair/test-plans/bmrp-s1-test-plan.md
Goal: open the Unclassified group before the checkboxes are used, replace the stale header, keep every assertion; run the spec alone at least three times; open a draft pull request; move the matrix entry only after CI shows the spec passing.
Constraints: spec and matrix only; preserve line endings; stage exact paths; no product change.
```
