## Definition of Ready: Three quarantined browser specs are rewritten against the product as it is and join the core suite

**Story reference:** artefacts/2026-11-18-quarantine-rewrites/stories/qrw-s1-rewrite-three-quarantined-specs.md
**Test plan reference:** artefacts/2026-11-18-quarantine-rewrites/test-plans/qrw-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Track:** short

## Contract Proposal
See `artefacts/2026-11-18-quarantine-rewrites/dor/qrw-s1-dor-contract.md`.

## Contract Review
Contract review passed. All 5 acceptance criteria (AC) map to a named spec or check. The exclusion list (`src/`) has no test assertion against it (B1/D1).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | "the operator who merges pull requests on the strength of the core browser suite" |
| H2 | At least 3 ACs in Given / When / Then | Pass | 5 ACs |
| H3 | Every AC has a test | Pass | see the test plan |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | Restores coverage of three capabilities; removes a dated guard failure |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | `schemaDepends: []` |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass | AC3's 38% cap is read from the inline style, not rendered pixels; the specs are Playwright |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | None introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | No UI change (`hasDesignSystemTrack` not set) |

**Hard blocks: 19/19 passed** (6 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | Accepted | The iwu2 38% assertion pins an inline style value; if the layout changes the spec changes with it, which is the intent of a layout spec |
| W5 | Accepted | The reference modal has no entry in the journey form; the spec reaches it by URL and says so |

## Standards injection
Domain tags `[web-ui] [tests]`: read `src/web-ui/views/chat-view.js` (right panel), `src/web-ui/routes/journey.js` (`handleGetReferenceModal` and the reference-upload handlers), `tests/e2e/fixtures/csrf.js`, and the lpw-s4 and lpw-s5 specs as the pattern.

## Oversight level
**Low** - test files and a data file; the operator reads the diff.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-18-quarantine-rewrites/stories/qrw-s1-rewrite-three-quarantined-specs.md
Test plan: artefacts/2026-11-18-quarantine-rewrites/test-plans/qrw-s1-test-plan.md
Contract: artefacts/2026-11-18-quarantine-rewrites/dor/qrw-s1-dor-contract.md
Goal: confirm each of the three specs fails today, rewrite them, move their matrix entries to core, run the three files and then the core lane with --workers=1.
Constraints:
- Nothing under src/ changes.
- Check the absolute path contains .worktrees/qrw-s1/ before every edit.
```
