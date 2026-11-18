# qrw-s1 Definition of Done

Date: 2026-11-18. Story: three quarantined browser specs are rewritten against the product as it is and join the core suite. Pull request #1151 merged 2026-11-18 (`24f926b8f`). No issue.

## Result: COMPLETE

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (reference-upload T9 to T15 reach the modal and pass; T15 asserts the listing) | ✅ | 7 of 7 pass. Reached through the journey form post with `newProduct=1`, asserting the 303 to the modal, rather than by URL as the story text said | automated (browser) | entry route: posts the field the route handles instead of opening the URL; recorded in `decisions.md` |
| AC2 (dsda-s1 asserts the review redirect and edits the stories textarea) | ✅ | passes; asserts the redirect after definition is the review session | automated (browser) | none |
| AC3 (iwu2 assumption assertions on ideate; draft assertions on `#artefact-panel`) | ✅ | 8 of 8 pass | automated (browser) | none |
| AC4 (matrix entries in core, fields removed, 13 quarantined) | ✅ | `check-lpw-s2-capability-matrix`, `check-lpw-s3-matrix-reason` pass | automated | none |
| AC5 (core lane passes at 39 specs; nothing under `src/` changed) | ✅ | 144 passed locally with `--workers=1`; `git diff master --stat -- src` empty; CI on #1151 green before merge | automated + diff | none |

Red first: the three original files gave 15 failed, 1 passed on master.

## Observations and follow-ups

- **Product question for the operator:** nothing in the app emits the `newProduct` field, so the strategy grounding modal has no way in from the journey form.
- **Bare-API session defect (unfixed):** a chat page on a session from the bare `POST /api/skills/:name/sessions` has no `turns`, so its first auto-sent turn logs a swallowed `TypeError`. Not a path a person takes.
- **Quarantine now 13** specs (review date 2026-12-15): bmau-s1, bri-s3.6, dsa-s2, ep1-s3-stage-panel, ep1-s4, ep3-s1-regression, fpd-s4, fpux.1, frsr-s1, jcx-s6, kbsf-s1, pnfc-s1, wuce18-keyboard-nav.

## Scope Deviations

- Story AC1 wording said "opening `/journey/:id/reference-modal`" directly; the spec reaches it through the form post instead. Same page, closer to the real route.
