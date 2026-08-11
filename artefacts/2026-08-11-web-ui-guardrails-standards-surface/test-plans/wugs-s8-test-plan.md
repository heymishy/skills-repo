## Test Plan: Request a product-level guardrail/standard be promoted to org level

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s8-request-promotion.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-3-promotion-approval.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | request creates row with content snapshot | 1 test | — | — | — | — | 🟢 |
| AC2 | duplicate pending request not re-created | 1 test | — | — | — | — | 🟢 |
| AC3 | pending indicator shown on next render | 1 test | — | — | — | — | 🟢 |
| AC4 | cross-tenant request rejected | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock `guardrail_promotion_requests` table)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock product-level entry content, mock pool with no existing pending request | Mock pool | None | |
| AC2 | Mock pool with an existing `pending` row for the same entry | Mock pool | None | |
| AC3 | Mock pool with a `pending` row | Mock pool | None | |
| AC4 | Mock product row under Tenant A, request attempted by a Tenant B session | Mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### requestPromotion_newRequest_createsRowWithSnapshot

- **Verifies:** AC1
- **Precondition:** Mock pool, no existing pending request for the entry
- **Action:** Call the request-promotion handler
- **Expected result:** A `guardrail_promotion_requests` INSERT is issued with `status: 'pending'` and the entry's current content in `content_snapshot`
- **Edge case:** No

### requestPromotion_existingPending_returnsExistingNotDuplicate

- **Verifies:** AC2
- **Precondition:** Mock pool already has a `pending` row for the same entry
- **Action:** Call the request-promotion handler again for the same entry
- **Expected result:** No new INSERT issued; the existing pending request is returned/shown
- **Edge case:** Yes

### handleGetGuardrailsView_pendingPromotion_showsIndicator

- **Verifies:** AC3
- **Precondition:** Mock pool has a `pending` promotion request for an entry
- **Action:** Call the view handler
- **Expected result:** That entry shows a "promotion requested, pending approval" indicator
- **Edge case:** No

---

## Integration Tests

### requestPromotion_crossTenantProduct_rejected

- **Verifies:** AC4
- **Components involved:** request handler, tenant ownership check
- **Precondition:** Product belongs to Tenant A; request made using a Tenant B session
- **Action:** Call the request-promotion endpoint
- **Expected result:** Rejected with 403/404 (matching FORBIDDEN-vs-NOT_FOUND convention); no row created
- **Edge case:** Yes

---

## NFR Tests

- **Security:** Tenant-scoping (AC4) — covered by the integration test above, this IS the NFR test.
- **Audit:** Request creation logging — covered fully by `wugs-s10`'s own test plan, not duplicated here.

---

## Out of Scope for This Test Plan

- Approval/rejection of the request — `wugs-s9`'s test plan.
- Cancelling/withdrawing a pending request — not built in this story.

---

## Test Gaps and Risks

None identified as blocking.
