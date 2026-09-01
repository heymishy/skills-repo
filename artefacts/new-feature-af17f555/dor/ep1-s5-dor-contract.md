# Contract Proposal: Error Handling and Graceful Degradation

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s5.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-01

---

## What will be built

An error-handling wrapper layer around ep1-s1 (feature discovery), ep1-s2 (artefact resolution), ep1-s3 (journey backfill), and ep1-s4 (stage routing):

1. Each of the 5 named error conditions (pipeline-state.json unreachable, artefact file missing, artefact file unreadable, journey backfill fails, stage routing indeterminate) is caught at its own call site — not a single global catch-all — so the specific failing component can be identified and excluded without failing the whole session start.
2. Every caught error is logged to server stdout with `featureSlug`, `stage`, `errorType`, `timestamp`, and emitted fire-and-forget to PostHog (`artefact_load_error`, `journey_backfill_error`, `stage_routing_error`).
3. A single, non-duplicated operator-facing disclosure appears in the session header when critical data is missing (e.g. "Feature history incomplete — some prior artefacts could not be loaded."), regardless of how many individual errors contributed.

## What will NOT be built

- Automatic retry logic or exponential backoff — explicitly out of scope
- A user-initiated "reload artefacts" button
- An admin dashboard for error monitoring
- Email/Slack alerting

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (5 error conditions individually caught, logged, non-blocking; combined disclosure; PostHog fire-and-forget) | Unit tests per error condition + integration tests for combined-failure and PostHog-failure-tolerance scenarios | Unit + Integration |

## Assumptions

- ep1-s1 through ep1-s4 each have identifiable call sites this story can wrap without modifying their own internal logic — this story adds error boundaries around existing calls, it does not change what ep1-s1–s4 do when they succeed.
- "Stage routing indeterminate" (from ep1-s4) means `getNextSkill` returning `undefined`/unrecognised — the safe fallback is the skill picker, matching existing precedent for an unselected feature.
- No new PostHog event schema is required beyond the 3 named event types — reusing the already-initialized PostHog client per Architecture Constraints.

## Estimated touch points

Files: error-handling wrapper module (exact path TBD at `/implementation-plan`, likely co-located with or wrapping each of ep1-s1–s4's call sites in `src/web-ui/routes/skills.js`). Services: PostHog client (existing, no new dependency). Depends on: ep1-s2, ep1-s3, ep1-s4 (wraps all three's failure modes).
