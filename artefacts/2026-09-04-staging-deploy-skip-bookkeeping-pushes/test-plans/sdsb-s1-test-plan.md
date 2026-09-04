# Test Plan: Staging deploy workflow skips bookkeeping-only pushes to master

**Story reference:** artefacts/2026-09-04-staging-deploy-skip-bookkeeping-pushes/stories/sdsb-s1-skip-staging-deploy-for-bookkeeping-only-pushes.md
**Date:** 2026-09-04

---

## Test approach

GitHub Actions' own `paths-ignore` skip semantics execute entirely inside GitHub's own trigger evaluation -- there is no local harness that can execute a real push event and observe whether a run was skipped. Tests are therefore static: parse `staging-deploy.yml`'s own YAML, and assert the `on.push.paths-ignore` list has exactly the right shape. AC2/AC3's actual skip-vs-run behaviour is confirmed by real-world observation after merge (see the verification script), matching this repo's own established pattern for CSS-layout-dependent ACs (CLAUDE.md's B2 rule) applied here to a GitHub-native-behaviour-dependent AC.

## Tests

| # | AC | Test | Type |
|---|----|------|------|
| T1 | AC1 | `staging-deploy.yml`'s parsed YAML has `on.push.paths-ignore` containing exactly `['workspace/**', 'artefacts/**', '.github/pipeline-state.json']` (order-independent, length 3) | Automated (new) |
| T2 | AC1 (regression) | `on.push.branches` is still exactly `['master']` | Automated (new) |
| T3 | AC4 | `tests/check-bri-s2.5-ci-pipeline-staging-deploy.js` full suite still passes unmodified | Automated (existing, regression) |
| T4 | AC5 | `tests/check-bri-s2.6-smoke-test-promote-gate.js` full suite still passes unmodified | Automated (existing, regression) |
| T5 | AC2/AC3 | Manual: after merge, push a bookkeeping-only commit (e.g. a `workspace/state.json` touch) and confirm no new `staging-deploy.yml` run appears in Actions history for that commit; separately confirm a commit touching `src/`/`tests/` still triggers a run as before | Manual (verification script) |

**Total logical tests:** 5 (T1-T5; T3/T4 count as one reused-suite check each per this repo's `testPlan.totalTests` convention, not per-assertion).

## Gaps

Real GitHub Actions trigger-skip behaviour cannot be exercised in this local test environment (no way to simulate a real `push` webhook event against this exact workflow file without pushing to the real remote). T5's manual verification is the closest available confirmation and mirrors the CSS-layout-dependent-AC precedent already established in this repo (CLAUDE.md B2).
