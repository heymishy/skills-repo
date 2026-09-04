# DoR Contract: promote-to-prod writes the real version stamp before deploying

**Story reference:** artefacts/2026-09-05-promote-to-prod-version-stamp/stories/ptvs-s1-promote-to-prod-writes-version-stamp.md
**Test plan:** artefacts/2026-09-05-promote-to-prod-version-stamp/test-plans/ptvs-s1-test-plan.md
**Date:** 2026-09-05

---

## Scope

**MUST touch:**
- `.github/workflows/staging-deploy.yml` (`promote-to-prod` job only -- 3 new steps before the existing `Deploy to production` step)
- `tests/check-ptvs-s1-promote-to-prod-version-stamp.js` (new)

**MUST NOT touch:**
- `scripts/write-version-file.js`, `scripts/write-learnings-count-file.js` -- both reused as-is, confirmed to need no dependency install (only Node built-ins: `fs`, `path`, `child_process`).
- `deploy-staging`'s own already-working version-stamp steps -- confirmed by direct reading, zero changes needed there.
- `tests/check-bri-s2.6-smoke-test-promote-gate.js` -- confirmed by direct reading that its own assertions (environment gate, `--app` scoping, `needs: smoke-test`, no `if: always()` override) never inspect the steps preceding `Deploy to production`, so adding steps before it cannot collide.
- `src/web-ui/utils/version-info.js`, `getLearningsCount()`'s own fallback logic -- both remain correct safety nets, unchanged.

## Assumptions verified before sign-off

1. **`promote-to-prod`'s own job currently has zero Node setup at all** -- confirmed by reading the job in full (`checkout`, `setup-flyctl`, `Deploy to production` -- nothing else).
2. **Both scripts need no `npm ci`** -- confirmed by reading every `require(...)` line in both files: only `fs`, `path`, `child_process`, all Node built-ins.
3. **`deploy-staging`'s own exact invocation is the correct pattern to mirror** -- `node scripts/write-version-file.js` with `GITHUB_SHA: ${{ github.sha }}`, then `node scripts/write-learnings-count-file.js` with no env needed, confirmed by reading `deploy-staging`'s own steps directly.
4. **`check-bri-s2.6`'s own test file has zero assertions on the steps preceding `Deploy to production`** -- confirmed by direct reading, not assumed.

## Risk

**Rating: 1** (mechanical, mirrors an already-proven pattern from the same file; the only real risk -- does `GET /version` actually show real data afterward -- is a "wait and see" risk, not an implementation risk).

**RISK-ACCEPT:** AC6 (does the live endpoint actually show real data after the next promotion) cannot be verified without a real production deploy -- accepted via mandatory manual post-merge re-check. Logged in this feature's own `decisions.md`.

## Coding Agent Instructions

1. Add `Set up Node.js`, `Write version stamp` (`node scripts/write-version-file.js`, `GITHUB_SHA: ${{ github.sha }}`), and `Write learnings count` (`node scripts/write-learnings-count-file.js`) steps to `promote-to-prod`'s own job, before its existing `Deploy to production` step -- mirroring `deploy-staging`'s own exact step names/invocations.
2. Write `tests/check-ptvs-s1-promote-to-prod-version-stamp.js` covering T1-T4.
3. Run `tests/check-bri-s2.6-smoke-test-promote-gate.js` directly to confirm T5 passes unmodified.
4. Run the full suite (`npm test`) before considering the task complete.
5. TDD RED-state verification: stash the workflow change, re-run the new test file, confirm it fails against pre-fix content, then restore.
6. After merge and the next real production promotion, perform T6 (`curl https://skills-framework.fly.dev/version` or an authenticated browser check) personally -- do not skip it or treat it as optional, matching this session's own now-standing practice for every Docker/deploy-topology story.

## Proceed: Yes
