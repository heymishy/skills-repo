## Definition of Ready: A feature the web app records in pipeline-state.json is complete enough to pass the repository's own checks

**Story reference:** artefacts/2026-11-18-writer-complete-feature-entries/stories/wfe-s1-writer-creates-complete-feature-entries.md
**Test plan reference:** artefacts/2026-11-18-writer-complete-feature-entries/test-plans/wfe-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Track:** short

## Contract Proposal
See `artefacts/2026-11-18-writer-complete-feature-entries/dor/wfe-s1-dor-contract.md`.

## Contract Review
Contract review passed. All 5 acceptance criteria (AC) map to a named test or existing suite. The exclusion list (routes, schema, integrity script, conflict handling) has no test assertion against it, so it does not contradict the test plan (B1/D1).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | "the operator who merges pull requests while colleagues start features in the web app" |
| H2 | At least 3 ACs in Given / When / Then | Pass | 5 ACs |
| H3 | Every AC has a test | Pass | AC1 T1a to T1c, AC2 T2, AC3 T3a and T3b, AC4 T4, AC5 existing suites |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | Removes a way for the app to break every open pull request |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | `schemaDepends: []` |
| H9 | Architecture Constraints populated | Pass | ADR-011 named |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | reliability, security |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | None introduced; the existing writer wiring is untouched |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | No UI change |

**Hard blocks: 19/19 passed** (6 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | Accepted | The production path (Contents API) is proved by a stubbed API only; the first live confirmation is the next feature started in the app |
| W5 | Accepted | `track: 'standard'` is a default; a feature the app starts is assumed to be standard-track |

## Standards injection
Domain tags `[web-ui] [pipeline-state]`: read both writers, `check-wsd-s2-github-pipeline-state-writer.js`, `scripts/check-pipeline-state-integrity.js` and `.github/pipeline-state.schema.json`.

## Oversight level
**Low** - a small change in two writers with a test; the operator merges the pull request. No named sign-off.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-18-writer-complete-feature-entries/stories/wfe-s1-writer-creates-complete-feature-entries.md
Test plan: artefacts/2026-11-18-writer-complete-feature-entries/test-plans/wfe-s1-test-plan.md
Contract: artefacts/2026-11-18-writer-complete-feature-entries/dor/wfe-s1-dor-contract.md
Goal: write T1a to T4 first and confirm T1c, T3a, T3b and T4 FAIL today; add the defaults to both writers' feature creation.
Constraints:
- Defaults only when the feature is created; an existing feature is never touched.
- The update's own feature-level values still win. No change to story handling, conflict detection, the retry or the PUT.
- No new npm dependency or adapter. Do not edit .github/pipeline-state.json or workspace/state.json from the worktree.
- Work in a worktree under .worktrees/wfe-s1; verify the absolute path before every edit. Stage only the files you changed.
Oversight level: Low.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No named sign-off.
