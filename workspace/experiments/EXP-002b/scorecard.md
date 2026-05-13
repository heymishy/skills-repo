# Scorecard — EXP-002b

Generated: 2026-05-13T09:39:50.845Z
Judge model: claude-sonnet-4-6

## Summary

| Skill | Case | Model | Trials | Avg Score | Pass Rate | Compliant | Est. Cost |
|-------|------|-------|--------|-----------|-----------|-----------|-----------|
| discovery | T5 | claude-sonnet-4-6 | 3 | 0.350 | 0/3 | yes | N/A |
| discovery | T5 | claude-opus-4-7 | 3 | 0.562 | 0/3 | yes | N/A |

## Notes

- Compliant=NO: categorical fail triggered regardless of weighted score
- Use this scorecard to update workspace/proposals/proposed-update-token-optimization-measurement.md

## Path reconciliation note

This scorecard reflects only the last sweep run (Pass 2 T5). Full EXP-002b dataset spans two directories:
- `EXP-002b-context-loaded-discovery/` — Opus T5 Pass 1 (avg 0.519) + errored Sonnet trial-1
- `EXP-002b/` (this directory) — all Copilot-proxy runs

## Complete EXP-002b summary (all runs)

| Pass | Case | Model | Trials | Avg Score | Pass Rate | Provider |
|------|------|-------|--------|-----------|-----------|----------|
| Pass 1 | T5 | claude-sonnet-4-6 | 3 | 0.390 | 0/3 | Copilot proxy |
| Pass 1 | T5 | claude-opus-4-7 | 3 | 0.519 | 0/3 | Direct API |
| Pass 1 | T1 | claude-sonnet-4-6 | 1 | 0.672 | 0/1 | Copilot proxy |
| Pass 1 | T1 | claude-opus-4-7 | 1 | 0.703 | 1/1 | Copilot proxy |
| Pass 1 | T2 | claude-sonnet-4-6 | 1 | 0.000 | 0/1 | Copilot proxy |
| Pass 1 | T2 | claude-opus-4-7 | 1 | 0.570 | 0/1 | Copilot proxy |
| Pass 1 | T4 | claude-sonnet-4-6 | 1 | 0.198 | 0/1 | Copilot proxy |
| Pass 1 | T4 | claude-opus-4-7 | 1 | 0.370 | 0/1 | Copilot proxy |
| Pass 2 | T5 | claude-sonnet-4-6 | 3 | 0.350 | 0/3 | Copilot proxy |
| Pass 2 | T5 | claude-opus-4-7 | 3 | 0.562 | 0/3 | Copilot proxy |

**Note:** Pass 1 Sonnet T5 JSON files were overwritten by the Pass 2 run (same filenames). Pass 1 Sonnet T5 scores (0.340, 0.340, 0.490; avg 0.390) are recorded from terminal history only.