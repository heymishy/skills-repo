# T2 Review — Run 1 (Haiku)

**Case ID:** T2  
**Domain:** Payment Platform DR  
**Model:** claude-haiku-4-5  
**Run:** 1  
**Mode:** Eval  
**Timestamp:** 2026-05-15

---

## FINDINGS

`1-H1` — **HIGH — Category A: Traceability / Broken architectural constraint reference**

The constraint propagation summary table claims "C2 present in S1.2 ✓" and "C2 present in S2.2 ✓", but neither story contains a C2 reference in its Architecture Constraints section.

- **S1.2 (Primary-to-standby database replication pipeline)** describes connecting the standby database to the CDE-scoped primary infrastructure — an explicit CDE expansion. Architecture Constraints lists C1 and C3 only. C2 (PCI DSS QSA gate) is absent despite this being a CDE-expanding architectural change.

- **S2.2 (Automated failover activation)** describes promoting the standby to live payment processor (AC3: "the standby payment processing service is set to `mode: active`...") — another explicit CDE expansion. Architecture Constraints lists C3 only, with no C2 reference.

By contrast, S1.1 correctly includes C2 as the primary QSA gate delivery story. The propagation table contradicts the story text, creating a traceability gap: if CDE-expanding stories (S1.2 and S2.2) lack C2 references, the C2 constraint is not fully propagated.

---

## SCORE

| Criterion | Score | Justification |
|-----------|-------|---|
| Traceability (A) | 2 | Propagation table claims C2 present in S1.2 and S2.2, but story text contains no C2 references. This is a broken reference — the audit trail does not match the artefact. Triggers HIGH threshold. |
| Scope integrity (B) | 5 | All stories remain within MVP boundary. Discovery out-of-scope items not violated. |
| AC quality (C) | 5 | All stories use Given/When/Then format with 3–4 testable ACs each. S2.2 ACs are well-formed and specific. |
| Completeness (D) | 5 | All template fields populated with substantive content. No blank or generic fields. |
| Architecture compliance (E) | 4 | Stories reference architectural patterns and constraints. S1.1 references ADR-019. Constraint propagation data is internally inconsistent, but individual story fields are complete. |

---

## VERDICT

**FAIL** ❌ — One HIGH finding on Category A blocks progression. The constraint propagation summary table must be corrected: C2 is not present in S1.2 and S2.2, or those stories must include C2 references in their Architecture Constraints sections.

---

## Signal

**Expected:** FAIL with HIGH on Category A (traceability / missing C2)  
**Detected:** FAIL with HIGH on Category A ✓  
**Signal match:** Pass
