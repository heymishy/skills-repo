# Test Plan: Agency-Client relationships, shared-access grants, and read-only enforcement

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-2-relationship-grants-enforcement.md
**Epic reference:** artefacts/2026-07-30-agency-client-organisations/epics/agency-client-organisations.md
**Test plan author:** Claude (agent-authored)
**Date:** 2026-07-31

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Grant created scoped to specific relationship | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Grant scoped per-relationship — no cross-relationship leak (2 Agencies, 1 Client) | 1 test | 2 tests | — | — | — | 🔴 |
| AC3 | Grant conveys read-only, not write, access | 1 test | 1 test | — | — | — | 🔴 |
| AC4 | No grant → 404 (not 403), matching FORBIDDEN-vs-NOT_FOUND policy | 1 test | 1 test | — | — | — | 🔴 |
| AC5 | Revocation takes effect immediately, no caching delay | 1 test | 1 test | — | — | — | 🔴 |
| AC6 | Regression guard — existing tenant-isolation suite (`bri-s3.4`) unaffected | — | 1 test (full existing suite re-run) | — | — | — | 🟢 |

🔴 marks the security-critical ACs per this story's own Architecture Constraints ("the single highest-risk story in the epic") — extra scrutiny at review of the actual test assertions, not just their existence.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | One Agency org, one Client org, one relationship row | Synthetic | None | |
| AC2 | One Client org, two Agency orgs, two relationships, one grant on each | Synthetic | None | The two-Agency, one-Client fixture is the load-bearing test data shape for this whole story — build it once, reuse across AC2/AC4/AC5 |
| AC3 | A Client-org user with a valid read grant on a resource | Synthetic | None | |
| AC4 | A Client-org user with NO grant on a resource | Synthetic | None | |
| AC5 | A previously-granted, now-revoked grant | Synthetic | None | |
| AC6 | Existing `bri-s3.4` fixtures (reused, unmodified) | Existing fixtures | None | Do not recreate — import/reuse as-is to prove true non-regression |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `createsGrantScopedToRelationshipNotOrgBroadly`

- **Verifies:** AC1
- **Precondition:** An Agency org, a Client org, and an existing relationship row between them
- **Action:** Call the grant-creation adapter for a specific product
- **Expected result:** The created grant record's `relationship_id` matches the specific relationship — not a bare `client_org_id`-only scoping
- **Edge case:** No

### `grantCheckDeniesAccessViaWrongRelationship`

- **Verifies:** AC2
- **Precondition:** Client org has relationships with Agency A and Agency B; only the Agency A relationship has a grant for Product X
- **Action:** Run the grant-check adapter for the Client org against Product X
- **Expected result:** Grant-check returns true when evaluated against the Agency A relationship; returns false when evaluated as if only the Agency B relationship existed
- **Edge case:** Yes — this is the story's core security property; test it directly at the adapter level, not only through the route

### `grantConveysReadNotWrite`

- **Verifies:** AC3
- **Precondition:** A Client-org user with a valid grant on Product X
- **Action:** Call the write-capable route handler (e.g. the PUT/POST mutation handler) directly with that user's session
- **Expected result:** Handler returns 403; no mutation is applied to the underlying resource
- **Edge case:** No

### `noGrantReturnsNotFoundNotForbidden`

- **Verifies:** AC4
- **Precondition:** A Client-org user with no grant for Product Y
- **Action:** Call the read route handler for Product Y directly by ID
- **Expected result:** Handler returns 404 (not 403) — matches `middleware/journey-access.js`'s existing FORBIDDEN-vs-NOT_FOUND policy
- **Edge case:** Yes — also assert the 404 response body does not reveal whether the resource exists at all (identical shape to a genuinely non-existent resource ID)

### `revocationTakesEffectImmediately`

- **Verifies:** AC5
- **Precondition:** A grant exists and is then revoked (`revoked_at` set) within the same test
- **Action:** Run the grant-check adapter immediately after revocation, with no intervening delay or cache-warm step
- **Expected result:** Grant-check returns false immediately — no TTL, no stale-read window
- **Edge case:** Yes — explicitly assert there is no caching layer in the grant-check path (or that any cache is bypassed on revocation) so this isn't just "the test happened to run after an arbitrary cache TTL"

---

## Integration Tests

### `agencyShareCreatesGrantEndToEnd`

- **Verifies:** AC1
- **Components involved:** Grant-creation route handler, relationship adapter, grant adapter
- **Precondition:** Existing Agency→Client relationship
- **Action:** POST to the share/grant-creation route as the Agency admin
- **Expected result:** A grant row is persisted scoped to the correct `relationship_id`; response confirms success

### `clientUserSeesOnlyGrantedProductsAcrossTwoAgencies`

- **Verifies:** AC2
- **Components involved:** Product-list route, grant-check adapter, relationship adapter
- **Precondition:** Two-Agency, one-Client fixture (Agency A shares Product X; Agency B shares nothing, or shares a different product not granted to this Client)
- **Action:** GET the product list as the Client-org user
- **Expected result:** Product X appears; nothing shared only via a relationship without a grant to this Client appears

### `clientUserSeesOnlyGrantedProductsNotUngranted`

- **Verifies:** AC2 (negative direction)
- **Components involved:** Product-list route, grant-check adapter
- **Precondition:** Same two-Agency fixture, but this time Agency B DOES share a product only via its own relationship, with no grant reaching the Client for it through Agency A
- **Action:** GET the product list as the Client-org user
- **Expected result:** Agency B's shared product is absent from the response

### `mutationRouteRejectsGrantedReadOnlyUser`

- **Verifies:** AC3
- **Components involved:** Full route stack (session middleware → grant-check guard → mutation handler)
- **Precondition:** Client-org user with a valid read grant
- **Action:** Full HTTP-level PUT/POST request through the route stack
- **Expected result:** 403, handler body never reached, no side effect

### `directIdAccessWithNoGrantReturns404`

- **Verifies:** AC4
- **Components involved:** Full route stack
- **Precondition:** Client-org user, resource ID that exists but is not granted to them
- **Action:** Full HTTP-level GET request by direct ID
- **Expected result:** 404, response body identical in shape to a genuinely-nonexistent-ID 404

### `revokedGrantDeniesAccessOnNextRequest`

- **Verifies:** AC5
- **Components involved:** Full route stack, grant adapter
- **Precondition:** Grant created, then revoked, within the test
- **Action:** GET the resource immediately after revocation via the full route stack
- **Expected result:** 404 (per AC4's policy) on the very next request — no delay

### `existingTenantIsolationSuiteRunsUnmodifiedAndPasses` (`bri-s3.4` regression)

- **Verifies:** AC6
- **Components involved:** Full existing tenant-isolation test suite
- **Precondition:** This story's changes merged
- **Action:** Run `tests/check-bri-s3.4-*.js` (and related tenant-scoping tests) exactly as they exist today, unmodified
- **Expected result:** 100% of pre-existing assertions still pass — zero regressions introduced by the new relationship/grant guard extension

---

## NFR Tests

### `grantCheckAddsAtMostOneQueryPerProtectedRoute`

- **NFR addressed:** Performance
- **Measurement method:** Count queries issued by the fake pool for one protected-route request
- **Pass threshold:** At most 1 additional query beyond the existing tenant-scoping guard's baseline query count
- **Tool:** Node (query-count assertion)

### `everyNewReadPathGoesThroughGrantCheckGuard`

- **NFR addressed:** Security
- **Measurement method:** Static/structural check — every new route handler introduced by this story imports and calls the shared grant-check adapter (not an ad hoc inline query)
- **Pass threshold:** Zero new route handlers found querying `agency_client_relationships`/`shared_access_grants` tables directly, bypassing the adapter
- **Tool:** Node (source-scan assertion, mirroring the existing "no direct DB access from UI layer" guardrail check pattern)

### `deniedAccessAttemptsAreAudited`

- **NFR addressed:** Audit
- **Measurement method:** Assert a log entry is emitted on every AC4-path denial containing `relationship_id`, `org_id`, `resource_id`, and timestamp
- **Pass threshold:** Log entry present with all four fields on denial
- **Tool:** Node (injectable logger stub)

Accessibility: Not applicable at this story's layer — confirmed "covered by Story 3" per story NFRs (this story is access-control logic, not UI).

---

## Out of Scope for This Test Plan

- The Agency-side UI/flow for creating a relationship and granting access — covered by Story 3's test plan
- Any bidirectional (Client-to-Agency) sharing — explicitly out of scope per the story
- Comments/collaboration on shared resources — covered by Story 5's test plan

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
