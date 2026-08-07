## Test Plan: Restructure account-level nav items and add a dangling-link regression test

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/b2-account-nav-restructure-and-dangling-link-test.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-b-navigation-fix.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Non-admin sees Settings, no Admin credits | 1 | — | — | — | — | 🟢 |
| AC2 | Admin sees Admin credits, gated on live role check | 1 | 1 | — | — | — | 🟢 |
| AC3 | New structural test asserts every nav href resolves | 1 | — | — | — | — | 🟢 |
| AC4 | The new test fails against the pre-fix array | 1 | — | — | — | — | 🟢 |

## Coverage gaps

None.

## Test Data Strategy

**Source:** Mixed — synthetic session fixtures (admin/non-admin) plus the real `NAV_ITEMS` array/route table.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1, AC2 | Mocked sessions with `role: 'user'` and `role: 'admin'` | Synthetic | None | |
| AC3, AC4 | Real `NAV_ITEMS` + a fixture copy of the pre-B1 array | Real source + fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Non-admin session renders sidebar bottom without Admin credits
- **Verifies:** AC1
- **Precondition:** Mocked session with `role: 'user'`
- **Action:** Render the sidebar bottom section
- **Expected result:** HTML contains "Settings" and the user identity block; does not contain "Admin credits"

### Admin session renders sidebar bottom with Admin credits
- **Verifies:** AC2
- **Precondition:** Mocked session with `role: 'admin'`
- **Action:** Render
- **Expected result:** HTML contains "Admin credits" in addition to Settings/identity

### Dangling-link test fails against the known-bad pre-fix array
- **Verifies:** AC4
- **Precondition:** A fixture array containing the old `Features`/`Actions`/`Status` entries
- **Action:** Run the new structural test against this fixture
- **Expected result:** FAILS — confirming the test is a real regression guard, not a test that trivially passes regardless of input

---

## Integration Tests

### Admin nav visibility reflects a live role re-check, not a stale cached role
- **Verifies:** AC2
- **Components involved:** sidebar render, `requireAdmin`'s live role-check mechanism
- **Precondition:** A session that started as `admin` but whose role was since revoked in the DB (mocked)
- **Action:** Render the sidebar on a subsequent request
- **Expected result:** Admin credits is NOT shown — confirming the nav-visibility check re-reads current role rather than trusting session-start-time role

---

## NFR Tests

### Admin-only nav visibility is not the actual security boundary
- **NFR addressed:** Security
- **Measurement method:** Directly call `/admin/credits` with a non-admin session, bypassing the UI entirely
- **Pass threshold:** Rejected by `requireAdmin` regardless of what the nav shows — confirming the nav item's visibility is UX only, and the real route-level gate is what actually protects the surface
- **Tool:** Integration test, existing `requireAdmin` convention

---

## Out of Scope for This Test Plan

- The Settings page's actual content — Epic C's test plans cover that.

## Test Gaps and Risks

None.
