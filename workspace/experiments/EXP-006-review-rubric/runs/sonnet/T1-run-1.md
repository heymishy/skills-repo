# /review — Corpus Case T1 — Payment Platform DR: AC quality (HIGH) — Trial 1

**Case:** T1-ac-quality-high
**Model:** claude-sonnet-4-6
**Trial:** 1

---

## FINDINGS

### 1-H1 — HIGH — Category C (AC quality) — Story S2.2: Automated failover activation

Story S2.2 is the primary delivery mechanism for Metric M1 (RTO ≤ 4 hours). All three ACs fail the GWT requirement and state outcomes that are not observable or testable:

- AC1: "The failover should complete quickly." — No Given/When/Then structure. "Quickly" is not a measurable criterion. There is no specified threshold, no precondition, no triggering action.
- AC2: "The system should handle load gracefully during failover." — No Given/When/Then structure. "Handle load gracefully" is not an observable, testable outcome. No load level or behaviour is specified.
- AC3: "Monitoring alerts should fire promptly when failover is activated." — No Given/When/Then structure. "Promptly" is not a measurable criterion. No alert name, threshold, or timing value is provided.

The single NFR for this story reads "Must comply with RTO requirements." This is a vacuous statement — it names no RTO value, defines no test method, and cannot be verified independently. Discovery constraint C3 specifies RTO ≤ 4 hours; that value must be carried into the story's NFR.

Per SKILL.md Category C: absence of GWT structure across all ACs is a HIGH threshold breach. A story whose entire AC set is composed of untestable "should" statements cannot be verified by a test plan and must be rewritten before moving to /test-plan.

All other stories in the set (S1.1, S1.2, S2.1, S2.3) have well-formed GWT ACs with specific, measurable outcomes. The defect is localised to S2.2.

No other HIGH or MEDIUM findings.

---

## SCORE

| Criterion | Score | Pass/Fail | Notes |
|-----------|-------|-----------|-------|
| Traceability | 4 | PASS | Discovery reference, benefit metric, and story-level benefit linkage all present. S2.2's "So that" clause references "the RTO window" without naming the metric explicitly — minor. All other stories name M1/M2 directly in benefit linkage. |
| Scope integrity | 5 | PASS | All stories implement features within the discovery MVP scope. No out-of-scope features detected. |
| AC quality | 1 | FAIL | S2.2 ACs are untestable "should" statements with no GWT structure and no measurable outcomes. Three of three ACs fail. |
| Completeness | 3 | PASS | S2.2 NFR "Must comply with RTO requirements" lacks a specific value — addressable (replace with "RTO ≤ 4 hours at p95" per discovery constraint C3). All other completeness fields populated across all stories. |

*Category E (Architecture compliance) — skipped. No architecture-guardrails.md provided in corpus bundle.*

---

## VERDICT

**FAIL — 1 criterion below threshold.**

AC quality = 1 (FAIL). Story S2.2 must have all three ACs rewritten in Given/When/Then format with specific, testable outcomes before this definition set is ready for /test-plan. The NFR must also be updated to state the RTO target value. All other criteria pass.
