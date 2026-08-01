# Definition of Done: Organisation exists as a first-class entity with an org_type

**PR:** https://github.com/heymishy/skills-repo/pull/657 | **Merged:** 2026-07-30
**Story:** artefacts/2026-07-30-agency-client-organisations/stories/story-1-organisation-entity.md
**Test plan:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-1-organisation-entity-test-plan.md
**DoR artefact:** artefacts/2026-07-30-agency-client-organisations/dor/story-1-organisation-entity-dor.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-08-01

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `createsOrganisationsTableWithCorrectColumns` | automated test (`tests/check-story1-organisation-entity.js`) | None |
| AC2 | ✅ | `resolvesOrgTypeStandaloneForBackfilledTenant`, `backfillPathIntegratesWithSessionResolution` | automated test | None |
| AC3 | ✅ | `resolvesOrgTypeStandaloneForNewSignupNoAllowlistMatch` | automated test | Extended beyond the AC's literal "OAuth callback" wording: a same-PR follow-up (found during review, operator-approved before merge) additionally wires resolution into `routes/auth-email.js`'s email/password signup and login, not just OAuth. This is a scope *expansion* in the user's favor, not a gap — recorded here because AC3's text names only "OAuth callback." |
| AC4 | ✅ | `existingTenantRoutesUnaffectedByOrganisationsTable` | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The email/password wiring noted under AC3 above is additive coverage of the same underlying capability (organisation resolution at sign-in), not a new feature or an out-of-scope item — it was reviewed and approved by the operator before merge specifically because leaving it out would have left a gap for Story 3's later reliance on every tenant having an `organisations` row regardless of login method.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10 (8 from the original test plan + 2 added in the same PR for the email/password follow-up)
**Tests passing in CI:** 10 / 10

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| createsOrganisationsTableWithCorrectColumns (AC1) | ✅ | ✅ | |
| resolvesOrgTypeStandaloneForNewSignupNoAllowlistMatch (AC3) | ✅ | ✅ | |
| resolvesOrgTypeStandaloneForBackfilledTenant (AC2) | ✅ | ✅ | |
| existingTenantRoutesUnaffectedByOrganisationsTable (AC4) | ✅ | ✅ | |
| backfillPathIntegratesWithSessionResolution (AC2) | ✅ | ✅ | |
| organisationLookupAddsAtMostOneIndexedQuery (NFR-perf) | ✅ | ✅ | |
| organisationLookupScopedByTrustedSessionTenantId (NFR-security) | ✅ | ✅ | |
| organisationCreationIsAudited (NFR-audit) | ✅ | ✅ | |
| emailSignupResolvesOrganisationForNewTenant (fix-forward) | ✅ | ✅ | Added pre-merge after the AC3 scope gap was found |
| emailLoginResolvesOrganisationForExistingTenant (fix-forward) | ✅ | ✅ | Added pre-merge after the AC3 scope gap was found |

Independently re-confirmed on merged master (2026-08-01, post-`npm install`): 10/10 passing.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — at most one additional indexed lookup | ✅ | `organisationLookupAddsAtMostOneIndexedQuery` asserts query count directly against the fake pool |
| Security — no new tenant-scope surface (trusted session value only) | ✅ | `organisationLookupScopedByTrustedSessionTenantId` asserts the lookup uses only `req.session.tenantId` |
| Accessibility — not applicable | ✅ | Confirmed no UI in this story |
| Audit — organisation creation logged with tenant_id, org_type, timestamp | ✅ | `organisationCreationIsAudited` asserts log shape directly |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Agency-led client provisioning | ❌ | Not yet — this story alone provisions no Agency/Client orgs; it is the foundational entity every later story depends on. Feature not yet deployed to production (staging only as of 2026-08-01). | Signal: not-yet-measured |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None.

---

## DoD Observations

1. AC3's literal text ("resolved at OAuth callback") undershot what Story 3 actually needed (every tenant, regardless of login method, needs an `organisations` row) — the gap was caught during independent review before merge, not after. Worth a `/improve` candidate: when a story's AC scopes a cross-cutting resolution step to "one auth path," check whether sibling/downstream stories in the same epic assume it applies to all paths.
2. The `passport`/`passport-magic-login`/`resend` npm dependencies this epic introduces (added starting Story 3) require `npm install` to be re-run in any checkout of this repo that predates Story 3's merge — this bit during the DoD pass itself (a stale `node_modules` in the main checkout produced spurious "Cannot find module" test failures that had nothing to do with the code). Not a defect in this story; a operational note for anyone picking up this repo fresh.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Organisation exists as a first-class entity with an org_type.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
