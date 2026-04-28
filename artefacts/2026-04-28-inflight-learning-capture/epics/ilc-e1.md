# Epic: Pipeline learning signal survives the full session lifecycle

**Discovery reference:** artefacts/2026-04-28-inflight-learning-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-04-28-inflight-learning-capture/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

When this epic is complete, a platform operator running any pipeline session will find that signals — decisions, validated assumptions, discovered patterns, identified gaps — are recorded to `workspace/capture-log.md` as they arise, promoted to `workspace/learnings.md` at session end via `/checkpoint`, and never silently lost to context compaction or abrupt session close. The operator can also manually invoke `/capture [signal]` at any point. The agent self-records without prompting in ≥80% of sessions.

## Out of Scope

- Dashboard or query UI over `capture-log.md` — append-only plain file only in MVP.
- Automated signal quality scoring, deduplication, or conflict detection — curation is a human action at checkpoint.
- Benefit-metric measurement signals (M1/M2/MM etc.) — those remain the scope of `/record-signal`; `/capture` handles the wider operational signal class.
- Changes to `pipeline-state.json` schema — this epic is ADDITIVE: SKILL.md and `copilot-instructions.md` instruction changes only; no schema evolution.
- VS Code or Copilot API context-threshold hooks — not available as a structural hook today.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Signal loss rate | 5 documented loss events (April 2026) | 0 loss events/month | The capture-log convention + checkpoint bridge ensure signals are written before context pressure strikes |
| M2 — In-session agent capture rate | 0% (no mechanism exists) | ≥80% of sessions | The instruction layer (ilc.2) wires the agent to self-record; the file convention (ilc.1) is the write target |
| MM1 — Agent vs operator capture ratio | N/A | ≥80% agent-auto | The structural instruction (ilc.2) drives agent-auto entries; the operator `/capture` command (ilc.1) covers the residual 20% |
| MM2 — Learnings.md growth rate | April 2026 baseline | ≥20% more entries/month post-delivery | Checkpoint bridge (ilc.3) promotes entries from capture-log to learnings.md at session end |

## Stories in This Epic

- [ ] ilc.1 — Define `workspace/capture-log.md` schema and `/capture` operator command
- [ ] ilc.2 — Weave agent self-recording instruction into `copilot-instructions.md` and key SKILL.md files
- [ ] ilc.3 — Update `/checkpoint` to bridge `capture-log.md` entries to `workspace/learnings.md`

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Changes to `copilot-instructions.md` are behavioural — they affect every future agent session. Medium oversight is appropriate: agent implements, human reviews the PR before merge.

## Complexity Rating

**Rating:** 2

All three stories involve instruction text changes rather than code logic. The complexity is in verifying that instruction text is precise enough to produce reliable agent behaviour — that is an empirical unknown (A1 in discovery). Stories are straightforward to implement; the uncertainty is in post-delivery measurement.

## Scope Stability

**Stability:** Stable

All three stories are derived directly from MVP scope items in the approved discovery. No known scope expanders.
