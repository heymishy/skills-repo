## Definition of Ready: Re-seeding the shared E2E test session no longer invalidates the CSRF token of a test that is already running

**Story reference:** artefacts/2026-11-20-e2e-session-reseed-csrf/stories/tiso-s1-reseed-keeps-csrf-token.md
**Test plan reference:** artefacts/2026-11-20-e2e-session-reseed-csrf/test-plans/tiso-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Track:** short

## Contract Proposal
- `src/web-ui/middleware/session.js` (AC1 to AC3, AC5): `seedTestSession` carries the existing `csrfToken` over when it replaces the session, nothing else; signature and guard unchanged.
- `tests/check-tiso-s1-reseed-keeps-csrf-token.js` (T1 to T4) and `tests/e2e/tiso-s1-reseed-keeps-csrf.spec.js` (T-E1), and its entry in `tests/e2e/capability-matrix.json` (the lpw-s2 rule: every spec appears once; found by CI in ctab-s1, so listed here from the start).
- `decisions.md` and a DoD.
- Not built: no per-spec sessions or tenants, no change to the `/test/session` route, `withAuth`, any other spec, any workflow, or `continue-on-error`; no lane change for any other spec (done afterwards, all together, at the operator's request).

## Contract Review
Contract review passed. All 7 acceptance criteria map to a named test, an existing spec run, or a recorded manual step. `session.js` is a required touchpoint and appears in no exclusion list; the files in the exclusion list (`server.js`, `fixtures/auth.js`, other specs) have no assertions in the new tests.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. `src/` changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator of the platform |
| H2 | At least 3 ACs in Given / When / Then | Pass | 7 ACs |
| H3 | Every AC has a test | Pass | AC6 and AC7 are recorded manual steps |
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
| W1 | Accepted | Only the CSRF token is carried over. Other state that parallel specs share (the roster, pods, the journey list of the `e2e-tester` tenant) is not touched, so the failures that come from shared data (`dsa-s2` counts, `ep1-s4` before esh-s1, and others) are expected to remain; this story removes one cause, measured, not all of them. |
| W2 | Accepted | `seedTestSession` is also reached from `/test/session` on staging through the dss-s1 bypass (`allowOutsideTest`). The carry-over applies there too, which is the intended effect (the same defect class exists for the Scenario A and B specs against staging), and is limited to the session the route seeds. |
| W3 | Accepted | AC6 is a repeated-run measurement of a timing-dependent failure; the deterministic proof is T-E1. If any of the five runs fails for another reason, it is recorded and diagnosed, not retried away. |
| W4 | Accepted | The agent runs the full `npm test` and the CI regression script before pushing, and the capability-matrix check specifically, since a new spec file needs its entry. |
| W5 | Accepted | Local runs create real `artefacts/*e2e*` folders; the agent works in a worktree and removes it afterwards, staging exact paths only. |

## Oversight level
**Low** - a change to a test-support function that refuses to run outside test mode (or the staging bypass). The operator reviews the pull request and merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-20-e2e-session-reseed-csrf/stories/tiso-s1-reseed-keeps-csrf-token.md
Test plan: artefacts/2026-11-20-e2e-session-reseed-csrf/test-plans/tiso-s1-test-plan.md
Goal: write the node check and the E2E spec first and confirm T1 and T-E1 fail; then change seedTestSession so a re-seed keeps an existing csrfToken and replaces everything else; run the new tests, the existing session and CSRF checks, the full npm test with the CI regression script, and the repeated-run measurement; open a draft PR.
Constraints:
- Touch only seedTestSession in src/web-ui/middleware/session.js, the new check, the new spec, one capability-matrix entry, and artefacts.
- Do not change the /test/session route, withAuth, any other spec, any workflow, or continue-on-error; do not move any other spec between lanes.
- Preserve each file's existing line endings.
- Local runs happen in the worktree; remove only what the run created, by exact path; never git add a directory in the main checkout.
- Check the absolute path contains .worktrees/tiso-s1/ before every edit.
```
