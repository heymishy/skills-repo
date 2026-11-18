## Test Plan: After a production promotion, a read-only job confirms production is running the promoted build and answering /health

**Story reference:** artefacts/2026-11-19-promotion-safety/stories/ppv-s1-post-promotion-verification.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-19
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New file: `tests/check-ppv-s1-post-promotion-verification.js`, plain Node, with injected `fetch` and `sleep` and no network. New script: `scripts/verify-production.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Matching sha and buildRunId plus healthy: exit 0 | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Other sha or run until timeout: exit non-zero with last seen state | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Version matches but /health not 200 ok: exit non-zero | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | Transient error then success: exit 0 | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | Only GET requests, only to the production host | 1 (T5) | - | - | - | - | 🟢 |
| AC6 | Failure opens one `production-verification` issue; no duplicate for the same sha | 2 (T6, T7) | - | - | - | - | 🟢 |
| AC7 | Workflow: needs, no environment, issues: write on the job only, wired to run sha and id, promote job has no if: | 1 (T8, reads the workflow) | - | - | - | - | 🟢 |

## Red-first plan

All eight tests fail before the change because the script and the job do not exist. The injected `fetch` default throws `Adapter not wired`, asserted in T5 (a call with no injected `fetch` must throw).

## Manual step

After the first promotion that carries this job, the operator confirms the job went green and that its log names the promoted sha and run id. A deliberate failure drill is not run against production. Recorded in the DoD.
