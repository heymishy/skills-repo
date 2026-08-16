# Definition of Done: Invitee accepts the invite and joins the tenant with the assigned role

**PR:** https://github.com/heymishy/skills-repo/pull/738 | **Merged:** 2026-08-15
**Story:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s2-invitee-accepts-and-joins.md
**Test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s2-invitee-accepts-and-joins-test-plan.md
**DoR artefact:** artefacts/2026-08-14-wuce-self-serve-invites/dor/wsi-s2-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `acceptInvite_validToken_createsTeamMembershipWithInviteTenantAndRole` — PASS (fresh run against merged `master`, 2026-08-16) | automated test | None |
| AC2 | ✅ | `acceptInvite_newInvitee_createsPersonAndIdentityLink` — PASS | automated test | None |
| AC3 | ✅ | `acceptInvite_existingInvitee_reusesPersonNoDuplicate` — PASS | automated test | None |
| AC4 | ✅ | `acceptInvite_sameTokenTwice_secondAttemptRejectedNoSecondMembership` — PASS | automated test | None |
| AC5 | ✅ | `combinedDispatcher_clientOrgInvitePayload_stillRoutesToOriginalHandlerUnchanged`, `combinedDispatcher_clientLoginPayload_stillRoutesToOriginalHandlerUnchanged` — both PASS; both pre-existing sibling features' own full suites (`check-story3-self-service-provisioning.js`, `check-story4-dual-path-authentication.js`) independently re-confirmed unaffected | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None. Checked the merged PR's commits against the story's Out of Scope (invite creation, expiry/seat-limit enforcement — both explicitly deferred to `wsi-s3`/`wsi-s4`, confirmed not touched) and the epic's Out of Scope. Only two commits touch source: `df4db6e1` (`modules/team-invitations.js` — new redemption functions) and `0aaab548` (`server.js` — dispatcher extension). Both are exactly what the story's own Architecture Constraints describe.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| acceptInvite_validToken_createsTeamMembershipWithInviteTenantAndRole | ✅ | ✅ | |
| acceptInvite_newInvitee_createsPersonAndIdentityLink | ✅ | ✅ | |
| acceptInvite_existingInvitee_reusesPersonNoDuplicate | ✅ | ✅ | |
| acceptInvite_sameTokenTwice_secondAttemptRejectedNoSecondMembership | ✅ | ✅ | |
| combinedDispatcher_clientOrgInvitePayload_stillRoutesToOriginalHandlerUnchanged | ✅ | ✅ | |
| combinedDispatcher_clientLoginPayload_stillRoutesToOriginalHandlerUnchanged | ✅ | ✅ | |
| auditLog_redemption_neverLogsRawToken | ✅ | ✅ | |

**Gaps:** None — unlike `wsi-s1`, this story's implementation plan explicitly scheduled its own NFR test as a dedicated task from the start (a direct, deliberate application of the lesson `wsi-s1`'s own DoD had just surfaced), so no equivalent gap occurred here.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — redemption within normal request/response cycle | ✅ | Code review: no async/background processing introduced |
| Security — atomic redemption prevents double-use | ✅ | `acceptInvite_sameTokenTwice_...` test, PASS |
| Security — tenant_id never accept-time-request-controlled (ADR-025) | ✅ | `acceptInvite_validToken_...` asserts `tenantId` comes from the invite's own stored value |
| Security — existing 2 dispatcher cases regression-tested, not just assumed | ✅ | Both AC5 tests, PASS; both real sibling features' own full suites re-confirmed |
| Accessibility — not applicable (no new UI surface; reuses existing OAuth/email-password flow) | ✅ | Correctly scoped as N/A in the story itself — this is the one NFR category `wsi-s1` got wrong (claimed a UI NFR without building one); `wsi-s2` explicitly and correctly says "Not a new UI surface" |
| Audit — redemption logged, never the raw token | ✅ | `auditLog_redemption_neverLogsRawToken` test, PASS |

Update the NFR profile's status: **not updated to Verified feature-wide** — individual NFRs for this story are all verified, but the feature-level `nfr-profile.md`'s own `Status: Active` remains unchanged until every story in the feature reaches this same bar (tracked per-story in each story's own DoD, not flipped early).

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Share of new teammates added via self-serve invite | ✅ (0%, per `benefit-metric.md`) | Not yet — `wsi-s2` completes the mechanical round-trip, but no UI existed to drive real traffic until `wsi-s6` merged (2026-08-16, after this story). Real usage data has not yet accumulated. | Signal: **not-yet-measured**. Evidence note: "Mechanism complete as of this story; UI blocker (wsi-s6) has since been resolved, but no real production usage has occurred yet to produce a signal." |
| Time from invite creation to invitee access | ✅ (not yet established) | Not yet — same reasoning as above | Signal: **not-yet-measured**. Evidence note: same as above. |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. `wsi-s2` itself has no open gaps — the story's own scope was fully and correctly delivered. (The UI-reachability gap that blocked real measurement was `wsi-s1`'s own DoD finding, tracked and closed separately via `wsi-s6`.)

---

## DoD Observations

1. **This story is a direct, positive case study in applying a lesson from an earlier DoD within the same session.** `wsi-s1`'s own DoD (run immediately before this story's implementation began) found that its test plan's NFR test was never scheduled as an implementation task. `wsi-s2`'s own implementation plan explicitly named the NFR test as "Task 5" from the very start, with an inline note citing exactly this precedent. The lesson held: `wsi-s2` shipped with 0 test-plan gaps, versus `wsi-s1`'s 1. **Tag: /improve confirmation** — this is evidence the plan-authoring checklist gap flagged in `wsi-s1`'s own DoD Observation #1 is real and fixable by discipline alone, ahead of any tooling change; worth citing directly if that `/improve` proposal is ever written up.
2. **The highest-risk part of this story (extending a dispatcher shared with two already-shipped, unrelated features) shipped with zero regressions**, verified independently at three separate points in the delivery (implementing subagent, orchestrating session post-Task-4, and again here at DoD) — worth noting as a positive signal for this session's own "independently verify subagent self-reports" discipline actually catching what it's meant to catch, not just adding process overhead.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Invitee accepts the invite and joins the tenant with the assigned role" (wsi-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```
