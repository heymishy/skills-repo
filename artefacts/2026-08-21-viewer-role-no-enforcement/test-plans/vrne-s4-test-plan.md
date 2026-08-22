## Test Plan: Wire the viewer-write-block gate to edge-case routes (agency client creation/invite, artefact annotations)

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s4-edge-cases.md`
**Epic reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/epics/vrne-e1-viewer-write-blocking.md`
**Test plan author:** Copilot
**Date:** 2026-08-22

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Viewer denied creating an Agency client | 1 test | — | — | — | — | 🟢 |
| AC2 | Viewer denied inviting into a Client org | 1 test | — | — | — | — | 🟢 |
| AC3 | Viewer denied posting an annotation | 1 test | — | — | — | — | 🟢 |
| AC4 | Non-viewer roles at Agency org unaffected | 2 tests | — | — | — | — | 🟢 |
| AC5 | Org-type check still denies non-Agency orgs (additive, not replacing) | 2 tests | — | — | — | — | 🟢 |
| AC6 | Denial is logged | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — in-memory `req`/`res` mocks, same pattern as the other 3 stories.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC2 | Mock `req.session` with `role: 'viewer'` AND `org_type: 'agency'` (both conditions present, so the test isolates the role gate specifically) | Synthetic | None | Critical: must set org_type to 'agency' so a failure here is attributable to the role check, not the pre-existing org-type check |
| AC3 | Mock `req.session.role = 'viewer'` | Synthetic | None | |
| AC4 | Mock `req.session` with `role: 'engineer'`/`'admin'` and `org_type: 'agency'` | Synthetic | None | |
| AC5 | Mock `req.session` with any role and `org_type` NOT `'agency'` | Synthetic | None | Isolates the pre-existing org-type check — must still fire independently of the new role gate |
| AC6 | Injectable test logger | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### viewer-denied-agency-client-new

- **Verifies:** AC1
- **Precondition:** `req.session = { role: 'viewer', org_type: 'agency', ... }`.
- **Action:** Call `POST /agency/clients/new`.
- **Expected result:** 403; client-org-creation function never invoked (spy-verified).
- **Edge case:** No.

### viewer-denied-agency-client-invite

- **Verifies:** AC2
- **Precondition:** Same as above.
- **Action:** Call `POST /agency/clients/:id/invite`.
- **Expected result:** 403; invite function never invoked.
- **Edge case:** No.

### viewer-denied-annotation

- **Verifies:** AC3
- **Precondition:** `req.session.role = 'viewer'`.
- **Action:** Call `POST /api/artefacts/:slug/annotations`.
- **Expected result:** 403; annotation-creation function never invoked.
- **Edge case:** No.

### engineer-agency-client-new-succeeds / admin-agency-client-invite-succeeds

- **Verifies:** AC4
- **Precondition:** `req.session = { role: 'engineer' (and separately 'admin'), org_type: 'agency', ... }`.
- **Action:** Call `/agency/clients/new` and `/agency/clients/:id/invite` respectively.
- **Expected result:** Both proceed exactly as before this story.
- **Edge case:** No.

### non-agency-org-still-denied-client-new / non-agency-org-still-denied-client-invite

- **Verifies:** AC5 — the critical regression guard for this story.
- **Precondition:** `req.session = { role: 'engineer', org_type: 'standard', ... }` (a non-Agency org, but a role that would otherwise pass the new gate).
- **Action:** Call `/agency/clients/new` and `/agency/clients/:id/invite`.
- **Expected result:** Still 403 — but the test must assert this denial comes from the *pre-existing* org-type check, not the new role gate (e.g. by verifying the org-type check function was called and returned false, distinct from the role-gate function's own pass/fail). This proves the new gate was added additively, not by replacing the old check with a differently-scoped one.
- **Edge case:** Yes — this is the story's single most important regression test, directly verifying `1-M1`'s "additive, not replacing" Architecture Constraint.

### agency-edge-case-denial-logged

- **Verifies:** AC6
- **Precondition:** Injectable test logger wired.
- **Action:** Trigger a viewer denial on `/agency/clients/new`.
- **Expected result:** Logger called with `personId`, `tenantId`, `timestamp`, `route` — same shape as the other 3 stories' audit tests.
- **Edge case:** No.

---

## Integration Tests

None required beyond unit-level coverage — these 3 routes' existing pre-story test suites already exercise the real `server.js` dispatch path for the org-type check; this story's change is additive to that existing coverage.

---

## NFR Tests

### audit-log-format-consistent-with-other-stories

- **NFR addressed:** Audit
- **Measurement method:** Same structural assertion as the other 3 stories' NFR tests.
- **Pass threshold:** Same field names, same event-name convention.
- **Tool:** Node `assert`.

No Performance/Accessibility NFR tests — same rationale as the other 3 stories.

---

## Out of Scope for This Test Plan

- Products/Features, Skill session, and Credits/billing routes — covered by the other 3 stories.
- `/journey/wizard`'s missing auth check — explicitly out of scope for this story (see story's own Out of Scope section); not tested here.
- `/api/admin/promotions/:id/approve`/`reject` and `/organisations/convert` — already effectively admin-gated via `isEffectivelyAdmin`/`_isAdminOfOwnOrg`; confirmed no viewer-role gap exists, no test needed.

---

## Test Gaps and Risks

None.
