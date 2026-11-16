## Test Plan: Scenario A and B end-to-end tests run against the pull request's own build before merge, and against the deployed staging before production

**Story reference:** artefacts/2026-11-17-scenario-e2e-on-pr-build/stories/sep-s1-scenario-e2e-on-the-pr-build.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-sep-s1-scenarios-on-pr-build.js` (reads the workflow files as text; no network). The behavioural proof is this PR's own CI run (AC5, AC6), which is the real test of the new environment.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Jobs keep names and boot the PR's server with the hermetic setup | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | No staging secret, staging URL or deploy-group in the two jobs; B independent of A | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Spec lists and flags unchanged | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | Promotion needs smoke-test and post-deploy confirmation; guards pass | 1 (T4) | the two guard test files | - | - | - | 🟢 |
| AC5 | Both jobs green on this PR three times, under 8 minutes | - | - | CI | - | CI-only | 🟡 |
| AC6 | A deliberate break turns a job red | - | - | CI | - | CI-only | 🟡 |
| AC7 | Next real deploy: confirmation runs and promotion waits | - | - | - | 1 | Live-only | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs real CI runs | AC5, AC6 | CI-only | Evidence links recorded on the PR; the first runs may need spec or workflow fixes, each recorded |
| Needs a real deploy | AC7 | Live-only | Verification script; observed on the next master deploy |

## Tests (new file `tests/check-sep-s1-scenarios-on-pr-build.js`)

- **T1 (AC1).** In `e2e.yml`, the two jobs by display name exist; each contains a `services:` block with a `postgres` image, a step that starts `node src/web-ui/server.js` with `MOCK_LLM_GATEWAY` `true`, a generated stub secret (`openssl rand` or `crypto`), and `E2E_STAGING_BASE_URL` set to `http://127.0.0.1`. Fails today (jobs use secrets).
- **T2 (AC2).** The text of each of the two jobs contains none of the four staging secrets nor `deploy-group`; the Scenario B job has no `needs:` line. Fails today.
- **T3 (AC3).** The `npx playwright test` command of Scenario A lists exactly the five spec files and `--workers=1`; Scenario B lists exactly `b1-formed-idea-outer-loop-story-map.spec.js`; both still read `staging_e2e_scenario_a` / `_b` from `context.yml`.
- **T4 (AC4).** In `staging-deploy.yml`, `promote-to-prod` has `needs:` containing both `smoke-test` and `post-deploy-e2e-confirm` and has no `if:` line; the two existing guard files are run as child processes and exit 0.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| The new environment may expose staging-only assumptions in specs | They have only ever run against real staging | Iterate on the PR; record each change in `decisions.md`; unchanged-spec rule in AC3 means a spec edit needs a recorded reason |
| A text check cannot prove the jobs work | It reads YAML | AC5 and AC6 are the proof, on real CI |

**Total automated tests:** 4 (T1 to T4) plus AC5, AC6 CI evidence and AC7 live.
