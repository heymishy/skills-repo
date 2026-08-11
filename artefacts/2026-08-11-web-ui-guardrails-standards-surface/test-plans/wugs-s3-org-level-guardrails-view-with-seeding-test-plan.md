## Test Plan: Show a tenant's org-level guardrails and standards, read from a designated org repo, seeded on first use

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s3-org-level-guardrails-view-with-seeding.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-1-repo-backed-viewing.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | first designation seeds org repo | 1 test | — | — | — | — | 🟢 |
| AC2 | org section shows real designated-repo content | 1 test | — | — | — | — | 🟢 |
| AC3 | no org repo designated — explicit state | 1 test | — | — | — | — | 🟢 |
| AC4 | two products, same tenant, same org content | 1 test | — | — | — | — | 🟢 |
| AC5 | cross-tenant isolation | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. Review finding 1-M1 (seed content unspecified) resolved 2026-08-11 — AC1 now names the exact verbatim seed content; the AC1 unit test below asserts against that exact text.

---

## Test Data Strategy

**Source:** Synthetic (mock `tenant_org_repo` table state) + Mocked external services (`wugs-s1`'s fetch, injected)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock pool with no `tenant_org_repo` row initially | Mock pool | None | Assert an INSERT occurs and mocked fetch/write calls fire for seed content |
| AC2 | Mock pool with an existing `tenant_org_repo` row + mocked fetch content | Mock pool + mocked adapter | None | |
| AC3 | Mock pool with no `tenant_org_repo` row | Mock pool | None | |
| AC4 | Two mock product rows under the same `tenant_id`, one `tenant_org_repo` row | Mock pool | None | |
| AC5 | Two mock product rows under different `tenant_id`s, two different `tenant_org_repo` rows | Mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None — resolved (see above).

---

## Unit Tests

### designateOrgRepo_noExistingRow_createsRowAndSeedsExactContent

- **Verifies:** AC1
- **Precondition:** Mock pool query for `tenant_org_repo` by tenant_id returns no row
- **Action:** Call the org-repo designation handler with a repo_owner/repo_name
- **Expected result:** A `tenant_org_repo` INSERT is issued; a write call fires (via `wugs-s6`'s adapter, stubbed for this story's own test) seeding `.github/architecture-guardrails.md` and `standards/getting-started.md` with the exact verbatim content specified in AC1 — asserted string-for-string, not just "some content exists"
- **Edge case:** No

### handleGetGuardrailsView_orgRepoDesignated_showsRealContent

- **Verifies:** AC2
- **Precondition:** Mock pool returns a `tenant_org_repo` row; mocked fetch returns real-shaped content for that repo
- **Action:** Call the view handler for any product under that tenant
- **Expected result:** Org-level section shows the mocked content, using the identical read mechanism as `wugs-s2`
- **Edge case:** No

### handleGetGuardrailsView_noOrgRepoDesignated_showsExplicitPrompt

- **Verifies:** AC3
- **Precondition:** Mock pool returns no `tenant_org_repo` row
- **Action:** Call the view handler
- **Expected result:** Org-level section shows an explicit "no org repo designated" state with a designation entry point — not silently empty
- **Edge case:** No

### handleGetGuardrailsView_twoProductsSameTenant_identicalOrgContent

- **Verifies:** AC4
- **Precondition:** Two mock products under the same tenant_id, one `tenant_org_repo` row
- **Action:** Call the view handler for each product
- **Expected result:** Both responses show identical org-level content
- **Edge case:** No

---

## Integration Tests

### handleGetGuardrailsView_crossTenantIsolation_neverLeaksOtherTenantOrgRepo

- **Verifies:** AC5
- **Components involved:** view handler, `tenant_org_repo` lookup, `wugs-s1` fetch
- **Precondition:** Two mock products under two different tenant_ids, each with its own `tenant_org_repo` row pointing at different repos
- **Action:** Call the view handler for Tenant A's product and Tenant B's product
- **Expected result:** Tenant A's response never contains Tenant B's org repo owner/name/content or vice versa
- **Edge case:** Yes — this is the feature's core multi-tenancy guarantee (ADR-025), treated as a hard NFR test, not just implied by the query's `WHERE tenant_id` clause

---

## NFR Tests

### Cross-tenant isolation is asserted directly, not implied

- **NFR addressed:** Security (ADR-025)
- **Measurement method:** Same as the AC5 integration test above — this IS the NFR test, duplicated here per the template's requirement to name it explicitly
- **Pass threshold:** Zero cross-tenant data leakage across the assertion
- **Tool:** Node, mock-pool assertion

### Org-repo designation is audit-logged

- **NFR addressed:** Audit
- **Measurement method:** Assert a PostHog `org_repo_designated` capture call fires with tenant_id, repo_owner, repo_name on AC1's designation flow
- **Pass threshold:** Capture call present with correct properties
- **Tool:** Node, mock PostHog client assertion

---

## Out of Scope for This Test Plan

- The actual content/wording of the seeded starter entries — pending review finding `wugs-s3` 1-M1 resolution.
- UI for re-designating an org repo after first set — out of scope per the story itself.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Seeded content text unspecified | Story's own review finding 1-M1 | Resolve via /decisions or story revision before this AC1 test can assert exact text; current test asserts seeding behaviour only |
