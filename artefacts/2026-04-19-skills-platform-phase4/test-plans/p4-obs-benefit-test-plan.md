# Test Plan: p4-obs-benefit

**Story:** Benefit measurement expansion — platform vs traditional SDLC comparison
**Epic:** E5 — Platform Observability & Measurement
**Complexity:** 2 | **Scope stability:** Stable
**Implementation path:** `scripts/record-benefit-comparison.js`

---

## Test Suite Overview

| Test ID | AC | Description | Type |
|---------|----|-------------|------|
| T1 | AC1 | `recordComparison` produces comparison report file at correct path | Unit |
| T2 | AC2 | Report contains all required YAML front-matter fields | Unit |
| T3 | AC2 | Report contains comparison table with platform vs traditional rows | Unit |
| T4 | AC2 | Percentage delta calculated correctly for cycle time and hours | Unit |
| T5 | AC3 | `--summary` produces markdown table with one row per report | Unit |
| T6 | AC3 | Summary table has required columns | Unit |
| T7 | AC4 | Report includes `experiment_ref` field pointing to EXP directory | Unit |
| T8 | AC4 | `experiment_ref` is null when no experiment directory referenced | Unit |
| T9 | AC1 | `platform_operator_hours` is null when estimation-norms.md absent | Unit |
| T10 | AC1 | `platform_operator_hours` reads from estimation-norms.md when present | Unit |
| T-NFR1 | NFR | No credentials pattern in report output | Security |
| T-NFR2 | NFR | YAML front-matter is parseable without external dependencies | Governance |

---

## Test Specifications

### T1 — recordComparison produces report file at correct path

**Preconditions:** `workspace/experiments/` directory exists; fixture state with feature `slug-a` containing one `dodStatus: "complete"` story.
**Input:** `recordComparison({ featureSlug: 'slug-a', traditionalCycleDays: 30, traditionalOperatorHours: 80, traditionalDefectEstimate: 5, notes: 'baseline' }, fixtureState)`.
**Expected:** File `workspace/experiments/benefit-comparison-slug-a.md` created.
**Failure state (before implementation):** `recordComparison` does not exist.

---

### T2 — Report contains all required YAML front-matter fields

**Preconditions:** T1 passes.
**Input:** Read file created in T1.
**Expected:** Front-matter block at top of file contains all 8 required fields: `feature_slug`, `report_date`, `platform_cycle_days`, `traditional_cycle_days`, `platform_operator_hours`, `traditional_operator_hours_estimate`, `platform_story_count`, `platform_test_count`.
**Failure state (before implementation):** File missing or fields absent.

---

### T3 — Report contains comparison table with platform vs traditional rows

**Preconditions:** T1 passes.
**Input:** File content from T1.
**Expected:** Markdown body contains a table with columns `Platform` and `Traditional` and rows for cycle time, operator hours, and test count.
**Failure state (before implementation):** No table in output.

---

### T4 — Percentage delta calculated correctly

**Preconditions:** Fixture inputs: platform cycle = 10 days, traditional cycle = 30 days.
**Input:** `recordComparison({ featureSlug: 'slug-b', traditionalCycleDays: 30, ... }, fixtureState)`.
**Expected:** Delta row for cycle time shows `-67%` (or equivalent rounded value from `Math.round((10 - 30) / 30 * 100)`).
**Failure state (before implementation):** Function missing or delta incorrect.

---

### T5 — `--summary` produces markdown table with one row per report

**Preconditions:** Two comparison report files exist in `workspace/experiments/` from T1 and T4.
**Input:** `generateSummary('workspace/experiments/')`.
**Expected:** Output contains a markdown table with 2 data rows (one per report file) plus a header row.
**Failure state (before implementation):** `generateSummary` missing or returns empty.

---

### T6 — Summary table has required columns

**Preconditions:** T5 passes.
**Input:** Same output.
**Expected:** Table header contains: `Feature`, `Platform cycle (days)`, `Traditional estimate (days)`, `Delta %`, `Platform tests`, `Operator hours saved`.
**Failure state (before implementation):** Columns missing or renamed.

---

### T7 — Report includes experiment_ref pointing to EXP directory

**Preconditions:** `workspace/experiments/EXP-001-discovery-phase4-5/` exists.
**Input:** `recordComparison({ ..., experimentRef: 'workspace/experiments/EXP-001-discovery-phase4-5/' }, ...)`.
**Expected:** Front-matter `experiment_ref` value is `workspace/experiments/EXP-001-discovery-phase4-5/`.
**Failure state (before implementation):** Field absent or null.

---

### T8 — experiment_ref is null when not provided

**Preconditions:** T1 fixture without `experimentRef` argument.
**Input:** `recordComparison({ featureSlug: 'slug-c', traditionalCycleDays: 20, ... }, fixtureState)` (no experimentRef).
**Expected:** Front-matter `experiment_ref: null`.
**Failure state (before implementation):** Field absent (test distinguishes null from absent).

---

### T9 — platform_operator_hours is null when estimation-norms.md absent

**Preconditions:** `workspace/estimation-norms.md` does not exist.
**Input:** `recordComparison({ featureSlug: 'slug-a', ... }, fixtureState)`.
**Expected:** Front-matter `platform_operator_hours: null`.
**Failure state (before implementation):** Error thrown or field missing.

---

### T10 — platform_operator_hours reads from estimation-norms.md when present

**Preconditions:** Fixture `estimation-norms.md` containing a row for feature `slug-a` with E3 actuals `12.5h`.
**Input:** `recordComparison({ featureSlug: 'slug-a', ... }, fixtureState, { normsPath: fixturePath })`.
**Expected:** Front-matter `platform_operator_hours: 12.5`.
**Failure state (before implementation):** Field null or incorrect value.

---

### T-NFR1 — No credentials in report output

**Preconditions:** T1 passes.
**Input:** File content from T1.
**Expected:** File does not contain patterns `/Bearer\s/i`, `/password:/i`, `/secret:/i`.
**Failure state (before implementation):** Function missing (always passes trivially — confirmed at implementation).

---

### T-NFR2 — YAML front-matter parseable without external libs

**Preconditions:** T1 passes.
**Input:** Extract front-matter block from file; parse with simple `---`-delimited split; split each line on `:`.
**Expected:** Every field resolves to a key-value pair without throwing; no field value contains characters that require a full YAML parser (no nested structures, no special YAML types).
**Failure state (before implementation):** Front-matter uses nested objects or non-primitive types.
