# Test Plan: promote-to-prod writes the real version stamp before deploying

**Story reference:** artefacts/2026-09-05-promote-to-prod-version-stamp/stories/ptvs-s1-promote-to-prod-writes-version-stamp.md
**Date:** 2026-09-05

---

## Test approach

AC1-AC5 are static YAML-shape assertions against `staging-deploy.yml`, testable locally. AC6 (does `GET /version` actually show real data after the next promotion) cannot be verified without a real production deploy -- RISK-ACCEPTed with mandatory post-merge manual re-check.

## Tests

| # | AC | Test | Type |
|---|----|------|------|
| T1 | AC1 | `promote-to-prod`'s own job block includes a `Set up Node.js` step | Automated (new) |
| T2 | AC2 | `promote-to-prod`'s own job block runs `node scripts/write-version-file.js` with `GITHUB_SHA: ${{ github.sha }}`, before `Deploy to production` | Automated (new) |
| T3 | AC3 | `promote-to-prod`'s own job block runs `node scripts/write-learnings-count-file.js`, before `Deploy to production` | Automated (new) |
| T4 | AC4 | `deploy-staging`'s own version-stamp/learnings-count steps are unchanged (byte-identical) | Automated (new) |
| T5 | AC5 | `tests/check-bri-s2.6-smoke-test-promote-gate.js` passes unmodified | Automated (existing, regression) |
| T6 | AC6 | Manual: after merge and the next real production promotion, `curl https://skills-framework.fly.dev/version` (or an authenticated browser check) shows a real `sha`/`shortSha`/`prNumber`, not the DEV_FALLBACK | Manual (verification script) |

**Total logical tests:** 6 (T1-T6).

## Gaps

No real Fly deploy available in this local test environment -- T6's manual re-check is the only way to confirm the actual fix, matching this session's own established pattern for every Docker/deploy-topology story so far.
