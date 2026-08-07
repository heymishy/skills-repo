# Definition of Done: Agency-Client relationships, shared-access grants, and read-only enforcement

**PR:** https://github.com/heymishy/skills-repo/pull/658 | **Merged:** 2026-07-30
**Story:** artefacts/2026-07-30-agency-client-organisations/stories/story-2-relationship-grants-enforcement.md
**Test plan:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-2-relationship-grants-enforcement-test-plan.md
**DoR artefact:** artefacts/2026-07-30-agency-client-organisations/dor/story-2-relationship-grants-enforcement-dor.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-08-01

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `createsGrantScopedToRelationshipNotOrgBroadly`, `agencyShareCreatesGrantEndToEnd` | automated test | None |
| AC2 | ✅ | `grantCheckDeniesAccessViaWrongRelationship`, `clientUserSeesOnlyGrantedProductsAcrossTwoAgencies`, `clientUserSeesOnlyGrantedProductsNotUngranted` | automated test | None |
| AC3 | ✅ | `grantConveysReadNotWrite`, `mutationRouteRejectsGrantedReadOnlyUser` | automated test | None |
| AC4 | ✅ | `noGrantReturnsNotFoundNotForbidden`, `directIdAccessWithNoGrantReturns404` | automated test | None |
| AC5 | ✅ | `revocationTakesEffectImmediately`, `revokedGrantDeniesAccessOnNextRequest` | automated test | None |
| AC6 (regression guard) | ✅ | `existingTenantIsolationSuiteRunsUnmodifiedAndPasses` — spawns `tests/check-bri-s3.4-cross-tenant-isolation.js` as an unmodified child process; independently re-run directly by the reviewer, 14/14 passing | automated test + independent manual re-run | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The 5 new route handlers (`handleCreateGrant`, `handleListSharedProducts`, `handleGetSharedProduct`, `handleMutateSharedProduct`, `handleRevokeGrant`) were deliberately left unwired from `server.js`'s live URL dispatch table, exactly matching this story's own Out-of-Scope declaration ("the Agency-side UI/flow... that is Story 3"). This was resolved by Story 3/6, which each wire in the routes they own once the Client-org session shape was established — tracked as a cross-story handoff in `decisions.md`, not a gap in this story.

---

## Test Plan Coverage

**Tests from plan implemented:** 13 / 13
**Tests passing in CI:** 15 / 15 (13 from the test plan + 2 additional NFR tests confirmed passing)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| createsGrantScopedToRelationshipNotOrgBroadly (AC1) | ✅ | ✅ | |
| agencyShareCreatesGrantEndToEnd (AC1) | ✅ | ✅ | |
| grantCheckDeniesAccessViaWrongRelationship (AC2) | ✅ | ✅ | Core security property of the epic's highest-risk story |
| clientUserSeesOnlyGrantedProductsAcrossTwoAgencies (AC2) | ✅ | ✅ | |
| clientUserSeesOnlyGrantedProductsNotUngranted (AC2) | ✅ | ✅ | |
| grantConveysReadNotWrite (AC3) | ✅ | ✅ | |
| mutationRouteRejectsGrantedReadOnlyUser (AC3) | ✅ | ✅ | |
| noGrantReturnsNotFoundNotForbidden (AC4) | ✅ | ✅ | |
| directIdAccessWithNoGrantReturns404 (AC4) | ✅ | ✅ | |
| revocationTakesEffectImmediately (AC5) | ✅ | ✅ | |
| revokedGrantDeniesAccessOnNextRequest (AC5) | ✅ | ✅ | |
| existingTenantIsolationSuiteRunsUnmodifiedAndPasses (AC6) | ✅ | ✅ | bri-s3.4 suite, 14/14, independently re-confirmed |
| grantCheckAddsAtMostOneQueryPerProtectedRoute (NFR-perf) | ✅ | ✅ | |
| everyNewReadPathGoesThroughGrantCheckGuard (NFR-security) | ✅ | ✅ | Source-scan confirms zero direct queries against the new tables outside the dedicated adapter module |
| deniedAccessAttemptsAreAudited (NFR-audit) | ✅ | ✅ | |

Independently re-confirmed on merged master (2026-08-01): 15/15 passing.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — at most one additional query per protected route | ✅ | `grantCheckAddsAtMostOneQueryPerProtectedRoute` |
| Security — every new read path through the grant-check guard; no caching | ✅ | `everyNewReadPathGoesThroughGrantCheckGuard` source-scans `products.js` for direct table queries; the 2026-07-31 "no caching in MVP" Architecture Constraint (added to resolve review [1-M1]) removes the invalidation-delay risk AC5 depends on |
| Accessibility — not applicable at this layer | ✅ | Confirmed access-control logic only, no UI |
| Audit — grant creation/revocation/denial logged with relationship_id, org_id, resource_id, timestamp | ✅ | `deniedAccessAttemptsAreAudited` |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Agency-led client provisioning | ❌ | Not yet — this story enables the enforcement layer the metric's final "views a shared product" step depends on, but no real Agency/Client usage exists yet (staging only as of 2026-08-01, no production deploy). | Signal: not-yet-measured |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None.

---

## DoD Observations

1. This was the epic's own self-declared highest-risk story (Complexity 3/Unstable, named High-oversight sign-off at DoR). The extra scrutiny paid off in process terms — independent re-verification of the `bri-s3.4` regression suite (not just trusting the subagent's report) confirmed the claim was genuine (14/14, real spawn-as-child-process execution, not a mock).
2. Candidate `/improve` signal: this story's own MEDIUM review finding (caching/invalidation ambiguity for AC5) was resolved by adding an explicit "no caching in MVP" Architecture Constraint rather than building an invalidation mechanism — a cheap, correct resolution worth recognizing as a repeatable pattern when a review flags a *future* risk that can be eliminated by *not building* the thing that would create it.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Agency-Client relationships, shared-access grants, and read-only enforcement.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
