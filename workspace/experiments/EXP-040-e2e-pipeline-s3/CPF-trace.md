# CPF Trace — EXP-040 / C3

**Target constraint:** C3 = "10-second acknowledgement window / 9,500ms SLA_THRESHOLD_MS"  
**Scenario:** RTP inbound SLA (Payments NZ scheme participation — $50k/day penalty)  
**Experiment:** EXP-040-e2e-pipeline-s3

---

## Trace by Stage

| Stage | Skill | Case | Model | Score | CPF Evidence |
|-------|-------|------|-------|-------|--------------|
| 1 | discovery | S3 | sonnet-4-6 | 1.000¹ | C2 = "10-second acknowledgement timeout" — 10 constraints logged; CPF-C2 explicit |
| 2 | definition | case-EXP040-S3-definition | haiku-4-5 | 1.000 PASS | C2 in ISO-001, FRAUD-001, AML-001, ACK-001 NFRs; ACK-001 "alert triggered if P99 > 9.5 seconds" |
| 3 | review | case-EXP040-S3-review | haiku-4-5 | 0.070² | "Hard constraint (C2: 10s ACK) explicitly stated" in Strengths; latency math performed against 10s window |
| 4 | test-plan | case-EXP040-S3-test-plan | haiku-4-5 | 0.780² | AC4 tests assert ≤10,000ms P99 at 40,000 tph; AC6 tests assert 9,500ms alert threshold; both timing constants in test bodies |
| 5 | definition-of-ready | case-EXP040-S3-dor | **sonnet-4-6**³ | 0.370 | "AC4 — E2E ≤ 10s P99 @ 40k tph"; "Alert at > 9,500ms (AC6)"; Flag 4: "500ms alert margin (AC6) — AC6 provides a 500ms circuit-breaker margin" |
| 6 | implementation-plan | IL-S3 | haiku-4-5 | 0.955 PASS | `SLA_THRESHOLD_MS = 9500` hardcoded constant; `SCHEME_SLA_EXCEEDED` event; `Promise.race()` fires at 9,500ms; Architecture: "9,500ms SLA threshold (hard-coded, non-configurable)" |
| 7 | definition-of-done | IL-S3 | haiku-4-5 | 0.880 PASS | "9,500ms trigger with 500ms safety margin before 10,000ms deadline"; NFR validated at P99 < 9,000ms |

**H1 verdict: PASS** — C3 traceable through all 7 pipeline stages.

---

## Notes

¹ Discovery: judge scored 1.000 but eval marked NON-COMPLIANT due to `process_violation_override` — `**Bold heading**` pattern detected in closing /clarify section. False positive; model output correct.

² Review and test-plan: judge valid JSON confirmed after F1 EVAL.md variable-name fix. Scores of 0.070 / 0.780 reflect adversarial rubric applied to pipeline-fidelity cases — the review model raised CONDITIONAL PASS findings which the rubric penalises as phantom HIGHs on a clean baseline. Scores are rubric-mismatch noise; CPF confirmed from run files directly.

³ DoR: haiku-4-5 used initially (two attempts, both scored 0.215/0.060) — collapsed the interactive protocol to a summary table. Replaced with sonnet-4-6 per routing deviation note in manifest. Sonnet produced a structured checklist + flags format with G1=0.8 but also skipped Contract Proposal and Coding Agent Instructions (G3=0, G4=0 → 0.370). Both models fail to execute the full multi-turn DoR protocol in single-turn eval mode. CPF confirmed: "AC4 — E2E ≤ 10s P99 @ 40k tph" explicit in traceability matrix; 9,500ms cited in Flag 4.

---

## Constraint Value at Each Transition

```
Discovery  → C2 = "10-second acknowledgement timeout"
               ↓
Definition → ACK-001 NFR: "≤10 seconds P99"; alert "at 9.5 seconds"
               ↓
Review     → "C2: 10s ACK explicitly stated"; latency budget math against 10s window
               ↓
Test-plan  → T3.4: P99 ≤ 10,000ms assertion; T5: 9,500ms alert threshold assertion
               ↓
DoR        → "AC4 — E2E ≤ 10s P99 @ 40k tph"; Flag 4: "500ms circuit-breaker at 9,500ms"
               ↓
Impl-plan  → SLA_THRESHOLD_MS = 9500; Promise.race() timeout fires at 9,500ms
               ↓
DoD        → "9,500ms trigger with 500ms safety margin before 10,000ms deadline" ✅ DONE
```

The 9,500ms alert threshold first appeared explicitly at definition stage (ACK-001 NFR) and was carried through every subsequent stage, culminating in the hardcoded `SLA_THRESHOLD_MS = 9500` production constant confirmed DONE by DoD.
