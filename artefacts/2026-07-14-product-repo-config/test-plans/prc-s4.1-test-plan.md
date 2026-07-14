## Test Plan: Edit a product's name, description, and repo association

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s4.1.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-4-product-crud-and-isolation.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Editing name/description saves and reflects immediately | — | 1 test | — | — | — | 🟢 |
| AC2 | Changing repo association re-verifies access, updates | — | 1 test | — | — | — | 🟢 |
| AC3 | Adding a repo via edit works identically to first-time config | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — mocked pool, mocked GitHub repo-access check (reusing `prc-s1.2`'s mock convention).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Existing product fixture | Synthetic | None | |
| AC2 | Product with an existing repo association, mocked access-check for a new repo | Synthetic | None | |
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

### Editing name/description saves immediately

- **Verifies:** AC1
- **Components involved:** Edit route handler, mocked pool
- **Precondition:** Existing product fixture
- **Action:** PUT/POST an edit with a new name and description
- **Expected result:** Mock pool's `UPDATE products SET name=..., description=... WHERE product_id=$1` recorded; subsequent GET of the product reflects the new values

### Changing repo association re-verifies access before accepting

- **Verifies:** AC2
- **Components involved:** Edit route handler, `prc-s1.2`'s repo-access-check adapter (reused, not reimplemented)
- **Precondition:** Product already has `acme/widgets` connected; mocked `GET /repos/acme/widgets-v2` returns 200
- **Action:** Edit the product's repo association to `acme/widgets-v2`
- **Expected result:** The same access-verification call used by `prc-s1.2`'s AC1 test fires before the `UPDATE`; mock pool's `UPDATE` reflects the new repo values only after verification succeeds

### Adding a repo via edit uses the identical code path as first-time configuration

- **Verifies:** AC3
- **Components involved:** Edit route handler, `prc-s1.2`/`prc-s2.1`'s connect/create logic
- **Precondition:** Product fixture with `repo_owner: null`
- **Action:** Use the edit flow to connect a repo for the first time
- **Expected result:** Identical mock call sequence to `prc-s1.2`'s AC1 integration test (same function invoked, not a parallel implementation) — verified by reference/structural comparison, not just matching behaviour

---

## NFR Tests

### Repo-access re-verification uses the same security check as initial configuration

- **NFR addressed:** Security
- **Measurement method:** Assert the edit flow's access check and `prc-s1.2`'s access check both resolve to the same underlying function/module
- **Pass threshold:** Structural — reference equality
- **Tool:** Hand-rolled import-identity assertion

---

## Out of Scope for This Test Plan

- Cross-tenant product transfer — explicitly out of scope per the story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | | |
