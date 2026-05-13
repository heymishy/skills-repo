# Scorecard — EXP-002b-context-loaded-discovery

Generated: 2026-05-13T08:52:12.553Z
Judge model: claude-sonnet-4-6

## Summary

| Skill | Case | Model | Trials | Avg Score | Pass Rate | Compliant | Est. Cost |
|-------|------|-------|--------|-----------|-----------|-----------|-----------|
| discovery | T5 | claude-sonnet-4-6 | 3 | 0.000 | 0/3 | yes | $0.119 |
| discovery | T5 | claude-opus-4-7 | 3 | 0.519 | 0/3 | yes | $0.889 |

## Notes

- Compliant=NO: categorical fail triggered regardless of weighted score
- Use this scorecard to update workspace/proposals/proposed-update-token-optimization-measurement.md

## Path reconciliation note

This directory (`EXP-002b-context-loaded-discovery/`) contains:
- **Opus T5 Pass 1** — 3 trials via direct Anthropic API (scored, avg 0.519). These are the canonical Pass 1 Opus T5 results.
- **Sonnet T5 trial-1 original** — `error: judge failed` (direct API rate limit before Copilot proxy was available). Not usable.

All subsequent runs (Sonnet T5 Pass 1 re-run, T1/T2/T4 sanity checks, Pass 2) are in `workspace/experiments/EXP-002b/`.
The two directories together constitute the full EXP-002b dataset. See `EXP-002b/scorecard.md` for the complete summary table.