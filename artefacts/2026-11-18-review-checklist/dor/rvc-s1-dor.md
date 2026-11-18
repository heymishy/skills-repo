## Definition of Ready: A review checklist, seeded from recorded defects, shows the items a change's diff is likely to need

**Story reference:** artefacts/2026-11-18-review-checklist/stories/rvc-s1-diff-triggered-review-checklist.md
**Test plan reference:** artefacts/2026-11-18-review-checklist/test-plans/rvc-s1-test-plan.md
**Assessed by:** Claude Haiku 5.5
**Date:** 2026-11-18
**Track:** short

## Contract Proposal
See `artefacts/2026-11-18-review-checklist/dor/rvc-s1-dor-contract.md`.

## Contract Review
Contract review passed. All 7 acceptance criteria (AC) map to a named test. The exclusion list (workflows, gate files, skills, source) has no test assertion against it (B1/D1).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | "the reviewer, or the coding agent, checking a pull request" |
| H2 | At least 3 ACs in Given / When / Then | Pass | 7 ACs |
| H3 | Every AC has a test | Pass | see the test plan |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | Each seed cites a defect that escaped |
| H6 | Complexity rated | Pass | 2, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | `schemaDepends: []` |
| H9 | Architecture Constraints populated | Pass | advisory by design; blocking is out of scope |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | No CSS-layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | reliability, maintainability |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | None introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | new script under `scripts/` with a story artefact (artefact-first rule) |
| H-DESIGN | Design-token gate | Pass (N/A) | No UI |

**Hard blocks: 19/19 passed** (6 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | Accepted | The seed list is ten entries chosen from defects a diff can show; the rest of `workspace/learnings.md` stays out, by design |
| W5 | Accepted | Glob support is deliberately minimal (`*`, `**`); a pattern that needs more is a reason to rewrite the entry, not to add a library |

## Standards injection
Domain tags `[tooling] [review]`: read `scripts/verify.js` (the diff-free command style and check pattern), `CLAUDE.md` (the coding standards each seed cites), and the decisions files cited by seeds.

## Oversight level
**Low** - a new advisory script and a reference file; the operator reads the diff.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-18-review-checklist/stories/rvc-s1-diff-triggered-review-checklist.md
Test plan: artefacts/2026-11-18-review-checklist/test-plans/rvc-s1-test-plan.md
Contract: artefacts/2026-11-18-review-checklist/dor/rvc-s1-dor-contract.md
Goal: write tests/check-rvc-s1-review-checklist.js first and confirm it fails at require; then write scripts/review-checklist.js; then write REVIEW.md with the ten seeds, each source verified tracked with git ls-files; run --check and the diff mode against a real branch.
Constraints:
- Advisory only: no workflow, gate file, skill or source file changes.
- Every seed cites a tracked source; do not add an entry whose defect you cannot point to.
- Check the absolute path contains .worktrees/rvc-s1/ before every edit.
```
