# Definition of Done: Let a --from-saas export request specify which DoR-approved story to fetch

**PR:** #675 (commit `3a43960c`) | **Merged:** 2026-08-07 (commit timestamp `2026-08-07 13:40:12 +1200`)
**Story:** artefacts/2026-08-07-export-multi-story-selection/stories/emss-s1-select-story-for-saas-export.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 -- no selector returns the first DoR-signed-off story (backward-compatible default) | Yes | `noSelector_returnsFirstSignedOffStory`, `routeHandler_noSelector_returnsFirstStoryArtefact`, `realExportDataSource_noSelector_preservesExistingNotDorApprovedError`, `cliNoStoryFlag_preservesDefaultUrlShape` | Automated test (`tests/check-emss-s1-select-story-for-saas-export.js`) | None |
| AC2 -- `?story=<slug>` returns that specific story, not the first | Yes | `validSelector_returnsThatSpecificStory`, `routeHandler_validSelector_returnsThatStoryArtefact` | Automated test | None |
| AC3 -- unmatched or not-signed-off selector returns a clear not-found error, never a silent fallback | Yes | `invalidSelector_nonexistentSlug_returnsNull`, `invalidSelector_unapprovedStory_returnsNull`, `realExportDataSource_invalidSelector_throwsExportNotFoundError`, `routeHandler_invalidSelector_returnsNotFoundError` | Automated test | None |
| AC4 -- CLI `--story <story-slug>` companion flag threads the selector through to the export request and installs that story's artefact | Yes | `cliStoryFlag_threadsSelectorToExportRequest`, `cliStoryFlag_writesTheSelectedStorysArtefactPath_notTheDefault`, `cliBinInit_parsesStoryFlagAndExcludesFromPositionalArgs` | Automated test | None |

Two additional tests beyond the 4 ACs cover defensive/NFR ground named in the story: `routeHandler_missingReqQuery_doesNotThrow` (req objects without `.query` must not throw) and `auditLog_includesSelectedStorySlug` (Audit NFR -- see below).

---

## Scope Deviations

None. The three "Out of Scope" items named in the story text (unchanged default-selection behaviour, no change to DoR sign-off itself, single-story-per-request only) are all upheld by the shipped code and are accepted exclusions, not gaps.

---

## Test Plan Coverage

`check-emss-s1-select-story-for-saas-export.js`: **15 passed, 0 failed** (freshly re-run 2026-08-17). All 15 registered tests map to the 4 ACs plus the two supporting cases above; no test is currently failing or skipped.

---

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance | Met (as expected -- negligible) | Not independently benchmarked; story rated the change as a single additional slug comparison on an existing find pass, no perf test was planned or needed. |
| Security (lookup-scoping guard) | Met | `invalidSelector_nonexistentSlug_returnsNull` and `invalidSelector_unapprovedStory_returnsNull` confirm the selector is resolved only against the target feature's own known, signed-off story slugs and never falls back silently. |
| Accessibility | N/A | Story declares N/A -- machine-to-machine API only, no UI surface. |
| Audit | Met | `auditLog_includesSelectedStorySlug` confirms the existing `export_fetch` audit log gains the selected story slug (or `null` for default) as an additive field. |

---

## Metric Signal

No formal benefit-metric artefact exists for this story -- it is short-track (`/test-plan -> /definition-of-ready -> coding agent`), which skips `/benefit-metric` by design. The story's stated benefit linkage is operational correctness of the `--from-saas` export path for multi-story features, not a tracked quantitative metric; no post-merge metric signal is available or expected.

---

## Outcome

**COMPLETE**
**Follow-up actions:** None.

---

## DoD Observations

DoR sign-off (2026-08-07) recorded no HIGH findings and only process-level GAP/RISK-ACCEPT entries already established as precedent for short-track stories in this repo (H-GOV discovery-skip, W4 unreviewed verification script) -- both logged in `decisions.md` and neither bears on the shipped behaviour. No incident or regression against this endpoint has been reported since merge.
