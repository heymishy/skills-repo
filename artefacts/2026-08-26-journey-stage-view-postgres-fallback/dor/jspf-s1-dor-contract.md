# Contract Proposal — jspf-s1: Shared disk-then-Postgres artefact resolver, wired to all 4 journey.js sites

**What will be built:**
1. New function `resolveArtefactFromDiskOrPg(repoRoot, artefactRelPath, journeyId, stageName)` in `src/web-ui/routes/journey.js`: reads disk first (`fs.readFileSync`, exactly today's mechanism); if empty, queries Postgres via `journey-store-pg.js`'s `getArtefactsForJourney(journeyId)` filtered to `skill_name === stageName`, wrapped in try/catch (best-effort, `process.env.DATABASE_URL`-guarded to match this file's existing convention). Returns the resolved content string, or `''`.
2. `handleGetJourneyStageView` (line ~786) updated: call the new helper before the existing git-fallback; only if the helper returns empty does the existing `das-s1` git-fetch logic run, unchanged.
3. `handleGetStories` (line ~2451), `handlePostStories` (line ~2517-2522), and `handlePostSideTripClarify` (line ~3292-3293) updated: each replaces its direct `fs.readFileSync` call with the new helper. No git-fallback added to any of these three.
4. New test file `tests/check-jspf-s1-journey-postgres-fallback.js` covering AC1-AC8.

**What will NOT be built:**
- No change to `das-s1`'s write path (dual-write to disk + git-commit-on-completion).
- No git-fallback tier added to sites 2, 3, or 4 — disk → Postgres only, matching each site's existing (narrower) contract.
- No new tenant-ACL check at any site — all 4 already operate on an access-checked `journeyId`.
- No fix to the spikes-directory listing (different artefact lifecycle, never written to Postgres — see story's Benefit Linkage "Ruled out during the audit" note) or any site outside `journey.js` (both other known sites, `artefact.js`/`features.js`, were already fixed by `avpf-s1`/`alrf-s4`).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `stageView_postgresFallback_rendersContent_whenDiskAndGitBothMiss` | unit |
| AC2 | `storyList_postgresFallback_populatesAutoIds_whenDiskMisses` | unit |
| AC3 | `postStories_postgresFallback_fillsPriorArtefacts_whenDiskMisses` | unit |
| AC4 | `clarifySideTrip_postgresFallback_fillsContext_whenDiskMisses` | unit |
| AC5 | 4 sub-tests, one per site, each with a disk-vs-Postgres-canary marker pair | unit |
| AC6 | `stageView_gitFallback_stillWorks_whenPostgresAlsoEmpty` | unit (regression guard) |
| AC7 | 4 sub-tests, one per site, all-sources-empty | unit (regression guard) |
| AC8 | 4 sub-tests, one per site, Postgres query throws | unit |

**Assumptions:**
- `journey-store-pg.js`'s existing `_setPoolForTesting` seam is sufficient to test the new helper without introducing a second injectable mechanism.
- `handlePostStories`'s existing structure (a synchronous `.map()` building `priorArtefacts`) will need to become `async`-aware (a `for` loop or `Promise.all`) to call the new (async) helper per stage — implementer's choice on which fits this file's style better; either is acceptable as long as AC3's assertion holds.
- No 5th call site exists beyond the 4 named — confirmed via a repo-wide `fs.readFileSync` grep across `src/web-ui/routes/*.js`, `adapters/*.js`, `modules/*.js` during this story's own pre-implementation investigation.

**Estimated touch points:**
Files: `src/web-ui/routes/journey.js` (new helper + 4 call-site edits), 1 new test file
Services: None
APIs: None — no new route, no schema change, no new request/response shape
