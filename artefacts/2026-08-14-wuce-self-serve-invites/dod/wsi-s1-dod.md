# Definition of Done: Admin creates a per-person team invite, which sends the invite email

**PR:** https://github.com/heymishy/skills-repo/pull/737 | **Merged:** 2026-08-15
**Story:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s1-admin-creates-invite.md
**Test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s1-admin-creates-invite-test-plan.md
**DoR artefact:** artefacts/2026-08-14-wuce-self-serve-invites/dor/wsi-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-15

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `createInvite_validRoleAndEmail_writesTenantScopedRow`, `createInvite_tenantIdNeverFromRequest_onlyFromSession` — both PASS (fresh run against merged `master`, 2026-08-15) | automated test: `tests/check-wsi-s1-admin-creates-invite.js` | None |
| AC2 | ✅ | `createInvite_success_issuesSignedMagicLinkWithCorrectTeamInvitationId` — PASS. Note: shipped mechanism differs from the first implementation committed during the inner loop (which used a plaintext, unsigned link) — caught and corrected pre-merge via two-stage review before the PR opened; final shipped code uses `magicLinkStrategy.issueMagicLink()`, a signed JWT carrying `teamInvitationId`, matching AC2's exact "signed invite token" wording. | automated test | None (post-correction) — see Deviation note below for historical record |
| AC3 | ✅ | `createInvite_invalidRole_rejectedNoRowWritten` — PASS | automated test | None |
| AC4 | ✅ | `createInvite_missingRole_rejected` — PASS | automated test | None |
| AC5 | ✅ | `createInvite_emailSendFails_surfacesErrorRowAlreadyWritten` — PASS. Returns HTTP 502 with a specific "could not be emailed" message; the `team_invitations` row remains written. | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

**AC2 deviation (historical, resolved pre-merge):** The implementation plan's first-written code for AC2 built the invite link as a plaintext URL around the raw `team_invitations.team_invitation_id` — an authoring gap in the plan itself, not a subagent deviation from a correct plan. Caught by two independent review subagents (spec-compliance, code-quality) before the PR was opened, corrected to use the existing `magicLinkStrategy.issueMagicLink()` primitive (mirroring `agency-provisioning.js`'s established pattern) before any of this reached the PR. Recorded here per DoD's own "any difference, even if resolved" convention. Full writeup: `decisions.md`, 2026-08-15 CORRECTION entries.

---

## Scope Deviations

None. Checked the merged PR's 10 commits against the story's Out of Scope (invitee-side acceptance, bulk/CSV invite, resend/regenerate, a distinct email template pass) and the epic's Out of Scope (invite management UI, bulk invite, billing changes, new email infrastructure) — none were touched. One commit (`f0b03656`) updated two unrelated security-review checklist test files (`check-d2-banner-exit-permission-visibility.js`, `check-d4-nfr-security-review-and-hardening.js`) to bump a hardcoded admin-route count from 12 to 13 — not scope creep, a mandatory, self-documented consequence of this story's own new `requireAdmin`-gated route (those checklists exist specifically to be updated when a route is added). Already logged in `decisions.md`.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (test-plan specified 6 unit tests + 1 NFR test = 7 total)
**Tests passing in CI:** 7 / 7 implemented

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| createInvite_validRoleAndEmail_writesTenantScopedRow | ✅ | ✅ | |
| createInvite_tenantIdNeverFromRequest_onlyFromSession | ✅ | ✅ | |
| createInvite_success_callsSendInvitationEmailWithCorrectArgs (renamed `..._issuesSignedMagicLinkWithCorrectTeamInvitationId` post-AC2-correction) | ✅ | ✅ | Test name changed to match the corrected mechanism; same AC coverage |
| createInvite_invalidRole_rejectedNoRowWritten | ✅ | ✅ | |
| createInvite_missingRole_rejected | ✅ | ✅ | |
| createInvite_emailSendFails_surfacesErrorRowAlreadyWritten | ✅ | ✅ | |
| auditLog_invitationCreated_neverLogsRawToken (NFR test) | ✅ | ✅ | **Closed post-merge, 2026-08-16** — added directly to `master` (test-only, no source change, direct copy of `check-story3-self-service-provisioning.js`'s own `invitationTokenNeverLoggedInPlaintext` pattern). Asserts the raw token AND the full signed link never appear in any captured audit-log entry. |

**Gaps (tests not implemented):** None remaining.

**Historical note:** `auditLog_invitationCreated_neverLogsRawToken` was originally specified in the test plan (NFR Tests section, Security/audit) but never implemented across any of the 4 implementation tasks in the PR that merged as #737 — an authoring gap in the implementation plan (`wsi-s1-plan.md`'s 4 tasks mapped to AC1–AC5 only; the plan never scheduled a task for this NFR test). Direct code inspection at the time confirmed the underlying behaviour was already safe (no token/link field is ever passed to the logger); only the automated proof was missing. Closed as this DoD run's own follow-up action #1, immediately after this artefact was first written.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no hard SLO, non-blocking send | ✅ | Code review: `handleCreateInvite` awaits `issueMagicLink` but does not block on invitee email-client delivery, matching the NFR's own stated bar |
| Security — tenant scoping server-side from session only (ADR-025) | ✅ | `createInvite_tenantIdNeverFromRequest_onlyFromSession` test, PASS |
| Security — raw token never logged in plaintext | ✅ | `auditLog_invitationCreated_neverLogsRawToken` test, PASS (added 2026-08-16, closing the original gap — see Test Plan Coverage) |
| Security — secrets management (reuses existing `RESEND_API_KEY` pattern) | ✅ | No new credential/env-var introduced; `magicLinkStrategy`/`invitation-email.js` wiring in `server.js` unchanged by this story |
| Audit — invite creation logged with IDs/tenant/timestamp | ✅ | `modules/team-invitations.js`'s `createInvitation` `log.info(...)` call, code-reviewed |
| Accessibility — invite-creation form has labelled, keyboard-accessible fields | ❌ | **Gap — see below** |

**Accessibility NFR gap (new finding, this DoD run):** The story's own NFR section states "The invite-creation form's email and role fields have labels; the submit action is a real, keyboard-accessible button." No such UI form exists anywhere in the merged code — `wsi-s1` shipped only the JSON API handler (`POST /api/team/invites`); there is no corresponding `GET` route or HTML form (unlike `handleGetTeamMembers`, which does render a real form for the existing identity-based add-teammate flow). The DoR contract's own "What will be built" section only lists the route handler, not a UI form — so this NFR line in the story appears to have been carried over from a template/precedent without being adjusted for this story's actual (API-only) scope, rather than being silently dropped during implementation. **Practical consequence:** as of this merge, a tenant admin has no way to create a team invite through the product itself — only via a direct API call (e.g. curl, a test script). This is a real gap, not a cosmetic one: it means the epic's benefit metric ("share of new teammates added via self-serve invite") cannot begin moving in practice until a UI exists to drive traffic to this endpoint.

Update the NFR profile's status: **not updated to Verified** — the Accessibility gap above means not all NFRs in the profile are verified for `wsi-s1`. `nfr-profile.md`'s `Status: Active` is left unchanged.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Share of new teammates added via self-serve invite | ✅ (0%, per `benefit-metric.md`) | Not yet — blocked on the Accessibility NFR gap above (no UI exists yet to create an invite) and on `wsi-s2` (invitee-side acceptance) merging | Signal: **not-yet-measured**. Evidence note: "No user-facing invite-creation surface exists yet (API-only handler shipped this story); the round-trip isn't usable end-to-end until wsi-s2 merges and a creation UI is built." |
| Time from invite creation to invitee access | ✅ (not yet established, per `benefit-metric.md`) | Not yet — same blockers as above | Signal: **not-yet-measured**. Evidence note: same as above. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. ~~Decide on the missing `auditLog_invitationCreated_neverLogsRawToken` NFR test~~ — **CLOSED 2026-08-16.** Test added directly (test-only commit, no source change); see Test Plan Coverage above.
2. ~~Decide whether an invite-creation UI form is in-scope for a new story or deliberately deferred~~ — **CLOSED 2026-08-16.** Operator chose a dedicated follow-up story (`AskUserQuestion`, 3 options presented). See `stories/wsi-s6-invite-creation-ui.md` and `decisions.md`'s 2026-08-16 SLICE entry. Remains open until `wsi-s6` itself reaches DoD — the epic's benefit metrics stay `not-yet-measured` until then.
3. **[Informational, no action needed]** wsi-s2 should follow AC2's corrected `magicLinkStrategy.issueMagicLink(email, { teamInvitationId })` pattern for its own redemption-side dispatch — already noted as the locked-in precedent in `decisions.md`.

---

## DoD Observations

1. **Plan-authoring gap, not implementation gap, for the missing NFR test.** The implementation plan's 4 tasks were scoped directly against the story's 5 ACs; the test plan's separate NFR Tests section (1 test) was never cross-checked against the plan's task list at plan-authoring time. **Tag: /improve candidate** — `/implementation-plan`'s own self-review checklist could add "does every test in test-plan.md's NFR Tests section have a corresponding task?" as a mechanical check, the same class of fix already recommended in this repo's `workspace/learnings.md` for the AC-verification-script drift pattern (2026-08-13 entry).
2. **Story NFR section asserted a UI surface that was never scoped for build.** The Accessibility NFR line describing a labelled, keyboard-accessible invite-creation form was written into the story at `/definition` time but the DoR contract's "What will be built" list — authored from the same story shortly after — only ever specified the route handler. Neither the DoR sign-off nor `/review`'s prior pass caught the mismatch. **Tag: /improve candidate** — `/definition-of-ready`'s own hard-block checklist could add a check: "does every NFR bullet in the story correspond to something named in the DoR contract's 'What will be built' list?"
3. **Both gaps above were only surfaced by DoD, the last gate in the pipeline**, not by `/review`, `/test-plan`, or `/definition-of-ready`, all of which ran cleanly against this story earlier. This is consistent with this feature's own established pattern this session of catching authoring-time gaps late rather than at their origin (see the email-adapter and seat-limit assumption corrections at `/definition`, and the AC2 signed-link gap caught only after implementation) — worth feeding into a broader `/improve` pass once this epic completes, rather than treating each instance as isolated.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Admin creates a per-person team invite, which sends the invite email" (wsi-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Specifically assess: is "COMPLETE WITH DEVIATIONS" (rather than "INCOMPLETE") the right verdict given the Accessibility NFR gap (no UI exists) — or does the missing UI mean this story hasn't actually delivered a usable capability yet, regardless of AC-level test coverage?
```
