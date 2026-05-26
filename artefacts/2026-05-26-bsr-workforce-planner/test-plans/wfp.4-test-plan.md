# Test Plan: Extended workforce-map modes — profile-match and net-new gap

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.4.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-reconciliation-engine.md
**Test plan author:** Copilot
**Date:** 2026-05-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Profile-match: all required tags matched; same-initiative direct allocs excluded; cross-initiative permitted | 3 tests | — | — | — | — | 🟢 |
| AC2 | Profile-match no-match → profileMatchResult:"no-match" + hiringGap:true | 2 tests | — | — | — | — | 🟢 |
| AC3 | Net-new entry → allocationMode:"net-new", computedFTE:0, hiringGap:true | 2 tests | — | — | — | — | 🟢 |
| AC4 | Mixed modes in single run: all types correct; net-new excluded from FTE total | 2 tests | 1 test | — | — | — | 🟢 |
| AC5 | Gap report stdout: initiative slug, required role, required tags, "no capacity" message | 3 tests | — | — | — | — | 🟢 |
| NFR-PERF | 200-person roster / 20 initiatives completes under 15 s (same run as wfp.3) | 1 test | — | — | — | — | 🟢 |
| NFR-SEC | No PII beyond already-supplied names written to stdout | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all ACs are fully automatable with synthetic fixture data.

---

## Test Data Strategy

All test data is synthetic. No real PII. Fixtures generated inline.

- **Roster fixture:** 6 persons; each has a `skills` array. One person has all required tags; one has a subset only; one is already in direct allocation for the same initiative.
- **Allocation-input fixture:** One `profile-match` entry, one `net-new` entry, one `direct` entry — combined in a single `allocations` array.
- **No-match fixture:** `requiredTags: ["quantum-engineer"]` — no roster person matches.

The module under test extends `src/workforce/map.js` with `processProfileMatch(allocationEntry, roster, currentInvocationDirectAllocations)` and `processNetNew(allocationEntry)`. The gap report is produced by `buildGapReport(initiativeMapEntries)`.

---

## Unit tests

Test file: `tests/check-wfp4-map-extended.js`
Run command: `node tests/check-wfp4-map-extended.js`
Source under test: `src/workforce/map.js` (adds `processProfileMatch`, `processNetNew`, `buildGapReport`)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| 1 | `profile-match-requires-all-tags` | AC1 | Roster person has `["java", "platform"]`; requiredTags `["java", "platform", "chapter-lead"]` | Person NOT matched — partial tag match is not sufficient |
| 2 | `profile-match-full-tag-match-included` | AC1 | Roster person has `["java", "platform", "chapter-lead"]`; same requiredTags | Person matched; appears in `allocatedPeople` |
| 3 | `profile-match-excludes-same-initiative-direct-alloc` | AC1 | Person A is in direct allocation for initiative X in same invocation; profile-match for initiative X also selects person A by tags | Person A excluded from profile-match result for initiative X |
| 4 | `profile-match-cross-initiative-permitted` | AC1 | Person A is in direct allocation for initiative X; profile-match for initiative Y (different slug) selects Person A | Person A is included in profile-match result for initiative Y |
| 5 | `profile-match-no-match-sets-no-match-result` | AC2 | requiredTags with no matching roster person | Result has `profileMatchResult: "no-match"` |
| 6 | `profile-match-no-match-sets-hiring-gap-true` | AC2 | requiredTags with no matching roster person | Result has `hiringGap: true` |
| 7 | `net-new-entry-has-zero-fte` | AC3 | `processNetNew` for net-new entry | `computedFTE: 0` |
| 8 | `net-new-entry-has-required-role-and-tags` | AC3 | `processNetNew` with `requiredRole: "Senior Engineer"` and `requiredTags: ["react"]` | Result contains `requiredRole: "Senior Engineer"`, `requiredTags: ["react"]`, `hiringGap: true` |
| 9 | `mixed-modes-all-types-present-in-output` | AC4 | Single invocation with direct, profile-match, and net-new entries | All 3 entry types appear in result array with correct `allocationMode` values |
| 10 | `mixed-modes-net-new-not-counted-in-total-fte` | AC4 | Direct (2 FTE) + profile-match (1 FTE) + net-new (0 FTE) | Total across non-net-new entries = 3; net-new entry has `computedFTE: 0` |
| 11 | `gap-report-includes-initiative-slug` | AC5 | `buildGapReport` with net-new entry for `"platform-migration"` | Gap report string contains `"platform-migration"` |
| 12 | `gap-report-includes-required-role` | AC5 | Net-new entry with `requiredRole: "Senior Engineer"` | Gap report contains `"Senior Engineer"` |
| 13 | `gap-report-includes-no-capacity-message` | AC5 | Net-new entry | Gap report contains `"No current roster capacity"` |

---

## Integration tests

Test file: `tests/check-wfp4-map-extended.js` (same file, integration section)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| I1 | `integration-mixed-modes-initiative-map-json` | AC4 | Full `workforce-map` invocation with mixed-mode allocation-input fixture | `initiative-map.json` written; contains correct entry for each mode |

---

## NFR tests

| # | Test ID | NFR | Scenario | Expected |
|---|---------|-----|---------|---------|
| N1 | `nfr-perf-full-run-200-people-20-initiatives-under-15s` | Performance | Full invocation with 200-person roster and 20 initiatives (mix of modes) | Total wall time under 15,000 ms |
| N2 | `nfr-sec-gap-report-no-extra-pii` | Security | `buildGapReport` output string | Contains only initiative slug, role, tags, and template text — no person field values (no endDate, squad, etc.) |

---

## Total test count

**13 unit + 1 integration + 2 NFR = 16 tests**
All tests are expected to FAIL before implementation (RED phase of TDD).
