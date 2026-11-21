# pgb-s1 Definition of Done

Date: 2026-11-21. Story: a production promotion is not refused because of bookkeeping commits that landed after the deployed commit. Pull request #1183 merged 2026-11-21 (`1d728a981`).

## Result: COMPLETE. All 7 acceptance criteria met. CI ran on the pull request's final commit (`0e103d131`, the same commit the merge took; the pull request head and the local head were compared), the changed files and checks were re-run on master after the merge, and the merged guard logic was run against the **real** GitHub compare API on four real commit ranges, including the exact range that was refused on 2026-11-21, which it now accepts. The first live promotion under the fixed guard is staging run 44884053350 (commit `1d728a981`), which the operator approves.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `tests/check-pgb-s1-promotion-bookkeeping.js` P1 and P1b run the real guard as a child process against a fake GitHub API over HTTP: with the head `ahead` and only bookkeeping files it exits 0, says the difference is bookkeeping only, prints both commits, and the request is `GET /repos/o/r/compare/<run>...<head>` with `Bearer tok`. Red first: P1 and P1b failed on the unchanged guard; 17 of 17 pass after (re-run on master: 17 passed, 0 failed) | automated | none |
| AC2 | ✅ | P2 (a code file is refused and named), P3 (a playback media file under `artefacts/<dir>/playback/` is code), P7 (a file renamed from a code path into a bookkeeping path is refused; the previous name is checked) | automated | none |
| AC3 | ✅ | P4 (compare answers 500, no files list, empty answer), P5 (status `diverged`, `behind`, `identical`), P6 (300 files), P6b (fewer commits than `total_commits`): each exits 1 REFUSED. These passed vacuously on the old guard (it refused everything), so eleven deliberate weakenings of the new guard were run, each caught by the matching test: changed files not checked (P2, P3, P7), `ahead` not required (P5), `diverged` accepted (P5), truncated commit list accepted (P6b), a full page of files accepted (P6), a failed comparison treated as success (P4), the old name of a rename ignored (P7), playback media counted as bookkeeping (P3, P9), anything under `.github/` counted as bookkeeping (P9), the request sent without the token (P1), an unwired adapter that passes (P10) | automated | none |
| AC4 | ✅ | P8: when the run commit is the head the guard exits 0 and makes no compare request | automated | none |
| AC5 | ✅ | P9 parses the deploy workflow's `paths-ignore` list and checks that `scripts/lib/bookkeeping-paths.js` classifies 15 sample paths exactly as it does | automated | none |
| AC6 | ✅ | P10: with the compare adapter unwired a stale commit is refused (the default stub throws); P11: `check-spg-s1-stale-promotion-guard` passes unchanged (10 of 10) | automated | none |
| AC7 | ✅ | CI green on the final commit: 10 of 10 checks (including the assurance gate, which resolved the feature from the pull request body, and "Validate traceability chain"), both coverage ratchet steps "at or above the floor" | CI read | none |

## Real-API verification (the gap the test plan named)

The merged `onlyBookkeepingBehind` was run on actual `GET /repos/heymishy/skills-repo/compare/<a>...<b>` answers (through `gh api`, read-only), on master after the merge:

- `8ba55c2b7...4c87c33d3` (the range refused on 2026-11-21: 2 commits, 6 files, all under `artefacts/` and `.github/pipeline-state.json`): **accepted**.
- `23aed6fbe...7b9f20f1a` (the `sfr-s1` DoD commit: 1 commit, 2 files): **accepted**.
- `8ba55c2b7...23aed6fbe` (includes the staging-retries pull request: 3 commits, 10 files): **refused**, naming `.github/workflows/staging-deploy.yml`, `tests/FLAKE-POLICY.md`, `tests/check-sfr-s1-staging-flake-retries.js`, `tests/e2e/flake-ledger.json`.
- `7b9f20f1a...23aed6fbe` (run commit newer than the head): **refused**, comparison status `behind`.

The real answer has the documented shape (`status`, `total_commits`, `commits[]`, `files[]`), so the fake API in the check was faithful.

## CI evidence

All 10 checks passed on `0e103d131`, including `Lint, typecheck, test, build` (4m7s). A local full unit chain (923 files) showed 5 failing files, none from this change: the two known local-only failures (`check-pcr-s1-test-runner` perf budget, `check-p3.5-validate-trace`), `check-rtvap-s1-archived-test-plan-coverage` (no `/bin/bash` here; identical on master), `check-p4-enf-second-line` T6 (`validate-trace.sh` killed by a timeout during a slow run) and `check-rb-s3-harness-agnostic-instructions` (its under-2-seconds assertion during the same slow run; passes alone, 8 of 8). `check-pgb-s1` (17) and `check-spg-s1` (10) passed inside the chain.

## Observations and follow-ups

- **What went wrong first, recorded:** after each code merge the repository process pushes the DoD and state to master, and the old guard refused any run whose commit was not exactly the head, so every waiting promotion was already unpromotable when it was reported; the operator's approval of run 44873189915 was wasted (2026-11-21, 06:33 UTC) because I had pushed bookkeeping before presenting it as actionable. Production was promoted the next time (run 44880044029, commit `23aed6fbe`, 07:38 UTC) after pushes were held. With this change the hold is no longer needed.
- **The compare API's limits are treated as truncation:** 300 files or fewer commits than `total_commits` refuse. A very long gap between a run and master's head therefore refuses (the safe direction); the answer is to promote a newer run.
- **The guard still promotes the run's own older commit:** it is identical to the head in every non-bookkeeping path by construction of the check; the promote job was not changed.
- **First live use:** staging run 44884053350 (commit `1d728a981`) is the first to be promoted under the new guard; bookkeeping pushed after it (this DoD) is the real test. If the guard refuses it, the job log says why.
- **Process held:** no push to master for this story until the promotion was approved; the feature registered in the branch; master merged into the branch before opening the pull request; CI confirmed on the final commit; master checked after the merge.

## Scope Deviations

None.
