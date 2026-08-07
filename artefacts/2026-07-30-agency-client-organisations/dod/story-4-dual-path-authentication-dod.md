# Definition of Done: Client-org dual-path authentication

**PR:** https://github.com/heymishy/skills-repo/pull/663 | **Merged:** 2026-07-31
**Story:** artefacts/2026-07-30-agency-client-organisations/stories/story-4-dual-path-authentication.md
**Test plan:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-4-dual-path-authentication-test-plan.md
**DoR artefact:** artefacts/2026-07-30-agency-client-organisations/dor/story-4-dual-path-authentication-dor.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-08-01

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | GitHub OAuth non-regression test confirms Client-org sessions resolve identically to other org types via unmodified `routes/auth.js` | automated test | None |
| AC2 | ✅ | Magic-link request/redemption resolves with the same session shape (`tenantId`, `login`, session fields) as OAuth | automated test | None |
| AC3 | ✅ | Magic-link path rejected for `org_type='agency'`/`'standalone'`, parametrised test | automated test | None |
| AC4 | ✅ | Single-use enforcement + separate expired-token rejection test | automated test | None |
| AC5 (D37 adapter wiring) | ✅ | `magicLinkAdapterStubsThrowWhenUnwired`, `serverJsWiresMagicLoginToDistinctRealSessions` | automated test | None — stubs confirmed to throw when unwired; wiring test resolves two distinct, individually-correct sessions for two different users, not merely confirms a setter was called |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. All 3 items in the story's own Out of Scope section (non-Client org types, password auth, MFA) were correctly left unbuilt. One design consequence worth recording rather than as a deviation: because Story 4 extends Story 3's single Passport strategy instance rather than registering a second one, both the invitation link and the ongoing login link necessarily redirect through the same fixed `/invite/redeem` callback URL — this is a direct, documented consequence of the shared-strategy architecture decision (see `decisions.md`), not an unplanned side effect.

---

## Test Plan Coverage

**Tests from plan implemented:** 14 / 14 (final scoped count — the original test-plan phase estimate of 17 was refined down during implementation as some planned NFR sub-cases were consolidated into fewer, more targeted tests)
**Tests passing in CI:** 14 / 14

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| githubOAuthResolvesClientOrgSessionShape (AC1) | ✅ | ✅ | Non-regression — confirms zero changes needed to `routes/auth.js` |
| magicLinkRequestAndRedemption (AC2) | ✅ | ✅ | |
| magicLinkPathRejectedForNonClientOrgTypes (AC3) | ✅ | ✅ | Parametrised over `agency` and `standalone` |
| magicLinkSingleUseRejectedOnSecondClick (AC4) | ✅ | ✅ | |
| magicLinkAdapterStubsThrowWhenUnwired (AC5) | ✅ | ✅ | |
| serverJsWiresMagicLoginToDistinctRealSessions (AC5) | ✅ | ✅ | |
| magicLinkSingleUseTimeLimitedAndAddressBound (NFR-security) | ✅ | ✅ | |
| magicLinkRequestEndpointIsRateLimited (NFR-security, resolves review [1-M1]) | ✅ | ✅ | Reuses `auth-email.js`'s existing sliding-window limiter, extracted into a shared `checkSlidingWindowRateLimit` primitive rather than a new one |
| magicLinkRequestFormIsKeyboardNavigable (NFR-accessibility) | ✅ | ✅ | |
| magicLinkEventsAuditedWithoutRawToken (NFR-audit) | ✅ | ✅ | |
| (4 additional AC/edge-case tests) | ✅ | ✅ | |

Independently re-confirmed on merged master (2026-08-01): 14/14 passing. Story 3's own 18/18-test suite re-confirmed passing unmodified both before and after this story's merge (critical check, since both stories share one Passport strategy instance).

**Gaps (tests not implemented):**
None automated. The email-delivery-latency NFR has no automated test by the test plan's own explicit design ("Tool: None") — latency of a third-party email provider is not something a mocked-adapter unit test can meaningfully measure.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — email delivery within existing latency norms | ⚠️ | No automated measurement (by test-plan design — third-party delivery latency isn't unit-testable). Reuses Story 3's already-wired Resend adapter unchanged. |
| Security — single-use, time-limited, address-bound magic-links | ✅ | `magicLinkSingleUseTimeLimitedAndAddressBound`, `magicLinkSingleUseRejectedOnSecondClick` |
| Security (rate-limiting) — per-IP and per-target-email | ✅ | `magicLinkRequestEndpointIsRateLimited`, reusing `auth-email.js`'s established limiter |
| Accessibility — real `<form>`/`<input type=email>` | ✅ | `magicLinkRequestFormIsKeyboardNavigable` |
| Audit — requests/sends/redemptions logged with email, timestamp, outcome; no raw token | ✅ | `magicLinkEventsAuditedWithoutRawToken` |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Agency-led client provisioning | ❌ | Not yet — this closes the last gap in the metric's required flow (a viable login path for non-GitHub-using Client-org users), but no real Client-org user has logged in via either path yet (staging only as of 2026-08-01, no production deploy). | Signal: not-yet-measured |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None.

---

## DoD Observations

1. This story's coding-agent dispatch independently confirmed the Passport strategy extension mechanism by reading `node_modules/passport-magic-login`'s own source (not assuming), correctly identifying that `sendMagicLink`/`callbackUrl` are fixed at construction time, unlike `verify` which Story 3 had already wrapped in a mutable indirection. This is a good pattern worth reinforcing for future stories that extend shared third-party-backed infrastructure: read the actual library source before assuming an extension point exists in the shape you need.
2. Both this story's and Story 6's PRs briefly hit a "cancelled" (not failed) staging E2E CI job due to what appeared to be concurrency-lock contention on the shared staging environment between near-simultaneous merges. Re-running the specific job resolved it cleanly both times. Worth a `/improve` candidate: if this recurs, consider whether the staging E2E workflow's concurrency group should serialize rather than cancel competing runs.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Client-org dual-path authentication.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
