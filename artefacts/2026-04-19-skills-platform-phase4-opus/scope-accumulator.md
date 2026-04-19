## Scope Accumulator — /definition Step 6

**Feature:** 2026-04-19-skills-platform-phase4 (Opus arm)
**Date:** 2026-04-19
**Model:** claude-opus-4-6

---

## Discovery MVP Items vs Story Coverage

| MVP Item | Discovery Description | Stories Covering It | Coverage |
|----------|----------------------|---------------------|----------|
| 1. Distribution — zero-commit install + sync | Install skills without generating consumer commits; sync updates without severing update channel | spike-a, spike-c, design-package-manifest, implement-zero-commit-install, implement-sync-command, implement-lockfile-hash-verification, implement-context-yml-seeding, validate-install-sync-e2e | ✅ Full coverage (8 stories) |
| 2. Structural enforcement with navigation flexibility — spike programme | 5 spikes (A, B1, B2, C, D) to resolve enforcement mechanism, distribution model, and Teams fidelity | spike-a, spike-b1, spike-b2, spike-c, spike-d, synthesise-enforcement-recommendation, record-enforcement-adr | ✅ Full coverage (7 stories — 5 spikes + 2 synthesis/recording) |
| 3. Non-technical access — Teams bot prototype for C7 | Teams bot demonstrating C7 one-question-at-a-time fidelity for PMs, business leads, auditors | spike-d, implement-teams-bot-scaffold, implement-teams-dor-approval, implement-teams-pipeline-health, implement-teams-governance-output, validate-teams-e2e-session | ✅ Full coverage (6 stories) |
| 4. Readable governance output | Plain-language trace summaries, gate verdicts, audit export for non-engineers | design-readable-governance-format, implement-trace-plain-language, implement-gate-verdict-narrative, implement-second-line-audit-export, validate-readable-output-review | ✅ Full coverage (5 stories) |

**Total stories:** 23 (after deduplication — spike-a and spike-d appear in multiple MVP items)
**MVP items with no story coverage:** 0
**Stories with no MVP item trace:** 0

---

## Scope Drift Analysis

| Drift Type | Count | Details |
|------------|-------|---------|
| Stories adding scope beyond discovery MVP | 0 | All 23 stories trace to one of the 4 MVP items |
| Discovery MVP items dropped without decisions.md entry | 0 | All 4 MVP items have story coverage |
| Constraint coverage gaps | 0 | All 5 constraints (C1, C4, C5, C7, C11) appear in at least one story's Architecture Constraints section |

**Verdict:** No scope drift detected. The 23 stories map cleanly to the 4 discovery MVP items. No scope was added beyond what the discovery specified; no discovery scope was dropped.

---

## Comparison with Sonnet arm (for experiment record)

| Dimension | Sonnet | Opus |
|-----------|--------|------|
| Total stories | 24 | 23 |
| Epics | 4 | 4 |
| Complexity distribution | {1:3, 2:12, 3:9} | {1:3, 2:16, 3:4} |
| MVP items covered | 4/4 | 4/4 |
| Scope drift items | _To be verified by operator_ | 0 |

**Observation:** Opus produced 1 fewer story (23 vs 24) and rated fewer stories at complexity 3 (4 vs 9), shifting the distribution toward complexity 2. This suggests Opus decomposed some scope that Sonnet kept as single complex stories into more granular but individually simpler stories. The total story count difference is small (4% fewer). Further analysis in the experiment scorecard.
