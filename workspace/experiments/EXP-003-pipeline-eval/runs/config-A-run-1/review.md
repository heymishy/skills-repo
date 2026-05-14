# Review Report — Payment Authorisation Service DR Failover

**Feature:** 2026-05-14-payment-auth-dr-failover
**Review run:** 1
**Reviewer model:** claude-sonnet-4-6 (Config A)
**Date:** 2026-05-14
**Categories reviewed:** A (Traceability), B (Scope discipline), C (AC quality), D (Completeness), E (Architecture compliance)
**Stories reviewed:** 7 (Stories 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2)

---

## FINDINGS

### Story 1.1 — Secondary Site Capacity Validation

**1-M1 [MEDIUM]** — Traceability: Benefit-metric artefact not present (intentional EXP-003 experimental simplification). "So that..." clause references an observability goal but cannot be traced to a named metric in a benefit-metric artefact. Recommended action: acceptable for eval run; flag as known gap for non-experimental pipeline runs.

**1-M2 [MEDIUM]** — Completeness: Complexity rating and scope stability fields are absent (not present in the eval definition artefact). Required by the story template. Recommended action: annotate with complexity score (suggested: 2 — some ambiguity in capacity assessment scope) and scope stability (suggested: Stable — scope is bounded by the capacity assessment report).

**1-L1 [LOW]** — Completeness: Benefit linkage field is present in the "So that..." clause but not as a separate named field. The template expects a distinct "Benefit linkage" section. No rework required for eval; acceptable as-is.

### Story 1.2 — Secondary Site Provisioning for Active Payment Processing

**1-M3 [MEDIUM]** — Completeness: Complexity rating and scope stability absent. Suggested: complexity 2, scope stability Stable.

**1-L2 [LOW]** — AC quality: AC3 ("when a PCI DSS preliminary scoping exercise is conducted") describes an activity that depends on an external party (the QSA scoping exercise), making independent testability conditional. The AC is accepted as-is because the dependency is named and the test condition is explicit — but it does not meet the "independently testable" criterion in isolation.

### Story 1.3 — Transaction Data Replication to RPO Target

**1-L3 [LOW]** — AC quality: AC3 ("when the operations team queries the replication status dashboard") presupposes a dashboard exists. This is an implementation assumption embedded in an AC. Observable behaviour is correct (real-time lag visibility), but the mechanism is specified. Revise or accept: "then the current replication lag is observable in real time via a monitoring mechanism". Accepted as-is for eval purposes.

### Story 2.1 — Manual Failover Runbook

No HIGH findings. No MEDIUM findings.

**1-L4 [LOW]** — Completeness: Complexity rating and scope stability absent. Suggested: complexity 1 — well-understood problem space, though the runbook content depends on infrastructure that is not yet provisioned.

### Story 2.2 — Failover Drill Testing and RTO Validation

**1-M4 [MEDIUM]** — Completeness: Complexity rating and scope stability absent. Suggested: complexity 2, scope stability Stable.

**1-L5 [LOW]** — AC quality: AC4 references "Board Risk Committee receives the DR compliance evidence package" — this is a delivery/handoff action that is outside the scope of a test runner verification. The AC is arguably an acceptance event rather than a testable observable behaviour. Accepted as-is — this type of AC is common for compliance stories and the evidence package is the observable output.

### Story 3.1 — PCI DSS QSA DR Environment Assessment

No HIGH findings.

**1-M5 [MEDIUM]** — Completeness: Complexity rating and scope stability absent. Suggested: complexity 3 — QSA engagement timeline and finding severity are genuinely uncertain. Scope stability: Unstable — QSA findings may expand scope.

**1-M6 [MEDIUM]** — Scope discipline: Story 3.1 was flagged in the definition as not explicitly named in the discovery MVP scope — it was added via scope note as a required regulatory gate (C2). This is an approved scope addition. The scope note is present in the definition artefact. No rework required — confirming that the scope note is present and justified.

### Story 3.2 — AML/CFT Transaction Record Replication Audit

No HIGH findings.

**1-M7 [MEDIUM]** — Completeness: Complexity rating and scope stability absent. Suggested: complexity 2, scope stability Unstable — depends on findings from the replication audit, which may surface gaps requiring a separate remediation workstream.

**1-L6 [LOW]** — Scope note: Story 3.2 AC2 mentions "before go-live" as a hard gate for remediation of replication gaps. This implies a potential scope expansion (if gaps are found, the remediation workstream is not scoped in the current story set). The risk is acknowledged in the discovery Assumptions section (the AML gap is unconfirmed). Recommended: carry this as a risk in the DoR.

---

## SCORE SUMMARY

| Criterion | Score | Pass/Fail | Justification |
|-----------|-------|-----------|---------------|
| A — Traceability | 3 | PASS | Benefit-metric artefact absent (intentional eval simplification — known gap). Discovery linkage present in all stories via "So that..." clauses. Finding 1-M1 acknowledged. |
| B — Scope discipline | 5 | PASS | All stories stay within declared MVP scope. One scope addition (Story 3.1 — PCI DSS QSA) is approved via explicit scope note in the definition artefact and is justified by C2. |
| C — AC quality | 4 | PASS | All ACs are in Given/When/Then format with observable behaviour. Three low-severity notes (1-L2, 1-L3, 1-L5) — all accepted as-is. No "should" language. No sub-bullet edge cases. All stories have minimum 3 ACs. |
| D — Completeness | 3 | PASS | Complexity and scope stability fields absent across all stories (1-M2, 1-M3, 1-M4, 1-M5, 1-M7). All other template fields populated. No HIGH completeness issues. |
| E — Architecture compliance | 4 | PASS | Architecture-guardrails.md exists but governs the skills platform repository — not applicable to the payment authorisation service. Constraints C1-C5 appear in the Architecture Constraints field of all affected stories. C2 (PCI DSS) and C3 (AML/CFT) are correctly flagged as regulated in story 3.1 and 3.2 respectively. C5 (AML replication gap) appears in Story 1.3 and 3.2 Architecture Constraints. |

**Overall verdict:** PASS

**Findings summary:** 0 HIGH, 7 MEDIUM, 6 LOW

**HIGH findings:** None

**MEDIUM findings (acknowledge in /decisions if proceeding):**
- 1-M1: Benefit-metric absent (intentional eval simplification) — acceptable for EXP-003
- 1-M2, 1-M3, 1-M4, 1-M5, 1-M7: Complexity and scope stability absent from all 5 stories — should be added before formal DoR
- 1-M6: Story 3.1 scope addition confirmed present and justified by C2

**Constraint propagation check (preview — for CPF scoring at DoR stage):**

| Constraint | In discovery | In definition (Architecture Constraints / NFR) |
|-----------|-------------|------------------------------------------------|
| C1 — RTO/RPO Board policy | ✅ | ✅ Stories 1.1, 1.2, 1.3, 2.1, 2.2, 3.1 |
| C2 — PCI DSS QSA | ✅ | ✅ Stories 1.2, 1.3, 2.1, 2.2, 3.1 |
| C3 — AML/CFT 5-year retention | ✅ | ✅ Stories 1.3, 3.2 |
| C4 — Single Auckland DC | ✅ | ✅ Stories 1.1, 1.2 |
| C5 — AML replication gap | ✅ | ✅ Stories 1.3, 3.2 |

All 5 constraints (including C5 — the hidden element) propagated from discovery through definition. C2 and C3 (regulated) correctly flagged in regulatory compliance stories.

---

**VERDICT: PASS ✅ — Run 1**
0 HIGH | 7 MEDIUM (all acknowledged, none block progression) | 6 LOW

Ready to proceed to /test-plan.

<!-- eval-mode: true -->
