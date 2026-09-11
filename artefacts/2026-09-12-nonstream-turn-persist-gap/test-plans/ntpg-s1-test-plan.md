# Test Plan: Add the missing session_turns durable write to the non-streaming turn handler (ntpg-s1)

**Story:** artefacts/2026-09-12-nonstream-turn-persist-gap/stories/ntpg-s1-add-session-turns-write-to-nonstream-handler.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| AC1 | AC1 | Integration | `handlePostTurnHtml` (real route handler, calling the real `htmlSubmitTurn`) triggers `writeSessionTurns` with correct `journey_id`/`tenant_id`/`skill_name` on completion |
| AC1 regression | AC1 | Integration | The persisted turns array's last entry is the completing assistant turn with the real response content — mirrors `dsh-s1`'s own regression test for the sibling streaming path exactly |
| AC2 | AC2 | Integration | A second completion for the same journey/skill via the non-streaming path calls `writeSessionTurns` again (the adapter's own upsert behaviour is already covered by `dsh-s1`'s AC2 at the adapter level; this confirms the handler doesn't skip the call on a revision) |
| AC3 | AC3 | Integration | `handlePostTurnHtml` still returns 200 even when the `session_turns` write rejects |
| AC4 | AC4 | Integration, end-to-end | A journey completed via the non-streaming path, with its stage then marked complete (simulating the real gate-confirm step), renders the `dsh-s3` chat-split read-only view (`id="chat-messages"` present) when viewed via `handleGetJourneyStageView` — not the plain-artefact fallback |

## Regression coverage

- `tests/check-dsh-s1-persist-session-turns.js` (the sibling streaming-path story's own suite) re-run unmodified.
- `tests/check-drh-s1-resume-history-diagram-rendering.js`, `check-dsh-s2-shared-durable-read.js`, `check-dsh-s3-breadcrumb-split-view.js`, `check-dsh-s4-fix-resume-conversation-link.js` re-run unmodified.
- 16 further test files that exercise `htmlSubmitTurn`/`handlePostTurnHtml` for unrelated reasons re-run unmodified, to confirm this change doesn't alter any of their existing behaviour.

## Out of Scope (per story)

- Backfilling `session_turns` for already-completed journeys.
- Any change to `handlePostTurnStreamHtml`'s own already-correct write.
- The archive/rehydrate mechanism (`dsh-s5`/`dsh-s6`).

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
