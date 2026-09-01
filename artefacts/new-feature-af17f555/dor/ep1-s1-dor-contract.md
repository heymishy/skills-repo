# Contract Proposal: Feature Discovery from Pipeline-State Index (revised 2026-09-01)

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s1.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-01 (revision; original DoR sign-off 2026-05-16 predates this contract — see story's Revision Note)

---

## What will be built

1. `mergeeStateFeaturesIntoJourneyList(journeys, pipelineStateFeatures)` (or equivalent pure function, exact name/location TBD at `/implementation-plan`): for every feature in `.github/pipeline-state.json` (read via the already-wired `setFetchPipelineState`/`listFeatures()` in `adapters/feature-list.js`) that is (a) at a non-terminal stage and (b) has no matching entry in the journey-store list already passed to `_renderJourneyHome`, synthesize a journey-shaped card entry: `{ featureSlug, displayName, stage, updatedAt, isCliOnly: true }`.
2. `_renderJourneyHome` (`journey.js`) wired to call this merge function before rendering, so the resulting card list contains both journey-store-originated and pipeline-state.json-originated features, sorted consistently (existing sort order preserved).
3. Each merged-in card renders with the **same** stage badge, date, and "Continue →" markup `_renderJourneyHome` already produces for journey-store cards — no new card template.
4. The existing "Continue →" → `GET /journey/:featureSlug/resume` → `handleGetJourneyResume` path is reused **completely unchanged** for these cards. `handleGetJourneyResume` already creates a session when no active one exists; for a CLI-only feature with no journey record, this is the exact point where ep1-s3's `backfillJourney` fires (this story's merge only makes the feature visible and clickable — journey creation itself remains ep1-s3's job, called from the resume path as it already is for any first-time continuation).

## What will NOT be built

- Any change to `/skills` (the literal skill picker) — explicitly out of scope per the story's 2026-09-01 revision
- Any change to `handleGetJourneyResume`'s own session-creation logic — reused as-is
- Two-way sync or conflict resolution if a feature exists in both pipeline-state.json and journey-store with disagreeing stage values (journey-store wins when both exist — pipeline-state.json is only consulted for features journey-store doesn't know about yet)
- Real-time polling — pipeline-state.json is read fresh on each `/journey` page load, same freshness model the page already has for journey-store

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (CLI-only non-terminal feature appears on /journey with correct badge/date/Continue) | Unit test on the merge function + integration test rendering `_renderJourneyHome` with a mixed fixture | Unit + Integration |
| AC2 (terminal-stage features excluded, from both sources) | Unit test on the merge function's filter + integration test with a terminal-stage pipeline-state.json fixture feature | Unit + Integration |

## Assumptions

- `adapters/feature-list.js`'s `listFeatures()` already returns data shaped closely enough to reuse (`{ slug, stage, lastUpdated, artefactIndexUrl }`) — confirmed present but orphaned by this session's investigation (2026-09-01); this story is what finally wires it to a live consumer.
- Journey-store remains the source of truth whenever a feature has BOTH a journey record and a pipeline-state.json entry — this story only fills the gap for features journey-store has never heard of, it does not reconcile the two on every load.
- `updatedAt` in pipeline-state.json is a reliable last-modified proxy — already the convention every other story in this epic relies on.

## Estimated touch points

Files: `src/web-ui/routes/journey.js` (`_renderJourneyHome` wiring), `src/web-ui/adapters/feature-list.js` (`listFeatures()` — reused, may need minor shape adjustment), a new small merge-function module (exact path TBD at `/implementation-plan`). Services: none new — `setFetchPipelineState` already wired in `server.js`. Depends on: nothing upstream in this epic (ep1-s1 remains the epic's entry point); ep1-s3 (journey backfill) is the natural next click for any CLI-only feature this story makes visible, but is not a build-time dependency of this story itself.
