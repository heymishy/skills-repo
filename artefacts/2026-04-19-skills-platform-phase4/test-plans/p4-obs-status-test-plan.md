# Test Plan: p4-obs-status

**Story:** Generate pipeline status report (daily/weekly) from pipeline state
**Epic:** E5 — Platform Observability & Measurement
**Complexity:** 1 | **Scope stability:** Stable
**Implementation path:** `scripts/generate-status-report.js`

---

## Test Suite Overview

| Test ID | AC | Description | Type |
|---------|----|-------------|------|
| T1 | AC1 | Daily report module exists and exports `generateDailyReport` | Unit |
| T2 | AC1 | Daily report output contains all 5 required section headers | Unit |
| T3 | AC1 | In-flight story appears with ID, phase, and days-in-phase | Unit |
| T4 | AC2 | Weekly report output contains all 5 required section headers | Unit |
| T5 | AC2 | Metric signal health table contains one row per metric signal | Unit |
| T6 | AC3 | `--output` flag writes to file, nothing printed to stdout | Unit |
| T7 | AC3 | Without `--output`, report printed to stdout, no file written | Unit |
| T8 | AC4 | Story in archive with dodAt in current week counted in "This Week" | Unit |
| T9 | AC4 | Story in archive with dodAt outside current week not counted | Unit |
| T10 | AC5 | No hardcoded `heymishy` or `skills-repo` string in report output | Governance |
| T-NFR1 | NFR | No credentials pattern (Bearer, password, secret) in any report output | Security |

---

## Test Specifications

### T1 — Module exists and exports generateDailyReport and generateWeeklyReport

**Preconditions:** `scripts/generate-status-report.js` does not yet exist.
**Input:** `require('../scripts/generate-status-report.js')`.
**Expected:** Module exports `generateDailyReport` and `generateWeeklyReport` as functions.
**Failure state (before implementation):** Module does not exist — `require` throws.

---

### T2 — Daily report contains all 5 required section headers

**Preconditions:** T1 passes; minimal fixture state with one in-flight story.
**Input:** `generateDailyReport(fixtureState)`.
**Expected:** Return value contains `## In-Flight Stories`, `## Blocked Items`, `## Pending Human Actions`, `## Recent Activity`, `## Test Count`.
**Failure state (before implementation):** Function missing or returns empty string.

---

### T3 — In-flight story appears in daily report with ID, phase, days-in-phase

**Preconditions:** T1 passes; fixture state with story `{ id: 'test-story', stage: 'definition', stageEnteredAt: <7 days ago> }`.
**Input:** `generateDailyReport(fixtureState)`.
**Expected:** Output contains `test-story`, `definition`, and `7` (days-in-phase).
**Failure state (before implementation):** Function missing or story not rendered.

---

### T4 — Weekly report contains all 5 required section headers

**Preconditions:** T1 passes; minimal fixture state.
**Input:** `generateWeeklyReport(fixtureState)`.
**Expected:** Return value contains `## This Week`, `## Pipeline Funnel`, `## Metric Signal Health`, `## Cycle Time`, `## Risk Flags`.
**Failure state (before implementation):** Function missing.

---

### T5 — Metric signal health table contains one row per signal

**Preconditions:** T1 passes; fixture state with two metric signals `{ id: 'M1', status: 'on-track' }`, `{ id: 'M2', status: 'at-risk' }`.
**Input:** `generateWeeklyReport(fixtureState)`.
**Expected:** Output contains `M1` and `on-track` and `M2` and `at-risk`.
**Failure state (before implementation):** Function missing or signals not rendered.

---

### T6 — `--output` flag writes to file, nothing to stdout

**Preconditions:** T1 passes; temp output path.
**Input:** `generateDailyReport(fixtureState, { output: tmpPath })`.
**Expected:** File written at tmpPath with report content; return value is `null` or empty string.
**Failure state (before implementation):** File not written.

---

### T7 — Without `--output`, report returned / printed to stdout

**Preconditions:** T1 passes.
**Input:** `generateDailyReport(fixtureState)` (no output option).
**Expected:** Return value is a non-empty string containing the report; no file written at any path.
**Failure state (before implementation):** Function missing.

---

### T8 — Archive story with dodAt in current week counted in "This Week"

**Preconditions:** T1 passes; fixture archive state with story `dodAt` set to two days ago (within current week).
**Input:** `generateWeeklyReport(mergedState)`.
**Expected:** "This Week" section contains count ≥ 1.
**Failure state (before implementation):** Archive not read or story not counted.

---

### T9 — Archive story with dodAt outside current week not counted

**Preconditions:** T1 passes; fixture archive state with story `dodAt` set to 10 days ago (outside current week).
**Input:** `generateWeeklyReport(mergedState)`.
**Expected:** "This Week" section count does not include this story (0 if no other stories).
**Failure state (before implementation):** All archive stories counted regardless of date.

---

### T10 — No hardcoded org name in output (governance check)

**Preconditions:** T1 passes; standard fixture state.
**Input:** `generateDailyReport(fixtureState)` and `generateWeeklyReport(fixtureState)`.
**Expected:** Neither output contains the literal strings `heymishy` or `skills-repo`.
**Failure state (before implementation):** Function missing.

---

### T-NFR1 — No credentials in report output (security check)

**Preconditions:** T1 passes; standard fixture state.
**Input:** Both report outputs.
**Expected:** Neither output contains patterns matching `/Bearer\s/i`, `/password/i`, `/secret/i`.
**Failure state (before implementation):** Function missing.
