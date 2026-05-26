# Test Plan: Map workforce to initiatives with direct allocation, FTE delta, and cost inference

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.3.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-reconciliation-engine.md
**Test plan author:** Copilot
**Date:** 2026-05-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Direct allocation entry in initiative-map.json with all required fields | 4 tests | 1 test | — | — | — | 🟢 |
| AC2 | Missing portfolio file → warning + null claimed fields + continue | 2 tests | — | — | — | — | 🟢 |
| AC3 | Cost-model lookup; unmapped role → $0 + warning | 3 tests | — | — | — | — | 🟢 |
| AC4 | fteDelta < 0 → gap:true; fteDelta ≥ 0 → no gap | 2 tests | — | — | — | — | 🟢 |
| AC5 | Unmatched person name → warning + exclude + continue | 2 tests | — | — | — | — | 🟢 |
| AC6 | Second run overwrites first (idempotent) | 1 test | — | — | — | — | 🟢 |
| NFR-PERF | 200 people / 20 initiatives completes under 15 seconds | 1 test | — | — | — | — | 🟢 |
| NFR-SEC | No PII beyond already-supplied names written to stdout | 1 test | — | — | — | — | 🟢 |
| NFR-INT | Failed output write → non-zero exit + no partial file | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all ACs are fully automatable with synthetic fixture data and file stubs.

---

## Test Data Strategy

All test data is synthetic. No real PII. Fixtures generated inline.

- **Roster fixture:** 5-person JSON array with varied roles; one person with a role absent from cost-model.
- **Cost-model fixture:** 3 role entries with non-null quarterlyRateNZD values; intentionally missing one role from roster.
- **Allocation-input fixture:** Direct allocation entries for 2 initiatives; one with a matching portfolio file, one without.
- **Portfolio fixture:** `{ "people": { "fte_demand": 3 }, "cost": { "quarterlyBudgetNZD": 90000 } }` written to temp `portfolio/[slug].json`.
- **Retired-person fixture:** One roster record with `retired: true` to verify exclusion from FTE count.

The module under test exports a pure `processDirectAllocation(allocationEntry, roster, costModel, portfolioDir)` function. File reading and writing are in a thin CLI wrapper tested by integration tests.

---

## Unit tests

Test file: `tests/check-wfp3-map-core.js`
Run command: `node tests/check-wfp3-map-core.js`
Source under test: `src/workforce/map.js` (exports `processDirectAllocation`, `lookupCost`, `computeFteDelta`)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| 1 | `direct-alloc-entry-has-required-fields` | AC1 | `processDirectAllocation` with 2 matched people | Result contains `slug`, `allocationMode: "direct"`, `allocatedPeople`, `computedFTE`, `computedCostPerQuarterNZD`, `claimedFTE`, `claimedCostNZD`, `fteDelta` |
| 2 | `direct-alloc-computed-fte-is-matched-count` | AC1 | 3-person roster; allocation names 2 of them | `computedFTE: 2` |
| 3 | `direct-alloc-retired-person-excluded` | AC1 | One matched person has `retired: true` | `computedFTE` does not count retired person; they do not appear in `allocatedPeople` |
| 4 | `direct-alloc-fte-delta-computed-correctly` | AC1 | computedFTE:2, claimedFTE:3 | `fteDelta: -1` |
| 5 | `missing-portfolio-file-sets-null-claimed` | AC2 | No portfolio file exists for the initiative slug | `claimedFTE: null`, `claimedCostNZD: null` |
| 6 | `missing-portfolio-file-warning-to-stderr` | AC2 | No portfolio file exists | Warning message written to stderr naming the missing slug |
| 7 | `cost-lookup-sums-role-rates` | AC3 | 2 people with roles that have quarterlyRateNZD 15000 and 20000 | `computedCostPerQuarterNZD: 35000` |
| 8 | `cost-lookup-zero-for-unmapped-role` | AC3 | One person's role not in cost-model | Their cost contribution is 0; total reflects only mapped persons |
| 9 | `cost-lookup-warning-for-unmapped-role` | AC3 | One person's role not in cost-model | Warning written to stderr naming the unmapped role |
| 10 | `gap-true-when-fte-delta-negative` | AC4 | `computeFteDelta(2, 4)` | Returns `{ fteDelta: -2, gap: true }` |
| 11 | `gap-false-when-fte-delta-zero` | AC4 | `computeFteDelta(3, 3)` | Returns `{ fteDelta: 0, gap: false }` |
| 12 | `unmatched-person-excluded-from-fte` | AC5 | Allocation names a person not in roster | `computedFTE` excludes unmatched person; entry still written |
| 13 | `unmatched-person-warning-to-stderr` | AC5 | Allocation names a person not in roster | Warning written to stderr naming the unmatched person |
| 14 | `idempotent-second-run-same-output` | AC6 | Run `processDirectAllocation` twice with same input | Second result is identical to first; no accumulated state |

---

## Integration tests

Test file: `tests/check-wfp3-map-core.js` (same file, integration section)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| I1 | `integration-map-produces-initiative-map-json` | AC1 | Full `workforce-map` invocation with temp fixtures | `workforce/initiative-map.json` written; valid JSON; contains all initiative entries from allocation input |

---

## NFR tests

| # | Test ID | NFR | Scenario | Expected |
|---|---------|-----|---------|---------|
| N1 | `nfr-perf-200-people-20-initiatives-under-15s` | Performance | `processDirectAllocation` called 20 times with 200-person roster (10 allocations each) | Total wall time under 15,000 ms |
| N2 | `nfr-integrity-no-partial-output-on-write-failure` | Integrity | Write error injected before final rename | Non-zero exit; no partial `initiative-map.json` at output path |

---

## Total test count

**14 unit + 1 integration + 2 NFR = 17 tests**
All tests are expected to FAIL before implementation (RED phase of TDD).
