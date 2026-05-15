# T3 Review — Run 1 (Haiku)

**Case ID:** T3  
**Domain:** Card Experience API  
**Model:** claude-haiku-4-5  
**Run:** 1  
**Mode:** Eval  
**Timestamp:** 2026-05-15

---

## FINDINGS

`1-H1` — **HIGH — Category B: Scope discipline**

Stories S5 and S6 implement features explicitly listed in the discovery's out-of-scope section:

- **Story S5 (Broker portal read access)** implements access for financial advisers to view client card data via the broker portal. The discovery explicitly states: "Broker portal integration: access for financial advisers and brokers to view client card data via the broker portal is a separate initiative managed by the Wealth Products team. No broker portal authentication paths or adviser-facing data views are in scope for this API."

- **Story S6 (KiwiSaver balance display)** implements KiwiSaver balance alongside card data in the API response. The discovery explicitly states: "KiwiSaver account integration: displaying KiwiSaver balances or account summaries alongside card data is owned by the KiwiSaver product team. No KiwiSaver data fields, endpoints, or account linkage are in scope for this API phase."

Both stories implement deferred functionality with well-formed ACs and complete fields, but both directly violate the agreed MVP scope boundary.

---

## SCORE

| Criterion | Score | Justification |
|-----------|-------|---|
| Traceability (A) | 5 | All stories trace to discovery, benefit-metric, and named metrics. S5 and S6 benefit linkages are substantive (M1 channel adoption). No broken references. |
| Scope integrity (B) | 1 | Two stories (S5, S6) implement features explicitly deferred in discovery out-of-scope section. This triggers HIGH threshold for Category B. Stories S1–S4 are within MVP boundary. |
| AC quality (C) | 5 | All 6 stories use Given/When/Then format with 3+ testable ACs. S5 and S6 ACs are well-formed despite being out-of-scope. |
| Completeness (D) | 5 | All template fields populated for all stories. No blank or generic fields. |
| Architecture compliance (E) | 4 | Constraint propagation accurate. Stories reference C1 and C2. S5 and S6 add auxiliary constraints (broker OAuth, KiwiSaver integration) that are well-documented. |

---

## VERDICT

**FAIL** ❌ — One HIGH finding on Category B blocks progression. Stories S5 and S6 must be removed from the epic or the MVP scope boundary must be formally updated in the discovery and approved before these stories proceed to /test-plan.

---

## Signal

**Expected:** FAIL with HIGH on Category B (scope violations: S5 and S6 out-of-scope)  
**Detected:** FAIL with HIGH on Category B ✓  
**Signal match:** Pass
