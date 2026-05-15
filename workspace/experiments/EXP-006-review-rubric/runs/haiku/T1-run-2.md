# T1 Review — Run 2 (Haiku)

**Case ID:** T1  
**Domain:** Payment Platform DR  
**Model:** claude-haiku-4-5  
**Run:** 2  
**Mode:** Eval  
**Timestamp:** 2026-05-15

---

## FINDINGS

`1-H1` — **HIGH — Category C: AC quality**

Story S2.2 (Automated failover activation) contains three ACs written as "should" statements with no Given/When/Then structure:
- AC1: "The failover should complete quickly"
- AC2: "The system should handle load gracefully during failover"
- AC3: "Monitoring alerts should fire promptly when failover is activated"

None of these ACs have an observable, testable outcome. "Should" language without Given/When/Then structure and without measurable criteria (e.g., "within X seconds" or "at p99") violates the Category C HIGH threshold. Additionally, the single NFR ("Must comply with RTO requirements") has no specific value or test method — it is not measurable.

---

## SCORE

| Criterion | Score | Justification |
|-----------|-------|---|
| Traceability (A) | 5 | All stories trace to discovery, benefit-metric, and named metrics (M1, M2). No broken references. |
| Scope integrity (B) | 5 | All stories remain within MVP boundary. No out-of-scope deferences violated. |
| AC quality (C) | 2 | S1.1, S1.2, S2.1, S2.3 use GWT format with 3–4 testable ACs each. S2.2 contains 3 non-testable ACs in "should" language. Triggers HIGH threshold. |
| Completeness (D) | 3 | All stories have fields populated. S2.2 NFR is non-specific ("Must comply with RTO requirements" has no measurable target). |
| Architecture compliance (E) | 4 | Constraints referenced and propagated correctly. ADR-019 referenced. |

---

## VERDICT

**FAIL** ❌ — One HIGH finding on Category C blocks progression. Story S2.2 must be revised to convert all ACs to Given/When/Then format with specific, testable outcomes. The NFR must specify an exact RTO value (e.g., "≤ 4 hours").

---

## Signal

**Expected:** FAIL with HIGH on Category C (untestable ACs in S2.2)  
**Detected:** FAIL with HIGH on Category C ✓  
**Signal match:** Pass
