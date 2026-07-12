## Test Plan: The admin/credits panel is gated by per-person role, not tenant membership

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s4.md
**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Test plan author:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Non-admin team member sharing an admin's tenant is denied (403) | 1 test | — | — | — | — | 🟢 |
| AC2 | Admin retains access to the credits panel | 1 test | — | — | — | — | 🟢 |
| AC3 | Solo tenant admin access is unchanged (zero regression) | 1 test | — | — | — | — | 🟢 |
| AC4 | Ambiguous/missing role fails closed (denied, not granted) | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mocked (fixtures seeded directly against `require-admin.js`/`admin-credits.js`, extending the existing `check-arl-s2-admin-middleware.js` test pattern — no need for tir-s3's actual UI, per this story's own Dependencies reasoning)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A `team_memberships` fixture: admin + non-admin sharing one tenant | Synthetic | None | Seeded directly, not via tir-s3's UI |
| AC2 | Same fixture, admin's own request | Synthetic | None | |
| AC3 | A single-person tenant fixture with role `admin` | Synthetic | None | Matches today's common case |
| AC4 | A session with a missing/stale role field | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `requireAdmin` denies a non-admin team member sharing the admin's tenant

- **Verifies:** AC1
- **Precondition:** `team_memberships` fixture: person X is `admin` for tenant `acme`; person Y is `engineer` for the same tenant `acme`. Request is from Y.
- **Action:** Call `requireAdmin(req, res, next)` with Y's session.
- **Expected result:** 403 Forbidden response; `next()` is never called — extends the existing `check-arl-s2-admin-middleware.js` assertion pattern to the new per-person role source.

### `requireAdmin` grants the admin of the same tenant

- **Verifies:** AC2
- **Precondition:** Same fixture as above. Request is from X (admin).
- **Action:** Call `requireAdmin(req, res, next)` with X's session.
- **Expected result:** `next()` is called; access proceeds to the credits panel handler.

### `requireAdmin` is unchanged for a solo tenant (zero regression)

- **Verifies:** AC3
- **Precondition:** A single-person tenant `solo-acme` with role `admin`, migrated per tir-s1.
- **Action:** Call `requireAdmin(req, res, next)` with that person's session.
- **Expected result:** `next()` is called — identical behaviour to before this story's change.

### `requireAdmin` fails closed when the role is missing or stale

- **Verifies:** AC4
- **Precondition:** A session with no resolvable role for the requested tenant (simulating staleness/ambiguity).
- **Action:** Call `requireAdmin(req, res, next)`.
- **Expected result:** 403 Forbidden — access is denied by default, not granted, when role resolution is ambiguous.

---

## Integration Tests

None beyond the unit-level middleware tests above — this story's entire surface area is the `requireAdmin` middleware and its direct callers, which the unit tests already exercise end-to-end at the handler level.

---

## NFR Tests

### Fail-closed on role ambiguity

- **NFR addressed:** Security
- **Measurement method:** Directly covered by the "fails closed when the role is missing or stale" unit test above.
- **Pass threshold:** 100% of ambiguous-role requests are denied, zero granted.
- **Tool:** Hand-rolled Node.js assertion in `tests/check-tir-s4-role-gated-credits-panel.js`.

### Audit

- **NFR addressed:** Audit (denied access attempts logged with person ID, tenant ID, timestamp)
- **Measurement method:** Assert the logger is called on each denial with the required fields, matching the existing `requireAdmin` denial-logging convention.
- **Pass threshold:** Log entry present with all required fields on every denial.
- **Tool:** Hand-rolled Node.js assertion (spy on the injected logger).

---

## Out of Scope for This Test Plan

- Gating any UI surface beyond the admin/credits panel — not in this story's scope.
- Changing what an admin can do inside the panel — only who can reach it changes.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None identified | This story's surface area is small and fully coverable at the unit level | — |
