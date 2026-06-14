# Scorecard — EXP-019-pipeline-fidelity

Generated: 2026-06-12T10:47:47.687Z
Judge model: claude-sonnet-4-6

## Summary

| Skill | Case | Model | Trials | Avg Score | Pass Rate | Compliant | Est. Cost |
|-------|------|-------|--------|-----------|-----------|-----------|-----------|
| definition-of-done | S5 | claude-haiku-4-5 | 1 | 0.000 | 0/1 | yes | N/A |

## Notes

- Compliant=NO: categorical fail triggered regardless of weighted score
- Score of 0.000 is a sweep infrastructure artefact, not a model quality failure — see findings below.

## Findings

**H1 — DoD format compatibility confirmed:** Haiku correctly parsed a real-format pipeline bundle (S5 story with discovery → definition → review → test-plan artefacts). Zero fabricated governance gates, zero false DONE verdicts.

**Infrastructure finding 1 — Discovery token ceiling:** Discovery stage completed manually (4096 token ceiling caused truncation at automated run). The discovery output fed into this experiment was operator-completed. Automated discovery sweep should use `--max-tokens 8192`.

**Infrastructure finding 2 — Definition sweep-script incompatibility:** Definition stage produced an artefact via VS Code session; the automated sweep script was not compatible with the definition output format at the time of this experiment. Subsequently fixed.

**Score 0.000 explanation:** The auto-generated scorecard captures the DoD sweep run only (single stage). The S5 DoD run scored 0.000 due to a corpus heading-level issue in the operator input block (since fixed in commit `9063d40`). The human-reviewed artefact confirmed Haiku DoD output was qualitatively correct on all substantive dimensions. EXP-015 and EXP-016 provide the canonical DoD calibration results.

**Status:** complete — format compatibility confirmed; infrastructure gaps documented and fixed.