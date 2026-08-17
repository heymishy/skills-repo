# Definition of Done: bri-s3.5's billing journey runs against real staging (session seeding + webhook signature stub)

**PR:** #605 (commit `43be7011`) | **Merged:** 2026-07-25 (git commit timestamp: 2026-07-25T19:32:44+12:00)
**Story:** artefacts/2026-07-25-billing-journey-staging-safe/stories/bjs-s1-billing-journey-staging-safe.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 | Yes | `testSessionGateAC1SecretUnset` -- "AC1: secret unset -> _isTestEndpointAllowed false (route stays NODE_ENV=test-only)" | Automated test, freshly re-run | None |
| AC2 | Yes | `testSessionGateAC2SecretSetHeaderMatches` + `testSessionRouteWidenedInSource` -- "AC2: secret set + header matches -> _isTestEndpointAllowed true" / "AC2: /test/session route condition now uses _isTestEndpointAllowed(req)" | Automated test (behavioural + source-text assertion), freshly re-run | None |
| AC3 | Yes | `testSessionTenantIdPrefixGuardInSource` -- "AC3/AC4: /test/session handler validates tenantId against an e2e- prefix pattern" | Automated source-text assertion, freshly re-run | None |
| AC4 | Yes | Same test as AC3 (single source-text assertion covers both, per the handler body match) | Automated source-text assertion, freshly re-run | None |
| AC5 | Yes | `testAC5SecretUnsetStubNeverActivates` -- "AC5: real verifyWebhookSignature invoked when secret unset, even with header present" | Automated test (spy count), freshly re-run | None |
| AC6 | Yes | `testAC6StubActivatesForAllE2ETenantIds` + `testAC6StubActivatesForMetadataTenantId` -- "AC6: real verifyWebhookSignature NOT invoked when the stub is active" / "AC6: existing dispatch logic runs unmodified (tenantPlan.setPlanState called with the event's tenantId)" / "AC6: metadata.tenant_id-shaped event also activates the stub and dispatches correctly" | Automated test, freshly re-run | None |
| AC7 | Yes | `testAC7RejectsNonE2EClientReferenceId`, `testAC7RejectsNonE2EMetadataTenantId`, `testAC7RejectsNonE2ESubscriptionMetadataTenantId` -- all three assert "-> 400" plus "no plan-state mutation happens on rejection" | Automated test, freshly re-run (3 tests, one per candidate field) | None |
| AC8 | Yes (evidence gap noted) | `tests/e2e/bri-s3.5-billing-journey.spec.js` was modified in the same PR (19 lines changed, per `git show 43be7011 --stat`) consistent with AC8's intent, and `.github/pipeline-state.json` records `acVerified: 8` (all 8 ACs, `testPlan.status: "all-passing"`) at time of merge. No fresh Playwright run output was captured or supplied for this retroactive session -- only the `check-bjs-s1-billing-journey-staging-safe.js` unit-level results (AC1-AC7) were re-run today. | Historical pipeline-state record + PR diff; no fresh execution evidence this session | Evidence gap only (see Scope Deviations) |

## Scope Deviations

None on functional scope. The story's own "Out of Scope" section explicitly defers a live re-run against real `wuce-staging` to post-merge verification (matching `dss-s1`/`nis-s1` precedent) -- accepted, not a defect.

One evidence-completeness note (not a functional deviation): AC8's local Playwright suite re-run was not independently re-executed during this retroactive DoD pass (out of scope for this bookkeeping session, and standing up the local harness was not part of the provided evidence). The historical `pipeline-state.json` record (`acVerified: 8`, `testPlan.status: "all-passing"`) and the fact that the spec file itself was edited as part of this PR are treated as sufficient standing evidence that AC8 was satisfied at merge time.

## Test Plan Coverage

`check-bjs-s1-billing-journey-staging-safe.js`: **17 passed, 0 failed** (freshly re-run this session, 2026-08-17). This matches the `totalTests: 17, passing: 17` figure already recorded in `.github/pipeline-state.json` at merge time. Covers AC1-AC7 directly (unit/behavioural + source-text assertions). AC8 (existing Playwright suite re-run) is a separate, non-unit test path per the story's test plan and was not re-executed this session -- see AC Coverage table.

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Security (e2e- prefix guard is the load-bearing control) | Met | AC3/AC4 (session mint) and AC7 (webhook stub, all three candidate fields) all pass; `decisions.md` documents the threat model (leaked secret must never mark a real tenant as paid or grant real credits) and the guard's coverage of every tenantId-shaped field the dispatch switch reads |
| Backward compatibility (zero behaviour change on real prod path + local NODE_ENV=test path) | Met | AC1 and AC5 both assert unchanged behaviour when the secret is unset; AC8 (see evidence-gap note above) covers the local harness path |

## Metric Signal

No `benefit-metric` artefact is referenced by this story or present in the feature folder -- this is a short-track security-scoped infra fix (not a discovery-through-benefit-metric feature), so no metric signal applies.

## Outcome

**COMPLETE**
**Follow-up actions:** None required. Optional (not blocking): a fresh local Playwright re-run of `tests/e2e/bri-s3.5-billing-journey.spec.js` would upgrade AC8 from historical/diff-based evidence to freshly-verified evidence, but this is not a known or suspected regression -- just a completeness nicety for this retroactive pass.

## DoD Observations

Story correctly root-caused a misleading downstream symptom ("plan-state returns HTML") to two independent, real staging-safety gaps (an uncovered 5th `/test/*` route and unstubbed webhook signature verification) rather than patching the symptom; the webhook-stub tenantId guard is explicitly called out in `decisions.md` as the highest-risk mechanism in this batch, and its test coverage (3 distinct candidate-field rejection tests) matches that risk rating. No incidents or regressions identified against this story since merge (2026-07-25).
