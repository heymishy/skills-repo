# T1 Review — Run 1 (Haiku)

**Case ID:** T1  
**Domain:** Payment Platform DR  
**Model:** claude-haiku-4-5  
**Run:** 1  
**Mode:** Eval  
**Timestamp:** 2026-05-15

---

## FINDINGS

`1-H1` — **HIGH — Category C: AC quality**

Story S2.2 (Automated failover activation) contains 3 ACs written as implementation-language "should" statements with no Given/When/Then structure and no observable, testable outcomes:
- AC1: "The failover should complete quickly." — No specific time window, no observed state change, not testable.
- AC2: "The system should handle load gracefully during failover." — No definition of "gracefully", no measurable outcome, not testable.
- AC3: "Monitoring alerts should fire promptly when failover is activated." — No threshold for "promptly", not independently testable.

Additionally, S2.2's sole NFR ("Must comply with RTO requirements") lacks a specific time value or test method, rendering the entire story untestable against the metric M1 it claims to deliver.

---

## SCORE

| Criterion | Score | Justification |
|-----------|-------|---|
| Traceability (A) | 5 | All stories trace to discovery, benefit-metric, and named metrics (M1, M2). No broken references. |
| Scope integrity (B) | 5 | All stories align with MVP scope and discovery boundary. No out-of-scope deferences violated. |
| AC quality (C) | 2 | S2.2 fails the Given/When/Then requirement. Three "should" statements with no observable outcomes trigger HIGH threshold. Stories S1.1, S1.2, S2.1, S2.3 are well-formed. |
| Completeness (D) | 3 | All template fields populated except S2.2 NFR ("Must comply with RTO requirements") is non-specific. Other stories complete. |
| Architecture compliance (E) | 4 | Stories reference C1, C2, C3 constraints and propagate them correctly. S1.1 references ADR-019. Constraint propagation table is accurate. |

---

## VERDICT

**FAIL** ❌ — One HIGH finding on Category C blocks progression to /test-plan. Story S2.2 ACs must be rewritten in Given/When/Then format with specific, observable outcomes and measurable time targets.

---

## Signal

**Expected:** FAIL with HIGH on Category C  
**Detected:** FAIL with HIGH on Category C ✓  
**Signal match:** Pass
