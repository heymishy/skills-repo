# Definition of Done: PostHog instrumentation for both benefit metrics

**PR:** https://github.com/heymishy/skills-repo/pull/741 | **Merged:** 2026-08-16
**Story:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s5-metrics-instrumentation.md
**Test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s5-metrics-instrumentation-test-plan.md
**DoR artefact:** artefacts/2026-08-14-wuce-self-serve-invites/dor/wsi-s5-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `createInvite_success_capturesTeamInviteCreatedWithProperties` — PASS (fresh run against merged `master`, 2026-08-16) | automated test | None |
| AC2 | ✅ | `acceptInvite_success_capturesTeamInviteAcceptedWithElapsedTime` — PASS | automated test | None |
| AC3 | ✅ | `addTeammateByAdmin_success_capturesComparableEvent` — PASS | automated test | None |
| AC4 | ✅ | `bothMetrics_realEventShapes_computableWithoutManualEstimation` — PASS | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None. AC3's touch of `modules/team-management.js` (the separate `team-identity-roles` epic's own module) is explicitly pre-justified in the story's own ACs and was already accounted for at `/review` and `/definition-of-ready` — not a new deviation, a deliberately-scoped cross-epic dependency.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| createInvite_success_capturesTeamInviteCreatedWithProperties | ✅ | ✅ | |
| acceptInvite_success_capturesTeamInviteAcceptedWithElapsedTime | ✅ | ✅ | |
| addTeammateByAdmin_success_capturesComparableEvent | ✅ | ✅ | |
| bothMetrics_realEventShapes_computableWithoutManualEstimation | ✅ | ✅ | |
| eventProperties_neverIncludeEmailOrToken | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — fire-and-forget, never blocks request/response | ✅ | Code review: `_posthog.capture` calls are synchronous fire-and-forget (matches `posthog-server.js`'s own existing no-await convention) |
| Security — no raw email or invite token in any event property | ✅ | `eventProperties_neverIncludeEmailOrToken` test — inspects all 3 event types' captured properties directly |
| Accessibility — not applicable, no UI in this story | ✅ | Correctly scoped as N/A |
| Audit — these events ARE the audit/observability mechanism | ✅ | Correctly scoped — no separate audit log claimed |

Update the NFR profile's status: **not updated to Verified feature-wide** — tracked per-story.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Share of new teammates added via self-serve invite | ✅ (0%) | **Now** — this story is what makes measurement technically possible at all; combined with `wsi-s6` (merged 2026-08-16, same day), both the mechanism AND the instrumentation AND the UI are now live. No real admin/invitee traffic has occurred yet, so no actual number exists yet. | Signal: **not-yet-measured**. Evidence note: "Instrumentation complete and UI reachable as of today (wsi-s5 + wsi-s6 both merged 2026-08-16) — first real signal is now purely a function of real usage occurring, not any remaining engineering blocker." |
| Time from invite creation to invitee access | ✅ (not yet established) | **Now** — same reasoning; `elapsedMs` property exists and is verified correct on every real `team_invite_accepted` event once one occurs. | Signal: **not-yet-measured**. Evidence note: same as above. |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. **[Owner: Hamish King]** Once real beta usage begins, query PostHog for `team_invite_created`/`team_invite_accepted`/`teammate_added_by_admin` events to compute both benefit metrics' first real signal — this is now purely an operational/timing step, not an engineering task.

---

## DoD Observations

1. **This story completes the measurability half of the epic; `wsi-s6` (merged the same day) completes the usability half.** Together, as of 2026-08-16, every engineering blocker either metric had is resolved — the only remaining variable is real usage volume. Worth flagging to the metric owner directly rather than leaving buried in this artefact: the epic's own benefit metrics are now ready to start accumulating real signal.
2. **Two real test defects were caught and correctly diagnosed during this story's own implementation** (a `require.cache` ordering bug in the AC3 test, and a missing mock-pool branch in the AC4/NFR tests) — both fully documented in `plans/wsi-s5-plan.md`'s own correction notes at the time, not new findings here. Notable because the two defects were correctly distinguished from each other by the dispatching subagents (neither assumed the second failure was a repeat of the first root cause) — a positive signal for this session's "don't improvise, report precisely" discipline holding up under a second, superficially-similar-looking failure in the same story.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "PostHog instrumentation for both benefit metrics" (wsi-s5).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```
