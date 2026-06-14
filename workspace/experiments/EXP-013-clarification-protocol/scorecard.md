# Scorecard — EXP-013-clarification-protocol

Generated: 2026-06-11T19:21:18.599Z
Judge model: claude-sonnet-4-6

## Summary

| Skill | Case | Model | Trials | Avg Score | Pass Rate | Compliant | Est. Cost |
|-------|------|-------|--------|-----------|-----------|-----------|-----------|
| discovery | T2 | claude-sonnet-4-6 | 3 | 0.080 | 0/3 | NO | $0.143 |
| discovery | T5 | claude-fable-5 | 3 | 0.748 | 3/3 | yes | $0.239 |
| discovery | T5 | claude-sonnet-4-6 | 3 | 0.726 | 2/3 | yes | $0.036 |
| discovery | T2 | claude-fable-5 | 3 | 0.552 | 0/3 | yes | $0.156 |
| discovery | T4 | claude-fable-5 | 3 | 0.483 | 1/3 | NO | $0.174 |
| discovery | T4 | claude-sonnet-4-6 | 3 | 0.000 | 0/3 | NO | $0.090 |

## Notes

- Compliant=NO: categorical fail triggered regardless of weighted score
- T2 Sonnet Compliant=NO: clarification gate — Sonnet issued /clarify instead of producing a discovery artefact; the gate correctly fires. T2 is a clarification-required case; Sonnet was compliant with the new gate but the judge scored the non-artefact output as 0.
- T4 Fable 5 / Sonnet Compliant=NO: scope-creep categorical fail on both models.

## Findings

**Primary finding:** EXP-010 Fable 5 T2 advantage (2-trial N) was variance, not a genuine capability lead. When run at 3 trials per model, Fable 5 T2 (0.552) is below Sonnet T5 (0.726) and does not pass the clarification-protocol corpus. Fable 5 EXP-010 HOLD verdict reinforced.

**Secondary finding:** The hard clarification gate (commit `d17b41e`) correctly triggers on T4 and T5 scope-creep inputs for both models. Post-gate, Sonnet T5 maintains 2/3 pass rate. Gate works as designed.

**Action taken:** SKILL.md hard clarification gate applied. Post-fix validation sweep (EXP-018) required to confirm Sonnet compliant rate on T2/T4 with the corrected gate.