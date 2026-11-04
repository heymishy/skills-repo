## Epic: Operators can measure real inner-loop cycle time without manual log archaeology

**Discovery reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/discovery.md
**Benefit-metric reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/benefit-metric.md
**Slicing strategy:** Walking skeleton

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    BS[skills/branch-setup/SKILL.md]\n    IP[skills/implementation-plan/SKILL.md]\n    SE[skills/subagent-execution/SKILL.md]\n    VC[skills/verify-completion/SKILL.md]\n    BC[skills/branch-complete/SKILL.md]\n    LOG[.github/pipeline-timings.jsonl]\n    QUERY[scripts/query-pipeline-timings.js]\n    WF[skills/workflow/SKILL.md]\n    STATE[.github/pipeline-state.json]\n    GH[gh pr list --state merged]\n    BS -->|appends timing record| LOG\n    IP -->|appends timing record| LOG\n    SE -->|appends timing record, discard+re-dispatch on spec fail| LOG\n    VC -->|appends timing record| LOG\n    BC -->|appends timing record, reads LOG for freshness guard| LOG\n    QUERY -->|reads| LOG\n    WF -->|reads| STATE\n    WF -->|cross-references, ADR-030| GH"}}---

## Goal

An operator (or future contributor) can regenerate the inner-loop cycle-time baseline — review-dispatch active time per task, redundant-rerun incidence, and related timing metrics — by running one small query script against a structured, purpose-built log, with no raw Claude Code session-transcript mining and none of the contamination (gitBranch/worktree mismatch, slug-citation false attribution) that made the ad hoc version of this measurement unreliable. This epic is the walking skeleton for the whole feature: it proves the measurement approach works before the riskier sequencing changes (Epics 2 and 3) build on it.

## Out of Scope

- Rollup or summary-view generation on top of the raw log — deferred; the raw append-only log plus a small query script is sufficient for this epic's validation purpose (discovery, Assumptions and Risks).
- Retroactively backfilling timing data for stories that ran before this epic ships — there is no historical structured data to backfill from; the baseline starts fresh from this epic's merge date.
- Any change to `/subagent-execution`'s review sequencing itself — that is Epic 2.
- Any change to the DoD-handoff check — that is Epic 3.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Meta Metric 1 — Repeatable baseline regeneration | `[UNKNOWN BASELINE]` — no structured data exists | Regenerate Metric 1 from `pipeline-timings.jsonl` alone for ≥5 stories, zero manual log archaeology | Directly implements the structured log and query script this metric measures |
| Metric 2 — Redundant full-suite reruns in `/branch-complete` | 0% skip rate (always reruns) | 100% skip rate when freshness condition met | Implements the freshness guard directly, mirroring `/verify-completion`'s existing pattern |
| Metric 1 — Review-dispatch active time per task | 22.0 active minutes/task | Sustained ≥10% reduction (measured once Epic 2 ships) | This epic provides the measurement instrument Epic 2's reduction will be measured against — it does not itself move Metric 1 |

## Stories in This Epic

- [ ] Add structured per-skill timing writes to `pipeline-timings.jsonl`
- [ ] `/branch-complete` skips the redundant full-suite rerun when a fresh result exists

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches multiple platform-governed `SKILL.md` files (CLAUDE.md's platform change policy) — coding agent should pause for human review at PR, consistent with how every other inner-loop story in this repo has shipped so far.

## Complexity Rating

**Rating:** 1

<!-- Mechanically repetitive change (one new "append a timing record" step per skill, following the same shape each time) with low ambiguity. The review-yield-by-complexity audit from the session preceding this discovery found Complexity-1 stories still catch real findings at a non-trivial rate (44%) — this rating reflects task clarity, not an exemption from full review. -->

## Scope Stability

**Stability:** Stable
