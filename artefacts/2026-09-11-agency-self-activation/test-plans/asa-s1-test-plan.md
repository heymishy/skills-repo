## Test Plan: A standalone organisation's admin can self-activate it as an Agency

**Story reference:** artefacts/2026-09-11-agency-self-activation/stories/asa-s1-standalone-org-can-self-activate-as-agency.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-09-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Admin activation flips `standalone` -> `agency` in place, audited | 2 tests | — | — | Live Chrome smoke check (staging) | — | 🟢 |
| AC2 (regression guard) | Non-admin rejected 403, denial audited | 2 tests | — | — | — | — | 🟢 |
| AC3 (regression guard) | Already-`agency`/`client` orgs unaffected | 2 tests | — | — | — | — | 🟢 |
| AC4 (regression guard) | `agency_client_relationships`/`shared_access_grants` untouched | 1 test | — | — | — | — | 🟢 |
| AC5 (end-to-end) | Post-activation, `/agency/clients/new` becomes reachable | — | 1 test | — | Live Chrome smoke check (staging) | — | 🟢 |

All ACs are covered by automated unit/integration tests, mirroring `org-conversion.js`'s own established test shape (`modules/organisations.js` + `routes/org-conversion.js` sibling test files). AC1 and AC5 additionally get a live post-deploy Chrome smoke check — not because the mechanism is CSS-layout-dependent (it isn't; this is server-side logic with a minimal form), but because this exact class of gap (a flow that passes every mocked test but is unreachable in reality) is precisely what this story exists to fix, so a real live click-through is the closing confirmation, matching the standard already set by `jgls-s1` earlier this session.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** In-process test database / mocked `pool.query`, matching `org-conversion.js`'s own existing test suite's approach (`tests/check-*org-conversion*.js` pattern, if present) or a fresh equivalent following the same shape.
**PCI/sensitivity in scope:** No.
**Availability:** N/A.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | One `organisations` row with `org_type='standalone'`, one admin `team_memberships` row for it | In-test fixture | None | |
| AC2 | Same org, plus a non-admin `team_memberships` row (e.g. `role='member'`) | In-test fixture | None | |
| AC3 | Two orgs: one `org_type='agency'`, one `org_type='client'`, each with an admin membership | In-test fixture | None | |
| AC4 | AC1's fixture, plus a pre-existing (unrelated) `agency_client_relationships`/`shared_access_grants` row to assert against, confirming it is untouched after activation | In-test fixture | None | |
| AC5 | AC1's fixture, chained: activate, then call the existing Story 3 route handler (`routes/agency-provisioning.js`'s create-client handler) directly against the now-activated org | In-test fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### activateOrganisationAsAgency-flips-standalone-org-in-place

- **Verifies:** AC1
- **Precondition:** An `organisations` row with `org_type='standalone'`.
- **Action:** Call `modules/organisations.js`'s new `activateOrganisationAsAgency(pool, orgId, logger)`.
- **Expected result:** Returns the updated row with `org_type='agency'`, same `org_id`. Logger receives an `organisation_activated_as_agency` event with `org_id` and `timestamp`.
- **Edge case:** No — primary case, must currently FAIL (function does not exist) against unmodified code.

### activateOrganisationAsAgency-idempotent-safe-on-non-standalone

- **Verifies:** AC3
- **Precondition:** An `organisations` row with `org_type='agency'` (already activated) and a separate row with `org_type='client'`.
- **Action:** Call `activateOrganisationAsAgency` against each.
- **Expected result:** Returns `null` for both — the `WHERE org_type='standalone'` clause matches neither row; `org_type` is unchanged for both.
- **Edge case:** No.

### handlePostBecomeAgency-rejects-non-admin

- **Verifies:** AC2
- **Precondition:** A `standalone` org with a non-admin `team_memberships` row for the requesting session.
- **Action:** Call `routes/org-activation.js`'s `handlePostBecomeAgency` (or equivalent handler name) directly with a mocked `req`/`res`.
- **Expected result:** Responds 403 with the established error-message shape; `organisations` row unchanged; a `organisation_activation_denied` audit event is logged.
- **Edge case:** No.

### handleGetBecomeAgencyForm-rejects-non-admin

- **Verifies:** AC2
- **Precondition:** Same as above.
- **Action:** Call the GET form handler directly.
- **Expected result:** Responds 403, form HTML is never returned.
- **Edge case:** No.

### handlePostBecomeAgency-rejects-already-activated-org

- **Verifies:** AC3
- **Precondition:** An admin of an already-`agency`-type org.
- **Action:** Call `handlePostBecomeAgency`.
- **Expected result:** Responds with a "not eligible" error (matching `org-conversion.js`'s own 400 shape for its analogous case), `organisations` row unchanged.
- **Edge case:** No.

### activateOrganisationAsAgency-does-not-touch-relationship-or-grant-tables

- **Verifies:** AC4
- **Precondition:** A `standalone` org, plus an unrelated pre-existing `agency_client_relationships` row and `shared_access_grants` row (belonging to a different org pair) in the same mocked/test database.
- **Action:** Activate the `standalone` org.
- **Expected result:** The unrelated `agency_client_relationships` and `shared_access_grants` rows are byte-for-byte unchanged after activation — confirms by construction (single-table UPDATE), not by convention.
- **Edge case:** No.

---

## Integration Tests

### become-agency-then-create-client-flow-succeeds-end-to-end

- **Verifies:** AC5
- **Precondition:** A `standalone` org with an admin session.
- **Action:** Call `handlePostBecomeAgency` to activate, then immediately call `routes/agency-provisioning.js`'s existing `GET /agency/clients/new` handler with the same (now-activated) session.
- **Expected result:** The Create-Client form renders successfully (200) — not the "only reachable by Agency-type organisations" rejection this story exists to fix. Confirms the two stories compose correctly.
- **Edge case:** No — this is the actual end-to-end confirmation that the gap is closed.

---

## E2E Tests

None. This is server-side logic plus a minimal, non-CSS-layout-dependent form — no browser-rendering-specific behaviour to verify beyond what the unit/integration tests already cover. A live post-deploy Chrome smoke check (see AC Coverage table) provides the same "does this actually work for a real user" confirmation an E2E spec would, without the added CI maintenance cost of a new Playwright spec for a form this simple.

---

## NFR Tests

None beyond what AC2 (security: server-side admin gate) and AC4 (isolation: no cross-table writes) already cover as part of their own AC verification.

---

## Out of Scope for This Test Plan

- Any test of `2026-07-30-agency-client-organisations`'s own 6 stories' existing behaviour — unchanged by this story, already covered by their own existing test suites.
- Reversal (agency → standalone) — not built, not tested.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No new Playwright E2E spec | Server-side logic + minimal form, no CSS-layout-dependent behaviour beyond what unit/integration tests cover | Live post-deploy Chrome smoke check on staging, recorded in the DoD artefact — matching the standard set by `jgls-s1` |
