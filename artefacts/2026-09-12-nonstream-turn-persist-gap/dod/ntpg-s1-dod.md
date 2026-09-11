# Definition of Done: Add the missing session_turns durable write to the non-streaming turn handler (ntpg-s1)

**PR:** https://github.com/heymishy/skills-repo/pull/865 | **Merged:** 2026-09-11 (merge commit `916144eaf809a32d9c89fb0cd5133008d42dc04b`)
**Story:** artefacts/2026-09-12-nonstream-turn-persist-gap/stories/ntpg-s1-add-session-turns-write-to-nonstream-handler.md
**Test plan:** artefacts/2026-09-12-nonstream-turn-persist-gap/test-plans/ntpg-s1-test-plan.md
**DoR:** artefacts/2026-09-12-nonstream-turn-persist-gap/dor/ntpg-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-12

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-ntpg-s1-nonstream-turn-persist.js` drives the real `handlePostTurnHtml`/`htmlSubmitTurn` route handler (not a mock), confirms `writeSessionTurns` fires with correct `journey_id`/`tenant_id`/`skill_name` and the completing assistant turn included in the persisted array. Re-run fresh on merged master: 5/5 passing. | Integration test against real handler code, re-run post-merge | None |
| AC2 | ✅ | Second completion via the non-streaming path re-triggers `writeSessionTurns` (upsert behaviour itself already covered at the adapter level by `dsh-s1`'s own AC2 — unchanged, unmodified). Re-run fresh on merged master. | Integration test, re-run post-merge | None |
| AC3 | ✅ | A rejected `session_turns` write does not block the 200 response — confirmed by real handler execution with the adapter forced to reject. Re-run fresh on merged master. | Integration test, re-run post-merge | None |
| AC4 | ✅ | End-to-end test: after writing a real artefact to disk and calling the real `journeyStore.completeStage()` (the same call the production gate-confirm flow makes), `handleGetJourneyStageView` renders `id="chat-messages"` — the `dsh-s3` chat-split view — not the plain-artefact fallback. Re-run fresh on merged master. | Integration test exercising the full write→read→render chain via real production handlers, re-run post-merge | None |

**Full re-run on merged master:** `tests/check-ntpg-s1-nonstream-turn-persist.js` — 5/5 passing. Full suite: 642 files run, 3 failed — exact same pre-existing baseline as every other branch checked this session (`check-bjs-s1-billing-journey-staging-safe.js`, `check-p3.5-validate-trace.js`, `check-s6.1-cache-scope-session-threading.js`), 0 new failures.

---

## Verification method — honesty note

This fix closes a gap in the **non-streaming JSON API** turn-completion path (`POST /api/skills/:name/sessions/:id/turn`) — the path used by automated/programmatic clients, not by a human clicking through the browser chat UI. Live Chrome verification, the strongest evidence class used elsewhere in this session's DoD-triage sweep (e.g. `ibg-s1`, `cdpl-s1`/`cmba-s1`), does not apply cleanly here: there is no browser interaction that exercises this specific code path — a human always completes a turn through the streaming SSE endpoint, which already had the write and is unaffected by this change. The evidence class used instead is the same one established this session for `cdpl-s1`'s own re-verification: drive the real, unmodified production handler chain end-to-end with real data (`htmlSubmitTurn` → `writeSessionTurns` → `journeyStore.completeStage()` → `handleGetJourneyStageView`), not mocks, and confirm the rendered output. This is stronger than a markup-presence test but is not a substitute for observing a real staging journey; no real staging journey was advanced via the JSON API as part of this DoD (doing so would require a live external API client scripted against `wuce-staging.fly.dev`, judged out of proportion for a 2-line logic fix with full end-to-end handler-level coverage already in place).

---

## Scope Deviations

None. Confirmed via `gh pr view 865 --json files`: the merged diff touches exactly `src/web-ui/routes/skills.js` (the `htmlSubmitTurn` completion block named in the story), the new test file, and artefacts/pipeline-state.json bookkeeping. `handlePostTurnStreamHtml`'s own write, named out-of-scope in the story, is untouched.

---

## Test Plan Coverage

**Tests from plan implemented:** 5/5
**Tests passing on merged master:** 5/5 (own suite) + 642 files / 3 pre-existing failures (full suite)

**Gaps:** None against the story's own ACs. The honesty note above documents the one class of evidence (live external-API-client verification against staging) that was judged out of scope for this fix's size, not a silent gap.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Fire-and-forget, non-fatal `.catch()`, identical shape to `dsh-s1`'s own already-accepted write — no added latency to the turn response (AC3 confirms the response still returns 200 even when the write itself fails) |
| Security | ✅ | `tenant_id` present on every row (pulled from `_journeyStore.getJourney(session.journeyId).tenantId`, same source `handlePostTurnStreamHtml` uses); no `accessToken` or other credential fields included in persisted turn content |
| Accessibility | ✅ N/A | Backend-only change; the rendered chat-split view's own accessibility is unaffected — it is `dsh-s3`'s rendering, not this story's |
| Audit | ✅ N/A | No new audit surface introduced |

---

## Metric Signal

No formal benefit-metric artefact exists for this story — short-track bug fix, per the story's own Benefit Linkage section. The stated benefit (restoring `dsh-s1`'s own AC1 guarantee for the one code path it silently never covered) is directly confirmed by AC4's end-to-end test: a journey advanced via the previously-broken path now renders the chat-split view instead of silently falling back.

---

## Outcome

**COMPLETE**

No deviations, no test gaps against the story's own scope. All 4 ACs verified via real production-handler execution (not mocks), re-run fresh on merged master with zero new regressions across the full 642-file suite.

**Follow-up actions:**
1. No real staging journey has yet been advanced through the fixed JSON API path to observe the chat-split view live end-to-end (see honesty note above). If a future session has reason to script a real API client against `wuce-staging.fly.dev` for unrelated purposes, checking one such journey afterward would upgrade this story's evidence class — not required to close this story.

---

## DoD Observations

1. Root-caused directly from `cdpl-s1`'s own DoD re-verification (Observation #5): 6 real historical journeys checked on staging, none had ever shown the `dsh-s3` chat-split view — every one had been advanced through this exact broken path. This story closes that gap for all future journeys; it does not retroactively fix the 6 (or any other) already-completed journeys, per its own Out of Scope.
2. Same `pipeline-state.json` `stage` field silent-omission risk found and corrected here as a **new variant**: not a merge-conflict revert this time, but a direct case of the `gate-advance` field-omission gotcha this session already documented (`gate-advance` validates against the gate but only sets the literal `field=value` pairs passed — it does not auto-set `stage` from the gate name). The `branch-complete` gate-advance call for this very story omitted `stage=branch-complete`, leaving the story stuck at `stage=definition-of-ready` in the merged artefact despite `dorStatus=signed-off`, `prStatus` correctly tracking, and the branch-complete JSON artefact itself being valid. Corrected on master post-merge (`stage=branch-complete`, `prStatus=merged`) before this DoD was written, now further advanced to `definition-of-done` below. This confirms the gotcha is a real, recurring risk (not a one-off) and worth adding to `CLAUDE.md`'s own `gate-advance` mandate documentation as a checklist reminder in a future session.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Add the missing session_turns durable write to the non-streaming turn handler" (ntpg-s1).
Check:
1. Is the "no live Chrome verification" decision for this backend/API-only fix well justified, or should a real staging API call have been scripted before closing this out?
2. Is DoD Observation #2 (the gate-advance stage-field omission) clear enough to act on as a future process improvement?
3. Is the outcome verdict (COMPLETE) consistent with the AC and deviation rows?
```
