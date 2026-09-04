# DoR Contract: Stream npm lifecycle-script output in the two slow staging-deploy.yml jobs

**Story reference:** artefacts/2026-09-04-npm-ci-timing-diagnostic-visibility/stories/ncdv-s1-stream-npm-lifecycle-script-output-in-slow-jobs.md
**Test plan:** artefacts/2026-09-04-npm-ci-timing-diagnostic-visibility/test-plans/ncdv-s1-test-plan.md
**Date:** 2026-09-04

---

## Scope

**MUST touch:**
- `.github/workflows/staging-deploy.yml` (`deploy-staging` and `post-deploy-e2e-confirm` jobs' own `npm ci` `run:` lines only)
- `tests/check-ncdv-s1-npm-ci-foreground-scripts.js` (new)

**MUST NOT touch:**
- `smoke-test`'s own `npm ci` step (already fast, no diagnostic need, explicitly out of scope per the story).
- `pr-checks.yml`, `e2e.yml`, `bri-s3.4-cross-tenant-repeat-gate.yml`, `archive-session-turns.yml` -- none have shown the slow pattern.
- The 4 existing regression-guard test files -- confirmed via direct reading that none assert on the exact `npm ci` command-line flags beyond what they already check (env vars, cache steps), so adding a flag to the `run:` string does not collide.
- `package.json`, `package-lock.json`, `node_modules/bcrypt` -- no dependency change, diagnostic-only.

## Assumptions verified before sign-off

1. **`--foreground-scripts` is npm's own documented, purely-cosmetic flag** (streams lifecycle-script output to the parent process's stdout/stderr in real time instead of buffering it) -- does not change install behaviour, package resolution, timing, or exit codes. Confirmed against npm's own documented CLI flag semantics.
2. **None of the 4 existing regression-guard test files assert on the literal `npm ci` command string beyond checking for its presence and nearby `env:`/cache-step shape** -- confirmed by reading all 4 files; none use a strict full-line-match regex that `--foreground-scripts` being appended would break.
3. **This is a genuinely low-risk, reversible change** -- if it turns out not to help diagnose anything, it can be removed in a follow-up with zero migration cost, since it has no other effect.

## Risk

**Rating: 1** (single-flag addition to 2 existing `run:` lines, no behavioural change, fully covered by static assertion; the only real risk -- AC4's own diagnostic value -- is a "wait and see" risk, not an implementation risk).

**RISK-ACCEPT:** AC4 (whether the streamed output actually explains the slowness next time it recurs) cannot be verified until a real recurrence -- accepted via manual post-merge observation, consistent with this repo's own established precedent. Logged in this feature's own `decisions.md`.

## Coding Agent Instructions

1. Append `--foreground-scripts` to the `npm ci` command in `deploy-staging`'s and `post-deploy-e2e-confirm`'s own `run:` lines only.
2. Write `tests/check-ncdv-s1-npm-ci-foreground-scripts.js` covering T1-T4.
3. Run the 4 existing regression-guard suites directly to confirm T5-T8 pass unmodified.
4. Run the full suite (`npm test`) before considering the task complete.
5. TDD RED-state verification: stash the workflow change, re-run the new test file, confirm it fails against pre-fix content, then restore.

## Proceed: Yes
