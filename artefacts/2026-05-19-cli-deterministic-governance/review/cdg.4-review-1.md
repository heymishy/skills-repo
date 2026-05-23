# Review Report: cdg.4 — Web UI gate-confirm CLI validation integration

**Story slug:** cdg.4
**Review run:** 1
**Review date:** 2026-05-24
**Reviewer:** GitHub Copilot (Claude Sonnet 4.6) — operator-directed review
**Feature:** 2026-05-19-cli-deterministic-governance
**Categories run:** A, B, C, D, E (all five)

---

## FINDINGS

### MEDIUM findings

**1-M1 — No NFR section (Completeness)**
The story does not include an NFR section. The template requires either populated NFRs or an explicit "None — confirmed" declaration. cdg.4 modifies a server-side route handler — there are lightweight security NFRs worth stating explicitly (input sanitisation, path traversal guard).
- **Line reference:** Story ends at "## Scope Stability — Stability: Stable." — no NFR section precedes this.
- **Recommended action:** Add `## Non-Functional Requirements` with a short security entry acknowledging the path traversal guard (already in AC4) and the input sanitisation mandatory constraint (already in Architecture Constraints). Operator has applied this fix inline before write.

### LOW findings

**1-L1 — AC1 describes internal call ordering (AC quality)**
AC1's "Then" clause reads: "validate(dorArtefactPath, 'definition-of-ready', repoRoot) is called before _pipelineStateWriter() is called." This describes internal call sequencing — a partially implementation-level observable. While the ordering IS the core safety invariant of this story (validate-before-write is the enforcement gap this story closes), the AC would be stronger if it described the externally observable consequence of the ordering (e.g., the state file is unchanged if validate fails, and changed only if validate passes), which is captured by AC2 and AC3 respectively. AC1 as written is verifiable by stub injection test but borders on testing implementation rather than behaviour.
- **Line reference:** AC1: "...Then `validate(dorArtefactPath, 'definition-of-ready', repoRoot)` is called before `_pipelineStateWriter()` is called."
- **Recommended action:** Consider supplementing with "and if validate exits non-zero, the state file is not modified" to make the Then clause observable. However, AC2 already covers this — AC1 can remain as the ordering-verification companion AC. Low severity.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 4 | PASS |
| D — Completeness | 3 | PASS |
| E — Architecture compliance | 5 | PASS |

**Traceability (5):** Epic, discovery, and benefit-metric references all present. "So that..." links to M2 by name and provides a specific mechanism sentence ("no pipeline-state.json stage advancement can occur through the web UI without a passing deterministic gate check"). Benefit linkage section explains the mechanism in detail. M2 exists in benefit-metric.md. No broken references.

**Scope integrity (5):** Web UI gate-confirm enforcement is explicitly in-scope for Phase 2. Story out-of-scope section correctly excludes trace (cdg.5), non-DoR gate types, frontend changes, and skills advance. Architecture constraints explicitly state "No frontend changes" ✓. No discovery out-of-scope items implemented.

**AC quality (4):** 8 ACs, all in Given/When/Then format. AC2 (422 + no state write), AC3 (200 + state written), AC4 (path traversal 400), AC6 (default stub throws), AC7 (non-DoR unaffected) describe observable external behaviour well. AC1 describes internal call ordering (finding 1-L1 — LOW). All ACs are independently testable via stub injection.

**Completeness (3):** User story uses As/Want/So with named persona ("platform operator") ✓. Benefit linkage populated ✓. Out of scope populated ✓. Complexity rated ✓. Scope stability declared ✓. NFR section missing (finding 1-M1 — MEDIUM). Score of 3 is borderline pass; field is addressable without story rework.

**Architecture compliance (5):** ADR-H7.1 explicitly referenced ✓. ADR-023 (disk canonicity) explicitly referenced ✓. D37 (injectable adapter, default-throws) explicitly referenced with code examples ✓. Path traversal guard (ougl) explicitly in Architecture Constraints ✓. "Mandatory constraint: All server-side inputs validated before use" stated ✓. All applicable active ADRs are respected. No anti-patterns.

---

## VERDICT

**Review PASSED ✅ — Run 1**

0 HIGH | 1 MEDIUM (1-M1 — missing NFR section — acknowledge in /decisions before proceeding to /test-plan) | 1 LOW (1-L1 — AC1 ordering detail)

Ready to run /test-plan for cdg.4.
