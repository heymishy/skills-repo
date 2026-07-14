## Test Plan: Delete (detach) a product

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s4.2.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-4-product-crud-and-isolation.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Product deleted, GitHub repo untouched | — | 1 test | — | — | — | 🟢 |
| AC2 | Confirmation explicitly states the repo isn't deleted | — | — | — | 1 scenario | — | 🟢 |
| AC3 | Deleted product access returns a clear "not found," not a crash | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — mocked pool; the GitHub API is asserted to receive zero delete calls (not mocked to succeed/fail, since the whole point is it's never invoked).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Product fixture with journeys and standards cache rows attached | Synthetic | None | |
| AC2 | N/A — UI copy check, covered in verification script only | N/A | None | |
| AC3 | Deleted product fixture, subsequent GET attempt | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None.

---

## Integration Tests

### Deleting a product removes wuce-side data but never calls a GitHub delete endpoint

- **Verifies:** AC1
- **Components involved:** Delete route handler, mocked pool, mocked GitHub API client (spy only, no delete endpoint mocked to succeed)
- **Precondition:** Product fixture with associated journeys and a standards cache row
- **Action:** DELETE the product
- **Expected result:** Mock pool records deletion of the product row, its journeys, and its standards cache rows; the mocked GitHub API client records **zero** calls to any delete-repo endpoint (`DELETE /repos/{owner}/{repo}`) — asserted explicitly, not just "no error occurred"

### Accessing a deleted product returns a clear not-found response

- **Verifies:** AC3
- **Components involved:** Product-view route handler, mocked pool with the product already deleted
- **Precondition:** Product ID no longer exists in the mock pool
- **Action:** GET the deleted product's URL
- **Expected result:** A clean 404-equivalent response with a "this product no longer exists" message — not a 500 error, not a partial render with missing data

---

## NFR Tests

### Only the product's own tenant can delete it

- **NFR addressed:** Security
- **Measurement method:** Attempt deletion with a session belonging to a different tenant than the product's owner
- **Pass threshold:** Rejected (403/404), zero deletion occurs
- **Tool:** Hand-rolled tenant-mismatch assertion, matching this repo's existing tenant-scoping test convention

### Deletion is audit-logged

- **NFR addressed:** Audit
- **Measurement method:** Assert the existing PostHog `capture()` pattern is invoked with the deleting user, timestamp, and product ID
- **Pass threshold:** One capture call per deletion, correct event name
- **Tool:** Hand-rolled mock assertion on the PostHog capture spy

---

## Out of Scope for This Test Plan

- Actually deleting the GitHub repo — explicitly never happens, per AC1 and the story's Architecture Constraints.
- Soft-delete/undo — out of scope per the story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | | |
