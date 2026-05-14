# Review Report — Payment Authorisation Service DR Failover

**Feature:** 2026-05-14-payment-auth-dr-failover
**Review run:** 1
**Reviewer model:** claude-sonnet-4-6 (Config B — Sonnet for /review per config matrix)
**Date:** 2026-05-14
**Categories reviewed:** A (Traceability), B (Scope discipline), C (AC quality), D (Completeness), E (Architecture compliance)
**Stories reviewed:** 7 (Stories 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2)
**Source artefacts:** `runs/config-B-run-1/discovery.md`, `runs/config-B-run-1/definition.md`

---

## FINDINGS

### Story 1.1 — Hamilton Capacity Validation for 100% Transaction Volume

**1-M1 [MEDIUM]** — Traceability: Benefit-metric artefact not present (intentional EXP-003 experimental simplification). The "So that..." clause references an observability goal ("rather than discovering capacity shortfalls at the first failover drill") but cannot be formally traced to a named metric in a benefit-metric artefact. Recommended action: acceptable for eval run; flag as known gap for any non-experimental pipeline run.

**1-M2 [MEDIUM]** — Completeness: Complexity rating and scope stability fields are absent from the definition artefact. Required fields by the story template. Suggested: complexity 2 (some ambiguity — capacity assessment outcome determines whether infrastructure remediation is needed and whether Story 1.2 can start on schedule), scope stability: Stable (bounded by the capacity assessment report).

**1-L1 [LOW]** — Completeness: "Benefit linkage" is embedded in the "So that..." clause rather than appearing as a distinct named field. The template expects a separate section. No rework required for eval; accepted as-is.

**Positive note (for CPF record):** C4 (single Auckland DC) is explicitly named and framed in the Architecture Constraints section, not just referenced in passing. C1 (RTO timing / lead-time risk on remediation) is propagated to the Architecture Constraints section — a non-obvious propagation path that is present here and was also present in Config A. C6 (100% volume at secondary) also appears explicitly — but C6 is a non-canonical constraint extracted by Opus from the follow-up context; see the CPF preview footnote below.

---

### Story 1.2 — Hamilton Provisioning for Active-Passive Payment Authorisation

**1-M3 [MEDIUM]** — Completeness: Complexity rating and scope stability absent. Suggested: complexity 2, scope stability Stable (Story 1.1 provides the baseline spec; scope is bounded by the provisioning runbook).

**1-L2 [LOW]** — AC quality: AC3 ("when a PCI DSS preliminary scoping exercise is performed") involves an activity dependent on an external party's participation. The AC describes observable compliance-documentation output (the scoping confirmation), which is correct and accepted. Not independently testable without the QSA party. Accepted as-is — QSA dependency is named explicitly in the AC and Architecture Constraints.

**1-L3 [LOW]** — Completeness: AC4 ("configuration-divergence register") creates a named artefact expectation that does not appear in the story's own Out of scope section. Minor — the register is clearly within scope of this story. Accepted as-is.

**Positive note (CPF):** C2 (PCI DSS) is propagated to AC3 (scoping exercise documentation), AC4 (configuration-divergence register for QSA), and the NFR section, with "PCI DSS CDE" named explicitly — not paraphrased. This is a stronger per-AC constraint framing than would be expected from a lower-tier model.

---

### Story 1.3 — Continuous Replication to Hamilton at RPO ≤ 15 Minutes (with AML-Scope Inclusion Guarantee)

**No HIGH findings.**

**1-L4 [LOW]** — AC quality: AC4 ("per-record-type replication health") presupposes a specific dashboard mechanism. Observable behaviour is correct (real-time per-type visibility); mechanism is an implementation prescription. Accepted as-is — the constraint (C3 + C5 per-record-type coverage) makes the specificity appropriate.

**Positive note (CPF):** This story carries the most significant CPF signal in the feature. Five distinct ACs each map to a constraint: AC1 (C1 RPO lag target), AC2 (C1 RPO simulated outage), AC3 (C3/C5 AML-scope sign-off gate with named compliance lead), AC4 (monitoring), AC5 (replication outage paging). The C5-targeting AC3 — requiring a written compliance-lead sign-off that every AML/CFT-scope record type is included — is an explicit closure mechanism for the hidden constraint, not just a passing reference. The constraint coverage chain is stronger here than in Config A's story 1.3, which carried the AML inclusion as an NFR rather than an explicit AC.

---

### Story 2.1 — Manual Failover Runbook Authored and Reviewed

**No HIGH findings. No MEDIUM findings.**

**1-L5 [LOW]** — Completeness: Complexity rating and scope stability absent. Suggested: complexity 1 (well-understood problem space; runbook authoring is standard procedure), scope stability: Stable.

**1-L6 [LOW]** — AC quality: AC4 ("consistent with PCI DSS access-control requirements — for QSA review in Story 3.1") adds a compliance framing note to a procedural AC. The framing is correct and appropriate given C2. It is however slightly unusual to cross-reference a future story in an AC body. Accepted as-is — the cross-reference aids traceability.

---

### Story 2.2 — Two Pre-Go-Live Failover Drills with RTO/RPO Evidence Package

**No HIGH findings.**

**1-M4 [MEDIUM]** — Completeness: Complexity rating and scope stability absent. Suggested: complexity 2, scope stability Stable.

**1-L7 [LOW]** — AC quality: AC5 ("cross-reference to the QSA letter and the AML audit confirmation") creates a coupling between this story's deliverable and Stories 3.1 and 3.2. This is the correct constraint propagation behaviour (the evidence package should cross-reference both regulatory gates), but it means AC5 cannot pass in isolation — it is dependency-contingent. Accepted as-is — the coupling is by design and correctly reflects the compliance evidence structure.

---

### Story 3.1 — PCI DSS QSA Assessment of the DR Environment Before Q3

**No HIGH findings.**

**1-M5 [MEDIUM]** — Completeness: Complexity rating and scope stability absent. Suggested: complexity 3 (QSA engagement timeline, potential Critical/High findings, and remediation scope are genuinely uncertain), scope stability: Unstable (QSA findings may expand scope).

**1-M6 [MEDIUM]** — Scope discipline: Story 3.1 is not listed as an explicit MVP scope item in the discovery brief ("secondary site failover capability", "manual failover procedure", "replication at RPO target" are the three MVP items). It is a required regulatory gate (C2) that was surfaced in the definition via the risk-first slicing strategy. The scope addition is justified by C2 and is explicitly noted in the definition's scope accumulator. Confirmed: scope note is present and justified. No rework required — confirming the scope note is present and correctly traced.

**Positive note (CPF):** AC4 ("absence of a current QSA letter is a hard go-live block") explicitly embeds the C2 constraint as an operational gate in the change-approval process, not just as a documented requirement. This is a stronger propagation form than a constraint appearing only in the NFR section — it makes the constraint enforceable at go-live.

---

### Story 3.2 — Independent AML/CFT Replication Completeness Audit (Closes Internal Audit Finding)

**No HIGH findings.**

**1-M7 [MEDIUM]** — Completeness: Complexity rating and scope stability absent. Suggested: complexity 2, scope stability: Unstable (depends on audit findings — if gaps are confirmed in AC2, a remediation workstream is triggered).

**1-L8 [LOW]** — Scope: AC2 ("un-remediated gaps are an explicit go-live blocker") implies a potential remediation workstream if replication gaps are found. This workstream is not scoped in the current story set. The risk is acknowledged in the discovery Assumptions section (C5 is flagged as unverified). Carried forward to DoR risk register.

**Positive note (CPF):** This story directly targets the C5 hidden constraint via AC1 (5-year window audit scope), AC2 (gap quantification with mandatory remediation), AC3 (written confirmation of full coverage), and AC4 (formal audit-register closure with the open internal audit finding explicitly named). The discovery's hidden constraint is explicitly closed — not just mentioned — by AC4. This is the strongest C5 closure mechanism available at story level.

---

## SCORE SUMMARY

| Criterion | Score | Pass/Fail | Justification |
|-----------|-------|-----------|---------------|
| A — Traceability | 3 | PASS | Benefit-metric artefact absent (intentional EXP-003 simplification — known gap, 1-M1). Discovery linkage present in all stories via "So that..." clauses and Architecture Constraints. Epic structure explicit. |
| B — Scope discipline | 5 | PASS | All stories stay within declared MVP scope. Story 3.1 scope addition (C2 regulatory gate) is approved via explicit scope note in the definition's scope accumulator. 0 unauthorised additions. |
| C — AC quality | 4 | PASS | All ACs are in Given/When/Then format with observable behaviour. Three low-severity notes (1-L2, 1-L4, 1-L7) — all accepted as-is. No "should" language found. All stories have ≥ 3 ACs (Story 1.3: 5, Story 2.2: 5). |
| D — Completeness | 3 | PASS | Complexity and scope stability absent across all 7 stories (1-M2, 1-M3, 1-M4, 1-M5, 1-M7). All other template fields populated with substantive content. User story format, persona, Architecture Constraints, NFR, Out of scope all present and specific. |
| E — Architecture compliance | 4 | PASS | `.github/architecture-guardrails.md` governs the skills platform repo — not applicable to payment authorisation infrastructure. C1–C5 (canonical) appear explicitly in Architecture Constraints of all affected stories. C6 (non-canonical — Opus-extracted from follow-up context) also appears throughout and is correctly framed. C2 (PCI DSS) and C3 (AML/CFT Act) are retained with named regulatory clauses and retention period (5 years) throughout — no paraphrase loss. C5 (AML replication gap) is present in Stories 1.3 and 3.2 Architecture Constraints. |

**Overall verdict: PASS**

**Findings summary:** 0 HIGH, 7 MEDIUM, 8 LOW

**HIGH findings:** None.

**MEDIUM findings (acknowledge in /decisions if proceeding):**
- 1-M1: Benefit-metric absent (intentional eval simplification) — acceptable for EXP-003
- 1-M2, 1-M3, 1-M4, 1-M5, 1-M7: Complexity and scope stability absent across all stories — add before formal DoR sign-off in a production run
- 1-M6: Story 3.1 scope addition confirmed present, traced to C2, and justified in the definition scope accumulator

---

## Constraint propagation check (CPF preview — for evaluator scoring)

| Constraint | In discovery | In definition (Architecture Constraints / NFR / ACs) | Notes |
|-----------|-------------|------------------------------------------------------|-------|
| C1 — RTO/RPO Board policy | ✅ | ✅ Stories 1.1 (timing risk), 1.2 (RTO budget), 1.3 (AC1, AC2, AC4, AC5), 2.1 (AC3 90-min estimate), 2.2 (AC1, AC2, AC4), 3.1 (timing risk) | C1 propagated to 6 of 7 stories |
| C2 — PCI DSS QSA (regulated) | ✅ | ✅ Stories 1.1 (NFR), 1.2 (AC3, AC4, NFR), 1.3 (NFR security), 2.1 (AC4, NFR), 2.2 (drill harness data), 3.1 (entire story, AC4 hard gate) | "PCI DSS" and "QSA" named verbatim in all cases — no paraphrase |
| C3 — AML/CFT Act 5-year retention (regulated) | ✅ | ✅ Stories 1.3 (AC3 sign-off gate, NFR), 3.2 (entire story) | "AML/CFT Act", "5-year", "secondary-site replication" named verbatim — no paraphrase |
| C4 — Single Auckland DC | ✅ | ✅ Stories 1.1 (eliminates C4), 1.2 (operationally eliminates with 1.3) | Correctly framed as constraint to be eliminated |
| C5 — AML replication gap (hidden) | ✅ | ✅ Stories 1.3 (AC3 — compliance-lead sign-off gate on AML-scope inclusion), 3.2 (AC1–AC4 — 5-year audit + formal audit-register closure) | **Strongest C5 closure in this feature:** AC3 of 1.3 is a by-design inclusion guarantee; AC4 of 3.2 is the formal audit-register closure naming the open internal finding. C5 is closed in two stages (design guarantee → independent audit) |
| C6 — 100% volume at secondary _(non-canonical)_ | ✅ Surfaced in discovery from follow-up context | ✅ Stories 1.1, 1.2, 1.3, 2.2 | Propagated fully — but not part of the canonical S1 inventory. Not counted in CPF denominator. |

**CPF (canonical): 5/5 = 1.0.** All constraints in the canonical S1 evaluator inventory (C1–C5) are propagated. Regulated constraints (C2, C3, C5) named with statutory language intact throughout. C5 propagation is two-stage and explicitly targets audit closure — the strongest form of C5 treatment observed in this corpus.

**Depth-of-extraction note (C6):** Opus additionally extracted C6 (100% transaction volume at secondary — no partial routing) from the follow-up context and elevated it to a named constraint. This was not in the canonical S1 inventory. Sonnet (Config A) did not extract this additional constraint. C6 is fully propagated through all five pipeline stages. This is recorded in the EXP-003 scorecard as a qualitative depth-of-extraction finding, not a CPF win.

---

**VERDICT: PASS ✅ — Run 1**
0 HIGH | 7 MEDIUM (all acknowledged, none block progression) | 8 LOW

Ready to proceed to /test-plan.

```json
{
  "skill": "review",
  "caseId": "S1",
  "model": "claude-sonnet-4-6",
  "config": "B",
  "completedAt": "2026-05-14T00:00:00Z",
  "artefactPath": "workspace/experiments/EXP-003-pipeline-eval/runs/config-B-run-1/review.md",
  "verdict": "PASS",
  "highFindings": 0,
  "mediumFindings": 7,
  "lowFindings": 8,
  "constraintsPropagated": ["C1", "C2", "C3", "C4", "C5"],
  "extraConstraintsExtracted": ["C6 — 100% volume at secondary (Opus-extracted from follow-up context; not in canonical S1 inventory)"],
  "cpfPreview": "5/5 canonical (incl. C5 hidden — two-stage closure); +1 non-canonical C6 (Opus depth-of-extraction)",
  "dimensionsScored": null
}
```

<!-- eval-mode: true -->
