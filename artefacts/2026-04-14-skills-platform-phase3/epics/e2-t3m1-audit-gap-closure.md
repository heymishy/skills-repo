# Epic: T3M1 Audit Gap Closed (Q2–Q8)

**Discovery reference:** artefacts/2026-04-14-skills-platform-phase3/discovery.md
**Benefit-metric reference:** artefacts/2026-04-14-skills-platform-phase3/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

When this epic is complete, all five currently-unanswerable MODEL-RISK audit questions (Q2, Q5, Q6, Q7, Q8) can be answered by an independent non-engineering reviewer using only the trace and the repository — no engineering assistance required. The four new mandatory trace fields (`standardsInjected`, `watermarkResult`, `stalenessFlag`, `sessionIdentity`) are present in every regulated delivery trace and enforced by the gate. The tamper-evidence registry provides an attestation anchor outside the delivery repository, closing Q8.

## Out of Scope

- The independent review session itself (T3M1 CR1 metric) — this is a human-gated external action, not a story. Stories in this epic create the prerequisite evidence; the review is scheduled by the platform maintainer after this epic's stories are DoD-complete.
- Changes to MODEL-RISK.md content beyond adding the new trace field definitions — the reviewer fills in their verdicts during the independent review session.
- Estimation calibration or improvement agent changes — those are Epic E7.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — T3M1 audit question coverage | 3/8 (Q1, Q3, Q4 answered) | 8/8 | p3.2a adds Q2/Q5/Q6/Q7 trace fields; p3.2b adds Q8 tamper-evidence |
| CR1 — T3M1 independent validation on record | Not on record | 8/8 with reviewer name/role/date | These stories are the prerequisite for the independent review session |

## Stories in This Epic

- [ ] p3.2a — Add four mandatory T3M1 trace fields to schema and gate enforcement
- [ ] p3.2b — Implement tamper-evidence registry for traceHash (T3M1 Q8)

## Human Oversight Level

**Oversight:** High
**Rationale:** Touches the trace schema (`pipeline-state.schema.json`) and the assurance gate's merge-blocking logic. An error in gate enforcement could either block legitimate deliveries or fail to block missing evidence. T3M1 is a compliance-level obligation — errors here have audit consequences. Human review and a second-person check of all AC evidence is required before merge.

## Complexity Rating

**Rating:** 3
p3.2a is straightforward (schema + gate extension) but p3.2b (tamper-evidence registry) involves ASSUMPTION-02: the choice between GitHub Artifact Attestation (preferred) and a read-only registry repository (Bitbucket/Jenkins fallback). The implementation path depends on which option is confirmed. Consider a brief spike on p3.2b before DoR sign-off if ASSUMPTION-02 is not yet confirmed.

## Scope Stability

**Stability:** Unstable for p3.2b
The tamper-evidence approach is confirmed to two options (Artifact Attestation or read-only registry repo) but the implementation differs significantly. Scope is stable for p3.2a.
