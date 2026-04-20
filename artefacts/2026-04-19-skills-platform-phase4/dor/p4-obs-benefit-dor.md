# Definition of Ready: p4-obs-benefit — Benefit measurement expansion

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-obs-benefit.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-obs-benefit-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-obs-benefit-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-20
Epic: E5 — Platform Observability & Measurement
Oversight level: Medium — standard peer review required before merge

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: platform operator evaluating delivery outcomes. All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered — see test plan. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | MM-A through MM-D (Tier 2 meta-metrics — experiment framework) named. |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 1 MEDIUM, 2 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered; MEDIUM 1-M1 resolved in test plan via fixture specification. |
| H9 | Architecture constraints section populated | ✅ PASS | ADR-001, workspace/experiments/ write target, read-only state, interactive prompts via readline, MC-SEC-02. |
| H-E2E | CSS/layout check | N/A | CLI script — no UI. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | No regulatory requirements. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — no credentials or operator personal identifiers in comparison report output. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02), Correctness (YAML front-matter valid; delta formula labelled), Performance (report generation bounded by state file read — no unbounded loops). |
| W2 | Scope stability declared | ✅ STABLE | Stable — writes to workspace/experiments/, reads existing state files; no new state fields. |
| W3 | MEDIUM findings acknowledged | ✅ | 1-M1 (estimation-norms.md mapping) acknowledged — test plan T9/T10 specify fixture; `platform_operator_hours` is null when file absent. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W3 and W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — Medium oversight; standard peer review required before merge.**

**Upstream gate:** EXP-001 directory (`workspace/experiments/EXP-001-discovery-phase4-5/`) must exist. It is committed ✅.

**Scope contract:**
- Create `scripts/record-benefit-comparison.js` — exports `recordComparison(inputs, state, opts)` and `generateSummary(experimentsDir)`.
- AC1: `recordComparison` reads platform actuals from merged state; prompts for traditional estimates (interactive); writes `workspace/experiments/benefit-comparison-<slug>.md`.
- AC2: Report contains YAML front-matter block (`---` delimited) with all 8 required fields: `feature_slug`, `report_date`, `platform_cycle_days`, `traditional_cycle_days`, `platform_operator_hours`, `traditional_operator_hours_estimate`, `platform_story_count`, `platform_test_count`. Body contains markdown comparison table.
- AC3: `generateSummary(dir)` reads all `benefit-comparison-*.md` files in dir; outputs markdown table with one row per file, columns: Feature, Platform cycle (days), Traditional estimate (days), Delta %, Platform tests, Operator hours saved.
- AC4: `experiment_ref` in front-matter populated with `experimentRef` CLI arg if provided; `null` if not provided.
- `platform_operator_hours`: read from `workspace/estimation-norms.md` E3 actuals row for the feature if file exists and row found; otherwise `null`.
- Delta formula: `Math.round((platform - traditional) / traditional * 100)` — negative = platform faster/cheaper; label clearly in table.
- `opts.normsPath` overrides default path for test isolation.
- Create `tests/check-p4-obs-benefit.js` covering all 12 test IDs (T1–T10, T-NFR1, T-NFR2).
- YAML front-matter: scalar values only (string, number, null) — no nested objects.
- Do NOT use `js-yaml` or any external npm package.

**Architecture constraints:**
- ADR-001: CommonJS (`require`/`module.exports`)
- Write target: `workspace/experiments/` only — no writes to pipeline state files
- Interactive prompts: Node.js built-in `readline` only
- MC-SEC-02: no credentials, tokens, or operator personal identifiers in any report output

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — peer review required before merge (Medium oversight)
Date: 2026-04-20

All hard blocks: PASS
Warnings acknowledged: W3 (1-M1 — estimation-norms fixture specified in test plan T9/T10), W4 (verification script)
Upstream gate: EXP-001 directory committed ✅
