# Story: promote-to-prod writes the real version stamp before deploying

**Slug:** ptvs-s1
**Track:** Short-track (bugs, small fixes, bounded refactors)
**Date:** 2026-09-05

---

## Problem

`GET /version` on production (`skills-framework.fly.dev`) always returns `{"sha":null,"shortSha":"dev","prNumber":null,"commitSubject":null,"deployedAt":null}` -- the `version-info.js` `DEV_FALLBACK`, regardless of what commit is actually deployed. Found during the `dcfx-s1` investigation (2026-09-05) while checking whether a real production build was running.

Root cause: `write-version-file.js` (which generates `version.json`, the file the Docker image's own optional `COPY version.jso[n] ./` line picks up -- see `alrf-s2`) and `write-learnings-count-file.js` (same optional-copy pattern, `lcdf-s1`) both only run inside `staging-deploy.yml`'s `deploy-staging` job, immediately before that job's own `flyctl deploy --app wuce-staging` step. `promote-to-prod`'s own job -- a separate job, with its own separate `flyctl deploy --app skills-framework` step -- never runs either script. Its own checkout has no `version.json`/`learnings-count.json` present, so the Docker build's optional-copy lines match nothing, and the running production container falls back to `version-info.js`'s `DEV_FALLBACK` and `getLearningsCount()`'s own fail-open fallback every time, forever.

This means the one tool this repo built specifically to answer "which build is actually running in production?" (`alrf-s2`'s own stated purpose) has never actually worked for a real production deploy -- only for staging.

## As a / I want / So that

As the operator relying on `GET /version` to confirm what's actually deployed to production
I want `promote-to-prod`'s own job to write the same real version stamp `deploy-staging` already writes, before its own deploy step
So that `GET /version` on `skills-framework.fly.dev` answers "which build is this?" correctly, matching what this endpoint was originally built to do

## Acceptance Criteria

- **AC1:** `promote-to-prod`'s own job in `staging-deploy.yml` includes a `Set up Node.js` step (currently absent -- the job has no Node setup at all today).
- **AC2:** `promote-to-prod`'s own job runs `node scripts/write-version-file.js` (with `GITHUB_SHA: ${{ github.sha }}`, matching `deploy-staging`'s own exact invocation) before its own `Deploy to production` step.
- **AC3:** `promote-to-prod`'s own job runs `node scripts/write-learnings-count-file.js` before its own `Deploy to production` step, matching `deploy-staging`'s own exact invocation.
- **AC4 (regression guard):** `deploy-staging`'s own existing version-stamp/learnings-count steps are untouched -- this story only adds equivalent steps to `promote-to-prod`, it does not modify the already-working `deploy-staging` job.
- **AC5 (regression guard):** `tests/check-bri-s2.6-smoke-test-promote-gate.js` (the existing suite asserting things about `promote-to-prod`'s own job shape) still passes unmodified.
- **AC6 (real-world, RISK-ACCEPTed):** after merge and the next real production promotion, `GET https://skills-framework.fly.dev/version` returns the real deployed commit's SHA/PR number/subject, not the DEV_FALLBACK -- cannot be verified locally (no real Fly deploy available in this environment), only via a real promotion.

## Out of scope

- Any change to `deploy-staging`'s own already-working version-stamp steps.
- Any change to `version-info.js`'s own `DEV_FALLBACK` logic or `getLearningsCount()`'s own fail-open fallback -- both remain correct, necessary safety nets for the case where `version.json`/`learnings-count.json` genuinely aren't present (e.g. a local `docker build` run without either script having run first); this story just ensures `promote-to-prod` populates them like `deploy-staging` already does, not that the fallbacks themselves change.
- Neither script needs `npm ci` -- both use only Node built-ins (`fs`, `path`, `child_process`), confirmed by reading both files in full; no dependency-install step is added to `promote-to-prod`.

## Benefit linkage

Restores the originally-intended function of `GET /version` (and the landing page's own "learnings captured" count) for real production deploys, not just staging -- closes a real observability gap found during today's own investigation into a different, more serious bug (`dcfx-s1`). No formal benefit-metric artefact -- short-track story, consistent with every other short-track delivery this session.
