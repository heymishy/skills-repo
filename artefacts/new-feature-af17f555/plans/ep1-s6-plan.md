# Implementation Plan: ep1-s6 — Audit Logging and PostHog Instrumentation

**Story:** artefacts/new-feature-af17f555/stories/ep1-s6.md
**DoR:** artefacts/new-feature-af17f555/dor/ep1-s6-dor.md
**Test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s6-test-plan.md
**Author:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## Investigation finding

Unlike `ep1-s1`/`ep1-s2`/`ep1-s4`, this story's DoR contract held up under investigation — confirmed by direct code reading (no fresh `Explore` subagent needed, given accumulated codebase familiarity this session). Findings:

- `_logCrossChannelError` (ep1-s5) already exists as a fire-and-forget logging+PostHog helper for the 3 named error types, but its console-log format (`'[cross-channel] ' + errorType + ' ' + JSON.stringify({...})`) is NOT valid JSON immediately after the `[cross-channel] ` prefix — `errorType` sits as free text before the JSON object starts. This story's own NFR test ("Server logs are structured JSON, not free-text interpolation") requires fixing this as part of unifying the shape, not just adding new events beside the old format.
- Of the 6 named success events, only `journey_backfilled_from_cli` (ep1-s3) and `earlier_stage_reopened`/`materiality_flag_cleared` (pre-existing, unrelated to this epic) have any related PostHog wiring already. Neither uses the `[cross-channel]` prefix, structured JSON stdout logging, or an `eventType` field. The other 4 events (feature discovered, feature selected, artefact loaded, session started from CLI-progressed feature) have zero existing instrumentation.
- `backfillJourneyFromPipelineState` is called from exactly one call site (`handleGetJourneyResume`) with only `(featureSlug, repoRoot)` — no session/operator context reaches it today. Needs a 3rd optional `operatorId` param to satisfy the "operatorId present when available, absent for a background/system-triggered backfill" test.

## Design

One shared helper, `_logCrossChannelEvent(eventType, context)`, added to `journey.js` (`_logCrossChannelError` becomes a thin wrapper delegating to it — preserves ep1-s5's existing exported name and passing tests unchanged). Emits:
- `console.log('[cross-channel] ' + JSON.stringify({eventType, timestamp, ...context}))` — valid JSON after the prefix.
- `_posthog.capture(operatorId || featureSlug || 'system', eventType, payload)` — fire-and-forget, wrapped in try/catch.

`operatorId` is only included in `context` when the caller actually has one (`req.session.login || undefined` — `JSON.stringify` drops `undefined`-valued keys, so it's cleanly absent rather than null-padded).

## Why NOT a new shared module

Considered extracting `_logCrossChannelEvent` into its own module (e.g. `src/web-ui/modules/cross-channel-instrumentation.js`) to avoid the `skills.js` → `journey.js` lazy require. Rejected: `journey.js` already lazily requires `skills.js` in 6+ places for the reverse direction (`registerHtmlSession`, `linkSessionToJourney`, etc.) — this is an established, working pattern in this codebase, and a new module would be pure ceremony for one function with no other consumers.

## Tasks

1. **Task 1 — Shared instrumentation helper.** `_logCrossChannelEvent` in `journey.js`; `_logCrossChannelError` becomes a wrapper. Export both.
2. **Task 2 — Wire `feature_discovered`.** `_mergeStateFeaturesIntoJourneyList` (ep1-s1) — once per newly-synthesized feature.
3. **Task 3 — Wire `feature_selected` + `artefact_loaded`.** `feature_selected` at the top of `handleGetJourneyResume` (ep1-s2's own resume path); `artefact_loaded` in `skills.js`'s `buildSystemPrompt` `_KEY_DIRS` scan (ep1-s2's own artefact-load gap fix), with `artefactCount`/`loadTimeMs`. Also unify the existing `artefact_load_error` inline log in `skills.js` onto the shared helper.
4. **Task 4 — Wire `journey_backfilled` + `session_started_from_cli_progressed_feature`.** `journey_backfilled` added alongside (not replacing) ep1-s3's existing `journey_backfilled_from_cli` event, with the new `operatorId` param threaded through. `session_started_from_cli_progressed_feature` fires in `handleGetJourneyResume` right after `registerHtmlSession()`, gated on `memJourney.cliAdoptionTimestamp` being set (i.e., only for a journey that actually originated from a CLI backfill).
5. **Task 5 — Wire `stage_navigation`.** `handleGetJourneyStageReopen` (ep1-s4's own confirm-back → reopen target) — adds the unified event alongside the existing `earlier_stage_reopened` capture, capturing both `fromStage` (`journey.activeSkill`, pre-reopen) and `toStage` (`skillName`).
6. **Task 6 — Full regression + new test suite.** `tests/check-ep1-s6-instrumentation.js` (9 tests per test plan: 7 unit + 2 integration), full local suite, sibling regression for `ep1-s1`–`ep1-s5`'s own test files (all touched files' existing suites re-run unmodified).

## Scope confirmation

Purely additive/observational — no existing call site's control flow, return values, or side effects (other than emitting new log lines / PostHog events) are changed. Confirmed via the test plan's own "Instrumentation does not alter the behaviour it observes" integration test.
