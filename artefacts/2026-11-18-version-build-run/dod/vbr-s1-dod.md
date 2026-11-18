# vbr-s1 Definition of Done

Date: 2026-11-18. Story: the build stamp records the workflow run that built the image, so an operator can find the run from the running app. Pull request #1156 merged 2026-11-18 (`0a03386c3`). No issue.

## Result: COMPLETE

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (buildRunId equals GITHUB_RUN_ID) | ✅ | T1 in `tests/check-vbr-s1-version-build-run.js` | automated | none |
| AC2 (buildRunAttempt equals GITHUB_RUN_ATTEMPT) | ✅ | T2 | automated | none |
| AC3 (both null when unset) | ✅ | T3 | automated | none |
| AC4 (existing fields unchanged) | ✅ | T4 (baseline, passed before and after the change) | automated | none |

Red first: T1 to T3 failed before the change in `scripts/write-version-file.js`; T4 passed as the baseline. Green after the change. The existing `tests/check-alrf-s2-version-stamp.js` still passes.

## Observations and follow-ups

- **The record names the build run only.** It does not say the tests in that run passed. `deploy-staging` in `.github/workflows/staging-deploy.yml` has no `needs:` on any test job, so a "passed" field would be false until the deploy waits for tests. That change is a separate decision.
- **Not shown in the UI.** The run identity is in `version.json` and `GET /version`, not in the footer. Surfacing it is a follow-up.
- **Two bookkeeping commits went through the path bypass.** The first artefact commit (`b5849bf94`) set an invalid stage value that failed the integrity check; `92d798cde` corrected it. Both were pushed under the operator's `artefacts/**` and `pipeline-state.json` bypass. Checking integrity before committing would have caught the first one.

## Scope Deviations

- None.
