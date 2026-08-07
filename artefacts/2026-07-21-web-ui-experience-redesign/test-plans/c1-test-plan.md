## Test Plan: Settings page shell with Profile tab

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/c1-settings-shell-and-profile-tab.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-c-account-settings-page.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Settings renders inside shared shell | 1 | — | — | — | — | 🟢 |
| AC2 | Profile tab shows identity + linked methods | 1 | 1 | — | — | — | 🟢 |
| AC3 | Link Google flow works via existing OAuth handler | — | 1 | — | — | External-dependency | 🟡 |
| AC4 | Both-linked state offers no dead-end "Link" control | 1 | — | — | — | — | 🟢 |

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Real Google OAuth round-trip | AC3 | External-dependency | Requires a real Google OAuth consent flow, not mockable in an automated test without a real (or heavily stubbed) provider | Integration test mocks `handleStartGoogleLink`'s redirect URL generation and the callback handler's session update in isolation (already this repo's established pattern from `tir-s2`); a manual scenario covers the real end-to-end round-trip |

## Test Data Strategy

**Source:** Mixed — synthetic session fixtures for unit/integration; a real (test) Google account for the manual OAuth round-trip.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained (unit/integration); operator has a real Google test account available (manual scenario)

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1, AC2, AC4 | Mocked sessions with 0, 1, or 2 linked providers | Synthetic | None | |
| AC3 | Real Google test account | Manual scenario only | OAuth token (not logged) | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond AC3's noted external-dependency handling.

---

## Unit Tests

### Settings page HTML includes the shared shell's header/sidebar markup
- **Verifies:** AC1
- **Precondition:** N/A
- **Action:** Render the Settings page
- **Expected result:** HTML includes the shell's brand mark and nav structure, not a bare `<!DOCTYPE html>` fragment like the current `handleGetLinkSettings`

### Profile tab shows GitHub linked, Google not linked
- **Verifies:** AC2
- **Precondition:** Mocked session with only GitHub linked
- **Action:** Render the Profile tab
- **Expected result:** HTML shows GitHub as "Linked", Google as "Not linked" with a "Link Google account" button

### Both providers linked shows no dead-end Link control
- **Verifies:** AC4
- **Precondition:** Mocked session with both GitHub and Google linked
- **Action:** Render
- **Expected result:** Neither provider shows a "Link" button — both show as linked with no further action offered

---

## Integration Tests

### Clicking Link Google reaches the existing handleStartGoogleLink handler unmodified
- **Verifies:** AC3
- **Components involved:** Settings page's Link button, `handleStartGoogleLink`
- **Precondition:** Mocked session, mocked OAuth adapter
- **Action:** Simulate the click's resulting request
- **Expected result:** Reaches `handleStartGoogleLink` with the same CSRF-state-setting behaviour already tested by `tir-s2` — this story wires to it, does not reimplement it

---

## NFR Tests

None — confirmed with story owner beyond the existing CSRF protection already covered by `tir-s2`'s own test suite (reused, not reimplemented).

---

## Out of Scope for This Test Plan

- Billing and Credits tabs — C2/C3 own test plans.
- Unlinking a provider — out of scope at the story level.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real Google OAuth round-trip (AC3) | Not mockable end-to-end in an automated test | Manual scenario in the verification script, using a real test Google account |
