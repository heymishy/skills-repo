# Test Plan: Author and maintain workforce-to-initiative allocation assignments

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.9.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-reconciliation-engine.md
**Test plan author:** Copilot
**Date:** 2026-05-26

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Guided mode happy path: iterates portfolio slugs, accepts squad/person assignments, writes allocation-input.json | 3 tests | — | — | — | — | 🟢 |
| AC2 | Guided mode: invalid person name → error message + re-prompt, no partial entry | 1 test | — | — | — | — | 🟢 |
| AC3 | File import xlsx/csv: rows merged by slug into single entry with people array | 2 tests | — | — | — | — | 🟢 |
| AC4 | File import: unmatched person → warning on stderr, entry still included | 1 test | — | — | — | — | 🟢 |
| AC5 | File import: missing required column → nonzero exit + error message, no output file | 1 test | — | — | — | — | 🟢 |
| AC6 | Auto-derive: _autoderived:true on root, _reviewRequired:true on every entry, summary stdout | 3 tests | — | — | — | — | 🟢 |
| AC7 | Auto-derive: no portfolio files → nonzero exit + correct message | 2 tests | — | — | — | — | 🟢 |
| AC8 | Overwrite protection all modes: existing file + no flag → nonzero exit + correct message | 3 tests | — | — | — | — | 🟢 |
| AC9 | Overwrite with --overwrite: file replaced; output is valid JSON (atomicity) | 2 tests | — | — | — | — | 🟢 |
| NFR-PERF | File import 500-row xlsx < 10s; auto-derive 30 slugs/200-person roster < 15s | 1 test | — | — | — | — | 🟡 |
| NFR-INTEG | Optional columns absent → omitted from output (not null) | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

**NFR-PERF (🟡 low risk):** Performance NFR thresholds (500-row file < 10s; 30 slugs/200-person roster < 15s) are not exercised in unit tests with real fixtures of that scale. They are self-enforced by the implementation constraints (no network I/O, synchronous file reads only). If performance is a concern in production, run manually with a synthetic fixture before the first live invocation.

**Guided mode stdin interaction:** AC1/AC2 require a `promptFn` injectable adapter (D37 pattern). Tests inject a mock array of answers. The readline production adapter is not exercised in unit tests — it is verified by a separate smoke test against the production wiring (see DoR).

---

## Test Data Strategy

All test data is synthetic. No real PII.

**Roster fixture (`roster.json`):** 2 squads — `{ squad: "Platform Engineering", productGroup: "platform", members: [{ name: "Alice Smith", skills: ["java","spring","kafka"] }, { name: "Bob Jones", skills: ["java","docker"] }] }` and `{ squad: "Data Engineering", productGroup: "data", members: [{ name: "Carol White", skills: ["python","spark"] }] }`.

**Portfolio fixture:** 3 slug files — `platform-migration.json` (productGroup: "platform", claimedFTE: 4.0), `data-lakehouse.json` (productGroup: "data", claimedFTE: 2.0), `unknown-initiative.json` (productGroup: "unknown").

**File import fixture (xlsx/csv):** Rows: `[("platform-migration","Alice Smith","platform",""), ("platform-migration","Bob Jones","platform",""), ("data-lakehouse","Carol White","data","")]`.

**Guided mode mock answers:** Implemented as an array consumed by the injected `promptFn`. Each element maps to one terminal prompt in sequence.

**MIN_COVERAGE_SCORE constant:** Not applicable to wfp.9 (no tag scoring — that is wfp.10).

---

## Unit tests

Test file: `tests/check-wfp9-assign.js`
Run command: `node tests/check-wfp9-assign.js`
Source under test: `src/workforce/assign.js` (exports `runAssign`, `setPromptFn`, `runAutoDerive`, `runFileImport`, `runGuided`)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| 1 | `guided-squad-assignment-produces-entry` | AC1 | Mock promptFn returns: option 1 (squad), selects "Platform Engineering" | `allocation-input.json` contains entry for slug with `allocationMode: "direct"` and squad reference |
| 2 | `guided-person-assignment-produces-entry` | AC1 | Mock promptFn returns: option 2 (people), "Alice Smith, Bob Jones" | Entry has `people: ["Alice Smith", "Bob Jones"]` |
| 3 | `guided-skip-omits-slug` | AC1 | Mock promptFn returns: option 3 (skip) | That slug is absent from `allocation-input.json` |
| 4 | `guided-invalid-person-re-prompts` | AC2 | Mock promptFn returns: "Unknown Person" then "Alice Smith" | Output entry has "Alice Smith"; no entry with "Unknown Person"; error message matches "Person not found in roster: Unknown Person" |
| 5 | `file-import-xlsx-merges-rows-by-slug` | AC3 | Two rows with `initiative-slug: platform-migration`; different `person-name` values | Single entry with `slug: "platform-migration"` and `people: ["Alice Smith", "Bob Jones"]` |
| 6 | `file-import-csv-produces-same-output-as-xlsx` | AC3 | Equivalent CSV with same rows | Same output structure as xlsx test (slug count, people arrays) |
| 7 | `file-import-unmatched-person-included-with-warning` | AC4 | Row with `person-name: "Ghost User"` not in roster | Entry written with "Ghost User" in people; stderr contains "Person not in roster: Ghost User" |
| 8 | `file-import-missing-required-column-exits-nonzero` | AC5 | XLSX with no `initiative-slug` column | Exit code ≠ 0; stdout/stderr contains "Required column 'initiative-slug' not found in file. Check column headers."; no output file written |
| 9 | `file-import-optional-columns-absent-omitted-not-null` | NFR-INTEG | XLSX with `initiative-slug` and `person-name` only; no `product-group` or `scope-label` columns | Output entries have no `productGroup` or `scopeLabel` keys (not `null` — keys absent entirely) |
| 10 | `auto-derive-direct-match-produces-direct-entry` | AC6 | `platform-migration` (productGroup: platform) → one squad matches | Entry has `allocationMode: "direct"`, `_reviewRequired: true` |
| 11 | `auto-derive-root-has-autoderived-flag` | AC6 | Run against portfolio fixture | `allocation-input.json` root has `_autoderived: true` |
| 12 | `auto-derive-all-entries-have-review-required` | AC6 | Run against portfolio fixture with all three match types | Every entry has `_reviewRequired: true` |
| 13 | `auto-derive-summary-stdout-has-correct-counts` | AC6 | 1 direct, 0 profile-match, 1 net-new in fixture | Stdout contains "Auto-derived 1 direct, 0 profile-match, 1 net-new entries." |
| 14 | `auto-derive-no-portfolio-dir-exits-nonzero` | AC7 | `portfolio/` directory absent | Exit code ≠ 0; message matches "No portfolio files found in portfolio/." |
| 15 | `auto-derive-empty-portfolio-dir-exits-nonzero` | AC7 | `portfolio/` directory exists but contains no `.json` files | Exit code ≠ 0; same message |
| 16 | `overwrite-protection-file-mode-no-flag` | AC8 | `allocation-input.json` exists; invoke `--mode file` without `--overwrite` | Exit code ≠ 0; message matches "allocation-input.json already exists. Use --overwrite to replace" |
| 17 | `overwrite-protection-guided-mode-no-flag` | AC8 | Same; invoke `--mode guided` without `--overwrite` | Same exit and message |
| 18 | `overwrite-protection-auto-mode-no-flag` | AC8 | Same; invoke `--mode auto` without `--overwrite` | Same exit and message |
| 19 | `overwrite-flag-replaces-existing-file` | AC9 | `allocation-input.json` exists; invoke with `--overwrite` | New file written; content reflects current run's output |
| 20 | `output-is-valid-json` | AC9 | Any successful run | `JSON.parse(fs.readFileSync(...))` does not throw |

---

## E2E tests

Not applicable — `workforce-assign` is a CLI skill with no browser-rendered output. H-E2E passes trivially.

---

## Integration / smoke tests (production wiring)

Per D37 rule, a separate test must verify the production readline adapter is wired:

| # | Test ID | Scope | Scenario | Expected |
|---|---------|-------|---------|---------|
| S1 | `guided-mode-production-promptfn-is-wired` | Smoke | Import `assign.js`; do NOT call `setPromptFn()`; call `getPromptFn()` | Returns a real readline-based function (not the stub thrower); or the module throws at load time if adapter is not wired — confirming D37 stub is enforced |

---

## Notes on test file format

```js
// tests/check-wfp9-assign.js
const assert = require('assert');
let passed = 0, failed = 0;
function test(label, fn) {
  try { fn(); console.log('  PASS', label); passed++; }
  catch (e) { console.log('  FAIL', label, e.message); failed++; }
}
// ... tests ...
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```
