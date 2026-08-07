# Definition of Done: Client org self-service conversion to an independent paying account

**PR:** https://github.com/heymishy/skills-repo/pull/662 | **Merged:** 2026-07-31
**Story:** artefacts/2026-07-30-agency-client-organisations/stories/story-6-conversion-to-independent.md
**Test plan:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-6-conversion-to-independent-test-plan.md
**DoR artefact:** artefacts/2026-07-30-agency-client-organisations/dor/story-6-conversion-to-independent-dor.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-08-01

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `convertsOrgTypeInPlaceRetainingSameOrgId`, `conversionRejectedForNonAdminRole`, `conversionRestrictedToAdminRoleServerSide` | automated test | None |
| AC2 | ✅ | `conversionFlowEndToEndAsOrgAdmin`, `conversionRedirectsToExistingStripeCheckout` — asserts the SAME `billing.js` `handlePostCheckout` function is called (via source + behavioural test), not a duplicate checkout path | automated test | None |
| AC3 | ✅ | `existingRelationshipsAndGrantsSurviveConversion`, `relationshipsAndGrantsFunctionUnchangedPostConversionEndToEnd` | automated test | None |
| AC4 | ✅ | `concurrentConversionAndGrantCreationDoNotCorruptEachOther`, `concurrencyTestReRunAtRouteLevelUnderLoad` — a genuine controlled-promise-ordering "gated pool" test double (both operations queued, released in both orders, asserted non-corrupted either way), independently verified by the reviewer, not a sequential `await` in disguise | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None against the story's own 3 Out of Scope items (billing-model change, reversal, relationship changes). One deliberate, documented deviation from the epic's own sibling-story precedent: unlike Story 2/5 (whose route handlers were left unwired pending the Client-org session-shape decision), this story's `GET`/`POST /organisations/convert` routes ARE wired into `server.js`'s live URL dispatch, since Story 3 had already resolved that blocking ambiguity by the time this story was implemented and this story's ACs describe a real, reachable self-service flow rather than a backend-only enforcement guard. Logged in `decisions.md` for operator confirmation, matching the same pattern this epic used for every prior touch-point deviation.

---

## Test Plan Coverage

**Tests from plan implemented:** 13 / 13
**Tests passing in CI:** 13 / 13

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| convertsOrgTypeInPlaceRetainingSameOrgId (AC1) | ✅ | ✅ | |
| conversionRejectedForNonAdminRole (AC1) | ✅ | ✅ | |
| existingRelationshipsAndGrantsSurviveConversion (AC3) | ✅ | ✅ | |
| concurrentConversionAndGrantCreationDoNotCorruptEachOther (AC4) | ✅ | ✅ | Genuine interleaving via gated-pool test double, independently verified |
| conversionFlowEndToEndAsOrgAdmin (AC1) | ✅ | ✅ | |
| conversionRedirectsToExistingStripeCheckout (AC2) | ✅ | ✅ | |
| relationshipsAndGrantsFunctionUnchangedPostConversionEndToEnd (AC3) | ✅ | ✅ | |
| concurrencyTestReRunAtRouteLevelUnderLoad (AC4) | ✅ | ✅ | |
| conversionHasNoSpecificLatencyTargetBeyondPageLoadNorms (NFR-perf) | ✅ | ✅ | |
| conversionRestrictedToAdminRoleServerSide (NFR-security) | ✅ | ✅ | |
| conversionFormIsKeyboardNavigable (NFR-accessibility) | ✅ | ✅ | |
| conversionIsAudited (NFR-audit) | ✅ | ✅ | |
| serverWiresOrgConversionRoutes (wiring regression) | ✅ | ✅ | |

Independently re-confirmed on merged master (2026-08-01): 13/13 passing. Story 2's own 15/15-test suite (including the AC6 `bri-s3.4` regression guard) re-confirmed unmodified after this story merged.

**Gaps (tests not implemented):**
None. The one genuine external-dependency gap (real Stripe checkout completion) is mocked at the adapter boundary in automated tests, matching this codebase's existing convention for every other billing test — not a gap, the established pattern.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no specific target, rare deliberate action | ✅ | Confirmed not a high-throughput path |
| Security — server-side `role==='admin'` gate only | ✅ | `conversionRestrictedToAdminRoleServerSide` |
| Accessibility — real `<form>`/confirmation UI | ✅ | `conversionFormIsKeyboardNavigable` |
| Audit — conversion logged with org_id, initiating user, timestamp | ✅ | `conversionIsAudited` |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A — no lock-in / adoption objection removal (indirect linkage to Metric 1) | ❌ | Not directly measurable by design — this story's own Benefit Linkage field frames its connection to Metric 1 as indirect (removing an adoption objection, not moving the metric directly). `benefit-metric.md`'s Metric Coverage Matrix explicitly records this as "Indirect / risk-mitigation, not directly measured" (added 2026-07-31, resolving review [1-M1]) rather than silently omitting it. | Signal: not-yet-measured (and not expected to have a direct signal even once measurement begins) |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None.

---

## DoD Observations

1. This story's own security-relevant design choices (self-supplied CSRF token when forwarding into `billing.js`'s `handlePostCheckout`, and the direct `resolveRoleForPerson` call bypassing the injectable `getRoleForTenant`/`requireAdmin` layer) were reviewed carefully during DoD-adjacent verification (this session) specifically because they deviate from the "obvious" pattern (injectable adapter, CSRF from the client). Both were confirmed legitimate: the CSRF token is generated for the same already-authenticated session as an internal same-request forward, never exposed externally; the direct role-check call mirrors Story 3's own `agency-provisioning.js` factory-per-pool convention rather than introducing a second role-resolution entry point. Worth flagging as a pattern: when a coding agent's own `decisions.md` entry proactively explains *why* a security-adjacent shortcut is safe rather than silently taking it, that's a strong signal worth rewarding, not just accepting.
2. This is the last story in the epic (dependency-wise: depends on Stories 1 and 3, nothing else in the epic depends on it) — its merge, alongside Story 4's, completed the full 6-story epic.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Client org self-service conversion to an independent paying account.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
