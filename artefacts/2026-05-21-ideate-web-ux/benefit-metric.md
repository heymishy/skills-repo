# Benefit Metric: /ideate Web UX — Structured Session Interface

**Discovery reference:** `artefacts/2026-05-21-ideate-web-ux/discovery.md`
**Date defined:** 2026-06-04
**Metric owner:** Hamish King — Platform operator / tech lead
**Reviewers:** (none at definition stage — solo operator pipeline)

> **Product context read:**
> Mission success outcomes: delivery traceability, empirical improvement cycle grounded in actuals, reduced overhead for developers and tech leads running the pipeline.
> Roadmap alignment: Phase 2 — cross-team observability, surface adapter model. This feature extends the web UI surface (Phase 1 foundation) to make the outer loop (discovery / ideation) visible and legible during execution, not just in its artefact outputs. Aligns directly with the Phase 2 objective of cross-team observability by making the operator's session context and assumptions readable by others (secondary operator persona, commercial evaluator).

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This feature also validates a hypothesis about tooling: that structured session UI tooling (assumption card visibility, live artefact draft) reduces model-driven rework in the outer loop and produces a legible demo surface for commercial outreach. Tier 2 metrics track these platform-level hypotheses separately from user-outcome metrics.

---

## Tier 1: Product Metrics (User Value)

### M1: Assumption card render pipeline reliability

| Field | Value |
|-------|-------|
| **What we measure** | % of `assumptionCard` SSE events emitted by the server that produce a visible card in the right panel within 500ms of emission, as measured by the automated test suite |
| **Baseline** | 0% — no web UI assumption surface exists today |
| **Target** | 100% — every emitted event renders a card within 500ms |
| **Minimum validation signal** | ≥95% — below this the card system is unreliable and operators cannot trust card completeness |
| **Measurement method** | Automated test (Jest / Playwright): assert SSE `assumptionCard` event → DOM card render pipeline. Run on every PR. Measured continuously by CI. |
| **Feedback loop** | If <95% on CI: story is not shippable. If <100% but ≥95% post-ship: open bug, Cluster 2 stories blocked on fix. If <70% emission rate from model (see MM1): escalate to SKILL.md tuning story re-do before Increment 2. |

---

### M2: Downstream rework rate from unconfirmed assumptions

| Field | Value |
|-------|-------|
| **What we measure** | % of completed `/ideate` sessions that require a subsequent re-run or a downstream correction at /definition or /review, attributable to unconfirmed or invisible assumptions from the ideation session |
| **Baseline** | ~40% directional estimate (Lens D operator signal). Empirical data: 2 confirmed re-run events in `pipeline-state.json` (`ideationRerun: true` — cloud-platform and ideate-web-ux). Sample size is too small for a statistical baseline; the directional figure is used. The real baseline will be established from delivery actuals over the first 30 days post-ship, using `ideationRerun` tracking now in pipeline-state.json. |
| **Target** | <15% of sessions require correction after MVP ships |
| **Minimum validation signal** | ≤25% — if actuals in the first 30 days are above 25%, Cluster 2 (assumption cards) is not moving the metric and root cause must be investigated before Increment 2 |
| **Measurement method** | `ideationRerun` boolean field in `pipeline-state.json` per story. Re-run count surfaces in governance check output. Measured per feature delivery. Metric owner reviews actuals at each /definition-of-done for ideation-touching stories. |
| **Feedback loop** | >25% at 30-day review: investigate whether assumption cards are being seen and acted on (operator behaviour, not just render rate). ≤15% at 90-day review: Increment 2 scope confirmed. >15% at 90-day review: Increment 2 must include structured assumption review step (Cluster 5 candidate). |

---

### M3: Session completion rate

| Field | Value |
|-------|-------|
| **What we measure** | % of started `/ideate` sessions (where the operator submits at least one answer) that result in a committed artefact (`session.done = true` signal in server-side logs) |
| **Baseline** | Not yet established. No web UI session telemetry exists. Baseline measurement begins on the day MVP ships; 30-day actuals lock the real baseline. |
| **Target** | 75% of started sessions result in a committed artefact |
| **Minimum validation signal** | ≥50% — below this the session UX has a structural problem (likely: session loss from browser close, Cluster 3 deferred, or first-run confusion, Increment 2) |
| **Measurement method** | `session.done = true` event frequency in server-side session logs, divided by sessions with ≥1 submitted answer. Measured weekly from ship date. |
| **Feedback loop** | <50% at 30-day review: investigate session loss reasons (browser close vs. abandonment vs. model failure). If ≥50% but <75%: defer Cluster 3 (session recovery) to Increment 2 as planned but confirm it is on the Increment 2 backlog. |

---

## Tier 2: Meta Metrics (Learning / Validation)

### MM1: Marker emission consistency under multi-turn context pressure

| Field | Value |
|-------|-------|
| **Hypothesis** | The `/ideate` SKILL.md marker emission instruction produces reliable `---ASSUMPTION-JSON---` output across a full multi-turn session (not just the clean-context single-turn case proven in Spike A2) |
| **What we measure** | Emission rate = `---ASSUMPTION-JSON---` markers emitted ÷ assumptions surfaced in prose, in a real multi-turn session with ≥6 turns before Lens B |
| **Baseline** | Spike A2 (2026-06-04, single clean-context turn): 100% (12/12). Multi-turn baseline: not yet measured. |
| **Target** | ≥70% emission rate in a real multi-turn production `/ideate` session |
| **Minimum signal** | ≥70% — this is both minimum and target; below 70% the assumption card value proposition is invalidated (see discovery commercialisation context) |
| **Measurement method** | DoD entry condition on the SKILL.md tuning story: run the instrumented instruction in a real multi-turn session (≥6 turns), count markers vs. assumptions, record result in the story's verification script output. Validated before the SKILL.md tuning story is merged. |

---

### MM2: Live-session demo moment — commercial legibility

| Field | Value |
|-------|-------|
| **Hypothesis** | A live `/ideate` session with Cluster 4 active (artefact draft visible in real time) is compelling enough to generate qualified follow-up from evaluators who see it without prior explanation |
| **What we measure** | Number of qualified follow-up conversations (defined as: the evaluator asks a specific question about using the platform for their own delivery, or requests a second demo) from the 5-person outreach experiment |
| **Baseline** | 0 — no live-session demo capability exists today |
| **Target** | ≥3 qualified follow-up conversations from the 5-person outreach cohort |
| **Minimum signal** | ≥1 qualified follow-up — below this the demo framing needs rework before a broader outreach round |
| **Measurement method** | Qualitative: operator (Hamish King) records outcome of each outreach session (follow-up / no follow-up / declined). Measured after each session, summarised at end of outreach experiment. Not automated. |

---

## Metric Coverage Matrix

*(Populated by /definition after stories are created.)*

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1: Assumption card render reliability | TBD — assumption cards UI story | Gap — pending /definition |
| M2: Downstream rework rate | TBD — all ideate-web-ux stories (indirect); SKILL.md tuning story (direct via emission) | Gap — pending /definition |
| M3: Session completion rate | TBD — context manifest + assumption cards + live draft stories (together enable the full session UX) | Gap — pending /definition |
| MM1: Marker emission consistency | SKILL.md tuning story (DoD entry condition) | Gap — pending /definition |
| MM2: Commercial legibility | Cluster 4 live draft story (enables the demo moment) | Gap — pending /definition |

---

## Spike evidence

**Spike A1** (`artefacts/2026-05-21-ideate-web-ux/spikes/a1-sse-architecture-feasibility.md`): SSE architecture confirmed viable. `handlePostTurnStreamHtml` supports `assumptionCard` event type without structural changes. No new model API dependencies required.

**Spike A2** (`artefacts/2026-05-21-ideate-web-ux/spikes/a2-marker-emission-rate.md`): Marker emission experiment — 100% (12/12) in clean-context simulation. Gate (≥70%) PASSED. Open question: multi-turn consistency at turns 6+ (tracked as MM1 DoD condition on SKILL.md tuning story).

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is /definition and /spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
