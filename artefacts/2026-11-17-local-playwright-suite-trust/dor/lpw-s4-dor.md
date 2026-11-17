## Definition of Ready: The four pod browser specs run against a seeded team roster and join the browser suite

**Story reference:** artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s4-pods-browser-specs-seeded-roster.md
**Test plan reference:** artefacts/2026-11-17-local-playwright-suite-trust/test-plans/lpw-s4-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Track:** short

## Contract Proposal
See `artefacts/2026-11-17-local-playwright-suite-trust/dor/lpw-s4-dor-contract.md`.

## Contract Review
Contract review passed. All 5 acceptance criteria (AC) map to a named test. The exclusion list (`src/web-ui/public/`, `modules/`, `routes/`) has no test assertion against it other than T5, which asserts it is unchanged, so it does not contradict the test plan (B1/D1).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | "the operator who relies on the browser suite" |
| H2 | At least 3 ACs in Given / When / Then | Pass | 5 ACs |
| H3 | Every AC has a test | Pass | AC1 T1a to T1c, AC2 T2a to T2c, AC3 the four specs, AC4 T4a and T4b, AC5 T5 |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | Closes the "pods" gap in the capability matrix |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | `schemaDepends: []` |
| H9 | Architecture Constraints populated | Pass | ADR-011 named |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | No CSS-layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | security, reliability, runtime |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | None introduced; a test route writes to the existing fake database |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | No UI change (`hasDesignSystemTrack` not set) |

**Hard blocks: 19/19 passed** (6 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | Accepted | AC3 is proven by running the specs in CI's core job; the local order-dependence check is two runs, not a proof |
| W5 | Accepted | Seeding members enlarges the roster for other specs that share the `e2e-tester` tenant; the story says specs must not rely on an empty roster |

## Standards injection
Domain tags `[testing] [web-ui]`: read `tests/e2e/capability-matrix.json`, `src/web-ui/adapters/fake-test-db.js` (lines 670 to 763), the sibling `/test/seed-*` routes in `src/web-ui/server.js` for the guard and response shape, and the four specs.

## Oversight level
**Low** - test-only code and specs; no product behaviour changes. No named sign-off.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s4-pods-browser-specs-seeded-roster.md
Test plan: artefacts/2026-11-17-local-playwright-suite-trust/test-plans/lpw-s4-test-plan.md
Contract: artefacts/2026-11-17-local-playwright-suite-trust/dor/lpw-s4-dor-contract.md
Goal: write T1a to T5 first and confirm they FAIL today; add POST /test/seed-team-member (test mode only); update the four specs to seed and select the seeded names; move the specs out of quarantine and at least one into the core.
Constraints:
- Test mode only, same inline NODE_ENV guard as the other seed routes; writes only to the fake test database.
- No change under src/web-ui/public/, modules/ or routes/; no new npm dependency.
- Specs must not assume an empty roster, and must pass alone and in core order.
- Work in a worktree under .worktrees/lpw-s4; verify the absolute path before every edit. Stage only the files you changed (never a directory in the main checkout). Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree.
Oversight level: Low.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No named sign-off.
