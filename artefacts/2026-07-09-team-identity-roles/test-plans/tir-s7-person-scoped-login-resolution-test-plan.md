## Test Plan: Login role resolution is scoped by person, not just tenant

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s7.md
**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Test plan author:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Person Y (engineer) in a 2-person tenant resolves their own role, not X's | — | 1 test | — | — | — | 🟢 |
| AC2 | Person X (admin) in the same tenant resolves their own role | — | 1 test | — | — | — | 🟢 |
| AC3 | Solo tenant login is unaffected (regression) | — | 1 test | — | — | — | 🟢 |
| AC4 | Brand-new unknown identity resolves to default 'user', no crash | — | 1 test | — | — | — | 🟢 |
| AC5 (D37) | `server.js` wiring resolves personId via `resolvePersonForIdentity` before the role lookup | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mocked (extends tir-s1/tir-s3's `fake-test-db.js`-style pool mocking with `person_identities` rows, matching tir-s2's own test convention)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Two `team_memberships` rows in tenant `acme` (person X = admin, person Y = engineer); mocked login as Y | Synthetic | None | |
| AC2 | Same fixture, mocked login as X | Synthetic | None | |
| AC3 | One `team_memberships` row for a solo tenant | Synthetic | None | |
| AC4 | No `team_memberships` row, no `user_roles` row, no `person_identities` row for the identity being tested | Synthetic | None | |
| AC5 | Inspect `server.js`'s wiring call site directly | N/A | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `server.js` wires person resolution before the role lookup

- **Verifies:** AC5 (D37 mandatory wiring)
- **Precondition:** `server.js` module loaded (isolated child process, not in-process require, per this repo's established convention to avoid the `setInterval()` hang).
- **Action:** Inspect the `setGetRoleForTenant` wiring call site.
- **Expected result:** The wired implementation calls `resolvePersonForIdentity` (or equivalent person-resolution step) before querying `team_memberships` — not a bare `tenantId`-only query.
- **Edge case:** No.

---

## Integration Tests

### Person Y resolves their own role in a shared tenant, not person X's

- **Verifies:** AC1
- **Components involved:** `resolveRoleForTenant` (or its corrected replacement), `resolvePersonForIdentity` (`identity-links.js`), mocked pool with 2 `team_memberships` rows in tenant `acme` (personX=admin, personY=engineer).
- **Precondition:** `identityKey` for Y resolves to `personId` Y via `resolvePersonForIdentity`.
- **Action:** Call the corrected role-resolution function with Y's identity/tenant.
- **Expected result:** Returns `engineer` — Y's own role — regardless of row insertion order in the mocked pool.

### Person X resolves their own role in the same shared tenant

- **Verifies:** AC2
- **Components involved:** Same as above, mocked login as X.
- **Precondition:** Same fixture.
- **Action:** Call the corrected role-resolution function with X's identity/tenant.
- **Expected result:** Returns `admin` — confirming both people resolve independently in the same tenant.

### Solo tenant login is unaffected

- **Verifies:** AC3
- **Components involved:** Same function, mocked pool with exactly one `team_memberships` row for a solo tenant.
- **Precondition:** One row, one person.
- **Action:** Call the corrected role-resolution function.
- **Expected result:** Returns the same role as before this story — zero regression for the common case.

### Brand-new unknown identity resolves to the default role, no crash

- **Verifies:** AC4
- **Components involved:** Same function, `resolvePersonForIdentity` returning `null` (no `person_identities` row, no `team_memberships` fallback row).
- **Precondition:** Completely unknown identity — no rows anywhere.
- **Action:** Call the corrected role-resolution function.
- **Expected result:** Returns `user` (today's existing default) — `resolvePersonForIdentity`'s `null` return is handled gracefully, not thrown or crashed on.

---

## NFR Tests

### Security — correctness of per-person resolution

- **NFR addressed:** Security
- **Measurement method:** Directly covered by AC1/AC2 above — a person must never resolve to a role that isn't their own, regardless of row order.
- **Pass threshold:** 100% — zero cases where the wrong person's role is returned.
- **Tool:** Hand-rolled Node.js assertion in `tests/check-tir-s7-person-scoped-login-resolution.js`.

### Performance

- **NFR addressed:** Performance — one additional lookup (`resolvePersonForIdentity`) added to the login path; no specific threshold identified, per story NFRs.

---

## Out of Scope for This Test Plan

- Testing `resolvePersonForIdentity` or `linkIdentity` themselves — those are tir-s2's own tested functions, this plan only tests their correct use in the login path.
- Auto-creation of new person/team_membership rows for brand-new signups — explicitly not built in this story (AC4 is a regression check, not new functionality).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None identified | This story's surface area is small and fully coverable at the unit/integration level using existing fixtures | — |
