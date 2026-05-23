# Review Report: cdg.5 — Chain-hash trace emission on gate-confirm

**Story slug:** cdg.5
**Review run:** 1
**Review date:** 2026-05-24
**Reviewer:** GitHub Copilot (Claude Sonnet 4.6) — operator-directed review
**Feature:** 2026-05-19-cli-deterministic-governance
**Categories run:** A, B, C, D, E (all five)

---

## FINDINGS

### MEDIUM findings

**1-M1 — No NFR section (Completeness)**
The story does not include an NFR section. The template requires either populated NFRs or an explicit "None — confirmed" declaration. cdg.5 appends to a file on every gate-confirm success — there is a lightweight integrity NFR worth stating (append-only, never overwrite).
- **Line reference:** Story ends at "## Scope Stability — Stability: Stable." — no NFR section precedes this.
- **Recommended action:** Add `## Non-Functional Requirements` noting the append-only integrity constraint (already in Architecture Constraints as "MUST use fs.appendFileSync") and test isolation requirement. Operator has applied this fix inline before write.

### LOW findings

**1-L1 — AC8 test coverage list skips AC5 (AC quality)**
AC8 states test coverage must include "AC1 (trace entry written on success), AC2 (chain hash correct for N>1 entries), AC3 (first entry uses empty prior hash), AC4 (no trace on validation failure), AC6 (default stub throws)." AC5 (injectable adapter via `setWriteTrace(fn)`) is omitted from the AC8 coverage list. AC5 is a distinct, independently testable behaviour that should be explicitly covered.
- **Line reference:** AC8: "covering at minimum: AC1...AC4, AC6..." — no AC5.
- **Recommended action:** Add AC5 to the AC8 coverage list. Low severity — the test file spec is advisory; the implementation agent should cover AC5 regardless.

**1-L2 — ADR-013 not referenced (Architecture compliance)**
ADR-013 (Active) establishes the Phase 4 enforcement architecture: "shared 3-operation governance package (`resolveAndVerifySkill`, `evaluateGateAndAdvance`, `writeVerifiedTrace`) is the contract all surface adapters call." cdg.5 wires `governance-package.writeTrace()` from the same module — this is directionally consistent with ADR-013 (Phase 2's `writeTrace` is the predecessor to Phase 4's `writeVerifiedTrace`), but ADR-013 is not referenced in Architecture Constraints. A future engineer looking at cdg.5 would not see the Phase 4 lineage without it.
- **Line reference:** Architecture Constraints section — no ADR-013 reference.
- **Recommended action:** Add a note: "ADR-013 compatibility: Phase 2's writeTrace is the Phase 4 writeVerifiedTrace predecessor — this story adds chain hashing that Phase 4 will extend, not replace." Low severity; ADR-013 is not violated, only un-referenced.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 4 | PASS |
| D — Completeness | 3 | PASS |
| E — Architecture compliance | 4 | PASS |

**Traceability (5):** Epic, discovery, and benefit-metric references all present. "So that..." links to both M2 and T3M1 by name. Benefit linkage section explains the auditor query mechanism (count trace events vs state advancement events — any gap is a bypass). Both M2 and T3M1 exist in benefit-metric.md. No broken references.

**Scope integrity (5):** Chain-hash trace is explicitly in-scope for Phase 2 in the discovery MVP. Story out-of-scope section correctly excludes `skills emit-trace` CLI subcommand, `skills verify-trace`, non-DoR gate trace, rotation/archiving, and HSM identity. No discovery out-of-scope items implemented.

**AC quality (4):** 8 ACs, all in Given/When/Then format. AC1 (trace entry written), AC2 (chain hash correct), AC3 (first entry empty prior hash), AC4 (no trace on failure), AC5 (injectable), AC6 (default throws), AC7 (gitignore) all describe observable behaviour clearly. AC8 coverage list omits AC5 (finding 1-L1 — LOW). All ACs independently testable.

**Completeness (3):** User story uses As/Want/So with named persona ("platform operator") ✓. Benefit linkage populated ✓. Out of scope populated ✓. Complexity rated ✓. Scope stability declared ✓. NFR section missing (finding 1-M1 — MEDIUM).

**Architecture compliance (4):** ADR-023 (disk canonicity) explicitly referenced ✓. D37 (injectable adapter, default-throws) with code examples ✓. Append-only constraint stated ✓. `governance-package.writeTrace()` as canonical implementation stated ✓. ADR-013 not referenced despite being applicable (finding 1-L2 — LOW). Score 4 (minor omission, no violation).

---

## VERDICT

**Review PASSED ✅ — Run 1**

0 HIGH | 1 MEDIUM (1-M1 — missing NFR section — acknowledge in /decisions before proceeding to /test-plan) | 2 LOW (1-L1 — AC8 skips AC5; 1-L2 — ADR-013 not referenced)

Ready to run /test-plan for cdg.5.
