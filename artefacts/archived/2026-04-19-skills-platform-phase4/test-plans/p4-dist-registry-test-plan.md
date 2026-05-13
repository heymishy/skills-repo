# Test Plan: Consumer registry and fleet visibility via fleet-state.json

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-registry.md
**Epic:** E2 — Distribution model
**Complexity:** 2 (Unstable — lockfileVersion field name depends on Spike C)
**Test type:** Unit + governance check

---

## Test matrix

| ID | Description | Type | AC | Method | Pass condition |
|----|-------------|------|----|--------|----------------|
| T1 | registry update script exists | Unit | — | `fs.existsSync` | `scripts/update-fleet-registry.js` present |
| T2 | `addConsumerEntry` creates entry with all required fields | Unit | AC1 | Call with fixture consumer data | Entry has `consumerSlug`, `lockfileVersion`, `upstreamSource`, `lastSyncDate`, `syncStatus` |
| T3 | Missing required field in entry → governance check fails | Governance | AC3 | Write entry missing `upstreamSource`, run check | `check-p4-dist-registry.js` exits non-zero with named field error |
| T4 | Consumer 2 releases behind → `syncStatus: "stale"` + `versionsBehind: 2` | Unit | AC2 | Call `computeSyncStatus` with behind=2, threshold=2 | Returns `{ syncStatus: "stale", versionsBehind: 2 }` |
| T5 | Fresh consumer → `syncStatus: "clean"`, no `versionsBehind` field | Unit | AC2 | Call `computeSyncStatus` with behind=0 | Returns `{ syncStatus: "clean" }`, `versionsBehind` absent |
| T6 | Absent `distribution.fleet.stale_threshold` → defaults to 2 | Unit | AC4 | Call without threshold config | Threshold treated as 2; consumer 1 behind = clean, consumer 2 behind = stale |
| T7 | Invalid `syncStatus` value → governance check fails | Governance | AC3 | Write entry with `syncStatus: "outdated"`, run check | Check exits non-zero naming the consumer slug and field |
| T8 | Non-ISO-8601 `lastSyncDate` → governance check fails | Governance | AC3 | Write entry with `lastSyncDate: "19/04/2026"`, run check | Check exits non-zero naming the consumer slug and field |
| T-NFR1 | Fleet-state.json entries contain no personal data | Security | NFR | Inspect `addConsumerEntry` output | No name, email, or user identifier fields in entry |
| T-NFR2 | Registry update completes within time bound for 50 entries | Performance | NFR | Time 50-entry fixture update (not a hard gate — structural check) | No synchronous blocking loop or O(n²) pattern in source |

---

## Test descriptions

### T1 — Script exists
`scripts/update-fleet-registry.js` must exist and export `{ addConsumerEntry, computeSyncStatus }` or equivalent. If absent, all remaining tests fail.

### T2 — Required fields
`addConsumerEntry({ consumerSlug: 'heymishy/sample-repo', lockfileVersion: 'main@abc1234', upstreamSource: 'https://github.com/heymishy/skills-repo.git', lastSyncDate: '2026-04-19', syncStatus: 'clean' })` must return an object with all five required fields present.

### T3 — Missing field fails governance
Write a fleet-state.json entry missing `upstreamSource`. Run `check-p4-dist-registry.js`. Expect non-zero exit with message identifying `consumerSlug` and `"upstreamSource"`.

### T4 — Stale detection
`computeSyncStatus({ versionsBehind: 2, threshold: 2 })` must return `{ syncStatus: 'stale', versionsBehind: 2 }`.

### T5 — Clean consumer
`computeSyncStatus({ versionsBehind: 0, threshold: 2 })` must return an object with `syncStatus: 'clean'` and no `versionsBehind` key.

### T6 — Default threshold
`computeSyncStatus({ versionsBehind: 1 })` (no threshold) must treat threshold as 2: return `{ syncStatus: 'clean' }`.
`computeSyncStatus({ versionsBehind: 2 })` (no threshold) must return `{ syncStatus: 'stale', versionsBehind: 2 }`.

### T7 — Invalid syncStatus
Write an entry with `syncStatus: "outdated"` (not in the allowed enum). Run the governance check. Expect failure with the consumer slug and "syncStatus" named in the error.

### T8 — Invalid lastSyncDate
Write an entry with `lastSyncDate: "April 19 2026"`. Run governance check. Expect failure naming the consumer slug and "lastSyncDate".

### T-NFR1 — No personal data
Inspect the entry produced by `addConsumerEntry`. Fields must include only `consumerSlug` (repo slug), `lockfileVersion`, `upstreamSource`, `lastSyncDate`, `syncStatus`, and optionally `versionsBehind`. No `name`, `email`, `userId`, or `teamName` fields.

### T-NFR2 — No O(n²) pattern
Source-scan `scripts/update-fleet-registry.js` for nested loops over all entries during a single update. No nested `forEach`/`for` over the full entries array inside an outer loop over the same array.

---

## Coverage

| AC | Tests |
|----|-------|
| AC1 | T2 |
| AC2 | T4, T5, T6 |
| AC3 | T3, T7, T8 |
| AC4 | T6 |
| NFR: Security | T-NFR1 |
| NFR: Performance | T-NFR2 |
