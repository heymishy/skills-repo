# ppv-s1 Definition of Done

Date: 2026-11-19. Story: after a production promotion, a read-only job confirms production runs the promoted build and answers /health, and opens an issue if not. Pull request #1162 merged 2026-11-19 (`d578a8788`). No issue.

## Result: COMPLETE, with one manual check outstanding (the first promotion that carries the job)

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (matching sha and build run id with a healthy `/health` exits 0 and prints the verified sha and run id) | ✅ | T1 in `tests/check-ppv-s1-post-promotion-verification.js` | automated | none |
| AC2 (another sha or run until the timeout exits non-zero and prints what it last saw) | ✅ | T2 (another sha, and the right sha with another run id) | automated | none |
| AC3 (version matches but `/health` is not 200 ok exits non-zero) | ✅ | T3 (503, and 200 without status ok) | automated | none |
| AC4 (a transient request error while polling is retried) | ✅ | T4 (a thrown error and a 502, then success) | automated | none |
| AC5 (every request is a GET to the production host, and no other method or host) | ✅ | T5 (production's own server records only GET `/version` and GET `/health`, with no credentials; the unwired fetch throws "Adapter not wired") | automated | none |
| AC6 (a failure opens one `production-verification` issue naming the sha, run URL and last state, and no duplicate for the same sha) | ✅ | T6, T7 | automated | none |
| AC7 (workflow: `needs: promote-to-prod`, no environment, `issues: write` on that job only, script run with the token, `promote-to-prod` has no `if:`) | ✅ | T8, plus the existing promote gate check (bri-s2.6) and `check-no-prod-deploy-on-push` | automated | none |

Red first: 9 of 10 assertions failed before the change; the one that passed was the existing promote-gate baseline. All 10 pass after. The script runs as a child process against a fake production server and a fake GitHub API, so the real wiring is asserted rather than a function reference.

## Observations and follow-ups

- **Manual check outstanding: the first promotion that carries this job.** After the operator approves a promotion, confirm the `verify-production` job is green and its log reads "VERIFIED - production reports sha ... and build run ...". No failure drill was run against production; the failure path is covered by T2, T3, T6 and T7. The script has not been run against the real production host.
- **The job reports and does not undo.** A red result leaves production as it is. Only Fly's health check (fhc-s1) stops a release that does not start. Automatic rollback is deferred until the check has run clean for a few weeks, as decided.
- **A shared helper changed.** `scripts/lib/github-request.js` gained an optional JSON body argument; callers without a body (spg-s1) are unchanged and their tests pass.
- **The pull request's first unit-job run failed on one unrelated, load-sensitive test** (`check-bri-s2.2-neon-staging-branch.js`, which asserts on elapsed time). It passed locally on the branch and on master, and passed on a re-run of the failed job. Not investigated further.
- **Feature complete:** with ppv-s1, all three promotion-safety stories (spg-s1, fhc-s1, ppv-s1) are at `definition-of-done`.

## Scope Deviations

- None.
