# Verify Completion: Add the missing session_turns durable write to the non-streaming turn handler (ntpg-s1)

**Story:** artefacts/2026-09-12-nonstream-turn-persist-gap/stories/ntpg-s1-add-session-turns-write-to-nonstream-handler.md

---

## AC verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✅ | New test: `handlePostTurnHtml` triggers `writeSessionTurns` with correct `journey_id`/`tenant_id`/`skill_name`; regression test confirms the completing assistant turn is included |
| AC2 | ✅ | A second completion via the non-streaming path calls `writeSessionTurns` again |
| AC3 | ✅ | A failed write does not block the 200 response |
| AC4 | ✅ | End-to-end: after simulating the real gate-confirm's `completeStage()`, the chat-split read-only view renders (`id="chat-messages"` present) — closing the loop this story exists to close |

**New test file:** `tests/check-ntpg-s1-nonstream-turn-persist.js` — 5/5 passing.

## Regression check

- `check-dsh-s1-persist-session-turns.js`: 5/5 (unmodified, sibling story's own suite).
- `check-drh-s1-resume-history-diagram-rendering.js`: 7/7.
- `check-dsh-s2-shared-durable-read.js`: 9/9.
- `check-dsh-s3-breadcrumb-split-view.js`: 5/5.
- `check-dsh-s4-fix-resume-conversation-link.js`: 2/2.
- `check-alrf-s8-journey-slug-priority.js`: 4/4.
- 16 further test files exercising `htmlSubmitTurn`/`handlePostTurnHtml`: all passing unmodified (`check-a4-session-store-state`, `check-cmtt-s1-*`, `check-dsq1/2/4-*`, `check-lab-s3.3-*`, `check-mfc1-*`, `check-pla-s2-*`, `check-sdrg-s1-*`, `check-srmw-s1-*`, `check-stis-s1-*`, `check-wsap-s1-*`, `check-wsm1/2-*`, `check-wuce26-*`, `check-wusl-s1-*`).

## Full suite

`NODE_ENV=test npm test`: 642 file(s) run, 3 failed, 0 new. Failures match the session's established pre-existing baseline exactly: `tests/check-bjs-s1-billing-journey-staging-safe.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-s6.1-cache-scope-session-threading.js`. All 42 files exercising `htmlSubmitTurn`/`handlePostTurnHtml`/`writeSessionTurns`/`handleGetJourneyStageView` pass, including the new `check-ntpg-s1-nonstream-turn-persist.js` (5/5).

## Outcome

**COMPLETE.** All 4 ACs verified with real end-to-end evidence (AC4 drives the actual production `completeStage()` call, not a mock). Zero regressions across the full suite. Ready for `branch-complete`.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
