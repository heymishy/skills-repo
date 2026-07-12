## Test Plan: An admin bulk-adds teammates from their connected GitHub org

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s5.md
**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Test plan author:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Bulk-add creates memberships for org members not already present, role `engineer` | — | 1 test | — | — | — | 🟢 |
| AC2 | Bulk-added member logs in via GitHub, resolves same as manual add | — | 1 test | — | — | — | 🟢 |
| AC3 | Re-run skips existing members, doesn't overwrite manually-set roles | — | 1 test | — | — | — | 🟢 |
| AC4 | Missing org-scope token fails with a clear, actionable error | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. The GitHub org-membership API itself (`setFetchOrgs`, p1.1) is already mocked in existing tests in this codebase — this story reuses that same mocking approach, not a new integration point.

---

## Test Data Strategy

**Source:** Mocked (`setFetchOrgs` adapter mocked to return a synthetic org member list; `fake-test-db.js` extension from tir-s1 for `team_memberships`)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mocked `setFetchOrgs`-style org member list (synthetic GitHub logins) | Mocked | None | |
| AC2 | Same synthetic org member list, plus a simulated login as one bulk-added member | Mocked | None | |
| AC3 | Org member list where one member was already added manually with a non-default role | Mocked | None | Confirms no overwrite |
| AC4 | Mocked adapter configured to reject with a scope-error, simulating a token missing org-read scope | Mocked | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — bulk-add is a thin loop over tir-s3's add-teammate operation; better exercised as integration tests.

---

## Integration Tests

### Bulk-add creates memberships for every org member not already present

- **Verifies:** AC1
- **Components involved:** Bulk-add route handler, mocked `setFetchOrgs` (returns 3 synthetic org members), `team_memberships` table (empty for this tenant).
- **Precondition:** Admin's account connected to a mocked GitHub org with 3 members; none are yet `team_memberships` rows for the admin's tenant.
- **Action:** Admin triggers bulk-add.
- **Expected result:** 3 new `team_memberships` rows exist, each with role `engineer`.

### A bulk-added member logs in and resolves identically to a manually-added teammate

- **Verifies:** AC2
- **Components involved:** Bulk-add route handler (from AC1), login handler.
- **Precondition:** One of the 3 bulk-added members from AC1's setup.
- **Action:** Simulate that member logging in via GitHub.
- **Expected result:** `req.session.role` resolves to `engineer` for the admin's tenant — identical resolution path to tir-s3's manual add, no separate login code path.

### Re-running bulk-add skips existing members and does not overwrite a manually-changed role

- **Verifies:** AC3
- **Components involved:** Bulk-add route handler, `team_memberships` pre-seeded with one of the 3 org members already present with a manually-set role `product`.
- **Precondition:** Same mocked 3-member org list; one member already has a `team_memberships` row with role `product` (manually changed after an earlier bulk-add or manual add).
- **Action:** Admin triggers bulk-add again.
- **Expected result:** Exactly 3 `team_memberships` rows exist total (no duplicates); the member with role `product` still has role `product`, not reset to `engineer`.

### Missing org-membership read scope fails with a clear, actionable error

- **Verifies:** AC4
- **Components involved:** Bulk-add route handler, mocked `setFetchOrgs` configured to reject with a scope-related error.
- **Precondition:** Admin's GitHub token lacks org-membership read scope (simulated via the mocked adapter rejecting).
- **Action:** Admin triggers bulk-add.
- **Expected result:** The action fails with an error message naming the missing permission — not a silent no-op (zero rows created, no misleading "success") and not an unhandled crash.

---

## NFR Tests

### Bulk-add stays within the admin's own verified GitHub org

- **NFR addressed:** Security
- **Measurement method:** Assert the bulk-add handler only requests org membership for the org the admin's own account is verified in (via the mocked `setFetchOrgs` call arguments) — it cannot be pointed at an arbitrary org name via request parameters.
- **Pass threshold:** Zero code paths accept an admin-supplied org name that differs from their own verified org.
- **Tool:** Hand-rolled Node.js assertion in `tests/check-tir-s5-github-org-bulk-add.js`.

### Performance

- **NFR addressed:** Performance (bulk-add for ~100 members completes without timing out)
- **Measurement method:** Shared with tir-s6's bulk-insert timing test — not duplicated here to avoid two tests asserting the same threshold; see tir-s6's test plan.
- **Pass threshold:** See tir-s6.
- **Tool:** See tir-s6.

### Audit

- **NFR addressed:** Audit (bulk-add logged with admin ID, org name, member count, timestamp)
- **Measurement method:** Assert the logger is called with all required fields after a successful bulk-add.
- **Pass threshold:** Log entry present with all 4 required fields.
- **Tool:** Hand-rolled Node.js assertion (spy on the injected logger).

---

## Out of Scope for This Test Plan

- Live/ongoing GitHub org membership sync — one-time action only, not tested as a recurring process.
- Bulk-add from any non-GitHub directory — not built in this story.
- Per-member role selection within the same bulk action — all bulk-added members get the same default role.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real GitHub org API behaviour at realistic org sizes | Mocked `setFetchOrgs` in this test plan; the real adapter (p1.1) is already covered by its own existing tests | Rely on p1.1's existing real-adapter test coverage rather than re-testing the GitHub API integration itself here |
