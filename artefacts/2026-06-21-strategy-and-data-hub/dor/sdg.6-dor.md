# Definition of Ready — sdg.6

**Story:** sdg.6 — Callout marker detection and metrics recording
**Feature:** 2026-06-21-strategy-and-data-hub
**Status:** SIGNED OFF
**Date:** 2026-06-26
**Oversight level:** Low

---

## Contract Proposal

**What will be built:**
A metrics recording module (`src/web-ui/modules/strategy-metrics.js`) with three exported functions: `initMetricsFile(workspaceDir)` (idempotent — creates `workspace/strategy-metrics.json` with `{"metrics":[]}` if absent), `detectCalloutMarkers(artefactText)` (literal case-sensitive scan for `[Grounded in: <filename>]` occurrences), and `recordMetrics(workspaceDir, metricsPayload)` (appends one entry to the metrics file). A `buildCompletionSummary(metricsPayload)` helper returns the human-readable session completion line. The post-completion hook in `routes/skills.js` calls `recordMetrics` after each artefact is saved for /ideate and /discovery sessions. Entries are per-artefact (one per session completion); no aggregation.

**What will NOT be built:**
- Automatic quality scoring from callout frequency
- Real-time feedback during a session
- Historical aggregation across multiple features
- Automated alerts or re-upload recommendations

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `initMetricsFile()` creates file with `{"metrics":[]}` if absent; idempotent | Unit (T1) |
| AC2 | `detectCalloutMarkers()` counts literal occurrences; case-sensitive | Unit (T2, T3) |
| AC3 | `recordMetrics()` appends entry with correct JSON structure including `calloutRate` | Unit (T4, T5) |
| AC4 | `buildCompletionSummary()` returns correct message for grounded and ungrounded sessions | Unit (T6, T9) |
| AC5 | `hasReferenceFiles: false` sessions recorded correctly with zero counts | Unit (T7) |
| AC6 | Multiple artefact completions produce independent entries (no aggregation) | Unit (T8) |
| NFR-APPEND | Prior entries never mutated on append | Unit (T10) |

**Assumptions:**
- Artefact sections are counted by `##` headings in the saved markdown (this rule must be documented in the module source)
- `workspace/strategy-metrics.json` lives at the repo root `workspace/` directory (same level as `workspace/state.json`)
- The post-completion hook fires after `completeStage()` — disk write precedes state advance (consistent with ougl disk canonicity rule)

**Estimated touch points:**
- Files: `src/web-ui/modules/strategy-metrics.js` (new), `src/web-ui/routes/skills.js` (post-completion hook at /ideate and /discovery `completeStage` call sites)
- Workspace: `workspace/strategy-metrics.json` (created at first session completion)
- Dependencies: sdg.4 (callout markers must exist in /ideate artefacts), sdg.5 (callout markers must exist in /discovery artefacts)

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story is in As / Want / So format | ✅ PASS — "As the skills pipeline, I want to detect 'Grounded in:' callout markers in completed artefacts, So that I can track how often the model uses reference content and correlate with artefact quality." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS — 6 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ PASS — test plan (`artefacts/2026-06-21-strategy-and-data-hub/test-plans/sdg.6-test-plan.md`) covers all 6 ACs with 10 unit tests |
| H4 | Out-of-scope section is populated | ✅ PASS — 4 out-of-scope items explicitly listed |
| H5 | Benefit linkage references a named metric | ✅ PASS — References M3 (Callout rate measurement) from benefit-metric.md |
| H6 | Complexity is rated | ✅ PASS — Complexity: 1 (well understood; file append with JSON, literal string scan; no ambiguity) |
| H7 | No unresolved HIGH findings from review | ✅ PASS — Review PASS with no HIGH findings for sdg.6 |
| H8 | Test plan has no uncovered ACs without acknowledgement | ✅ PASS — All 6 ACs fully covered; 2 acknowledged gaps (section counting heuristic, manual DoD confirmation) both accepted by design |
| H9 | Architecture constraints populated; no Category E HIGH findings | ✅ PASS — Constraints: "Append-only metrics file; literal `[Grounded in: ...]` pattern matching; post-completion timing; workspace/ location; disk write before completeStage()." |

---

## Coding Agent Instructions

1. Create `src/web-ui/modules/strategy-metrics.js` with exports: `initMetricsFile(workspaceDir)`, `detectCalloutMarkers(text)`, `recordMetrics(workspaceDir, payload)`, `buildCompletionSummary(payload)`
2. `detectCalloutMarkers(text)`: scan for `/\[Grounded in: ([^\]]+)\]/g` (literal pattern); return `{ count: N, filenames: ['a.md', ...] }`; case-sensitive (no `i` flag)
3. `recordMetrics`: read existing file → parse → push new entry → write back atomically. Entry fields: `date` (ISO 8601), `featureSlug`, `stage`, `hasReferenceFiles`, `referenceFileCount`, `referenceFileNames`, `calloutCount`, `totalSections`, `calloutRate` (rounded to 2dp). Count sections as `##` heading occurrences in the artefact text
4. `buildCompletionSummary`: if `hasReferenceFiles === false` return `"No strategy grounding used in this session."`; otherwise return `"Strategy content was cited in ${calloutCount}/${totalSections} sections of your artefact (rate: ${calloutRate})."`
5. In `routes/skills.js`, after the artefact disk write for /ideate and /discovery completions: call `initMetricsFile`, `detectCalloutMarkers` on the written artefact content, `recordMetrics` with computed values
6. Disk write MUST precede `completeStage()` per ougl disk canonicity rule (CLAUDE.md)
7. Run `node tests/check-sdg6-metrics-recording.js` — all 10 tests must pass before opening PR

---

## PROCEED ✅

All hard blocks pass. Oversight: Low — coding agent implements; human reviews before merge.
