# Definition of Done: Client-org lightweight collaboration — comments only

**PR:** https://github.com/heymishy/skills-repo/pull/659 | **Merged:** 2026-07-31
**Story:** artefacts/2026-07-30-agency-client-organisations/stories/story-5-client-agency-comments.md
**Test plan:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-5-client-agency-comments-test-plan.md
**DoR artefact:** artefacts/2026-07-30-agency-client-organisations/dor/story-5-client-agency-comments-dor.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-08-01

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `commentFlowEndToEndForClientUserWithGrant` | automated test | None |
| AC2 | ✅ | `commentFlowRejectedAtRouteLevelWithNoGrant` — 404 not 403, matching Story 2's own AC4 policy exactly (same guard function reference, not a re-implementation) | automated test | None |
| AC3 | ✅ | `agencyUserSeesClientCommentsAndCanReply`, `agencyReplyFlowEndToEnd` — explicitly asserts the Agency's reply is itself visible in a subsequent read, closing a review LOW finding about implicit bidirectional visibility | automated test | None |
| AC4 | ✅ | `bidirectionalThreadSatisfiesMetricDataCondition`, `firesClientAgencyCommentCreatedEventOnEveryComment` | automated test | None — `thread_has_both_org_types` confirmed as a real, live JOIN-computed boolean (false on first comment, true once both org types have commented), not hardcoded |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. All 4 items in the story's own Out of Scope section (edit/delete, real-time push, moderation, non-grant resources) were correctly left unbuilt. The 4 new route handlers were deliberately left unwired from `server.js`'s live URL dispatch table at merge time, mirroring Story 2's own precedent and for the same stated reason (Client-org session-shape ambiguity, since resolved by Story 3) — not a gap, a documented cross-story handoff.

---

## Test Plan Coverage

**Tests from plan implemented:** 13 / 13
**Tests passing in CI:** 13 / 13

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| commentFlowEndToEndForClientUserWithGrant (AC1) | ✅ | ✅ | |
| commentFlowRejectedAtRouteLevelWithNoGrant (AC2) | ✅ | ✅ | |
| agencyUserSeesClientCommentsAndCanReply (AC3) | ✅ | ✅ | |
| agencyReplyFlowEndToEnd (AC3) | ✅ | ✅ | |
| bidirectionalThreadSatisfiesMetricDataCondition (AC4) | ✅ | ✅ | |
| firesClientAgencyCommentCreatedEventOnEveryComment (AC4, edge case) | ✅ | ✅ | Asserts the boolean flips correctly across two sequential comments, not a static value |
| benefitMetricMeasurementCountsQualifyingThread (AC4) | ✅ | ✅ | |
| commentListUsesBatchedQueryNotN1 (NFR-perf) | ✅ | ✅ | |
| commentEndpointsGoThroughSameGrantCheckGuardAsStory2 (NFR-security) | ✅ | ✅ | Same function reference, not a re-implementation |
| commentFormIsKeyboardNavigable (NFR-accessibility) | ✅ | ✅ | |
| commentCreationIsAudited (NFR-audit) | ✅ | ✅ | |
| (2 additional route-level integration tests) | ✅ | ✅ | |

Independently re-confirmed on merged master (2026-08-01): 13/13 passing.

**Gaps (tests not implemented):**
None. Review run 1's MEDIUM finding (PostHog event not yet named) was resolved before implementation began — AC4 was updated to name `client_agency_comment_created` directly, so no gap reached the test-plan phase.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — one batched query per resource, no N+1 | ✅ | `commentListUsesBatchedQueryNotN1` |
| Security — same grant-check guard as Story 2, no bypass path | ✅ | `commentEndpointsGoThroughSameGrantCheckGuardAsStory2` asserts the same function reference is used, not a parallel implementation |
| Accessibility — real `<form>`/`<textarea>`/semantic list markup | ✅ | `commentFormIsKeyboardNavigable` |
| Audit — comment creation logged with author org_id, user_id, resource reference, timestamp | ✅ | `commentCreationIsAudited` |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 2 — Ongoing client-agency artefact collaboration | ❌ | Not yet — this story delivers the exact mechanism the metric measures (`client_agency_comment_created` events), but no real bidirectional comment thread exists yet (staging only as of 2026-08-01, no production deploy). | Signal: not-yet-measured |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None.

---

## DoD Observations

None beyond what is already captured in the AC/NFR tables above — this was one of the cleanest stories in the epic (no review findings beyond one MEDIUM, resolved before test-plan; no deviations found during DoD).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Client-org lightweight collaboration — comments only.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
