# CPF Trace — EXP-040 / C3

**Target constraint:** C3 = "10-second acknowledgement window / 9,500ms SLA_THRESHOLD_MS"  
**Scenario:** RTP inbound SLA (Payments NZ scheme participation — $50k/day penalty)  
**Experiment:** EXP-040-e2e-pipeline-s3

---

## Trace by Stage

| Stage | Skill | Case | Score | CPF Evidence |
|-------|-------|------|-------|--------------|
| 1 | discovery | S3 | 1.000¹ | C2 = "10-second acknowledgement timeout" — 10 constraints logged; CPF-C2 explicit |
| 2 | definition | case-EXP040-S3-definition | 1.000 PASS | C2 in ISO-001, FRAUD-001, AML-001, ACK-001 NFRs; ACK-001 "alert triggered if P99 > 9.5 seconds" |
| 3 | review | case-EXP040-S3-review | ERR² | "Hard constraint (C2: 10s ACK) explicitly stated" in Strengths; AML latency risk R1 flagged against 10s window |
| 4 | test-plan | case-EXP040-S3-test-plan | ERR² | AC4 tests assert ≤10,000ms P99 at 40,000 tph; AC6 tests assert 9,500ms alert threshold; both timing constants in test bodies |
| 5 | definition-of-ready | case-EXP040-S3-dor | 0.215³ | "Scheme compliance constraint (C2) explicitly stated as non-negotiable hard rule"; "P99 ≤ 10s is a hard gate, not a tuning target" |
| 6 | implementation-plan | IL-S3 | 0.955 PASS | `SLA_THRESHOLD_MS = 9500` hardcoded; `SCHEME_SLA_EXCEEDED` event; `Promise.race()` fires at 9,500ms; Architecture note: "non-configurable" |
| 7 | definition-of-done | IL-S3 | 0.880 PASS | "9,500ms trigger with 500ms safety margin before 10,000ms deadline"; NFR validated at P99 < 9,000ms |

**H1 verdict: PASS** — C3 traceable through all 7 pipeline stages.

---

## Notes

¹ Discovery: judge scored 1.000 but eval marked NON-COMPLIANT due to `process_violation_override` — `**Bold heading**` pattern detected before closing /clarify recommendation. This is a false positive; model output is correct.

² Review and test-plan: model output qualitatively correct and CPF-verified. Judge failed to return valid JSON because the corpus cases originally contained `## Scoring note` sections with custom dimension names conflicting with the EVAL.md D1-D5/D1-D6 schema. Sections removed post-run; re-judging pending (see Findings).

³ DoR: model output is qualitatively READY with correct verdict and explicit C2 references. Score of 0.215 reflects missing Contract Proposal and Coding Agent Instructions blocks required by DoR SKILL.md output protocol (haiku-4-5 skipped both). See Findings F2.

---

## Constraint Value at Each Transition

```
Discovery  → C2 = "10-second acknowledgement timeout"
Definition → ACK-001 NFR: "≤10 seconds P99"; alert "at 9.5 seconds"
Review     → "C2: 10s ACK explicitly stated"; latency budget math against 10s window
Test-plan  → T3.4 assertions: 10,000ms P99; T5 alert threshold: 9,500ms
DoR        → NFR-1: "P99 acknowledgement ≤ 10 seconds at 40,000 tph. Hard scheme rule (C2)"
Impl-plan  → SLA_THRESHOLD_MS = 9500; fires SCHEME_SLA_EXCEEDED before 10,000ms deadline
DoD        → "9,500ms trigger with 500ms safety margin before 10,000ms deadline" ✅ DONE
```

The 9,500ms alert threshold first appeared at definition stage (ACK-001 NFR) and persisted as the concrete implementation constant through to the production-ready SLA timer module.
