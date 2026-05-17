# AQ Score: Credit Risk Model Retraining — S12 Config A

**Run:** EXP-008-corpus-breadth-eval / Config A / S12
**Date scored:** 2026-05-18
**Judge model:** claude-sonnet-4-6 (separate judge session)
**AQ status:** confirmed
**AQ (validated):** 0.90
**Prior status:** requires_judge_scoring (self-score invalid — same-session artefact production)

---

## AQ Score — S12 — Config A

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Problem framing | 2 | Discovery names both a regulatory gap (C5 MRM Policy v2.0 version mismatch — [BLOCKER], C1 FMA fairness methodology misalignment, C3 CCCFA responsible lending, C4 explainability) and a business/performance gap (Gini degraded from 0.71 to 0.63, below MRM Policy v2.0 Part 3.1(a) threshold of 0.65); personas carry scoped role titles (Head of Retail Credit / CRO, Legal Counsel, Internal MRM validation team reporting to CRO, MRM Committee Chair); success indicators include measurable conditions (Gini ≥ 0.71, 5pp disparity trigger, 18–26 week revised timeline). |
| Scope discipline | 2 | MVP scope is bounded by four sequential governance obligations in discovery; definition Step 4a explicitly names five out-of-scope items (decision threshold changes, lending product terms, CRMP-MOD-002/003 retraining, consumer communications, CRMP infrastructure changes); scope accumulator confirms zero drift across seven stories in four epics. |
| Story testability | 1 | Governance-process ACs require human verification of document content and signatory authority rather than coding-agent or automated test execution: Story 2.1 AC2 (independent validation report must address six MRM Policy v2.0 Part 2.2 areas by content), Story 1.2 AC1 (Legal Counsel opinion scope review), Story 2.2 AC2 (committee meeting minutes documentation) — these are precise but human-executed, the same rubric structural gap as S13 Config A; no vague qualifiers (appropriate/adequate/user-friendly) are present. |
| NFR specificity | 2 | All four NFRs carry specific measurable thresholds: T-NFR-001 (batch scoring ≤ 4 hours / 500,000 accounts), T-NFR-002 (pre-flight check ≤ 5 seconds), T-NFR-003 (fairness library pinned to specific minor version, consistent with FAR methodology section), T-NFR-004 (explanation generation ≤ 150% baseline per-account time); FMA 2024 Algorithmic Fairness Framework clause references appear in functional tests T-FAIR-001 to T-FAIR-006 with specific thresholds (5pp, 5 characteristics, 3 metrics), not as generic regulatory label statements. |
| DoR gate quality | 2 | DoR regulated constraint gate summary table names a distinct specific role title for all five governance gates (Head of Model Risk for C1/C2, CRO/Head of Model Risk for C2, Legal Counsel for C3/C4, Legal Counsel + Head of Customer Experience for C4, MRM Committee Chair for C5), satisfying the named responsible party criterion; adversarial cases cover failure modes including T-IV-005 (FAR revision triggered by material validation error), T-MRM-004 (staging blocked on empty approval reference), and T-DEPLOY-001 (five pre-flight cases — each governance gate field independently empty). |

**AQ raw: 9/10 = 0.90**
**Confirmed AQ: 0.90**

### Scoring notes

Story testability is the only dimension below 2 and follows the established compliance-governance-delivery pattern (S13 Config A: same score {2,2,1,2,2}, same reason). The governance ACs are precise — they cite specific MRM Policy clauses (Part 2.2 six areas by name), specific CCCFA sections (ss. 9C, 9I, s.17), specific document format requirements (FAR-YYYY-xxx, MRM-YYYY-QX-NNN) — but verifying that an independent validation report genuinely addresses the six areas requires a human reader, not a coding agent. This is a rubric structural gap for compliance-delivery stories, not a vague-language failure; no close call on this dimension. NFR specificity is unambiguously 2: no FMA 2024 clause appears as a label-only statement in the NFR section; all four NFRs carry numeric thresholds. DoR gate quality is unambiguously 2: unlike S2, S8, and S9 Config A (all scored 1 for absent or team-level responsible parties), this DoR's gate table and deployment flags table each name a specific role title for every gate — this is the clearest Config A DoR gate quality 2 seen in the series for a complex regulated scenario.

---

## Self-score reference (invalid — for comparison only)

| Dimension | Self-score | Judge score | Delta |
|-----------|-----------|-------------|-------|
| Problem framing | — | 2 | — |
| Scope discipline | — | 2 | — |
| Story testability | — | 1 | — |
| NFR specificity | — | 2 | — |
| DoR gate quality | — | 2 | — |
| **Total** | **null** | **9/10 = 0.90** | — |

(Self-score was null — invalid same-session scoring per EXP-008 judge protocol.)

---

## Score pattern note

AQ 0.90 {2,2,1,2,2} matches Config A S13 (the only other EXP-008 Config A story at this complexity tier to score 2 on DoR gate quality). The pattern confirms: complex regulated compliance-delivery stories score 1 on story testability due to human-process governance ACs, and score 2 on DoR gate quality only when the DoR explicitly names role titles per gate. S12 is the second Config A story to achieve DoR gate quality 2 (after S13), and the first MRM/credit-model governance story in the corpus to do so.

---

## C5 surfacing assessment (judge confirmation)

**C5 surfaced:** YES (partial — injection-aided)
**C5 excluded from H3 validation:** YES

EA registry CRMP-RISK-001 directly named the team's policy version gap (CRITICAL flag: team following pre-2023 process; independent validation not in scope). Model could answer `c5_surfaced` without inference. Classified consistent with S9 precedent. MRM Policy excerpt (Part 3.2 retraining = new deployment) was within permitted signal level. C5 surface quality: partial.
