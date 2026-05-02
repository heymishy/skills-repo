# Review Report: Programme manager pipeline status view — Run 1

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.7-programme-status-view.md
**Date:** 2026-05-02
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[7-M1]** [B — Scope / E — Architecture] — AC5 relies on `dodStatus: "complete"` as the trigger for grouping a feature in the "Done" section. `dodStatus` does not appear in the known `pipeline-state.json` field set (fields confirmed across this feature: `prStatus`, `dorStatus`, `reviewStatus`, `traceStatus`, `health`, `highFindings`). Introducing it would require a schema update per ADR-003 and would conflict with the Epic 2 out-of-scope constraint ("no new pipeline-state.json fields beyond those introduced in Epic 1"). The "Done" condition should be derivable from existing fields.
  Fix: Replace the `dodStatus: "complete"` condition in AC5 with a derivable condition using existing fields, e.g.: "Given a feature has all stories with `prStatus: \"merged\"` and `traceStatus: \"passed\"`, When the status board renders, Then the feature is shown in a 'Done' group, visually separated from in-progress features." If `dodStatus` is intended to be added to the schema as part of this feature, this must be explicitly scoped as a new field with a corresponding schema update story — it cannot be added silently in the coding agent.

---

## LOW findings — note for retrospective

- **[7-L1]** [C — AC quality] — AC2 specifies `"Trace findings"` as a browser-rendered status label. The plain language NFR (nfr-profile.md) applies to wuce.7. "Trace" is pipeline vocabulary (the `/trace` skill name). A more accessible label such as "Consistency check findings" or "Assurance findings" would satisfy the plain language constraint without losing meaning for a non-technical programme manager.

---

## Category Scores

| Category | Score | Pass/Fail | Notes |
|----------|-------|-----------|-------|
| A — Traceability | 5 | PASS | All references present. Benefit Linkage is the strongest in E2 — directly states "this story directly delivers the self-service status view that P4 measures". |
| B — Scope integrity | 3 | PASS | Out of scope well-bounded: no editing, no custom dashboards, no real-time push (polling 60s noted), no Gantt/timeline, no historical trends. MEDIUM on `dodStatus` field scope (7-M1). |
| C — AC quality | 4 | PASS | 5 ACs in Given/When/Then format. AC3 "Awaiting implementation dispatch" is a clear, plain-language actionable status. AC4 (Markdown export) is testable. `dodStatus` field risk covered in MEDIUM above. "Trace findings" label borderline plain-language (LOW above). |
| D — Completeness | 5 | PASS | All mandatory fields. Named persona (programme manager), mechanism sentence, complexity 2, Stable, NFRs across 4 categories. Accessibility NFR explicitly notes colour-not-sole-indicator — correct for a status board. |
| E — Architecture | 3 | PASS | ADR-012: `getPipelineStatus` adapter named. ADR-003 correctly cited in Architecture Constraints (no new fields). MEDIUM finding: AC5 references `dodStatus` which is not in the known schema (7-M1). Security: per-repository access validation. |

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW.
**Outcome: PASS** — No HIGH findings. Resolve 7-M1 before /test-plan — `dodStatus` is either a new field (requiring a schema update story and epic scope review) or AC5 must be rewritten using derivable existing fields. The LOW (7-L1) is a plain language label refinement that can be addressed in the story fix or at test-plan time.
