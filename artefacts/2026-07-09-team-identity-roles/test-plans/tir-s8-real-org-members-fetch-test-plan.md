## Test Plan: Bulk-add fetches real GitHub org members, not the admin's own org memberships

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s8.md
**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Test plan author:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | New fetch returns real org members, not orgs-the-token-belongs-to | — | 1 test | — | — | — | 🟢 |
| AC2 | Unwired `setFetchOrgMembers` throws (D37) | 1 test | — | — | — | — | 🟢 |
| AC3 | End-to-end bulk-add with realistic member-object shape adds real teammates | — | 1 test | — | — | — | 🟢 |
| AC4 | Pagination followed across multiple pages | — | 1 test | — | — | — | 🟢 |
| AC5 | Existing tir-s5 tests corrected to mock the new function with realistic shapes | — | 1 test (regression) | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mocked (`getOrgMembers` mocked with realistic GitHub member-object shapes: `{login, id, type: 'User'}` — distinct from the org-object shape `{login, id, ...}` that was being incorrectly reused, to make the AC1/AC3 distinction concrete and testable)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mocked `getOrgMembers` returning 3 member objects for a specific org name | Mocked | None | |
| AC2 | No adapter wired | N/A | None | |
| AC3 | Mocked `getOrgMembers`, existing `people`/`team_memberships` fixtures from tir-s3/s5 | Mocked | None | |
| AC4 | Mocked `getOrgMembers` returning a `link`-header-shaped paginated response across 2+ pages | Mocked | None | |
| AC5 | tir-s5's existing test file's fixtures, corrected | Mocked | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `getOrgMembers` throws when `setFetchOrgMembers` is unwired

- **Verifies:** AC2
- **Precondition:** No adapter wired.
- **Action:** Call `getOrgMembers(orgName, accessToken, page)`.
- **Expected result:** Throws a clear "Adapter not wired: getOrgMembers. Call setFetchOrgMembers() with a real implementation before use." error, matching `setFetchOrgs`'s exact wording convention.
- **Edge case:** No.

---

## Integration Tests

### New fetch returns real org member logins for a specific org, not orgs the token belongs to

- **Verifies:** AC1
- **Components involved:** New `getOrgMembers`/`setFetchOrgMembers` adapter, mocked to return `[{login: 'alice'}, {login: 'bob'}, {login: 'carol'}]` for org `acme-corp`.
- **Precondition:** Mocked adapter configured to assert it's called with `orgName: 'acme-corp'` (not called with no org parameter, unlike the old `setFetchOrgs`).
- **Action:** Call `getOrgMembers('acme-corp', accessToken, 1)`.
- **Expected result:** Returns the 3 member logins — confirms the function signature takes an org name and the mocked call received it.

### End-to-end bulk-add with a realistic member-object shape adds real teammates

- **Verifies:** AC3
- **Components involved:** `bulkAddFromGithubOrg` (rewired to call `getOrgMembers` instead of the old `fetchOrgs`), mocked `getOrgMembers` returning `[{login: 'alice', id: 123, type: 'User'}]`.
- **Precondition:** `alice` has an existing `people` row (has logged in before), not yet a team member.
- **Action:** Run `bulkAddFromGithubOrg` for the admin's tenant.
- **Expected result:** `addedCount: 1` — `alice` is added as a teammate with the default role, proving the fix actually results in a real add, not a silent skip.

### Pagination is followed across multiple pages

- **Verifies:** AC4
- **Components involved:** Mocked `getOrgMembers` returning a `{ members, nextPage }`-shaped response across 2 pages.
- **Precondition:** Page 1 returns 2 members + `nextPage: 2`; page 2 returns 1 member + `nextPage: null`.
- **Action:** Run the org-members fetch to completion.
- **Expected result:** All 3 members across both pages are collected before `bulkAddFromGithubOrg` processes them.

### tir-s5's existing tests are corrected to mock the new function with realistic shapes

- **Verifies:** AC5
- **Components involved:** `tests/check-tir-s5-github-org-bulk-add.js`.
- **Precondition:** That file currently mocks `fetchOrgs` with person-shaped objects (the bug this story fixes).
- **Action:** Update its mocks to use `getOrgMembers` with realistic member-object shapes.
- **Expected result:** All of tir-s5's existing tests still pass after the correction — confirming the fix doesn't just add new tests but genuinely repairs the story it depends on.

---

## NFR Tests

### Org name is never request-supplied

- **NFR addressed:** Security
- **Measurement method:** Assert the route handler always passes `req.session.tenantId` as the org name to `getOrgMembers`, never a value read from `req.body`/`req.query`.
- **Pass threshold:** Zero code paths accept a request-supplied org name.
- **Tool:** Hand-rolled Node.js assertion in `tests/check-tir-s8-real-org-members-fetch.js`.

### Audit

- **NFR addressed:** Audit — inherited from tir-s5, unaffected by this story's fix. No new test needed beyond confirming tir-s5's existing audit test (AC5 above) still passes.

---

## Out of Scope for This Test Plan

- Testing `setFetchOrgs`/`resolveTenant` itself — unaffected by this story.
- Real GitHub API integration testing — mocked adapter only, per this codebase's convention.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None identified | This story's surface area is small (one new adapter, one call-site rewire, one test-fixture correction) and fully coverable at the mocked-integration level | — |
