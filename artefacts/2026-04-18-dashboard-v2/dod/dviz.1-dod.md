# Definition of Done: dviz.1 — Pipeline data adapter

**PR:** #158 (initial) + subsequent hotfix commits | **Merged:** 2026-04-21
**Story:** artefacts/2026-04-18-dashboard-v2/stories/dviz.1-pipeline-adapter.md
**Test plan:** artefacts/2026-04-18-dashboard-v2/test-plans/dviz.1-test-plan.md
**DoR artefact:** artefacts/2026-04-18-dashboard-v2/dor/dviz.1-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-23

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1a (pipeline-adapter.js exists), T3 (loaded before babel script block), T5 (assigns window.CYCLES and window.EPICS). Features from pipeline-state.json render as CYCLES in swimlane view. | Automated: tests/check-dviz1-adapter.js T1, T3, T5 | None |
| AC2 | ✅ | T6 (all 12 pipeline stages present in stage-to-phase mapping). Epics/stories placed in correct phase columns per mapping table. | Automated: T6 | None |
| AC3 | ✅ | T7 (dodStatus:complete → state "done"), T8 (health:red → state "blocked"). | Automated: T7, T8 | None |
| AC4 | ✅ | T9 (.catch branch present — no uncaught promise rejection on fetch failure). Falls back gracefully; hardcoded mock remains as fallback. | Automated: T9 | None |
| AC5 | ✅ | T10 (no credential strings found in adapter — MC-SEC-02 ✓). All data sourced from pipeline-state.json only. | Automated: T10 | None |

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 10/10
**Tests passing in CI:** 10/10

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — pipeline-adapter.js exists | ✅ | ✅ | |
| T2 — adapter syntax is valid JavaScript | ✅ | ✅ | |
| T3 — index.html loads pipeline-adapter.js before babel script block | ✅ | ✅ | |
| T4 — old inline mock comment not present in index.html | ✅ | ✅ | |
| T5 — adapter assigns window.CYCLES and window.EPICS | ✅ | ✅ | |
| T6 — all 12 pipeline stages present in stage-to-phase mapping | ✅ | ✅ | |
| T7 — adapter maps dodStatus:complete to state "done" | ✅ | ✅ | |
| T8 — adapter maps health:red to state "blocked" | ✅ | ✅ | |
| T9 — adapter has .catch branch | ✅ | ✅ | |
| T10 — no credential strings found in adapter (MC-SEC-02) | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| MC-SEC-02 — no credentials in adapter | ✅ | T10 automated check passes |

---

## Metric Signal

No metrics defined for this story.

---

## Outcome

**COMPLETE**

Follow-up actions: None.

---

## DoD Observations

None.
