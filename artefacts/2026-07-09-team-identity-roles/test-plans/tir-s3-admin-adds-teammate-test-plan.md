## Test Plan: An admin adds a teammate by identity and assigns a role

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s3.md
**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Test plan author:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Admin adds an existing person by identity, specifies a role | — | 1 test | — | — | — | 🟢 |
| AC2 | Assigned role resolves in session on the teammate's next login | — | 1 test | — | — | — | 🟢 |
| AC3 | Non-admin is denied (403) on add-teammate/assign-role endpoints | — | 1 test | — | — | — | 🟢 |
| AC4 | Re-adding an existing member updates role in place, no duplicate row | — | 1 test | — | — | — | 🟢 |
| AC5 | Adding a never-logged-in identity is rejected with a clear error | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mocked (`fake-test-db.js` extension from tir-s1, seeded with synthetic `people`/`team_memberships` rows)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | An admin session; a second synthetic person who has already logged in once (existing `people` row) | Synthetic | None | |
| AC2 | Same as AC1, plus a simulated subsequent login as the newly-added teammate | Synthetic | None | |
| AC3 | A non-admin (engineer/product/viewer) session | Synthetic | None | |
| AC4 | An admin session; a teammate already added once | Synthetic | None | |
| AC5 | An admin session; an identity descriptor with no corresponding `people` row | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — add/assign-role logic is a thin handler over the schema from tir-s1; better exercised as integration tests against the mocked DB and session layer directly.

---

## Integration Tests

### Admin adds an existing person as a teammate with a specified role

- **Verifies:** AC1
- **Components involved:** Add-teammate route handler, `team_memberships` table (mocked pool), admin session.
- **Precondition:** Admin session for tenant `acme`; a person with an existing `people` row (has logged in before) not yet a member of `acme`.
- **Action:** Admin calls the add-teammate action, specifying role `engineer`.
- **Expected result:** A `team_memberships` row is created linking that person to `acme` with role `engineer`.

### Assigned role resolves correctly on the teammate's next login

- **Verifies:** AC2
- **Components involved:** Add-teammate route handler (from AC1), login handler.
- **Precondition:** Teammate added with role `engineer` per AC1's setup.
- **Action:** Simulate that teammate logging in.
- **Expected result:** `req.session.role` resolves to `'engineer'` for tenant `acme` — distinct from the admin's own `'admin'` role in the same tenant.

### Non-admin is denied on the add-teammate and assign-role endpoints

- **Verifies:** AC3
- **Components involved:** Add-teammate/assign-role route handlers.
- **Precondition:** Session with role `engineer` (non-admin) for tenant `acme`.
- **Action:** Call the add-teammate endpoint.
- **Expected result:** 403 Forbidden; no `team_memberships` row is created or modified.

### Re-adding an existing member updates their role in place, not a duplicate row

- **Verifies:** AC4
- **Components involved:** Add-teammate route handler, `team_memberships` table pre-seeded with an existing membership (role `engineer`).
- **Precondition:** Admin session for `acme`; teammate already a member with role `engineer`.
- **Action:** Admin calls add-teammate again for the same person, specifying role `product`.
- **Expected result:** Exactly one `team_memberships` row exists for that person/tenant pair, now with role `product` — not two rows.

### Adding a never-logged-in identity is rejected

- **Verifies:** AC5
- **Components involved:** Add-teammate route handler, `people` table with no row for the target identity.
- **Precondition:** Admin session for `acme`; the identity descriptor provided has no corresponding `people` row.
- **Action:** Admin attempts to add that identity as a teammate.
- **Expected result:** The action is rejected with a clear error stating the person must log in at least once first; no `people` or `team_memberships` row is created.

---

## NFR Tests

### Add/assign-role actions are scoped to the admin's own tenant only

- **NFR addressed:** Security
- **Measurement method:** An admin of tenant `acme` attempts to add a teammate or assign a role for tenant `other-tenant`; assert the action is rejected and no row is created for `other-tenant`.
- **Pass threshold:** Zero cross-tenant writes succeed.
- **Tool:** Hand-rolled Node.js assertion in `tests/check-tir-s3-admin-adds-teammate.js`.

### Audit

- **NFR addressed:** Audit (role assignment logged with admin ID, target person ID, role, tenant, timestamp)
- **Measurement method:** Assert the logger is called with all required fields on a successful add/assign action.
- **Pass threshold:** Log entry present with all 5 required fields.
- **Tool:** Hand-rolled Node.js assertion (spy on the injected logger).

### Accessibility

- **NFR addressed:** Accessibility (team management page's add-teammate control meets WCAG 2.1 AA)
- **Measurement method:** No automated scan tooling exists in this repo's unit/integration layer for this — verified manually.
- **Pass threshold:** N/A — manual.
- **Tool:** Manual.

---

## Out of Scope for This Test Plan

- Self-serve invite/email-based invitation flows — not built in this story.
- Removing a teammate — not built in this story.
- A pending-invite state — memberships are active immediately in this story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None identified beyond what's already covered above | — | — |
