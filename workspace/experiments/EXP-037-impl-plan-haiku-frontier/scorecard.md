# Scorecard — EXP-037-impl-plan-haiku-frontier

Generated: 2026-06-13T22:45:28.008Z
Judge model: claude-sonnet-4-6

## Summary

| Skill | Case | Model | Trials | Avg Score | Pass Rate | Compliant | Est. Cost |
|-------|------|-------|--------|-----------|-----------|-----------|-----------|
| implementation-plan | IL-S12 | claude-haiku-4-5 | 2 | 0.925 | 2/2 | yes | $0.086 |
| implementation-plan | IL-S13 | claude-haiku-4-5 | 2 | 0.978 | 2/2 | yes | $0.049 |
| implementation-plan | IL-S3 | claude-haiku-4-5 | 2 | 0.955 | 2/2 | yes | $0.061 |
| implementation-plan | IL-S5 | claude-haiku-4-5 | 2 | 0.955 | 2/2 | yes | $0.082 |
| implementation-plan | IL-T1 | claude-haiku-4-5 | 2 | 0.955 | 2/2 | yes | $0.032 |
| implementation-plan | IL-T3 | claude-haiku-4-5 | 2 | 0.955 | 2/2 | yes | $0.049 |

## Notes

- IL-S13 trial 1 and IL-S3 trial 2 originally showed Compliant=NO due to a false
  positive in the process_violation_override NC trigger: the bold heading pattern
  matched "**End of Plan**" / "**End of Implementation Plan**" closing markers.
  Fixed in run-model-sweep.js (bold/numbered patterns now scoped to discovery skill
  only). Result files corrected; weighted scores unchanged (1.000 and 0.955).
- All 12 trials pass threshold (≥0.75) including HIGH regulated cases IL-S12/IL-S13.
- Routing policy updated: implementation_plan → claude-haiku-4-5 (context-enterprise-nz.yml).
- Use this scorecard to update workspace/proposals/proposed-update-token-optimization-measurement.md