# Benefit Metric: Execution Boundary Model and Invocation Telemetry

**Status:** Active
**Created:** 2026-05-21
**Discovery artefact:** `artefacts/2026-05-21-execution-boundary/discovery.md`
**Feature slug:** `2026-05-21-execution-boundary`
**Artefact path:** `artefacts/2026-05-21-execution-boundary/benefit-metric.md`

---

## Context and Rationale

This feature delivers two design capabilities — P5 (Execution Boundary Separation) and P6 (Invocation Telemetry Spine) — for the skills platform. Before this feature, the platform makes governance claims without execution evidence. After this feature, every outer loop skill run produces a committed JSONL trace that a risk examiner can read to verify what the model reasoned across.

The benefit being measured is **governance claim substantiability** — the degree to which the platform's governance assertions are backed by independently verifiable execution evidence rather than policy statements about what the model was instructed to do.

A secondary benefit is **model evaluation signal density** — the per-invocation evidence base available to the improvement agent and model evaluation programme. Currently the only signal is artefact text output. After this feature, the signal includes thinking block reasoning quality, tool call efficiency (how many reads to produce a correct artefact), and standards check coverage.

---

## Metric M1: Outer Loop Execution Observability Rate

**Definition:** Percentage of outer loop skill executions (Web UI Anthropic direct API path) that produce a committed JSONL trace file with at minimum Tier 1 events (`skill_invoked`, `skill_complete`, `gate_evaluated`).

**Measurement method:** CI check — count of CI runs with a JSONL artefact upload vs total CI runs with a successful skill execution. `jq '.traceRef // empty' .github/pipeline-state.json` should return a non-empty SHA for every completed story. Manual verification: `ls artefacts/*/traces/*.jsonl | wc -l` should match the number of completed story executions on the Anthropic API path.

**Baseline:** 0% — zero JSONL files exist today for any skill execution. Confirmed by `find . -path '*/traces/*.jsonl' -newer artefacts/2026-05-20-cloud-platform -type f | wc -l` (expected: 0).

**Target (30 days after delivery):** 100% for all outer loop skill runs on the Anthropic direct API path.

**Target (90 days after delivery):** 100% sustained; Tier 1 records queryable by the improvement agent for fidelity scoring.

**North star (12 months):** JSONL query surface enables the model evaluation programme to compare thinking block reasoning quality across models and skill versions — the `/model-sweep` skill becomes data-driven rather than manual scorecard.

---

## Metric M2: Governance Claim Substantiability Score

**Definition:** Proportion of "the platform checked X" governance claims that are now backed by a JSONL `tool_use` event showing the relevant file was read. Measured as: (claims with supporting tool_use event) / (total auditable claims in DoR artefact) across a sample of 5 completed stories.

**Measurement method:** For each sampled story: list the standards and guardrails referenced in the DoR artefact; query the JSONL trace for `tool_use` events where `input.path` matches the standards/guardrail file path. Divide.

**Baseline:** 0 — no JSONL exists; no claims can be backed by execution evidence.

**Target (30 days after delivery):** ≥ 70% of auditable claims backed by a tool_use event in the JSONL trace. (Note: some standards are injected as part of the SKILL.md content, not read separately — these will not appear as tool_use events but are still governed. The 70% target accounts for this.)

**Target (90 days after delivery):** ≥ 85% — after implementation tuning to ensure explicit standards reads are recorded rather than injected inline.

---

## Metric M3: Thinking Block Capture Rate (Tier 2 fidelity)

**Definition:** Percentage of Anthropic direct API skill runs that capture at least one `thinking` event in the JSONL trace.

**Measurement method:** `jq 'select(.event=="thinking") | .ts' artefacts/*/traces/*.jsonl | wc -l` compared to total JSONL file count. A run with zero thinking events on the Anthropic direct API path indicates either that extended thinking is disabled for that skill or that the streaming parser failed to capture it.

**Baseline:** 0% — no thinking events are captured today.

**Target (30 days after delivery):** ≥ 90% of Anthropic direct API runs capture at least one thinking event. (The 10% tolerance accounts for skills that explicitly disable extended thinking for cost reasons — e.g. very short `context: low` runs.)

---

## Metric M4: CI Trace Link Coverage (Phase 4 4.B.9 completion)

**Definition:** Percentage of merged PRs that include a CI artefact link to an individually addressable JSONL trace file in the PR comment.

**Measurement method:** GitHub PR comment inspection — count of merged PRs with a line matching `artefact: execution-trace` in the audit comment vs total merged PRs after feature delivery.

**Baseline:** 0% — gate audit comments include result summary but no trace link.

**Target (30 days after delivery):** 100% of PRs using the Anthropic API path include a JSONL trace link in the audit comment.

---

## Anti-metric: Telemetry Volume Without Fidelity Score Improvement

**What it measures:** Whether JSONL files are growing (increasing telemetry volume) but `gate_evaluated.fidelity_score` is not improving over time. Growth in JSONL file size without improvement in fidelity scores would indicate the telemetry is adding storage cost without governance value.

**Trigger:** If the average `skill_complete.output_tokens` / fidelity score ratio increases by more than 15% over 60 days (more tokens spent, same or lower fidelity), the telemetry investment is not generating governance value improvement.

**Action on trigger:** Run `/model-sweep` to identify whether fidelity degradation is model-driven; run `/systematic-debugging` on the gate_evaluated scoring logic.

---

## Economic Baseline

**Current cost per outer loop skill run (Anthropic direct API, Claude Sonnet 4.6):**
- `/discovery` full run: ~14,000 input tokens + ~4,000 output tokens = $0.042 input + $0.060 output = **~$0.10–$0.20 per run** depending on standards and guardrail context loaded.
- Full pipeline (/discovery → /benefit-metric → /definition × 3 stories → /review → /test-plan × 3 → /definition-of-ready × 3): **~$4–6 per feature.**
- With prompt caching on stable SKILL.md + standards content (ADR-E4 candidate): **~$1.50–2.50 per feature** — 60–70% reduction on the input side.

**Cost of the telemetry itself:**
- JSONL writing is `appendFileSync` — zero inference cost, zero network cost.
- JSONL file size: ~2–8 KB per run (Tier 1 only: ~500 bytes; full Tier 2 with thinking blocks: ~5–10 KB per run).
- CI artefact upload: negligible (text file upload to GitHub Actions artefact store).
- Net cost of adding P6 telemetry: effectively zero — the primary cost is the implementation engineering, not the runtime telemetry.

**Cost exposure from Phase 5 WS2 (Claude Agent SDK inner loop) — out of MVP scope but recorded here for planning:**
- Bounded scope (single module, 2,000 LOC): ~$0.50–$1.50 per story run.
- Unbounded scope (full enterprise codebase, 200,000 LOC, no max-iterations): **$10–50 per story run.**
- Max-iterations guardrail and codebase scope bounding are prerequisites for WS2. This metric will be revisited at the WS2 benefit-metric stage.

---

## Roadmap Alignment

| Roadmap item | Alignment |
|---|---|
| Phase 5 WS1 — Hook event schema | Direct delivery: Epic 1 + Epic 2 of this feature implement WS1. |
| Phase 5 WS2 — Subagent isolation | Partial: P5 execution boundary declaration (Epic 3) is WS2 design precursor. Claude Agent SDK subprocess runner is out of MVP scope. |
| 2026-05-20-cloud-platform — Tamper-evident audit trail | Dependency: Cloud platform cannot deliver this MVP capability without P6 telemetry being available. This feature is a prerequisite. |
| Model evaluation programme (/model-sweep data-driven path) | Enabler: Tier 1 JSONL query surface is the data input for a data-driven `/model-sweep`. Without JSONL traces, model comparison remains a manual scorecard. |

---

## Metric M1 Evidence Section

*This section is populated by the coding agent and/or improvement agent after feature delivery. Leave blank until first measurement.*

| Date | Observation | Source | Evidence URL |
|---|---|---|---|
| — | — | — | — |

---

*Produced by /benefit-metric skill — 2026-05-21. Discovery artefact: `artefacts/2026-05-21-execution-boundary/discovery.md`.*
