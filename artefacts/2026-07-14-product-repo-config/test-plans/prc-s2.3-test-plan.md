## Test Plan: Resolve annotation write-back to the product's own repo

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.3.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-2-full-config-and-bootstrap.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Annotation commit lands in the product's own repo | — | 1 test | — | — | — | 🟢 |
| AC2 | No repo configured → rejected, same error pattern as prc-s1.3 | — | 1 test | — | — | — | 🟢 |
| AC3 | Reuses prc-s1.3's resolution function, not a reimplementation | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — mocked Contents API at the `fetch` boundary, matching `annotation-writer.js`'s existing test convention.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Product fixture with `repo_owner`/`repo_name` set | Synthetic | None | |
| AC2 | Product fixture with null repo columns | Synthetic | None | |
| AC3 | Reference to the actual resolution module/function imported by both `sign-off-writer.js` and `annotation-writer.js` | Real source (import identity check, not mocked) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None.

---

## Integration Tests

### Annotation commit targets the product's own connected repo

- **Verifies:** AC1
- **Components involved:** `annotation-writer.js`, mocked Contents API, mocked pool
- **Precondition:** Product configured with `repo_owner='acme'`, `repo_name='widgets'`
- **Action:** Perform an annotation action for that product's artefact
- **Expected result:** Mocked `PUT /repos/{owner}/{repo}/contents/{path}` call made with `owner='acme'`, `repo='widgets'`

### Annotation with no repo configured is rejected with the same error pattern as sign-off

- **Verifies:** AC2
- **Components involved:** Annotation route handler, product fixture with null repo columns
- **Precondition:** Product has `repo_owner: null`
- **Action:** Attempt to annotate an artefact for that product
- **Expected result:** Response matches the exact error shape/message used by `prc-s1.3`'s AC3 test (same error code, same message text) — proving consistent behaviour, not a second, differently-worded implementation

### Annotation reuses prc-s1.3's resolution function, not a duplicate

- **Verifies:** AC3
- **Components involved:** `annotation-writer.js`, `sign-off-writer.js` (or the shared module both now import from, per prc-s1.3's implementation)
- **Precondition:** N/A — this is a static/structural check
- **Action:** Inspect `annotation-writer.js`'s imports
- **Expected result:** `annotation-writer.js` imports the same resolution function `sign-off-writer.js` uses — verified by reference equality (`require(...)` resolves to the same module export), not by two independently-written functions that happen to behave the same

---

## NFR Tests

### Fail-closed on missing repo config (matches prc-s1.3)

- **NFR addressed:** Security
- **Measurement method:** Same as AC2's integration test — zero Contents API calls when no repo is configured, asserted in isolation
- **Pass threshold:** Zero API calls
- **Tool:** Hand-rolled assertion on mock call count

---

## Out of Scope for This Test Plan

- Any new annotation UI/UX — this story only changes the write target.
- Sign-off's own test coverage — already covered by `prc-s1.3`'s test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | | |
