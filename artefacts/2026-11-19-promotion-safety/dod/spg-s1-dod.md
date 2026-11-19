# spg-s1 Definition of Done

Date: 2026-11-19. Story: a production promotion refuses a commit that is not the head of master, and Staging Deploy runs superseded by a newer commit are cancelled. Pull request #1158 merged 2026-11-19 (`43bf4c128`). No issue.

## Result: COMPLETE, with one manual check outstanding (the first live run)

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (a promote run whose commit differs from the head of master exits non-zero and prints both commits) | ✅ | T1 in `tests/check-spg-s1-stale-promotion-guard.js` | automated | none |
| AC2 (a promote run whose commit equals the head of master exits 0) | ✅ | T2 | automated | none |
| AC3 (the guard exits non-zero when the head of master cannot be read: request error, non-200, or no commit in the answer) | ✅ | T3, T4, T5 | automated | none |
| AC4 (the guard step comes after checkout and before every `flyctl` step, with no `if:` line and `needs` and `environment` unchanged) | ✅ | T6, T10 (existing promote gate check) | automated | none |
| AC5 (exactly the older waiting Staging Deploy runs are cancelled, and a failing cancel does not make the script exit non-zero) | ✅ | T7, T8 | automated | none |
| AC6 (the cancel job runs after deploy-staging, holds `actions: write` alone, and both scripts are called with the real workflow token) | ✅ | T9 | automated | none |

Red first: 9 of 10 failed before the change; T10 passed as the baseline. The first draft let two fail-closed tests pass only because the script did not exist, so they were tightened to require the guard's own exit code. Green after the change: 10 passed, 0 failed. The tests run both scripts as child processes against a local fake GitHub API, so the bearer token, API URL, exit codes and paging are asserted on the real scripts.

## Observations and follow-ups

- **Manual check outstanding: the first Staging Deploy run after this merge.** Cancelling a waiting run and the guard reading the head of master with the workflow token cannot be tested in CI. The operator watches that run and confirms the `cancel-superseded` job logs a cancel count and that the older waiting runs show as cancelled.
- **That first run cancels about 125 older waiting runs,** including the vbr-s1 production approval run `44270386578`. Nothing is deployed or deleted by this. The production app stays on `c0c9a46` until the next run is approved.
- **Scenario B failed on the pull request for a runner reason, not the change.** The Playwright browser cache restore failed, the full install took 9m15s, and the 10-minute job limit cancelled the server start. A re-run of the failed job was started. Worth watching: it is a required check, and the install fallback leaves almost no headroom.
- **The guard compares against `master`, hard-coded.** It is correct while master is the default branch.
- **A run approved after a newer commit lands is refused rather than rebuilt.** The operator then approves the newer run. This is the recorded decision.

## Scope Deviations

- None.
