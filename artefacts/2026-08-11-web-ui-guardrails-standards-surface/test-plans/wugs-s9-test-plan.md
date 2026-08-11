## Test Plan: Admin approves or rejects a promotion request

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s9-approve-reject-promotion.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-3-promotion-approval.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | approval invokes write adapter, records PR | 1 test | — | — | — | — | 🟢 |
| AC2 | rejection sets status, no write | 1 test | — | — | — | — | 🟢 |
| AC3 | non-admin rejected server-side | — | 1 test | — | — | — | 🟢 |
| AC4 | no org repo — blocked with clear error | 1 test | — | — | — | — | 🟢 |
| AC5 | concurrent resolution — only first wins | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. Review finding 1-M1 (atomic-update mechanism unnamed) resolved 2026-08-11 — Architecture Constraints now names the exact conditional `UPDATE ... WHERE status = 'pending'` mechanism.

---

## Test Data Strategy

**Source:** Synthetic (mock `guardrail_promotion_requests`, `tenant_org_repo` tables) + Mocked `wugs-s6` adapter
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock `pending` request row, mock `tenant_org_repo` row, mocked `wugs-s6` adapter returning a PR number | Mock pool + mocked adapter | None | |
| AC2 | Mock `pending` request row | Mock pool | None | Assert `wugs-s6` adapter is NOT called |
| AC3 | Mock session with non-admin role, mock `isEffectivelyAdmin` returning false | Mock session | None | |
| AC4 | Mock `pending` request row, no `tenant_org_repo` row | Mock pool | None | |
| AC5 | Mock `pending` request row, two simulated concurrent resolution calls | Mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None — resolved (see above).

---

## Unit Tests

### approveRequest_pending_invokesWriteAdapterAndRecordsPr

- **Verifies:** AC1
- **Precondition:** Mock `pending` request, mock org repo, mocked `wugs-s6` adapter returns `{prNumber: 7}`
- **Action:** Call the approve handler as an admin
- **Expected result:** `wugs-s6`'s adapter is called with the request's `content_snapshot` targeting the org repo; request status becomes `approved`; PR number `7` is recorded
- **Edge case:** No

### rejectRequest_pending_setsStatusNoWrite

- **Verifies:** AC2
- **Precondition:** Mock `pending` request
- **Action:** Call the reject handler as an admin
- **Expected result:** Request status becomes `rejected`; `wugs-s6`'s adapter is never called
- **Edge case:** No

### resolveRequest_noOrgRepo_blockedWithClearError

- **Verifies:** AC4
- **Precondition:** Mock `pending` request, no `tenant_org_repo` row
- **Action:** Call the approve handler
- **Expected result:** Rejected with an error directing the admin to designate an org repo first; no write attempted, status unchanged
- **Edge case:** Yes

---

## Integration Tests

### resolveRequest_nonAdmin_rejected403

- **Verifies:** AC3
- **Components involved:** approve/reject handler, `isEffectivelyAdmin` (same mechanism as `credits-guard.js`)
- **Precondition:** Mock session with `engineer`/`product`/`viewer` role
- **Action:** Call the approve or reject endpoint
- **Expected result:** 403, no state change to the request row
- **Edge case:** No

### resolveRequest_concurrentCalls_onlyFirstUpdateSucceeds

- **Verifies:** AC5
- **Components involved:** approve/reject handler, the conditional `UPDATE ... WHERE status = 'pending' RETURNING request_id` mechanism named in Architecture Constraints
- **Precondition:** Two near-simultaneous calls resolving the same `pending` request; mock pool simulates the second `UPDATE` returning zero rows (as Postgres would for a row already transitioned out of `pending`)
- **Action:** Fire both calls
- **Expected result:** The first call's `UPDATE` returns the row and proceeds to invoke `wugs-s6`'s adapter; the second call's `UPDATE` returns zero rows and short-circuits to an "already resolved" response without invoking the write adapter a second time
- **Edge case:** Yes

---

## NFR Tests

### Server-side role enforcement cannot be bypassed client-side

- **NFR addressed:** Security
- **Measurement method:** Same as the AC3 integration test — this IS the NFR test
- **Pass threshold:** Non-admin call rejected regardless of any client-side UI hiding
- **Tool:** Node, direct handler-call assertion (bypassing any UI layer)

---

## Out of Scope for This Test Plan

- The write adapter's own internal behaviour — `wugs-s6`'s test plan, mocked here at the seam.
- Review comments on requests — not built.

---

## Test Gaps and Risks

None identified as blocking.
