# /review — Corpus Case T2 — Payment Platform DR: Traceability (HIGH) — Trial 1

**Case:** T2-traceability-high
**Model:** claude-sonnet-4-6
**Trial:** 1

---

## FINDINGS

### 1-H1 — HIGH — Category A (Traceability) — Stories S1.2 and S2.2: C2 (PCI DSS QSA gate) absent from CDE-expanding stories

Discovery constraint C2 states: "PCI DSS QSA sign-off required before production failover activation — the DR system expands the Cardholder Data Environment (CDE) perimeter and must pass an external QSA assessment prior to production activation."

Story S1.1 (DR scope and architecture definition) explicitly documents this gate and states: "All subsequent stories that connect infrastructure to the CDE must include a reference to this QSA gate (ADR-019)." S1.1 is itself the C2 story — its presence in the set confirms the constraint exists.

Cross-checking C2 against each story that makes a CDE-expanding architectural change:

**Story S1.2 (Primary-to-standby database replication pipeline):** This story connects the standby database server to the CDE-scoped primary payments database — a direct CDE perimeter extension. S1.2's Architecture Constraints section lists C1 ("Replication traffic must be encrypted in transit using TLS 1.2 or above") and C3 ("Replication lag must not exceed 1 hour at any point"). C2 is absent. The story contains no reference to ADR-019, no PCI DSS sign-off condition, and no QSA gate.

**Story S2.2 (Automated failover activation):** This story activates the standby payment processor as the live CDE production system. AC3 explicitly sets the standby service to `mode: active` — this is the production CDE activation event that C2 was created to gate. S2.2's Architecture Constraints section lists only C3. C2 is absent. The story contains no reference to the QSA gate that must be satisfied before this activation can proceed.

**Constraint propagation summary table discrepancy:** The propagation table at the end of the definition artefact claims C2 is propagated to S1.2 (✓) and S2.2 (✓). This is contradicted by the story text in both cases. The story text is authoritative — the table cannot override the absence of a C2 reference in the story body. The table contains a false assertion that would cause a reviewer relying on it alone to miss the gap.

Stories S2.1, S2.3, and S1.1 do not require C2 (S2.1 explicitly notes "No new CDE-scoped systems introduced"; S2.3 is a runbook process story; S1.1 is the C2 definition story). Only S1.2 and S2.2 are affected.

Per SKILL.md Category A: a missing architectural constraint reference on a story that directly triggers the constraint condition is a HIGH threshold breach.

No other HIGH or MEDIUM findings.

---

## SCORE

| Criterion | Score | Pass/Fail | Notes |
|-----------|-------|-----------|-------|
| Traceability | 1 | FAIL | C2 absent from S1.2 and S2.2. Propagation table contradicts story text. Two CDE-expanding stories have no reference to the mandatory QSA gate. |
| Scope integrity | 5 | PASS | All stories implement features within the discovery MVP scope. No out-of-scope features detected. |
| AC quality | 5 | PASS | ACs across all five stories are well-formed GWT with specific, measurable outcomes. |
| Completeness | 4 | PASS | Benefit linkage, NFRs, complexity, scope stability, and effort estimates are populated across all stories. Minor: S2.3 benefit linkage is indirect. |

*Category E (Architecture compliance) — skipped. No architecture-guardrails.md provided in corpus bundle.*

---

## VERDICT

**FAIL — 1 criterion below threshold.**

Traceability = 1 (FAIL). S1.2 and S2.2 must include an explicit C2 reference in their Architecture Constraints sections, citing ADR-019 and the QSA sign-off condition, before this definition set is ready for /test-plan. The constraint propagation summary table must also be corrected to reflect actual story content rather than asserted coverage.
