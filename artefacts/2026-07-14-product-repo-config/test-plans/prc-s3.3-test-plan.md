## Test Plan: Wire standardsList to read from the git-backed cache, with promote/opt-out proven unaffected

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s3.3.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-3-standards-git-tracked.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | standardsList reads from prc-s3.2's cache, existing tests pass | — | 1 test | — | — | — | 🟢 |
| AC2 | promote/optout test suites pass unmodified (regression proof) | — | 1 test | — | — | — | 🟢 |
| AC3 | Full round-trip: write via prc-s3.1, read via standardsList, match | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — reuses `prc-s3.1`'s write mocks and `prc-s3.2`'s cache mocks; existing `standardsPromote`/`optoutPost`/`optoutDelete` test suites reused unmodified.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `prc-s3.2`'s mocked cache, populated with known content | Synthetic | None | |
| AC2 | Existing `standardsPromote`/`optoutPost`/`optoutDelete` test fixtures, unmodified | Reused from existing test suite | None | |
| AC3 | Combined `prc-s3.1` write mock + `prc-s3.2` cache mock, chained | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None.

---

## Integration Tests

### standardsList returns content from the git-backed cache

- **Verifies:** AC1
- **Components involved:** `standardsList`, `prc-s3.2`'s cache adapter, mocked pool
- **Precondition:** Cache pre-populated with 2 standards for a product
- **Action:** Call `standardsList` for that product
- **Expected result:** Response contains exactly the 2 standards, with content matching the cache — existing `standardsList` test suite (updated to seed via the cache rather than direct DB inserts) continues to pass with the same response shape/status codes as before

### standardsPromote and optoutPost/optoutDelete are unaffected

- **Verifies:** AC2
- **Components involved:** `standardsPromote`, `optoutPost`, `optoutDelete` — unmodified by this story
- **Precondition:** Existing pre-story test fixtures for these 3 handlers
- **Action:** Run the existing `standardsPromote`/`optoutPost`/`optoutDelete` test suites unmodified
- **Expected result:** All pre-existing tests pass exactly as they did before this story — zero changes to their assertions or fixtures were needed, proving the surrounding architectural change didn't touch this behaviour

### Full round trip: write via standardsPost, read back via standardsList, content matches

- **Verifies:** AC3
- **Components involved:** `standardsPost` (prc-s3.1's write path), `prc-s3.2`'s cache, `standardsList` (this story's read path)
- **Precondition:** Product with a connected repo, no standards yet
- **Action:** POST a new standard, then immediately call `standardsList`
- **Expected result:** The standard returned by `standardsList` matches exactly what was POSTed — proving `prc-s3.1`'s write path and this story's read path genuinely agree, not just independently plausible in isolation

---

## NFR Tests

### standardsList response time does not regress

- **NFR addressed:** Performance
- **Measurement method:** Compare `standardsList`'s mocked-call latency before/after this story — should be unchanged since it reads from the cache, not git directly
- **Pass threshold:** No new Contents API calls introduced into the `standardsList` read path itself (reconciliation, if any, is `prc-s3.2`'s concern)
- **Tool:** Hand-rolled call-count assertion

---

## Out of Scope for This Test Plan

- `standardsPost`/`standardsPut`'s write-through behaviour — `prc-s3.1`'s test plan.
- Cache-rebuild mechanics — `prc-s3.2`'s test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | | |
