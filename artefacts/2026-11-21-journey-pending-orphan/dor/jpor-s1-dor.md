## Definition of Ready: Creating a feature no longer leaves an untagged placeholder journey on disk that every tenant's dashboard counts

**Story reference:** artefacts/2026-11-21-journey-pending-orphan/stories/jpor-s1-no-orphan-pending-journey.md
**Test plan reference:** artefacts/2026-11-21-journey-pending-orphan/test-plans/jpor-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Track:** short

## Contract Proposal
- `src/web-ui/modules/journey-store.js` (AC1, AC2): `createJourney(featureSlug, productProfile, opts)`; when `opts.skipDisk` is true the disk save at creation is skipped; the PG write and the in-memory store are unchanged; default behaviour unchanged.
- `src/web-ui/routes/products.js` (AC3): the single `createJourney('pending', 'default')` call in `handlePostProductFeature` passes `{ skipDisk: true }`, with a comment saying why.
- `tests/check-jpor-s1-no-orphan-pending-journey.js` (T1 to T3), and the `dsa-s2` entry in `tests/e2e/capability-matrix.json` (AC6, only after CI shows the spec passing).
- `decisions.md` and a DoD.
- Not built: no deletion or migration of existing journey data, no dashboard filter change, no change to any other `createJourney` caller, no spec change, no `core` move.

## Contract Review
Contract review passed. All 7 acceptance criteria map to a named test, an existing spec run, or a recorded manual step. `journey-store.js` and `products.js` are required touchpoints and appear in no exclusion list; the files in the exclusion list (`routes/dashboard.js`, `routes/journey.js`, `server.js`, `modules/journey-disk.js`) have no assertion against them.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. `src/` changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | developer or operator on disk-backed journeys |
| H2 | At least 3 ACs in Given / When / Then | Pass | 7 ACs |
| H3 | Every AC has a test | Pass | AC4, AC6 and AC7 are a spec run, a CI read and a diff check |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | the disk adapter already exists and is wired in `server.js`; no adapter is added, and `createJourney` only gains an optional argument |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | Existing orphan `pending` directories on a machine are not removed, so a local `dsa-s2` run on a machine that already has one still fails until a developer deletes `workspace/journeys/pending` (the operator's own files; not deleted by this change). CI starts clean and is the authoritative measurement. |
| W2 | Accepted | Only the disk-adapter path changes; the Postgres deployment never wired the disk adapter and is unaffected, so there is nothing to observe there. |
| W3 | Accepted | The handler test (T3) needs the product-feature handler's fake pool; it reuses the shape of `check-das-s2-require-connected-repo.js`, whose assertion style is kept. The wiring is asserted by behaviour (what the disk adapter is asked to save), not by a function reference. |
| W4 | Accepted | The agent runs the full `npm test` and the CI regression script before pushing, and CI must run on the final commit (including the matrix commit) before the merge is requested; master is checked after the merge. |
| W5 | Accepted | Local E2E runs create real `artefacts/*e2e*` and `workspace/journeys` entries; the agent works in a worktree, removes it afterwards and stages exact paths only. |

## Oversight level
**Low** - a small change to journey creation on the disk-backed path. The operator reviews the pull request and merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-21-journey-pending-orphan/stories/jpor-s1-no-orphan-pending-journey.md
Test plan: artefacts/2026-11-21-journey-pending-orphan/test-plans/jpor-s1-test-plan.md
Goal: write the node check first and confirm T1 and T3 fail on master; then add the optional skipDisk argument to createJourney and pass it at the one placeholder call in handlePostProductFeature; run the new check, the das-s2 and jrf-s2 checks, the full npm test with the regression script, and dsa-s2 against an empty COPILOT_REPO_PATH; open a draft pull request; move the dsa-s2 matrix entry only after CI shows 8 of 8, then wait for CI on the final commit.
Constraints: journey-store.js, products.js, the new check and the matrix only; default createJourney behaviour unchanged; no deletion of any existing journey data; preserve line endings; stage exact paths.
```
