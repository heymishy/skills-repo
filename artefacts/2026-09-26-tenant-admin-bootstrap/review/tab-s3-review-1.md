# Review Report: Retire the legacy admin-bootstrap path — Run 1

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s3.md
**Date:** 2026-09-28
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

<!-- None this run. -->

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category C (AC quality / internal consistency) — AC1 scopes the removal to `server.js`'s own wiring ("that wiring is fully removed from `server.js` — ... nothing in the running application reads, writes, or seeds it anymore"), but AC5's grep check requires zero matches for `getUserRole`/`setGetUserRole` across the entire `src/web-ui/` tree — which also requires removing those function *definitions* from `user-roles.js`, not just their wiring call site in `server.js`. AC1 as written doesn't say this explicitly. An implementer following AC1's literal text could do a partial removal (production wiring gone, function definitions still present in `user-roles.js`) that satisfies AC1 but fails AC5's grep, producing rework.
  Risk if proceeding: implementer confusion / a real round of rework once AC5's stricter check is run against an AC1-only implementation.
  To acknowledge: reword AC1 to explicitly cover both files — e.g. "...Then that wiring is fully removed from `server.js`, AND the `getUserRole`/`setGetUserRole` function pair is removed entirely from `user-roles.js` (not just its production wiring call)."

---

## LOW findings — note for retrospective

- **[1-L1]** Category D (Completeness) — Complexity Rating is set to 1 ("well understood, clear path"). Once 1-M1 is fixed and the removal surface is clarified as spanning two files (plus tracing and updating any test file that references the legacy wiring), Complexity 2 is a more honest rating than 1 — there is real removal-surface-mapping work, not zero ambiguity. Not blocking; a minor recalibration once 1-M1 is resolved.

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Category scores

| Criterion | Score | Pass/Fail | Justification |
|-----------|-------|-----------|----------------|
| Traceability | 5 | PASS | Parent epic, discovery, and benefit-metric all referenced; "So that" connects to a named metric with a real mechanism sentence; metric present in the coverage matrix. |
| Scope integrity | 5 | PASS | No epic/discovery out-of-scope items implemented; own Out of Scope section names 3 excluded items; no unapproved additions. |
| AC quality | 3 | PASS | All 5 ACs are well-formed Given/When/Then, independently testable, observable-behaviour-focused — but AC1/AC5's scope inconsistency (1-M1) is a real gap addressable with a reword, not a rewrite. |
| Completeness | 4 | PASS | All required fields populated; named persona; NFRs and scope stability present. Complexity-rating note (1-L1) keeps this from a clean 5. |
| Architecture compliance (E) | 5 | PASS | Architecture Constraints populated (3 items); no named guardrail, pattern, or anti-pattern violated; ADR-025 correctly addressed as unaffected. |
