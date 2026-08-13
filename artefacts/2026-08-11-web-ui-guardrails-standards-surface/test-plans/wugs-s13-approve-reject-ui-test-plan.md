## Test Plan: Admin sees real Approve/Reject buttons for pending promotion requests

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s13-approve-reject-ui.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-3-promotion-approval.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | admin sees real buttons | 1 test | — | — | — | — | 🟢 |
| AC2 | non-admin sees unchanged static text | 1 test | — | — | — | — | 🟢 |
| AC3 | approve button wired, CSRF, disables, updates | 1 test | — | — | — | — | 🟢 |
| AC4 | reject button wired, CSRF, disables, updates | 1 test | — | — | — | — | 🟢 |
| AC5 | failure re-enables button, shows error | 1 test | — | — | — | — | 🟢 |
| AC6 | server-side role gate unchanged (regression) | — | 1 test (existing wugs-s9 test, re-run) | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock pool/session for server-side render tests; inline `<script>` string assertions for client-side JS)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1/AC2 | Mock session (admin and non-admin), mock pending-promotion state | Mock pool | None | Server-side render assertions, same pattern as wugs-s8/wugs-s9's own render tests |
| AC3-AC5 | Client-side JS logic (embedded `<script>` in the rendered HTML) | Source-string assertions | None | Matches this file's existing pattern for testing `ssPromote`/`ssOptOut`-style embedded JS in prior stories, before their removal in wugs-s11 |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### handlePostGuardrailsView_pendingRequestAdminSession_rendersRealButtons

- **Verifies:** AC1
- **Precondition:** Mock session with `isEffectivelyAdmin` returning true, a pending promotion request for the rendered path
- **Action:** Call `handleGetProductGuardrailsView` (or `_renderPromotionAction` directly, whichever the real implementation makes testable) with the admin session
- **Expected result:** Rendered HTML contains real `<button>` elements labelled "Approve" and "Reject" for the pending path, with the request's real `requestId` embedded in the button's own data/onclick wiring — not the static "pending approval" text
- **Edge case:** No

### handlePostGuardrailsView_pendingRequestNonAdminSession_rendersStaticTextUnchanged

- **Verifies:** AC2
- **Precondition:** Same pending-request state, but mock session with `isEffectivelyAdmin` returning false
- **Action:** Same call, non-admin session
- **Expected result:** Rendered HTML contains the existing static "Promotion requested — pending approval" text, exactly matching pre-story output for a non-admin — no `<button>` elements, no `requestId` leaked into non-admin-visible markup
- **Edge case:** Yes — this is the story's own explicit non-regression guarantee for non-admin sessions (AC2)

### approveButton_clicked_callsRealEndpointWithCsrfAndUpdatesRow

- **Verifies:** AC3
- **Precondition:** Rendered HTML containing the new Approve button and its embedded client-side JS
- **Action:** Inspect the embedded `<script>` source for the approve-button handler function
- **Expected result:** The handler function's source (a) disables the clicked button before the fetch call, (b) calls `fetch('/api/admin/promotions/' + requestId + '/approve', ...)` with `method: 'POST'` and the session's real `_csrf` token in the request body/headers, (c) on a successful (`.ok`) response, updates the row's DOM to reflect the resolved state (removes the buttons, or replaces them with an "Approved" indicator) without a full page navigation
- **Edge case:** No

### rejectButton_clicked_callsRealEndpointWithCsrfAndUpdatesRow

- **Verifies:** AC4
- **Precondition:** Same as AC3's test, for the Reject button
- **Action:** Inspect the embedded `<script>` source for the reject-button handler function
- **Expected result:** Same shape as AC3's test, targeting `/api/admin/promotions/' + requestId + '/reject'`
- **Edge case:** No

### approveOrRejectButton_fetchFails_reEnablesButtonAndShowsError

- **Verifies:** AC5
- **Precondition:** Same embedded JS as AC3/AC4's tests
- **Action:** Inspect the handler function's own failure-path source (the `.catch()`/non-`.ok` branch)
- **Expected result:** On failure, the button is re-enabled (not left permanently disabled) and a clear error is surfaced to the admin (e.g. `alert(...)`, matching this codebase's own established client-side error-surfacing convention for this exact class of button — see the removed `smug-s1` UI's own `ssPromote`/`ssOptOut` pattern for the established shape)
- **Edge case:** Yes — this is the story's own explicit failure-path guarantee (AC5)

---

## Integration Tests

### existingWugsS9AC3RoleGateTest_reRunUnchanged_stillPasses

- **Verifies:** AC6
- **Components involved:** `handlePostApprovePromotion`, `handlePostRejectPromotion` (both `wugs-s9`, unchanged by this story)
- **Precondition:** `wugs-s9`'s own existing test suite (`tests/check-wugs-s9-approve-reject-promotion.js`)
- **Action:** Re-run `wugs-s9`'s own AC3 tests (`resolveRequest_nonAdmin_approveRejected403`, `resolveRequest_nonAdmin_rejectRejected403`) unchanged, as a regression check
- **Expected result:** Both tests still pass exactly as before — confirms this story adds no new backend logic and does not weaken the existing server-side role gate
- **Edge case:** No

---

## NFR Tests

- **Accessibility:** Confirmed via AC1's own test — real `<button>` elements (not `<div onclick>` or similar non-semantic markup), matching this codebase's established convention for every other interactive control in this file.
- **Security:** Confirmed via AC6 — no new security surface, existing role-gating unchanged.

---

## Out of Scope for This Test Plan

- The two backend endpoints' own behaviour (approve/reject logic, concurrency safety, audit logging) — fully covered by `wugs-s9`'s and `wugs-s10`'s own existing test suites, not re-tested here.
- Bulk approve/reject, review comments, cross-product admin queue — not built, per the story's own Out of Scope section.

---

## Test Gaps and Risks

None identified as blocking.
