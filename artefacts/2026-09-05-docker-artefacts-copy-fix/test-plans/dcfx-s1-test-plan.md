# Test Plan: Dockerfile production stage actually copies artefacts/ and .github/ into the image

**Story reference:** artefacts/2026-09-05-docker-artefacts-copy-fix/stories/dcfx-s1-dockerfile-copy-artefacts-and-github.md
**Date:** 2026-09-05

---

## Test approach

AC1-AC4 are static assertions against `Dockerfile`'s own text and the existing `daga-s1` regression suite, testable locally without a real Docker build (same documented environment gap `daga-s1`'s own test plan already named). AC5 (does this actually fix the live page) cannot be verified without a real deploy -- RISK-ACCEPTed with mandatory post-merge live-page re-check, using the exact same authenticated verification already performed once today (not a new, unverified procedure).

## Tests

| # | AC | Test | Type |
|---|----|------|------|
| T1 | AC1 | `Dockerfile` contains `COPY --chown=node:node artefacts/ ./artefacts/` | Automated (new) |
| T2 | AC2 | `Dockerfile` contains `COPY --chown=node:node .github/ ./.github/` | Automated (new) |
| T3 | AC1/AC2 | Both new `COPY` lines appear in the `production` stage (after the `FROM node:20-alpine AS production` line), not accidentally in the `builder` stage | Automated (new) |
| T4 | AC3 | No `COPY` line in the whole `Dockerfile` targets `.git` or `.git/` | Automated (new) |
| T5 | AC4 | `tests/check-daga-s1-dockerignore-and-writer-safety.js` (5 tests) still passes unmodified | Automated (existing, regression) |
| T6 | AC5 | Manual: after merge and a real production promotion, re-run today's exact live-page check (authenticated, `skills-framework.fly.dev/features/2026-04-14-skills-platform-phase3`) and confirm real artefact content renders, not the empty state | Manual (verification script) |

**Total logical tests:** 6 (T1-T6).

## Gaps

No `docker build`/`docker run` execution available in this local test environment -- same documented gap as `daga-s1`'s own test plan. T6's real post-deploy live-page check is the actual proof this story exists to produce; it is the single most important test in this plan, not an optional nice-to-have.
