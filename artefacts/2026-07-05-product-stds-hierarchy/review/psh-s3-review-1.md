# Review Report: psh-s3 — Product creation flow (hybrid form + AI draft + review) — Run 1

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s3.md
**Date:** 2026-07-05
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M2]** Category C — AC1 trigger condition is under-specified. The text reads: "when they submit the creation form with at minimum a product name". The discovery clarification log states the form has three fields: name, tech stack, and constraints. "At minimum a product name" implies the other fields are optional but does not name them, leaving it ambiguous which fields are required for draft generation to trigger and which are optional. A test author cannot write a complete test for AC1 without knowing the full form contract. Recommended action: revise AC1 to enumerate the form fields explicitly — e.g. "when they submit the creation form with product name (required), tech stack (optional), and constraints (optional)".

- **[1-M3]** Category E — Architecture Constraints references "ADR-020 (`req.session.accessToken` canonical)" — this ADR ID does not appear in `.github/architecture-guardrails.md`. The Active ADRs section lists ADR-001 through ADR-024; there is no ADR-020. The `req.session.accessToken` canonical field requirement is from `CLAUDE.md` directly (Coding standards section), not a numbered repo-level ADR. Referencing a non-existent ADR ID creates a broken pointer. Recommended action: replace "ADR-020" with "CLAUDE.md (Coding standards — req.session.accessToken canonical)" or create ADR-020 in architecture-guardrails.md if the intent is to promote this rule to a repo-level ADR.

---

## LOW findings — note for retrospective

None.

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 3 | PASS |
| D — Completeness | 5 | PASS |
| E — Architecture compliance | 4 | PASS |

**A — Traceability (5):** All three reference links present. "So that" names M1 with the specific target (≥70%). Benefit linkage contains a mechanism sentence (product_created PostHog event + M1 calculation). M1 appears in the coverage matrix for this story.

**B — Scope integrity (5):** Out-of-scope section enumerates four concrete exclusions (reference upload, context editing after creation, deletion, architecture-guardrails editing UI). No discovery out-of-scope items are implemented. Solo plan enforcement (AC4, AC5) is an MVP scope item from the discovery clarification log.

**C — AC quality (3):** AC1 trigger condition is under-specified (1-M2). AC2–AC8 are well-formed Given/When/Then with specific observable behaviours (HTTP status codes, PostHog event properties, error response bodies). AC4 and AC5 correctly split plan enforcement into two scenarios. AC6 and AC7 cover the same security surface (XSS and path traversal) as independent ACs. AC8 (D37 wiring) is testable. Minimum 3 ACs: satisfied (8 ACs; AC1 is addressable without rework — only the trigger condition needs tightening).

**D — Completeness (5):** All template fields populated. Named persona ("product owner/operator"). Benefit linkage with mechanism sentence. Out of scope with real exclusions. NFRs with performance (30s AI timeout) and security. Complexity 3 (highest in feature — justified). Scope stability Stable.

**E — Architecture compliance (4):** D37, MC-SEC-01, path traversal guard, ADR-011 all correctly referenced. ADR-022/023 not applicable (this is product creation, not skill session orchestration — correctly omitted). Non-existent "ADR-020" reference is a broken pointer (1-M3); the constraint itself is correct, only the ID is wrong.

---

**Verdict:** PASS — all criteria scored 3 or above. 0 HIGH, 2 MEDIUM (AC1 form field specification gap; non-existent ADR-020 reference — both addressable without story rework), 0 LOW.
