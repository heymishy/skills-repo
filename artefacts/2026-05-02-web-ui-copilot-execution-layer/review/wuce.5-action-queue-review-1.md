# Review Report: Personalised action queue — pending sign-offs and annotation requests — Run 1

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.5-action-queue.md
**Date:** 2026-05-02
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[5-M1]** [B — Scope / E — Architecture] — AC1 references artefact state as `status: approved, sign-off: pending` without specifying the source of truth for "pending" determination. Epic E2 out-of-scope explicitly prohibits new `pipeline-state.json` fields beyond those introduced in Epic 1. Two possible implementations exist: (a) the adapter queries artefact markdown content, checking for the presence or absence of an `## Approved by` section — no new schema fields required; or (b) a new `signOffStatus` field is added to `pipeline-state.json` — which conflicts with the epic constraint and requires a schema update per ADR-003. The story and the named adapter function `getPendingActions(userIdentity, token)` must declare which mechanism drives "pending" state detection, and must confirm no new `pipeline-state.json` fields are introduced.
  Fix: Add an Architecture Constraints bullet: "The `getPendingActions` adapter determines sign-off pending state by inspecting artefact markdown content (absence of `## Approved by` section) — not from a pipeline-state.json field, consistent with the Epic 2 no-new-schema-fields constraint."

---

## LOW findings — note for retrospective

None.

---

## Category Scores

| Category | Score | Pass/Fail | Notes |
|----------|-------|-----------|-------|
| A — Traceability | 5 | PASS | All references present. Benefit Linkage names P5 with a direct mechanism sentence (pending sign-offs visible at login reduces wait time). |
| B — Scope integrity | 3 | PASS | Out of scope well-bounded: push/email/Teams notifications, delegation, sorting/filtering, annotation queue items — all deferred. MEDIUM finding on sign-off state source of truth (5-M1) — does not block but must be resolved. |
| C — AC quality | 5 | PASS | 5 ACs in Given/When/Then format. Observable outcomes. AC5 error handling (expired token / lost repo access) has its own AC with a clear user-facing message. |
| D — Completeness | 5 | PASS | All mandatory fields. Named personas (business lead / SME reviewer), mechanism sentence, complexity 2, Stable, NFRs across all 4 categories. |
| E — Architecture | 3 | PASS | ADR-012 correctly applied (`getPendingActions` adapter named). Security: server-side repo access validation explicit. ADR-004 applied to repo list configuration with correct "or env var" hedge. MEDIUM on state source (5-M1). |

---

## Summary

0 HIGH, 1 MEDIUM, 0 LOW.
**Outcome: PASS** — No HIGH findings. Resolve or acknowledge 5-M1 before /test-plan to prevent the coding agent from introducing a new pipeline-state.json field that conflicts with the Epic 2 schema constraint.
