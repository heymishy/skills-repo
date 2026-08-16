# Definition of Done: Admin has a real, reachable form to create a team invite

**PR:** https://github.com/heymishy/skills-repo/pull/742 | **Merged:** 2026-08-16
**Story:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s6-invite-creation-ui.md
**Test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s6-invite-creation-ui-test-plan.md
**DoR artefact:** artefacts/2026-08-14-wuce-self-serve-invites/dor/wsi-s6-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `getCreateInviteForm_rendersLabelledFormWithRoleOptionsAndSubmitButton` — PASS (fresh run against merged `master`, 2026-08-16); also independently rendered the real HTML output by hand this session and visually confirmed it | automated test + direct inspection | None |
| AC2 | ✅ | `getCreateInviteForm_formPostsToApiTeamInvitesWithCsrfAndCorrectFieldNames` — PASS | automated test | None |
| AC3 | ✅ | `getCreateInviteForm_wiredBehindRequireAdminSameStandardWay` — PASS | automated test | None |
| AC4 | ✅ | `getCreateInviteForm_everyInputHasLabelSubmitIsRealButton` — PASS | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None substantive. The merged PR's second commit (`4be63d35`) touches `tests/check-d2-banner-exit-permission-visibility.js` and `tests/check-d4-nfr-security-review-and-hardening.js` — a budgeted-in-advance, necessary consequence of this story's new admin-gated route (both files exist specifically to be updated when a route is added), planned as an explicit task from the start rather than discovered mid-implementation.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 4 / 4

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| getCreateInviteForm_rendersLabelledFormWithRoleOptionsAndSubmitButton | ✅ | ✅ | |
| getCreateInviteForm_formPostsToApiTeamInvitesWithCsrfAndCorrectFieldNames | ✅ | ✅ | |
| getCreateInviteForm_wiredBehindRequireAdminSameStandardWay | ✅ | ✅ | |
| getCreateInviteForm_everyInputHasLabelSubmitIsRealButton | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no hard SLO, simple server-rendered page | ✅ | Code review: no async work beyond CSRF token generation |
| Security — requireAdmin-gated, CSRF-protected, no new data written | ✅ | AC3 test (requireAdmin) + AC2 test (CSRF field present) |
| Accessibility — labelled inputs, real keyboard-accessible submit button | ✅ | AC1 + AC4 tests — this closes the exact gap `wsi-s1`'s own DoD found (a story claiming an accessibility NFR with no UI built to satisfy it) |
| Audit — none required, no new write path | ✅ | Correctly scoped — `wsi-s1`'s existing audit logging on the POST endpoint is unaffected |

Update the NFR profile's status: **`nfr-profile.md`'s own `Status: Active` remains as-is** — this is the last story in the epic, but the profile's own status field is a feature-level artefact best updated deliberately (or left to a future `/trace` run) rather than silently flipped here as a side effect of one story's own DoD.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Share of new teammates added via self-serve invite | ✅ (0%) | **Now, fully unblocked** — this was the last remaining blocker (`wsi-s1`'s own DoD follow-up action #2). Both metrics' entire engineering dependency chain is complete as of this story merging. | Signal: **not-yet-measured**. Evidence note: "All engineering blockers resolved as of this story (2026-08-16) — mechanism (wsi-s1/s2), guardrails (wsi-s3/s4), instrumentation (wsi-s5), and now reachability (wsi-s6). First real signal depends entirely on real admin/invitee usage from here." |
| Time from invite creation to invitee access | ✅ (not yet established) | Same — fully unblocked | Signal: **not-yet-measured**. Evidence note: same as above. |

Also updated `benefit-metric.md`'s own Metric Coverage Matrix as part of this DoD: added `wsi-s6` to both metric rows (previously missing — review finding `1-L1`, deferred at review time, closed here) and removed the stale duplicate/pending third row left over from before `/definition` finalized the real matrix (review finding `1-L2`).

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. **[Owner: Hamish King]** Same as `wsi-s5`'s own follow-up action — once real beta usage begins, query PostHog for the three captured event types to compute both benefit metrics' first real signal.
2. **[Owner: Hamish King]** Review finding `1-L4` from `wsi-s6`'s own `/review` run (the `MC-A11Y-01` guardrail citation being textually scoped to "the viz" rather than product UI generally) remains open — already captured as a cross-feature pattern signal in `workspace/capture-log.md`, worth resolving at the next `/improve` pass rather than in this feature's own DoD.

---

## DoD Observations

1. **Epic 1 (`epic-1-self-serve-invite-flow`) is now fully complete across all 6 stories, each with its own DoD confirming zero unresolved gaps.** The one real cross-story gap found across the whole epic — `wsi-s1`'s own Accessibility NFR claiming a UI that didn't exist — was caught at `wsi-s1`'s own DoD (not earlier), tracked as a named follow-up story rather than silently absorbed into a later story's scope, and closed by `wsi-s6` specifically and traceably. This is the epic-level payoff of the "DoD is not optional just because a PR merged" discipline this repo's own CLAUDE.md establishes for short-track stories — here applied rigorously to a full standard-track epic instead.
2. **Recurring pattern across this epic's own 6 DoD runs, worth a single consolidated `/improve` proposal rather than 3 separate ones:** (a) `wsi-s1`'s plan-authoring gap (NFR test not scheduled), (b) the cross-story mock-pool gap recurring 3 times (`wsi-s1`→D2/D4, `wsi-s4`→wsi-s2/wsi-s3, `wsi-s5`→its own tests), and (c) this story's own citation-precision finding (`MC-A11Y-01` scope ambiguity) are all variants of the same root cause: **a change to shared/reused code or shared/reused documentation is not automatically checked against every OTHER artefact that already depends on it.** Each instance was caught, but always live, during dispatch or review — never proactively, by a checklist step designed for exactly this. Recommend this be the single most useful `/improve` output of this epic's retrospective.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Admin has a real, reachable form to create a team invite" (wsi-s6) -- and note this is also the LAST story in Epic 1, so also sanity-check the epic-level claim in DoD Observation #1.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is the epic-level claim in DoD Observation #1 ("Epic 1 is now fully complete, zero unresolved gaps") actually supported by all 6 individual story DoD artefacts, or does it overstate what was actually checked?
```
