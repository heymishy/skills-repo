# scr-s1 verify-completion evidence

Date: 2026-11-16. Branch: `feature/scr-s1-commit-result-page` (red tests 6433fc34a, then the implementation commit).

## Result

6 of 7 acceptance criteria (AC) verified by automated tests that have run. AC7 (live: the "Committed." page after a real commit) can only be observed after deploy, and is operator-performed because it writes a real commit.

## Tests

- `tests/check-scr-s1-commit-result-page.js`: 7 passed, 0 failed. Written first and run red: T1 failed with the real "Adapter not wired: getCommitResult" error, T2 and T7 because `htmlGetCommitResult` did not exist, and T3, T4 and T5 answered 500; T6 (the unwired stub still throws) passed before the change as an invariant. Mapping: T1 AC1, T2 AC2, T3 AC3, T4 AC4, T5 AC5, T6 AC6, T7 the never-throws NFR.
- T1 and T3 run through the real `server.js` skill-adapter wiring block (`WIRE_SKILL_ADAPTERS=true`, the switch `playwright.local.config.js` uses), not a test-side setter, and assert behaviour: two committed sessions show two different, correct paths and links, and neither page contains the other's path (D37 rule 4).
- T5 posts to the commit handler with a stubbed `setCommitSession` and a valid CSRF token, checks the 303 `Location`, then requests it: 200 "Committed.".
- Related, passing unchanged: `check-wuce25-session-commit-result` 52, `check-ecg-s1-capture-all-5xx` 12, `check-uid-s1-invalid-id-404` 10.

## Full suite

865 files, 4 failed, all known baseline failures: `scripts/check-pipeline-state-integrity.js` (C3, tfhc-s1), `tests/check-pcr-s1-test-runner.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js`, and `tests/check-p4-enf-second-line.js` (passes alone). The suite side effect on `artefacts/test-slug/ideate.md` was reverted and the stub files it writes under `artefacts/` were not staged.

## Open

- Hold: do not merge or deploy before the ecf-s1 live check is done; this route is currently its only trigger for a real 5xx (story W7).
- AC7: after merge and deploy, the operator commits one skill session from the web UI (or opens the result URL of one committed in the same server run) and expects the "Committed." page with the file link, no 500, and no new GitHub issue.
