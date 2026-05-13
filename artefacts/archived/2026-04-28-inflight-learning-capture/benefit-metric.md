# Benefit Metric: In-Flight Learning Capture

**Discovery reference:** artefacts/2026-04-28-inflight-learning-capture/discovery.md
**Date defined:** 2026-04-28
**Metric owner:** heymishy (platform maintainer)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This feature validates a hypothesis about instruction-based agent self-recording — whether a structural SKILL.md + `copilot-instructions.md` instruction is sufficient to drive ≥80% of signal capture without operator prompting. The primary value is to the pipeline operator; the mechanism under test is the harness instruction layer itself. Both product metrics (signal survival) and meta metrics (instruction reliability) are required.

---

## Tier 1: Product Metrics (Operator Value)

### M1: Signal loss rate

| Field | Value |
|-------|-------|
| **What we measure** | Count of entries in `workspace/learnings.md` per month that document signal loss due to context compaction or abrupt session end — i.e. entries that say "this insight was nearly lost" or "lost to compaction" |
| **Baseline** | 5 documented loss events in the April 2026 pipeline run (Phase 1–3 delivery period, ~4 weeks of active sessions). Git log confirms all 49 learnings.md commits are in this window. |
| **Target** | 0 loss events per month after delivery |
| **Minimum validation signal** | ≤1 loss event across 3 consecutive sessions post-delivery |
| **Measurement method** | Operator scans `workspace/learnings.md` at each `/checkpoint` for entries mentioning compaction, session end, or signal loss. Monthly count recorded. |
| **Feedback loop** | If ≥2 loss events in the first 3 sessions post-delivery, the agent self-recording instruction is not firing reliably. Review `capture-log.md` to diagnose: if entries exist but were not promoted, adjust the `/checkpoint` bridge instruction. If no entries exist, strengthen the self-recording instruction in `copilot-instructions.md`. |

---

### M2: In-session agent capture rate

| Field | Value |
|-------|-------|
| **What we measure** | % of pipeline sessions that contain ≥1 entry in `workspace/capture-log.md` with `source: agent-auto` (written without operator prompting) |
| **Baseline** | 0% — `workspace/capture-log.md` does not exist; no agent self-recording mechanism is in place |
| **Target** | ≥80% of sessions within 5 sessions post-delivery |
| **Minimum validation signal** | ≥50% of sessions (i.e. ≥3 of the first 6 post-delivery sessions) contain at least one agent-auto entry |
| **Measurement method** | After each session, operator counts `source: agent-auto` entries added to `capture-log.md` during that session. A session with zero agent-auto entries is a miss. Checked at each `/checkpoint`. |
| **Feedback loop** | If M2 is below 50% after 6 sessions, the structural instruction is under-firing. Options: (a) strengthen instruction wording, (b) add to more SKILL.md files, (c) add an explicit "capture check" mid-skill prompt. |

---

## Tier 2: Meta Metrics (Instruction Reliability)

### MM1: Agent vs operator capture ratio

| Field | Value |
|-------|-------|
| **Hypothesis** | A structural instruction woven into `copilot-instructions.md` and relevant SKILL.md files will drive ≥80% of captures autonomously — the operator's `/capture` command accounts for ≤20% |
| **What we measure** | % of total `workspace/capture-log.md` entries with `source: agent-auto` vs `source: operator-manual` over the first 10 sessions post-delivery |
| **Baseline** | N/A — no capture-log exists pre-delivery |
| **Target** | ≥80% agent-auto across the first 10 sessions |
| **Minimum signal** | ≥60% agent-auto — i.e. the instruction reliably fires more often than not, even if it doesn't reach 80% |
| **Measurement method** | Operator counts entries by source field in `capture-log.md` at each `/checkpoint`. Cumulative ratio reported after 10 sessions. |

---

### MM2: Learnings.md growth rate after delivery

| Field | Value |
|-------|-------|
| **Hypothesis** | By capturing signals mid-session rather than only at checkpoint, the total volume of durable learnings promoted to `workspace/learnings.md` per month will increase |
| **What we measure** | Count of new entries added to `workspace/learnings.md` per month, comparing the 4-week pre-delivery period (April 2026, baseline) to the 4-week post-delivery period |
| **Baseline** | 49 commits touched `workspace/learnings.md` in April 2026 (all since project start). Approximately 25–30 distinct named entries estimated from reading the file. Exact count: operator counts entries in `workspace/learnings.md` at delivery date. |
| **Target** | ≥20% more named entries per month in the post-delivery period vs the April baseline |
| **Minimum signal** | No regression — post-delivery monthly count is equal to or greater than baseline |
| **Measurement method** | Operator counts named entries in `workspace/learnings.md` at the end of each month (a named entry = a `##` or `---` delimited block with a heading). Compare month-over-month. |

---

## Metric Coverage Matrix

| Metric | Stories that trace to it |
|--------|--------------------------|
| M1 — Signal loss rate | ilc.1 (creates the durability layer), ilc.3 (bridges captures to learnings.md at session end) |
| M2 — In-session agent capture rate | ilc.1 (defines the file + operator path), ilc.2 (wires the agent self-recording instruction) |
| MM1 — Agent vs operator capture ratio | ilc.2 (drives agent-auto entries), ilc.1 (provides operator-manual path for denominator measurement) |
| MM2 — Learnings.md growth rate | ilc.3 (bridges capture entries to learnings.md, increasing entries per session) |

---

## Constraints and dependencies

- No metric requires external tooling — all measured from `workspace/capture-log.md` and `workspace/learnings.md` in the repo.
- Baselines for MM1 and MM2 are established at delivery date, not before. First 10 sessions post-delivery are the measurement window.
- M1 baseline (5 loss events) is derived from reading `workspace/learnings.md` — if the operator identifies additional undocumented loss events on review, the baseline should be updated before /definition.
- This artefact is a living measurement document. The M1 and M2 evidence sections below should be updated as sessions complete.

---

## M1 Evidence (to be filled post-delivery)

| Session date | Loss events | Notes |
|-------------|-------------|-------|
| *(post-delivery)* | — | — |

## M2 Evidence (to be filled post-delivery)

| Session date | Agent-auto entries | Operator-manual entries | Rate |
|-------------|-------------------|------------------------|------|
| *(post-delivery)* | — | — | — |

## MM1 Evidence (to be filled post-delivery)

| Sessions measured | Agent-auto % | Status |
|------------------|-------------|--------|
| *(post-delivery)* | — | — |
