# Definition of Done: Don't show "could not be retrieved" for an artefact that simply doesn't exist yet

**PR:** https://github.com/heymishy/skills-repo/pull/677 (commit `67a4a1c5`) | **Merged:** 2026-08-07
**Story:** artefacts/2026-08-07-artefact-not-found-vs-fetch-failed/stories/anvf-s1-distinguish-not-found-from-fetch-failed.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — brand-new feature with no artefact ever (404) shows the ordinary "No artefact content found." message, not "could not be retrieved" | ✅ | `artefactNotFound404_showsOrdinaryNotFoundMessage` in `tests/check-das-s1-commit-artefact-git-fallback.js` (one of the 2 assertions this story added to das-s1's test file) | Automated test, re-run fresh 2026-08-17 as part of the file's 11/11 pass | None |
| AC2 — a real fetch failure (network error / non-404 API response) still shows "could not be retrieved" — message not removed, only narrowed | ✅ | Indirect, via pre-existing das-s1 regression test `bothLocalAndGitMissing_honestErrorMessage` (500 response case), which continues to pass unchanged after this story's fix | Automated test (pre-existing, not newly added by this story), re-run fresh 2026-08-17 | Minor: this story did not add a dedicated new assertion for AC2; it relies on an existing das-s1 test not regressing. Acceptable — AC2's own wording says "this story does not remove that message, it only narrows when it fires," so a non-regression check against the pre-existing test is direct evidence of exactly that claim. |
| AC3 — distinction made via `instanceof` against `ArtefactNotFoundError`/`ArtefactFetchError`, not string-matching on `error.message` | ✅ | `genericErrorResemblingNotFoundText_stillTreatedAsRealFailure` in the same test file (the second of the 2 added assertions — a generic `Error` whose message text resembles "not found" but is not an `ArtefactNotFoundError` instance is still treated as a real failure); confirmed directly in source at `src/web-ui/routes/journey.js:808`, which checks `instanceof require('../adapters/artefact-fetcher').ArtefactNotFoundError` | Automated test, re-run fresh 2026-08-17 + direct source read | None |

---

## Scope Deviations

None. The story's two Out of Scope items — (1) `fetchArtefact()`'s own error-throwing logic in `artefact-fetcher.js`, and (2) the `handlePostGateConfirm` (dual-write/commit) code path — are both correctly untouched; this story's diff is confined to the catch-block in `handleGetJourneyStageView` in `src/web-ui/routes/journey.js`, as scoped.

---

## Test Plan Coverage

**Tests passing:** 2/2 of this story's own added assertions (`artefactNotFound404_showsOrdinaryNotFoundMessage`, `genericErrorResemblingNotFoundText_stillTreatedAsRealFailure`), part of the file-wide 11/11 passing total in `tests/check-das-s1-commit-artefact-git-fallback.js` (re-run fresh 2026-08-17). Per das-s1's own DoD (`artefacts/2026-08-06-durable-artefact-storage/dod/das-s1-dod.md`), this file grew from 9/9 (das-s1's original count) to 11/11 specifically because this story (`anvf-s1`) added these 2 assertions after das-s1's merge — cross-referenced and consistent between both DoDs.
**Gaps:** None identified. No dedicated separate test file exists for this story by design — it extends das-s1's existing test file rather than duplicating setup/mock scaffolding for the same route handler.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: no change — same call count, different branch on existing catch | ✅ | Story states no change by construction; no separate timing test needed or added |
| Security: none identified — no new user input or credential handling | ✅ | Confirmed by source read — fix is a pure error-class branch, no new input surface |
| Accessibility: not applicable — text-only message change | N/A | — |
| Audit: not applicable | N/A | — |

---

## Metric Signal

No benefit-metric artefact is referenced by this story — it is explicitly short-track (bounded bug fix), and the Benefit Linkage section states the benefit directly (usability/correctness fix confirmed via live testing on 2026-08-07) rather than through a formal metric.

---

## Outcome

**COMPLETE**
**Follow-up actions:** None required.

---

## DoD Observations

~13 days live in production (merged 2026-08-07, assessed 2026-08-17), no incidents reported for this story's scope. This is a small, well-isolated catch-block fix reusing already-exported error classes exactly as the story's Architecture Constraints required — the negative-control test (`genericErrorResemblingNotFoundText_stillTreatedAsRealFailure`) is good practice, proving the fix discriminates by error class rather than message text, which the story explicitly called out as a requirement (AC3).
