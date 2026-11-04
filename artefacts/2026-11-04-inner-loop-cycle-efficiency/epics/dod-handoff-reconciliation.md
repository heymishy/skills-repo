## Epic: Merged stories stop silently stalling before Definition of Done

**Discovery reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/discovery.md
**Benefit-metric reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

At the start of every session, `/workflow` surfaces — prominently, not buried — any story that is really merged (confirmed against live `gh pr list --state merged`, not just `pipeline-state.json`'s own self-reported fields) but has not reached `/definition-of-done`. The existing 22-story backlog is not fixed by this epic; what stops is new occurrences accumulating unnoticed the way they have been.

## Out of Scope

- Retroactively running `/definition-of-done` for the 22 already-identified merged-but-no-DoD stories (including `fhff-s1/s2/s3`) — one-time operational cleanup, separate from this epic's structural mechanism (discovery, Out of Scope).
- A new scheduled CI job for always-on coverage — rejected at `/clarify`; this epic relies on the existing CLAUDE.md session-start convention, made loud instead of silent.
- Any change to `/definition-of-done`'s own content or process — this epic only makes the *handoff into it* visible, not the skill itself.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Metric 3 — New occurrences of merged-but-no-DoD gap | 22 of 819 stories repo-wide (2026-11-04, frozen) | 0 new occurrences among stories merged after this feature ships | Implements the reconciliation check directly, surfaced at session start |

## Stories in This Epic

- [ ] `/workflow` reconciles merged-but-no-DoD stories against live GitHub, not just `pipeline-state.json`

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches a platform-governed `SKILL.md` (`/workflow`) and introduces a new external dependency (`gh` CLI availability) per ADR-030's own stated consequence — warrants human review at PR.

## Complexity Rating

**Rating:** 2

<!-- ADR-030 already specifies the solution pattern (cross-reference gh pr list against prUrl, degrade gracefully if gh is unavailable), so this isn't high-ambiguity — but it's not a mechanical repeat either: it's the first time this repo's /workflow skill integrates a live external-API cross-reference rather than reading local files only. -->

## Scope Stability

**Stability:** Stable
