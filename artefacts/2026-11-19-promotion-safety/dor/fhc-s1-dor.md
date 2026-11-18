## Definition of Ready: Production declares a Fly health check on /health

**Story reference:** artefacts/2026-11-19-promotion-safety/stories/fhc-s1-fly-health-check.md
**Test plan reference:** artefacts/2026-11-19-promotion-safety/test-plans/fhc-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-19
**Track:** short

## Contract Proposal
- `fly.toml` (AC1, AC2): one `[[http_service.checks]]` entry, `GET /health`, grace period 60 s, interval 15 s, timeout 5 s.
- `tests/check-fhc-s1-fly-health-check.js` (T1 to T5).
- `decisions.md` and a DoD.
- Not built: no change to `fly.staging.toml`, the workflow, the health handler, or the other `[http_service]` settings; no deep readiness check.

## Contract Review
Contract review passed. All 5 acceptance criteria map to a named test. `fly.toml` is a required touchpoint and is not excluded.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. `fly.toml` is a deploy configuration file; the change goes through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator who promotes builds |
| H2 | At least 3 ACs in Given / When / Then | Pass | 5 ACs |
| H3 | Every AC has a test | Pass | |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | none introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | Production runs one machine, so a failing check means a 503 rather than a broken page. |
| W2 | Accepted | The interaction with `auto_stop_machines = 'suspend'` cannot be tested in CI. The operator runs `flyctl status -a skills-framework` after the first promotion that carries this change. |

## Oversight level
**Medium** - production deploy configuration; the operator reviews the pull request.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-19-promotion-safety/stories/fhc-s1-fly-health-check.md
Test plan: artefacts/2026-11-19-promotion-safety/test-plans/fhc-s1-test-plan.md
Goal: write tests/check-fhc-s1-fly-health-check.js first and confirm T1 and T2 fail; then add the check to fly.toml.
Constraints:
- Do not change fly.staging.toml, any workflow, the health handler, or any other fly.toml setting.
- Do not deploy or run flyctl against production.
- Check the absolute path contains .worktrees/fhc-s1/ before every edit.
```
