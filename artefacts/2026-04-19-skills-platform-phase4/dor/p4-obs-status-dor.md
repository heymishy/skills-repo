# Definition of Ready: p4-obs-status — Generate pipeline status report

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-obs-status.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-obs-status-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-obs-status-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-20
Epic: E5 — Platform Observability & Measurement
Oversight level: Medium — standard peer review required before merge

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: platform operator or delivery lead. All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 5 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 5 ACs covered — see test plan mapping. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M2 — Consumer confidence named. |
| H6 | Complexity is rated | ✅ PASS | Complexity: 1. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 2 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 5 ACs covered. |
| H9 | Architecture constraints section populated | ✅ PASS | ADR-001, read-only, ADR-004, mergeState() dependency, MC-SEC-02. |
| H-E2E | CSS/layout check | N/A | CLI script only — no UI. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | No regulatory requirements. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — no credentials in any output path. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02), Correctness (sections with no data render placeholder), Performance (≤3s for 100 stories). |
| W2 | Scope stability declared | ✅ STABLE | Stable — reads existing state format, no new schema fields. |
| W3 | MEDIUM findings acknowledged | N/A | 0 MEDIUM findings. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — Medium oversight; standard peer review required before merge.**

**Upstream gate:** psa.1 (`archive-completed-features.js` `mergeState()` export) must be present. It is DoD-complete ✅.

**Scope contract:**
- Create `scripts/generate-status-report.js` — exports `generateDailyReport(state, opts)` and `generateWeeklyReport(state, opts)`.
- AC1: `generateDailyReport` returns markdown with all 5 sections: `## In-Flight Stories`, `## Blocked Items`, `## Pending Human Actions`, `## Recent Activity`, `## Test Count`; each in-flight story listed with ID, phase, days-in-phase.
- AC2: `generateWeeklyReport` returns markdown with all 5 sections: `## This Week`, `## Pipeline Funnel`, `## Metric Signal Health`, `## Cycle Time`, `## Risk Flags`; metric signal table has one row per signal.
- AC3: `opts.output` path → write file, return null; no `opts.output` → return string, write nothing.
- AC4: Archive integration — weekly "This Week" count reads `mergeState()` output; only stories with `dodAt` in current Mon–Sun week counted.
- AC5: No string `heymishy` or `skills-repo` anywhere in report output — all labels from state file content.
- Read-only: the script must not write to `pipeline-state.json` or `pipeline-state-archive.json`.
- Create `tests/check-p4-obs-status.js` covering all 11 test IDs (T1–T10, T-NFR1).

**Architecture constraints:**
- ADR-001: CommonJS (`require`/`module.exports`) — no ESM
- Read-only state access — no writes to pipeline state files
- ADR-004 equivalent: no hardcoded org names in source or output
- MC-SEC-02: no credentials in any output path

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — peer review required before merge (Medium oversight)
Date: 2026-04-20

All hard blocks: PASS
Warnings acknowledged: W4 (verification script not independently reviewed)
Upstream gate: psa.1 `mergeState()` present ✅
