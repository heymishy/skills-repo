# Test Plan: Organisation exists as a first-class entity with an org_type

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-1-organisation-entity.md
**Epic reference:** artefacts/2026-07-30-agency-client-organisations/epics/agency-client-organisations.md
**Test plan author:** Claude (agent-authored)
**Date:** 2026-07-31

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Migration creates `organisations` table with correct columns | 1 test | — | — | — | — | 🟢 |
| AC2 | Existing pre-story tenant gets backfilled `organisations` row, `org_type='standalone'`, no re-classification prompt | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Brand-new post-story signup resolves/creates `organisations` row at OAuth callback, `org_type='standalone'` | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Existing routes reading `req.session.tenantId` behave identically (non-regression) | — | 1 test | — | — | — | 🟢 |

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
|----|-------------|--------|------------------|-------|
| AC1 | None — schema-only assertion (table/columns exist) | Synthetic | None | Matches this codebase's existing `CREATE TABLE IF NOT EXISTS` migration-test pattern (e.g. `migrateTeamSchema`) |
| AC2 | A pre-existing `tenant_id` string with no `organisations` row | Synthetic (in-memory fake pool, `adapters/fake-test-db.js` pattern) | None | |
| AC3 | A brand-new `tenant_id` from a simulated OAuth callback | Synthetic | None | |
| AC4 | Any existing route/session fixture already used by pre-existing tests | Synthetic (reused fixtures) | None | Confirms additive-only behaviour |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `createsOrganisationsTableWithCorrectColumns` (`tests/check-story1-organisation-entity.js`)

- **Verifies:** AC1
- **Precondition:** In-memory fake pool with no `organisations` table
- **Action:** Run the migration function
- **Expected result:** `organisations` table exists with columns `org_id` (PK), `name`, `org_type`, `created_at`; re-running the migration is idempotent (no error, no duplicate table)
- **Edge case:** No

### `resolvesOrgTypeStandaloneForBackfilledTenant`

- **Verifies:** AC2
- **Precondition:** A `tenant_id` with no corresponding `organisations` row
- **Action:** Run the backfill/default-assignment step
- **Expected result:** A new `organisations` row is created with `org_type = 'standalone'` for that `tenant_id`; no prompt/workflow object is returned or queued for that tenant
- **Edge case:** Yes — backfill run twice for the same tenant is idempotent (no duplicate row, no error)

### `resolvesOrgTypeStandaloneForNewSignupNoAllowlistMatch`

- **Verifies:** AC3
- **Precondition:** Session resolution reaches OAuth callback with a `tenantId` that has no `TENANT_ORG_ALLOWLIST` match and no agency/client selection
- **Action:** Run the organisation-resolution step invoked at OAuth callback
- **Expected result:** An `organisations` row exists (created or resolved) for that `tenant_id` with `org_type = 'standalone'`
- **Edge case:** Yes — calling resolution twice for the same `tenant_id` returns the same row, does not create a second one

---

## Integration Tests

### `existingTenantRoutesUnaffectedByOrganisationsTable`

- **Verifies:** AC4
- **Components involved:** Organisation-resolution step, existing route handler(s) that read `req.session.tenantId`
- **Precondition:** A pre-existing test fixture/session exercising an existing route (e.g. a products list route) with a `tenant_id` now also present in `organisations`
- **Action:** Run the existing route's pre-existing test assertions unchanged, with the new `organisations` table/resolution step active
- **Expected result:** All pre-existing assertions pass unmodified — no change to response shape, status code, or session fields as a result of this story

### `backfillPathIntegratesWithSessionResolution`

- **Verifies:** AC2
- **Components involved:** Backfill step, session/tenant resolution
- **Precondition:** A pre-story tenant fixture with an active session but no `organisations` row
- **Action:** Exercise a request that triggers organisation resolution
- **Expected result:** Row is backfilled transparently; the request completes with the same response the tenant would have received before this story shipped

---

## NFR Tests

### `organisationLookupAddsAtMostOneIndexedQuery`

- **NFR addressed:** Performance
- **Measurement method:** Count queries issued by the fake pool during a single OAuth-callback resolution
- **Pass threshold:** At most 1 additional `SELECT ... FROM organisations WHERE tenant_id = $1`-shaped query beyond pre-story query count
- **Tool:** Node (query-count assertion against the fake pool's call log)

### `organisationLookupScopedByTrustedSessionTenantId`

- **NFR addressed:** Security
- **Measurement method:** Assert the lookup uses `req.session.tenantId` (trusted, server-set) — never a request-supplied value (query string, body, header)
- **Pass threshold:** Lookup call args trace back only to the session value in the test fixture
- **Tool:** Node (call-arg assertion)

### `organisationCreationIsAudited`

- **NFR addressed:** Audit
- **Measurement method:** Assert a log/event is emitted on `organisations` row creation containing `tenant_id`, `org_type`, and a timestamp
- **Pass threshold:** Log entry present with all three fields for every creation path (AC2 backfill, AC3 new signup)
- **Tool:** Node (injectable logger stub, asserting call shape)

Accessibility: Not applicable — no UI in this story (confirmed "None" per story NFRs).

---

## Out of Scope for This Test Plan

- Any UI for viewing/editing organisation details — none exists in this story
- Setting `org_type = 'agency'`/`'client'` — covered by Story 3's test plan
- The Agency-Client relationship table — covered by Story 2's test plan

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
