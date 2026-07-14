## Test Plan: Write standards to the product's repo as the source of truth

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s3.1.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-3-standards-git-tracked.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | standardsPost/Put commits a real file to the product's repo | — | 1 test | — | — | — | 🟢 |
| AC2 | Editing an existing standard updates the file, not a duplicate | — | 1 test | — | — | — | 🟢 |
| AC3 | No repo configured → rejected, same error pattern | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — mocked Contents API; mocked pool for `standards` table interactions.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `standardsPost` request body with name+content | Synthetic | None | |
| AC2 | A standard already committed once, then edited | Synthetic fixture | None | |
| AC3 | Product fixture with null repo columns | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None.

---

## Integration Tests

### Creating a standard commits it as a real file, not only a DB row

- **Verifies:** AC1
- **Components involved:** `standardsPost`/`standardsPut`, mocked Contents API, product fixture with connected repo
- **Precondition:** Product configured with a repo
- **Action:** POST a new standard with `name='security-review'`, `content='...'`
- **Expected result:** Mocked `PUT /repos/{owner}/{repo}/contents/standards/security-review.md` call recorded with the submitted content, base64-encoded per the existing Contents API convention

### Editing an existing standard updates the same file

- **Verifies:** AC2
- **Components involved:** `standardsPut`, mocked Contents API (returning the prior file's SHA on GET, required for update per GitHub's Contents API contract)
- **Precondition:** A standard already exists as a file with a known SHA
- **Action:** PUT an edit to that standard
- **Expected result:** The Contents API `PUT` call includes the prior SHA (proving an update, not a blind overwrite-attempt that would conflict); only one file exists afterward, not two

### No repo configured blocks standard creation/edit

- **Verifies:** AC3
- **Components involved:** `standardsPost`/`standardsPut`, product fixture with null repo columns
- **Precondition:** Product has no repo configured
- **Action:** Attempt to create or edit a standard
- **Expected result:** Rejected with the same "no repo configured" error pattern used across this feature's other write paths; zero Contents API calls

---

## NFR Tests

### Fail-closed on missing repo config

- **NFR addressed:** Security
- **Measurement method:** Same as AC3, asserted in isolation
- **Pass threshold:** Zero API calls
- **Tool:** Hand-rolled assertion

---

## Out of Scope for This Test Plan

- `standardsPromote`/`optoutPost`/`optoutDelete` — untouched by this story, covered by `prc-s3.3`'s regression tests instead.
- Cache rebuild logic — `prc-s3.2`'s test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | | |
