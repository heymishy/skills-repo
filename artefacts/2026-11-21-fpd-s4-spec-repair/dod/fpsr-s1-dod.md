# fpsr-s1 Definition of Done

Date: 2026-11-21. Story: the caption-sync E2E spec opens a playback page that exists, so it passes instead of failing to find a video. Pull request #1175 merged 2026-11-21 (`16a2f2ece`). No issue.

## Result: COMPLETE. All 5 acceptance criteria met. CI ran on the pull request's final commit (`ea1c52a8e`, the same commit the merge took), and the changed files were checked on master after the merge, including the matrix move.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `tests/e2e/fpd-s4-caption-sync.spec.js` run alone: on master it failed with `.playback-ac__video` not found (`toBeVisible` timed out at 5 s); after the change it passed, 4 of 4 local runs (the first, then 3 consecutive). In CI it passed 1 of 1 in the E2E reports for both pull-request commits (`33dc8bd97`, `ea1c52a8e`) | automated | none |
| AC2 | ✅ | the spec diff is 5 lines added and 2 removed in total with the check: the `page.goto` URL changed to `/playback/2026-10-11-journey-cx-redesign` and a 3-line comment added; the selector, the track check, the `showing` mode, `play()` and the `activeCues > 0` assertion are untouched | manual (diff read) | none |
| AC3 | ✅ | with only the spec changed, `check-actr-s1-capture-target-derivation.js` failed 1 of 11 (it expected the old URL); with its expected URL updated, 11 of 11 pass; `check-rpca-s2-selector-derivation-from-e2e-specs.js` 8 of 8; the old placeholder slug appears nowhere outside `artefacts/` | automated | none |
| AC4 | ✅ | E2E report from the CI run on the final commit `ea1c52a8e` (PR head and CI commit matched): `fpd-s4` 1 passed, 0 failed; `dsa-s2` 8 of 8; E2E total 295 passed, 1 failed (`ep3-s1`). The matrix entry moved from `quarantined` to `extended` with a rewritten reason in that commit; master shows `fpd-s4` as `extended` | automated (CI report) + master check | none |
| AC5 | ✅ | the merge commit changed 3 files: the spec, `check-actr-s1-capture-target-derivation.js` and `capability-matrix.json` (7 insertions, 7 deletions); nothing under `src/` | manual (diff check on master) | none |

## CI evidence

All 9 checks passed on both commits, including `Lint, typecheck, test, build`. The `Playwright E2E smoke tests` job is `continue-on-error`, so a green job does not prove the specs passed; the evidence above is the `pw-report-json` artefact, read directly. Matrix checks (`lpw-s2`, `lpw-s3`, `flk-s1`, `gic-s1`, `lpw-s4`, `lpw-s5`) passed locally on the matrix commit; lanes after the move: core 39 (unchanged), extended 51, scenario 6, quarantined 1.

## Observations and follow-ups

- **The quarantine reason was a misdiagnosis.** It said the spec needed a playback fixture that did not exist. The spec opened a placeholder slug that matched no feature (a 404, so no video), while real committed evidence (`jcx-s3`: video, captions, transcript) was already in the repository. Worth remembering when a matrix reason names a missing fixture: read what the spec actually requests first.
- **Dependency recorded (W1 in the DoR, D1 in decisions):** the spec now depends on the committed `jcx-s3` evidence staying under `artefacts/2026-10-11-journey-cx-redesign/playback/jcx-s3/`. If it is moved, the spec fails with the same "video not found" symptom.
- **One spec remains quarantined:** `ep3-s1`, a product bug (issue #1042: regress-back lands on the wrong stage's session). It is the only failing test in the E2E report. Fixing it is product work with its own story.
- **Moving any `extended` spec to the blocking `core` lane** stays the operator's decision, as does dropping `continue-on-error` on the E2E job.
- **Process held:** CI was confirmed on the final commit before the merge was requested, and master was checked after the merge (all three files, not only the spec).

## Scope Deviations

None.
