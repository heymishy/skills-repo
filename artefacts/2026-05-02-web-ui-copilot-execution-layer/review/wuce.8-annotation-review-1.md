# Review Report: Annotation and comment on artefact sections — Run 1

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.8-annotation.md
**Date:** 2026-05-02
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[8-M1]** [C — AC quality] — AC1's activation trigger "hover over or click a section heading" is not keyboard-accessible in isolation. Mouse hover does not have a keyboard equivalent; an implementing agent satisfying AC1 literally could render a hover-only affordance that fails WCAG 2.1 AA — directly contradicting the NFR. The AC and NFR are in tension.
  Fix: Replace "hover over or click a section heading" with "activate the annotation control for a section heading (via mouse hover, keyboard focus, or click)" to ensure the AC itself requires keyboard accessibility — not just the NFR prose.

- **[8-M2]** [C — AC quality / E — Architecture] — No AC covers the GitHub Contents API 409 conflict scenario for annotation commits. wuce.3 uses the same write-back mechanism and has a dedicated conflict AC (AC5: "Given the GitHub Contents API returns a conflict error … When the sign-off commit fails, Then the user is shown a clear 'Artefact was updated — please reload' message"). wuce.8 reuses the same `commitAnnotation` adapter writing to the same artefact file — concurrent edits or stale page state will produce a 409. Without a testable AC, the coding agent has no contract for this error path.
  Fix: Add AC6: "Given the GitHub Contents API returns a conflict error (the artefact file was updated since the page loaded), When the annotation commit fails, Then the user is shown a clear message to reload the artefact and retry — no annotation data is silently lost or partially committed."

---

## LOW findings — note for retrospective

None.

---

## Category Scores

| Category | Score | Pass/Fail | Notes |
|----------|-------|-----------|-------|
| A — Traceability | 5 | PASS | All references present. Benefit Linkage names P3 with mechanism sentence (attribution record extended from sign-offs to review contributions). |
| B — Scope integrity | 5 | PASS | Out of scope well-bounded: reply/threading, delete/edit, line-level granularity, approval workflows — all deferred. The append-only constraint in Phase 1 is clearly stated. |
| C — AC quality | 3 | PASS | 5 ACs in Given/When/Then format. AC4 (HTML script tag sanitisation) and AC5 (length limit enforcement) are well-specified with observable server-side outcomes. Two MEDIUMs on AC1 keyboard accessibility (8-M1) and missing 409 conflict AC (8-M2). |
| D — Completeness | 5 | PASS | All mandatory fields. Named persona (SME reviewer), mechanism sentence, complexity 2, Stable. Audit NFR explicitly enumerates logged fields (user ID, artefact path, section heading, timestamp) — the most detailed audit specification in E2. |
| E — Architecture | 4 | PASS | `commitAnnotation(artefactPath, sectionHeading, annotationText, token)` adapter named with full signature. Security: sanitisation + max length + user identity constraints all explicit. ADR-012 correctly applied. Missing 409 conflict contract (8-M2). |

---

## Summary

0 HIGH, 2 MEDIUM, 0 LOW.
**Outcome: PASS** — No HIGH findings. Resolve both MEDIUMs before /test-plan: 8-M1 (keyboard accessibility gap in AC1) and 8-M2 (missing 409 conflict AC — same error path that wuce.3 covers explicitly). These are the most substantive findings in E2 for a story that introduces a new write-back path.
