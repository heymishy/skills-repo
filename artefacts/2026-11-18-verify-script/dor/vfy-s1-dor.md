## Definition of Ready: One committed command boots the test server, runs the core browser lane, and prints what broke

**Story reference:** artefacts/2026-11-18-verify-script/stories/vfy-s1-verify-script.md
**Test plan reference:** artefacts/2026-11-18-verify-script/test-plans/vfy-s1-test-plan.md
**Assessed by:** Claude Haiku 5.5
**Date:** 2026-11-18
**Track:** short

## Contract Proposal
See `artefacts/2026-11-18-verify-script/dor/vfy-s1-dor-contract.md`.

## Contract Review
Contract review passed. All 5 acceptance criteria (AC) map to a named test or to the live run recorded in the DoD. The exclusion list (`playwright.config.js`, the server) has no test assertion against it beyond the live run (B1/D1).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | "the developer about to open a pull request" |
| H2 | At least 3 ACs in Given / When / Then | Pass | 5 ACs |
| H3 | Every AC has a test | Pass | see the test plan |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | Removes hand-run lane commands and log scrolling |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | `schemaDepends: []` |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | No CSS-layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | reliability, security |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | None introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | new script under `scripts/` with a story artefact (artefact-first rule) |
| H-DESIGN | Design-token gate | Pass (N/A) | No UI |

**Hard blocks: 19/19 passed** (6 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | Accepted | AC5's busy-port check is a bind attempt; a race can pass the check and still fail in Playwright, which reports the port too. Accepted: the check's purpose is a clear message, not a guarantee |

## Standards injection
Domain tags `[tests] [tooling]`: read `scripts/list-core-specs.js` (the selector), `playwright.config.js` (the `webServer` block), `.github/workflows/core-browser-tests.yml` (the CI command and env), and `tests/check-lpw-s2-capability-matrix.js` for the check style.

## Oversight level
**Low** - a new local script and its check; the operator reads the diff.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-18-verify-script/stories/vfy-s1-verify-script.md
Test plan: artefacts/2026-11-18-verify-script/test-plans/vfy-s1-test-plan.md
Contract: artefacts/2026-11-18-verify-script/dor/vfy-s1-dor-contract.md
Goal: write tests/check-vfy-s1-verify-script.js first and confirm it fails at require; then write scripts/verify.js until it passes; then run the live core lane and a temporary failing spec through the script, record both outputs in the DoD, and delete the temporary spec.
Constraints:
- Do not change playwright.config.js, the core lane, list-core-specs.js, any spec or the server.
- Use the same worker count and env as CI (.github/workflows/core-browser-tests.yml).
- Check the absolute path contains .worktrees/vfy-s1/ before every edit.
```
