# Definition of Done: Self-service Agency-to-Client provisioning

**PR:** https://github.com/heymishy/skills-repo/pull/660 | **Merged:** 2026-07-31
**Story:** artefacts/2026-07-30-agency-client-organisations/stories/story-3-self-service-provisioning.md
**Test plan:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-3-self-service-provisioning-test-plan.md
**DoR artefact:** artefacts/2026-07-30-agency-client-organisations/dor/story-3-self-service-provisioning-dor.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-08-01

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `createsClientOrgAndRelationshipForAgencyUser`, `createClientFlowEndToEndAsAgencyAdmin` | automated test | None |
| AC2 | ✅ | `rejectsCreateClientForNonAgencyOrgType`, `createClientFlowRejectedForWrongOrgTypeAtRouteLevel` | automated test | None |
| AC3 | ✅ | `invitationRecordCreatedWithPassportMagicLinkToken`, `invitationRedemptionCreatesAdminRoleTeamMembership`, `inviteUserFlowSendsEmailAndPersistsInvitation`, `redeemedInvitationResolvesSessionAndCreatesAdminMembership` | automated test | **Positive deviation, added pre-merge:** the shipped code additionally verifies the calling Agency org owns a relationship to the target Client org before allowing an invitation — the story's own literal AC3 text does not name this check. Found during independent review (any Agency org could otherwise invite a user into any Client org whose ID it could guess, potentially disrupting another Agency's client relationship since the invited user gets `role='admin'`). Operator confirmed fix-before-merge over ship-and-defer. See `inviteRouteRejectsUnrelatedAgency` test and `decisions.md`. |
| AC4 | ✅ | `rejectsBlankOrInvalidOrgName`, `createClientFlowRejectsInvalidNameAtRouteLevel` | automated test | None |
| AC5 (D37 adapter wiring) | ✅ | `sendInvitationEmailAdapterStubThrowsWhenUnwired`, `serverJsWiresSendInvitationEmailToRealDifferentiatedResendCalls` | automated test | None — stub confirmed to throw when unwired; wiring test asserts two distinct, correctly-addressed Resend calls, not merely setter invocation |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None beyond the AC3 security-hardening addition noted above, which is additive scope in the user's favor (closing a real cross-org risk), not an out-of-scope violation. All 3 items in the story's own Out of Scope section (auth mechanism, product sharing, multi-user invitation) were correctly left unbuilt.

---

## Test Plan Coverage

**Tests from plan implemented:** 16 / 16 (test-plan phase) + 2 added pre-merge for the AC3 relationship-ownership fix = 18 total
**Tests passing in CI:** 18 / 18

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| createsClientOrgAndRelationshipForAgencyUser (AC1) | ✅ | ✅ | |
| rejectsCreateClientForNonAgencyOrgType (AC2) | ✅ | ✅ | |
| invitationRecordCreatedWithPassportMagicLinkToken (AC3) | ✅ | ✅ | |
| invitationRedemptionCreatesAdminRoleTeamMembership (AC3) | ✅ | ✅ | |
| rejectsBlankOrInvalidOrgName (AC4) | ✅ | ✅ | |
| sendInvitationEmailAdapterStubThrowsWhenUnwired (AC5) | ✅ | ✅ | |
| inviteRouteSurfaces500WhenAdapterFails (AC5 regression) | ✅ | ✅ | Extra test for a real bug found mid-implementation (`passport-magic-login`'s `.send()` swallows a rejected send into `{success:false}` rather than rejecting) |
| inviteRouteRejectsUnrelatedAgency (fix-forward) | ✅ | ✅ | Added pre-merge for the AC3 relationship-ownership fix |
| createClientFlowEndToEndAsAgencyAdmin (AC1) | ✅ | ✅ | |
| createClientFlowRejectedForWrongOrgTypeAtRouteLevel (AC2) | ✅ | ✅ | |
| redeemedInvitationResolvesSessionAndCreatesAdminMembership (AC3) | ✅ | ✅ | |
| createClientFlowRejectsInvalidNameAtRouteLevel (AC4) | ✅ | ✅ | |
| serverJsWiresSendInvitationEmailToRealDifferentiatedResendCalls (AC5) | ✅ | ✅ | |
| createClientOrgTypeCheckIsServerSideNotClientSideOnly (NFR-security) | ✅ | ✅ | |
| invitationTokenNeverLoggedInPlaintext (NFR-audit) | ✅ | ✅ | |
| createClientAndInviteAreAudited (NFR-audit) | ✅ | ✅ | |
| createClientFormIsKeyboardNavigable (NFR-accessibility) | ✅ | ✅ | |

Independently re-confirmed on merged master (2026-08-01, post-`npm install`): 18/18 passing. Also re-confirmed after Story 4 merged on top (shared Passport strategy): 18/18 unmodified.

**Gaps (tests not implemented):**
None. The one genuine external-dependency gap noted in the test plan (real Resend email delivery, mocked at the adapter boundary in automated tests) is a manual verification scenario in the story's own verification script, not an automated gap.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no specific target beyond page-load conventions | ✅ | Confirmed not a high-throughput path |
| Security — server-side `org_type` check, never client-side only | ✅ | `createClientOrgTypeCheckIsServerSideNotClientSideOnly` |
| Accessibility — real `<form>`/`<input>` elements | ✅ | `createClientFormIsKeyboardNavigable` |
| Audit — client-org creation and invitation logged with Agency admin identity, Client org ID, timestamp | ✅ | `createClientAndInviteAreAudited`; `invitationTokenNeverLoggedInPlaintext` confirms the raw token is never logged in plaintext |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Agency-led client provisioning | ❌ | Not yet — this is the actual user-facing flow the metric measures, but no real Agency has used it yet (staging only as of 2026-08-01, no production deploy). | Signal: not-yet-measured |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None. The AC3 relationship-ownership gap was fixed before merge, not deferred.

---

## DoD Observations

1. **Real security finding, fixed pre-merge, not deferred:** the relationship-ownership gap (any Agency could invite a user into any Client org it could guess the ID of) is exactly the kind of cross-org boundary issue this epic treats as its highest priority (per Story 2's own framing). The operator chose to fix rather than RISK-ACCEPT — worth surfacing at `/improve` as a positive pattern: a coding agent that flags rather than silently resolves an ambiguity, paired with an operator who chooses to fix pre-merge rather than defer, closes real gaps before they ship.
2. This story and Story 4 share one Passport.js/`passport-magic-login` strategy instance, registered once here and extended (never re-registered) by Story 4 via `setVerifyCallback()`. This cross-story coupling was documented clearly enough in `decisions.md` that Story 4's independent dispatch found and used the extension point correctly on the first attempt — a good signal for how this kind of shared-infrastructure handoff should be documented in future multi-story epics.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Self-service Agency-to-Client provisioning.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
