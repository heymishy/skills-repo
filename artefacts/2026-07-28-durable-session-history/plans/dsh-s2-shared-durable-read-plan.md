# Implementation Plan: dsh-s2 — A single, tenant-scoped read path for a completed stage's turns

**Story:** artefacts/2026-07-28-durable-session-history/stories/dsh-s2-shared-durable-read.md
**Test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s2-shared-durable-read-test-plan.md
**DoR:** artefacts/2026-07-28-durable-session-history/dor/dsh-s2-shared-durable-read-dor.md

---

## Scope note

Complexity rating 1 (Stable). No new adapter, no new server.js wiring — this story adds a single read function to the adapter module dsh-s1 already created and wired. Given the small size, this is implemented directly (TDD: test first, watch red, implement, watch green) rather than via one-subagent-per-task.

## Design decision (not covered explicitly by the DoR's Constraints, resolved here)

`getTurnsForStage` needs three things `session-turns-pg.js` doesn't already depend on:
1. `journeyStore.getJourney(journeyId)` — `../modules/journey-store` — no circularity risk (journey-store.js does not require the adapter).
2. `requireJourneyAccess`/`POLICY` — `../middleware/journey-access` — same, no circularity risk.
3. A way to find the live in-memory session for `(journeyId, skillName)` — only `routes/skills.js` has this (`_listHtmlSessions()`), and `routes/skills.js` already requires this adapter module (for the dsh-s1 write path) — requiring it back at module top would be circular. Resolved by a **lazy require inside the function body** (`require('../routes/skills')` called only when `getTurnsForStage` actually runs), matching the exact convention `routes/skills.js` itself already uses for calling into this adapter. No new adapter/setter introduced — this isn't a D37 case (D37 governs DB/external-system adapters; this is an in-repo, same-process module reference with no meaningful "unwired" state to guard against).

## Tasks

1. Write all 5 unit tests from the test plan (AC1-AC5) against a not-yet-existing `getTurnsForStage` export — confirm they fail with a clear "not a function" error (red).
2. Implement `getTurnsForStage(journeyId, skillName, requestingSession)` in `src/web-ui/adapters/session-turns-pg.js`:
   - Guard first (deny-by-default): `journeyStore.getJourney` → `requireJourneyAccess(journey, requestingSession, POLICY.TENANT)` → catch any thrown error → return `null`.
   - Prefer in-memory: lazy-require `routes/skills.js`, scan `_listHtmlSessions()` for a `(journeyId, skillName)` match → if found, return that session's `turns` directly (no Postgres query).
   - Else query Postgres: `SELECT turns FROM session_turns WHERE journey_id = $1 AND skill_name = $2` via the existing `requireSessionTurnsStore()` pool → no row → return `null` → row exists → return `row.turns`.
3. Run the 5 unit tests — confirm green.
4. Add the two NFR tests from the test plan (timing proxy + explicit two-subcase tenant-isolation check).
5. Run full `npm test` once — confirm no new failures beyond the known 37.
