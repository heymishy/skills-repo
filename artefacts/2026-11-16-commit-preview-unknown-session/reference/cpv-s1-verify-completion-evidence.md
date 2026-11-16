# cpv-s1 verification evidence

Date: 2026-11-16. Branch `feat/cpv-s1-commit-preview-unknown-session`, commit `259a7f0d0`.

## Red first
Before the implementation, `tests/check-cpv-s1-commit-preview-unknown-session.js` gave 2 passed, 5 failed: T1 answered 200 (a commit form for an unknown session), T2 answered 200, T3 had no "default branch" wording, T4 answered 303 (with GitHub stubbed to accept it, the unknown session "committed" an empty path), T7 failed because the checked function did not exist. T5 and T6 passed as invariants.

## Green
After the implementation: 7 passed, 0 failed.

| AC | Evidence |
|---|---|
| AC1 | T1: 404, message "Nothing to commit for this session", no `<form`, no "Review & commit" |
| AC2 | T2: session with no artefact, path with empty content, and a discovery session requested under `/skills/ideate/...` all answer 404 |
| AC3 | T3: drafted session previews 200 with its path, a form, "default branch" and no "new branch"; the result page says "The artefact has been committed." |
| AC4 | T4: commit POST for an unknown and for an empty session answers 404 and the recording `fetch` saw 0 requests |
| AC5 | T5: drafted session makes exactly one PUT ending `/contents/artefacts/2026-01-01-x/discovery.md`, answers 303 to the result page |
| AC6 | T6: `htmlGetPreview` still returns empty strings; related existing suites pass (wuce25 52, dsq4 7, scr-s1 7, sccf-s1 6, acdg-s1 6, dcuf-s1 13) |
| AC7 | Live, after deploy: read-only GET on staging then production (verification script step 8) |
| NFR | T7: undefined, empty, 300-character and numeric ids all reject with only the 404 error |

## Full suite (local, Windows)
872 files, 5 not passing, all the known local-environment set: `scripts/check-pipeline-state-integrity.js` (C3 baseline item for tfhc-s1), and `check-pcr-s1-test-runner`, `check-p4-enf-second-line`, `check-p3.5-validate-trace`, `check-rtvap-s1-archived-test-plan-coverage` (no working bash on this machine; they pass in CI). No new failure. The suite's stray test artefacts were discarded and no stray commit was created.

## Note
`src/web-ui/port-extract/port/src/web-ui/views/commit-view.js` is a separate copy that still carries the old wording; it is not loaded by the server and was left alone.
