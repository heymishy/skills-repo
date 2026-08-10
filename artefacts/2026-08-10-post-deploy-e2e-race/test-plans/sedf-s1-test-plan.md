## Test Plan: Fix the post-deploy CI race between smoke-test and post-deploy-e2e-confirm

**Story reference:** artefacts/2026-08-10-post-deploy-e2e-race/stories/sedf-s1-fix-post-deploy-e2e-race.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | Test | Gap type | Risk |
|----|-------------|------|----------|------|
| AC1 | needs: includes deploy-staging and smoke-test | check-pmec-s1 U1 (updated) | — | 🟢 |
| AC2 | if: preserves always-attempts-after-successful-deploy | Manual YAML inspection (no existing automated `if:` assertion for this job) | Gap, non-blocking | 🟡 |
| AC3 | promote-to-prod needs: unchanged | check-pmec-s1 U3, check-bri-s2.6 T5 | — | 🟢 |
| AC4 | existing governance tests all still pass | check-bri-s2.5, check-bri-s2.6, check-pmec-s1 | — | 🟢 |

---

## Coverage gaps

**AC2** (the `if:` condition's exact semantics) has no dedicated automated assertion — the existing test suite's convention (text/regex-based YAML checks, no js-yaml dependency, per `check-pmec-s1`'s own header comment) checks `needs:` shape but not `if:` condition semantics for this specific job. Accepted as a non-blocking gap for this short-track, low-complexity fix: the `if:` line is short, human-reviewable, and its correctness was verified directly against GitHub Actions' own documented `needs.<job>.result` context syntax during implementation. A follow-up could add a regex assertion for the literal `if: ${{ always() && needs.deploy-staging.result == 'success' }}` string if this job's conditional logic is touched again.

---

## Verification

- [x] `node tests/check-bri-s2.5-ci-pipeline-staging-deploy.js` — 7/7 passing, unmodified
- [x] `node tests/check-bri-s2.6-smoke-test-promote-gate.js` — 10/10 passing, unmodified
- [x] `node tests/check-pmec-s1-post-merge-e2e-confirmation.js` — 5/5 passing, U1 updated
- [x] `js-yaml` parse of `staging-deploy.yml` confirms valid syntax and the exact `needs:`/`if:` values on `post-deploy-e2e-confirm`

---

## Out of Scope for This Test Plan

- A live CI run confirming the race is actually gone (staging-deploy.yml only triggers on push to master) — verified post-merge instead, by checking the next few deploy runs' job timestamps show `post-deploy-e2e-confirm` starting only after `smoke-test` completes.

---

## Test Gaps and Risks

None identified as blocking beyond the AC2 gap noted above.
