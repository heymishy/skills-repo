# Benefit Metric: Auditor Trace Report

**Discovery reference:** artefacts/2026-04-18-auditor-trace-report/discovery.md
**Date defined:** 2026-04-18
**Metric owner:** Platform maintainer

---

## Tier Classification

**META-BENEFIT FLAG:** No

This is a straightforward tooling feature — a CLI script that produces a report. No meta-learning hypothesis.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Audit chain assembly time (M1)

| Field | Value |
|-------|-------|
| **What we measure** | Time for a person arriving cold to produce a complete traceability report for one feature |
| **Baseline** | ~15–30 minutes of manual JSON reading, file-by-file path checking, and JSONL grep (estimate based on current pipeline complexity) |
| **Target** | Under 30 seconds — one command, one report |
| **Minimum validation signal** | Under 2 minutes including reading the output |
| **Measurement method** | Wall-clock time running `node scripts/trace-report.js --feature <slug>` and reviewing the output. Measured by operator on first use. |
| **Feedback loop** | If the report takes longer than 2 minutes to produce and read, the output format needs simplification. Platform maintainer reviews after first 3 uses. |

### Metric 2: Chain link coverage (M2)

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of chain links the report can verify — discovery, benefit-metric, epic, story, test-plan, DoR, DoD, gate trace entry |
| **Baseline** | 0% — no automated report exists |
| **Target** | 100% of chain links that exist in the pipeline-state entry are checked and reported |
| **Minimum validation signal** | At least discovery → story → test-plan → gate evidence links are covered |
| **Measurement method** | Count of link types checked by the script vs total link types in the chain model. Verified by reading the script source. |
| **Feedback loop** | If a link type is missing from the report after first run, add it to the script. Platform maintainer reviews. |

### Metric 3: Archive-aware operation (M3)

| Field | Value |
|-------|-------|
| **What we measure** | Whether the report correctly resolves features that have been archived by psa.1 to `pipeline-state-archive.json` |
| **Baseline** | 0% — no report exists |
| **Target** | 100% — archived features produce the same report quality as active features |
| **Minimum validation signal** | At least one archived feature (e.g. Phase 1) produces a valid report |
| **Measurement method** | Run the script against an archived feature slug and verify the report contains all chain links. |
| **Feedback loop** | If archived features fail, the archive JSON shape handling needs fixing. Report the gap as a test failure. |

---

**Next step:** /definition
