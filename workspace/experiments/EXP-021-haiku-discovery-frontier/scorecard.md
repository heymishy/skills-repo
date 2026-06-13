# Scorecard — EXP-021-haiku-discovery-frontier

Generated: 2026-06-13T06:28:10.326Z
Judge model: claude-sonnet-4-6

## Summary

| Skill | Case | Model | Trials | Avg Score | Pass Rate | Compliant | Est. Cost |
|-------|------|-------|--------|-----------|-----------|-----------|-----------|
| discovery | S13 | claude-haiku-4-5 | 2 | 0.335 | 0/2 | NO | $0.019 |
| discovery | S4 | claude-haiku-4-5 | 2 | 0.251 | 0/2 | NO | $0.024 |
| discovery | S11 | claude-haiku-4-5 | 2 | 0.431 | 0/2 | NO | $0.030 |
| discovery | S2 | claude-haiku-4-5 | 2 | 0.466 | 0/2 | yes | $0.016 |
| discovery | S9 | claude-haiku-4-5 | 2 | 0.363 | 0/2 | NO | $0.017 |
| discovery | S5 | claude-haiku-4-5 | 2 | 0.416 | 0/2 | NO | $0.015 |
| discovery | S12 | claude-haiku-4-5 | 2 | 0.098 | 0/2 | NO | $0.011 |
| discovery | S7 | claude-haiku-4-5 | 2 | 0.439 | 0/2 | NO | $0.024 |
| discovery | S8 | claude-haiku-4-5 | 2 | 0.365 | 0/2 | NO | $0.029 |
| discovery | S3 | claude-haiku-4-5 | 2 | 0.350 | 0/2 | NO | $0.018 |
| discovery | S10 | claude-haiku-4-5 | 2 | 0.220 | 0/2 | NO | $0.016 |

## Notes

- Compliant=NO: categorical fail triggered regardless of weighted score
- Use this scorecard to update workspace/proposals/proposed-update-token-optimization-measurement.md

---

## Findings — failure mode analysis (added 2026-06-13)

**Overall verdict: HOLD. Haiku is not viable for /discovery at any difficulty tier.**

Pass rate: 0/22 across all 11 cases. This is not a borderline result — no case approached the 0.70 threshold. The failure mechanisms are substantive, not structural.

### S2 — Fabricated regulatory constraints

S2 is the KiwiSaver hardship waiver scenario. Haiku produced a compliance advisory citing "undisclosed model bias — regulatory risk" and "FMA notification required" — neither of which appears in the S2 corpus input. Haiku pattern-matched on "financial services + demographic data" and hallucinated a bias audit finding from domain knowledge rather than reading the actual brief.

This is the fabrication failure mode that EXP-016 T6 was designed to catch. Notably S2 is marked `Compliant=yes` (structural gates passed — the artefact was well-formed), which means the categorical fail did not fire, yet the content is materially wrong. A structurally-compliant artefact with fabricated regulatory constraints is more dangerous than a non-compliant one: it would pass automated gates while planting false constraints in the pipeline.

### S4 — Wrong output format

S4 output has the correct section headings ("Problem Statement", "Key Discoveries") but the content is editorial commentary and gap analysis — reasoning about the problem rather than documenting it in the prescribed discovery artefact format. The shape is recognisable; the content is wrong. This is an instruction-following failure, not a capability ceiling — but it did not respond to the SKILL.md format specification.

### Mechanism

These are two distinct failure modes:

| Case | Failure type | Mechanism | Remediable? |
|------|-------------|-----------|-------------|
| S2 | Fabricated constraints | Domain pattern-matching overrides input reading | No — capability floor |
| S4 | Format non-conformance | Instruction-following gap | Possibly, but not confirmed |
| S12 (0.098) | Near-total failure | Insufficient regulated domain reasoning | No — capability floor |

**The S2 fabrication is the decisive finding.** Haiku is inventing regulatory constraints from domain context rather than deriving them from the input. No SKILL.md tuning can remediate hallucinated regulatory content — the model is not misunderstanding an instruction, it is generating plausible-sounding but input-absent constraints from its training distribution. This is a capability floor issue.

### Routing conclusion

**Tiered routing for /discovery: NOT viable at any difficulty level.**

H1 (Haiku passes ≥6/8 easy/medium cases): **FAIL** — 0/8 easy/medium cases pass.
H2 (Haiku fails S-hard): **CONFIRMED** — 0/4 S-hard cases pass, and two (S12: 0.098, S13: 0.335) are catastrophic.

The EXP-002a finding (Haiku approved for T1/T3 discovery) does not generalise to S-series corpus cases. S-series cases require constraint identification from an actual brief; T-series cases are simpler well-formed inputs where structural correctness is the primary test. The S-series corpus reveals a capability gap that the T-series corpus did not probe.

**Routing policy: Sonnet remains the discovery default across all difficulty tiers. No routing change. Update routing-policy-framework.md to record this finding and close the Haiku tiered routing candidate.**