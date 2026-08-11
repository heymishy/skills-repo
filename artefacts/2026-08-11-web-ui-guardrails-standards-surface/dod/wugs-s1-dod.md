# Definition of Done: Extend the artefact-fetcher adapter to read arbitrary repo files and folders

**PR:** https://github.com/heymishy/skills-repo/pull/723 | **Merged:** 2026-08-11
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s1-extend-artefact-fetcher-arbitrary-paths.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s1-extend-artefact-fetcher-arbitrary-paths-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-12

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: realFetchRepoPath_singleFile_returnsDecodedContent` passes | automated test (`tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js`) | None |
| AC2 | ✅ | `AC2: realFetchRepoPath_folder_returnsEntryArray` passes | automated test | None |
| AC3 | ✅ | `AC3: realFetchRepoPath_missingPath_throwsArtefactNotFoundError` passes | automated test | None |
| AC4 | ✅ | `AC4: realFetchRepoPath_apiError_throwsArtefactFetchError` passes, asserts `err.cause` preserves the underlying message | automated test | None |
| AC5 | ✅ | `AC5: fetchRepoPath_unwired_throwsExplicitError` passes | automated test | None |
| AC6 | ✅ | `AC6: realWiring_twoDifferentPaths_returnTwoDifferentCorrectContents` passes — asserts two distinct paths resolve to two distinct, individually-correct contents (D37 requirement 4 shape, not just setter-was-called) | automated test | None |

All 6 tests re-run fresh against merged `master` (post-merge, not just pre-merge CI) on 2026-08-12: `6 passed, 0 failed`.

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. `fetchArtefact()`'s existing single-file behaviour and its callers (`export-data-source.js`, in-app artefact viewer) were not touched — confirmed via diff review of the merged PR. No caching layer was introduced. No write/PR-creation capability was added.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** 6 / 6

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: realFetchRepoPath_singleFile_returnsDecodedContent | ✅ | ✅ | |
| AC2: realFetchRepoPath_folder_returnsEntryArray | ✅ | ✅ | |
| AC3: realFetchRepoPath_missingPath_throwsArtefactNotFoundError | ✅ | ✅ | |
| AC4: realFetchRepoPath_apiError_throwsArtefactFetchError | ✅ | ✅ | Asserts `err.cause` explicitly, not just `instanceof` (fixed during Task 5 spec-compliance review) |
| AC5: fetchRepoPath_unwired_throwsExplicitError | ✅ | ✅ | |
| AC6: realWiring_twoDifferentPaths_returnTwoDifferentCorrectContents | ✅ | ✅ | D37-compliant differentiating-outcome assertion |

**Gaps (tests not implemented):** None.

**Pre-existing, unrelated CI note:** PR #723's "Validate traceability chain" check initially failed due to a repo-wide test-plan filename convention mismatch (short story ID vs. full story slug) affecting all 12 `wugs-s*` stories, not specific to this story's own diff. Fixed directly on `master` (commit `d094a940`) and merged into `feature/wugs-s1` before merge. Unrelated to this story's AC coverage.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Authentication — session OAuth token for all GitHub reads, no service-account token | ✅ | `realFetchRepoPath` and the shared `fetchGithubContentsResponse` helper pass `token` through as `Authorization: Bearer ${token}`, matching `fetchArtefact`'s existing pattern (`src/web-ui/adapters/artefact-fetcher.js:52`) |
| Secrets management — no credentials/tokens logged or persisted | ✅ | Code review of merged `artefact-fetcher.js`: no `console.log`/logging of `token` anywhere in the module; token only appears in the Authorization header construction |

All other NFR-profile rows (performance, authorisation, input validation/rendering, tenant isolation, audit logging) apply to downstream stories (`wugs-s2`–`wugs-s10`), not `wugs-s1`, per the NFR profile's "Applies to story" column.

---

## Metric Signal

Neither `m1` (Guardrail/standard visibility in the web UI) nor `m2` (Product-to-org promotion-approval workflow usage) lists `wugs-s1` in `contributingStories` in `pipeline-state.json` — consistent with the story's own Benefit Linkage section ("This story alone renders nothing new to a user; it unblocks `wugs-s2`, `wugs-s3`, and `wugs-s4`"). No metric signal capture applies to this story; both metrics remain `not-yet-measured` pending the user-facing stories that consume this adapter.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Guardrail/standard visibility in the web UI | ✅ (0%) | After `wugs-s2`/`wugs-s3`/`wugs-s4` ship | Not a contributing story for `wugs-s1` |
| Product-to-org promotion-approval workflow usage | ✅ (0) | After `wugs-s8`/`wugs-s9` ship | Not a contributing story for `wugs-s1` |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None.

---

## DoD Observations

1. The test-plan filename mismatch found and fixed during this DoD pass (see Test Plan Coverage note above) affects all 12 stories in this feature, not just `wugs-s1`. The fix already landed on `master` and was merged into `feature/wugs-s1` before merge, so it does not block this story's DoD — flagged here so subsequent `wugs-s*` DoD runs don't need to re-discover it.
2. `fetchGithubContentsResponse` (the shared helper extracted during Task 2's code-quality review) is now the single GitHub-Contents-API-reading code path for both `fetchArtefact` and `realFetchRepoPath` — future stories reading repo content should extend this helper rather than adding a third parallel implementation, per ADR-012.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Extend the artefact-fetcher adapter to read arbitrary repo files and folders.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
