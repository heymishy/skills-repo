## Test Plan: Rebuild the standards DB cache from git content

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s3.2.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-3-standards-git-tracked.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Cache updates in the same request as a git write | — | 1 test | — | — | — | 🟢 |
| AC2 | Cache fully reconstructable from git if DB is lost | — | 1 test | — | — | — | 🟢 |
| AC3 | Read-time reconciliation for out-of-band git edits | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — mocked pool for the `standards` cache table, mocked Contents API for reading git content back.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A write triggered via `prc-s3.1`'s mechanism, cache state checked immediately after | Synthetic | None | |
| AC2 | An empty `standards` table, populated git content across multiple products | Synthetic fixture | None | |
| AC3 | A standard's git content changed without going through `standardsPut` (simulating an out-of-band IDE edit) | Synthetic fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None.

---

## Integration Tests

### Cache row updates in the same request as the git write

- **Verifies:** AC1
- **Components involved:** Cache-rebuild adapter (D37-shaped per ADR-012), `prc-s3.1`'s write path, mocked pool
- **Precondition:** A standard is being created via `standardsPost`
- **Action:** Complete the request
- **Expected result:** Within the same request/response cycle, the mocked pool's `standards` table row is updated to match the just-written git content — not deferred to a separate background job

### Cache can be fully reconstructed from git content alone

- **Verifies:** AC2
- **Components involved:** Cache-rebuild adapter, mocked Contents API (listing `standards/` directories across product fixtures), empty mocked `standards` table
- **Precondition:** `standards` table is empty; 2 products each have 2 standards files in their mocked repos
- **Action:** Trigger a full cache rebuild
- **Expected result:** The mocked pool ends up with 4 rows (2 per product), each matching its source git file's content exactly

### Reading standards after an out-of-band git edit reflects the new content, not stale cache

- **Verifies:** AC3
- **Components involved:** Cache-rebuild adapter, read path (consumed by `prc-s3.3`'s `standardsList`)
- **Precondition:** Cache has stale content for a standard; the mocked git content for that standard has since changed (simulating an IDE edit that bypassed `standardsPut`)
- **Action:** Trigger a read (matching whatever read-time reconciliation mechanism this story implements — e.g. a git content hash/ETag check before trusting the cache)
- **Expected result:** The returned content matches the current git content, not the stale cache — read-time reconciliation, not a webhook or push-based sync (explicitly out of scope per discovery)

---

## NFR Tests

### Read latency does not regress versus DB-only behaviour

- **NFR addressed:** Performance
- **Measurement method:** Compare the cache-read path's call count/latency against a DB-only baseline — the read path should not make a live git API call on every read (only writes and explicit rebuilds should touch git, per the story's own NFR)
- **Pass threshold:** Zero Contents API calls during a plain cache-read (AC3's reconciliation check may be a lightweight metadata check, not a full content fetch, depending on implementation — this test should assert whichever mechanism is chosen doesn't degrade to a full API round-trip per read)
- **Tool:** Hand-rolled call-count assertion

---

## Out of Scope for This Test Plan

- `standardsList`'s actual route wiring to this cache — `prc-s3.3`'s test plan.
- Real-time push-based sync — explicitly out of scope per discovery.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | | |
