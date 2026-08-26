# Definition of Done: jspf-s1 — Shared disk-then-Postgres artefact resolver, wired to all 4 journey.js sites

**PR:** https://github.com/heymishy/skills-repo/pull/771 | **Merged:** 2026-08-26T17:45:01Z (commit `5405dd88`)
**Story:** `artefacts/2026-08-26-journey-stage-view-postgres-fallback/stories/jspf-s1-postgres-fallback-for-stage-view.md`
**Test plan:** `artefacts/2026-08-26-journey-stage-view-postgres-fallback/test-plans/jspf-s1-test-plan.md`
**DoR:** `artefacts/2026-08-26-journey-stage-view-postgres-fallback/dor/jspf-s1-dor.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-26

---

## AC Coverage

**Site key:** AC1/AC5/AC7/AC8 span all 4 sites (site 1 = stage-view/originally-reported bug, site 2 = story-list auto-populate, site 3 = review-session context/highest severity, site 4 = clarify side-trip); AC2-AC4 map 1:1 to sites 2-4; AC6 is site-1-only (git-fallback regression guard).

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Site 1 (stage-view): spec-compliance review traced the call from `resolveArtefactFromDiskOrPg` through to the rendered response body (`journey.js:794-796` → `:923` → `:990`); test `stageView_postgresFallback_rendersContent_whenDiskAndGitBothMiss` | Automated test + code-path trace | None |
| AC2 | ✅ | Site 2 (story-list auto-populate): traced `handleGetStories` → `extractStoryIdsFromDefinitionArtefact` → rendered textarea; test passes | Automated test + code-path trace | None |
| AC3 | ✅ | Site 3 (review-session context, highest severity): `.map()` → `for` loop conversion verified correct (every stage in `completedStages` gets the fallback, not just the first); `priorArtefacts` traced to `_startReviewSessionForJourney`; test asserts real per-stage content for both stages in a 2-stage fixture | Automated test + code-path trace | None |
| AC4 | ✅ | Site 4 (clarify side-trip): traced `handlePostSideTripClarify` → `discoveryContent` → `session.systemPrompt` | Automated test + code-path trace | None |
| AC5 | ✅ | Disk wins at all 4 sites: 4 sub-tests, each with a disk-vs-Postgres-canary marker pair; code-quality review confirmed these are genuine spy-based checks (`pgSpy.wasCalled() === false`), not output-only checks | Automated test | None |
| AC6 | ✅ | Site 1 git-fallback preserved: test mocks git-fetch success with Postgres empty; git content renders correctly | Automated test | None |
| AC7 | ✅ | True-empty case unchanged at all 4 sites: 4 sub-tests confirm each site's pre-existing default behaviour is untouched | Automated test | None |
| AC8 | ✅ | Postgres-throw degrades safely at all 4 sites: 4 sub-tests, fake pool throws, no unhandled exception at any site | Automated test | None |

**Test file:** `tests/check-jspf-s1-journey-postgres-fallback.js` — 17/17 passing, re-confirmed fresh against merged master (2026-08-26).

---

## Scope Deviations

None. Both reviewers (spec-compliance, code-quality) confirmed no scope creep — only `src/web-ui/routes/journey.js` and the one new test file were touched, matching the DoR contract exactly.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 AC groups / 17 individual tests, all implemented.
**Tests passing:** 17/17, confirmed fresh on merged master.

**Gaps:** None per the test plan's own "Test Gaps and Risks" table, whose one flagged uncertainty (AC3's exact interception mechanism) was resolved during implementation by reusing an existing `setRegisterHtmlSession`-based interception pattern already in this file's test suite.

**Collateral verification, not a gap:** All 17 pre-existing test files touching any of the 4 modified handlers were re-run individually (das-s1, drh-s1, dsda-s1, dsh-s3, dsh-s4, dtra-s1, jcn-s1, jsvr-s1, mds-s1, ougl6, owle1, p0.2, p2.2, pncg-s1, rcfc-s1, rht-s1, sec4-early-return) — 0 regressions. One interaction was caught and fixed mid-implementation: the new helper's initial placement in the file broke `check-sec4-early-return.js`'s literal source-order assertion; relocated (no behavioural change, hoisted function) and re-verified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Rated "negligible" in story — confirmed; one accepted follow-up (N+1 query pattern in the rare all-disk-missing case at site 3) logged as RISK-ACCEPT, not a defect |
| Security | ✅ N/A | No new ACL surface — all 4 sites already operate on access-checked `journeyId`; confirmed via `git diff` showing zero new/changed `requireJourneyAccess`/`POLICY.` occurrences |
| Accessibility | ✅ N/A | No markup/page-structure change |
| Audit | ✅ N/A | No existing audit-log call needed to change |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| None declared | N/A | N/A | Short-track direct correctness fix, no formal benefit-metric artefact — same treatment as `avpf-s1`/`alrf-s4`, both cited as direct precedent. |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. (Accepted, not blocking — logged in `decisions.md` 2026-08-26) N+1 Postgres-query pattern in `handlePostStories`'s rare all-disk-missing path. Revisit only if real cost/latency is ever observed via APM.
2. (Low priority, informational) Code-quality review noted the helper's doc-comment could be read as claiming it matches its two same-file precedents' *tier ordering* (Postgres-first) as well as their try/catch shape — it only matches the latter (this helper is deliberately disk-first per the story's own Architecture Constraints). No functional impact; worth a comment clarification if anyone touches this area again.
3. (Process note, not a defect) This story's own pipeline-state bookkeeping had a real defect during setup — the feature was initially registered with `track: standard` instead of `short`, which passed local review unnoticed and only surfaced as a hard CI failure ("Validate traceability chain" on PR #771, flagging a missing `discovery.md`) after the PR was opened. Fixed by correcting the field on master and merging that fix into the branch to trigger a fresh CI run. Logged as a durable learning (see `workspace/learnings.md`) — worth double-checking `track` explicitly against sibling short-track features at DoR sign-off time in future stories, not just at story-creation time.

---

## DoD Observations

1. **The scope-explosion pattern from `pncg-s1` (same day) recurred and was handled the same correct way.** A single reported bug (`/journey/.../stage/discovery` showing "No artefact content found") led to a codebase-wide audit per explicit operator request, surfacing 3 more instances of the identical defect shape — one of which (`handlePostStories`) was a more serious, silent AI-context-corruption bug than the originally reported display issue. Fixed via one shared helper rather than four patches, consistent with this repo's now-documented preference for this defect shape.
2. **A real process defect (track misconfiguration) was caught only by CI, not by any earlier pipeline gate.** DoR's own hard-block checklist has no explicit "confirm `track` matches sibling short-track precedent" check — this gap wasn't visible until the trace-validation CI gate hard-failed on the open PR. Recommend a `/discovery`-or-`/definition-of-ready`-time check comparing a new short-track feature's `track` field against known sibling values before signing off, to catch this class of error before CI rather than after.
