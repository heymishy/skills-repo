# Epic: Windows-Native CI Parity and Pipeline Evolution

**Discovery reference:** artefacts/2026-04-14-skills-platform-phase3/discovery.md
**Benefit-metric reference:** artefacts/2026-04-14-skills-platform-phase3/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

When this epic is complete, governance checks pass on Windows CI runners without OS-conditional workarounds, and the issue-dispatch skill's handoff sequence has a clear operator reminder to close dispatched issues. A squad working entirely in a Windows PowerShell environment can run all governance validations locally using `validate-trace.ps1 --ci`. The `--ci` flag behaviour is identical to the shell script equivalent.

## Out of Scope

- Enterprise channel adapter implementations — Epic E6.
- Cross-team trace aggregation — Epic E5.
- The assurance gate substantive check improvements — those are Epic E1. This epic only delivers Windows parity for the existing check set plus the pipeline evolution dispatch items.
- PowerShell rewrites of any other shell scripts beyond `validate-trace.sh` — out of scope, not identified as a gap.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| MM2 — Outer loop self-sufficiency: zero blocking lookups | 0 in Phase 2 (GitHub-native only) | 0 including Windows environments | p3.5 unblocks Windows CI adoption; p3.6 reduces operator memory load at dispatch |
| M3 — Post-merge silent failure detection rate | 4 silent failures (Phase 2) | Zero persisting beyond 1 CI cycle | p3.5 ensures detection works on Windows CI runners, not just Linux |

## Stories in This Epic

- [ ] p3.5 — Deliver validate-trace.ps1 with full parity to validate-trace.sh
- [ ] p3.6 — Add issue-dispatch forward-pointer and Closes guidance to /definition-of-ready exit

## Human Oversight Level

**Oversight:** Low
**Rationale:** p3.5 is a new file (no existing behaviour is changed on Linux) and has a clear behavioural specification. p3.6 is a SKILL.md text addition at a well-defined exit point. Neither story touches gate logic or schema.

## Complexity Rating

**Rating:** 1
Both stories have clear, bounded scope with no architectural ambiguity.

## Scope Stability

**Stability:** Stable
