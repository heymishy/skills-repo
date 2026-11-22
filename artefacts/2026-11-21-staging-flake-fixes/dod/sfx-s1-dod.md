# sfx-s1 Definition of Done

Date: 2026-11-22. Story: the first post-deploy auth call gets a cold-start budget, and the `/admin/credits` call records what it needs to explain its flake. Pull request #1184 merged 2026-11-22 (`14913039d`).

## Result: COMPLETE, with one limit stated below. All 5 acceptance criteria are met on the evidence listed. CI ran on the pull request's final commit (`d161843942`, the same commit the merge took; the pull request head and the local head were compared) and all 10 checks passed, including the assurance gate, which resolved the feature from the pull request body. On master after the merge the story's own check passes (18 of 18) and `check-flk-s1` passes (8 of 8). The post-deploy real-staging confirmation of the merged commit passed (staging deploy run 44992728956). The diagnostics lines themselves were not visible in the staging log (see the limit below), so the first real flake after this merge is the test of the instrumentation.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `a1` AC1 times a cold first call against 15 s and a warm second call against 5 s. Evidence: `tests/check-sfx-s1-staging-flake-fixes.js` (18 of 18 pass, re-run on master); the post-deploy real-staging confirmation of the merged commit passed in run 44992728956 | automated | none |
| AC2 | ✅ | `evaluateBudgets` fails a first call over 15 s, a warm call at 5 s or more, or a missing or non-numeric timing, and names which. Evidence: the same check, covering the budget helper cases including a slow first call (for example 9 s) with a fast warm call passing | automated | none |
| AC3 | ✅ for the code and its tests; live line not observed | `bri-s3.3` AC1 prints one diagnostics line per `/admin/credits` call and rethrows errors, assertions unchanged. Evidence: the same check covers the line builder and the rethrow; CI browser suites passed | automated | the line was not seen in the staging log (see limit) |
| AC4 | ✅ | flake ledger note records the 2026-11-21 occurrence; `reviewBy` unchanged; flake check passes. Evidence: `check-flk-s1` 8 of 8 and `check-sfr-s1` pass on master; `reviewBy` 2026-12-05 unchanged | automated | none |
| AC5 | ✅ | pull request names the artefact folder; CI green on the final commit. Evidence: pull request body names `artefacts/2026-11-21-staging-flake-fixes/`; 10 of 10 checks green on `d161843942` | CI read | the local run of the real `bri-s3.3` spec was not re-run in this closing session |

## The limit, stated plainly

The story's purpose for `bri-s3.3` is evidence: each future `/admin/credits` flake should arrive with its status, elapsed time and tenant row count. In the staging run's log I searched for the line and found none, which is consistent with a passing test whose console output the reporter does not print, but I did not prove that. Until a real flake or a deliberate read of a passing run shows the line, the instrumentation is built and tested but not seen working live. The decision to revisit (batch the per-tenant lookups only if the data supports it) stays open, as D1 recorded.

## Follow-ups for the operator

- Review the two ledger entries in `tests/e2e/flake-ledger.json` by 2026-12-05 (the `check-flk-s1` test goes red from 2026-12-06 unless they are fixed, removed or renewed). The `a1` entry becomes deletable after a quiet fortnight.
- Approve or decline staging deploy run 44992728956 (commit `14913039d`), the promotion this merge started.

## Scope Deviations

None.
