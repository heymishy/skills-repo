## Test Plan: Fix the over-broad Stripe-key grep scope

**Story reference:** artefacts/2026-07-16-ci-flake-grep-fix/stories/cfg-s1-scope-stripe-key-grep-checks.md
**Date:** 2026-07-16

## AC Coverage

| AC | Description | Verification method |
|----|-------------|---------------------|
| AC1 | check-bri-s3.5-nfr-stripe-keys.js passes under a real POSIX shell | Run under `C:\Program Files\Git\usr\bin\bash.exe` (or equivalent), confirm 4/4 passing |
| AC2 | check-lab-s3.2-stripe-checkout.js NFR1 passes | Same method |
| AC3 | check-lab-s3.4-stripe-webhook.js NFR passes | Same method |
| AC4 | Scoped grep still detects a real key in a runtime-relevant path | Temporary fixture file under `src/` containing a fake `sk_live_` value; confirm the check fails; remove fixture; confirm it passes again |
| AC5 | Baseline refreshed, full suite shows no new regressions | `node scripts/run-all-tests.js` + manual diff against `tests/known-baseline-failures.json` |

## Verification steps

1. Read each of the 3 files' current grep invocation.
2. Change the `git grep` pathspec to scope to `src/ tests/e2e/fixtures/ playwright.config.js .env.example` (adjust per file — `check-lab-s3.4`/`check-bri-s3.5` also check `.env.example` directly via `fs.readFileSync` in a separate assertion already, so the grep itself only needs to cover the paths not already covered by that direct-read check) and exclude `*.md` and the test's own file via pathspec negation (`':(exclude)*.md'`, `':(exclude)tests/check-*.js'`).
3. Run each file directly (`node tests/check-*.js`) via a shell that correctly executes the POSIX redirect syntax (Git Bash on this machine) — confirm each now passes for the RIGHT reason (the grep actually ran and found zero matches in the narrowed scope), not because it silently no-op'd.
4. AC4: temporarily add a fixture (e.g. `src/__cfg-s1-fixture.js` containing `const x = 'sk_live_faketestvalue123';`), re-run the affected check, confirm it now correctly FAILS, then delete the fixture and confirm it passes again — proving the narrowed scope still catches a real violation.
5. Update `tests/known-baseline-failures.json`: remove the 3 fixed files.
6. Run the full suite; confirm zero new regressions beyond the pre-existing, already-documented baseline.

## Out of Scope for This Test Plan

- `run-gpa-tests.js`/`check-gpa-sc06-source-path-guard.js` — separate, unconfirmed root cause, not this story's scope (see story's Out of Scope section).

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Cannot install/switch to Node 20 locally to test under CI's exact pinned version (`nvm` was unresponsive during investigation) | Environment limitation encountered during this story's own investigation | Verification for AC1-AC3 relies on correctly reproducing CI's *shell* behavior (the confirmed root cause), not its Node version — sufficient to confirm this specific fix; the actual CI run on the resulting PR is the final authoritative confirmation |
