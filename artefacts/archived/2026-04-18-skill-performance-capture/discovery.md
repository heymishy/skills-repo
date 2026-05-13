# Discovery: Skill Performance Capture

**Status:** Approved — 2026-04-18 (operator direction)
**Created:** 2026-04-18
**Approved by:** [Name + date — filled in after human review]
**Author:** Copilot (Claude Sonnet 4.6) / Hamish

---

## Problem Statement

The platform has no way to produce structured, comparable evidence of how different models perform when executing skills. Post-run judgements are informal — based on artefact quality as observed by the operator — and cannot be replicated, aggregated, or used as governed evidence for framework changes. Running the same outer loop scenario with two different models produces two sets of artefacts but no shared schema for comparing them.

The platform has a governed improvement loop (`/improve`, `/levelup`) designed to consume evidence, but currently has no mechanism to generate the kind of structured, traceable signal those skills need for model-level decisions.

## Who It Affects

**Operator running a comparison experiment** — wants to run the same outer loop scenario with two or more models and get structured, comparable evidence to inform which model to use for a given phase or skill type. Currently makes that decision informally or not at all.

**Platform maintainer tuning skills** — wants empirical signal about which skills are resilient across models vs. sensitive to model choice. Uses the data to prioritise SKILL.md improvements and propose changes through the governed `/improve` loop with evidence rather than intuition.

## Why Now

The platform has operated on a single model to date. New model releases introduce different capability tiers with different request multiplier costs. Before committing Phase 4 work — or recommending a model to contributors — the maintainer needs evidence that the premium is justified by measurably better artefact quality and reasoning fidelity, not just assumption. Without a capture mechanism, that evaluation cannot be done rigorously or repeatably.

## MVP Scope

A capture block appended to each outer loop artefact when instrumentation is opt-in enabled via `context.yml`. The integration mechanism is a **context overlay only**: a `context.yml` `instrumentation:` block instructs the agent to append the capture block at the end of each artefact write. No SKILL.md files are modified. This means capture is self-reported — the agent follows the instruction as a governed behaviour, but there is no turn-by-turn structural enforcement. The reliability class is structured self-report; operators should set expectations accordingly. If stronger enforcement is needed in future, the mechanism can evolve (e.g. MCP tool mediation per Phase 4 Theme B) without changing the capture schema or artefact format.

The block records:

- Structural metrics (turn count, question batching, prescribed vs produced intermediates)
- A fidelity self-report from the agent
- Operator cost proxies (model label + premium request context so cost can be inferred per run)
- An operator review section filled in post-run

One capture block per phase output artefact: `discovery.md`, `benefit-metric.md`, each story `.md`, each test plan `.md`. Gate artefacts (DoR, DoD) do not receive capture blocks — they are pass/fail records, not generative outputs. This gives one data point per phase per run, which is sufficient for side-by-side model comparison without adding noise from gate artefacts.

Two runs of the same outer loop scenario with different model labels produce two sets of artefacts with comparable capture blocks. The operator can read them side by side and make a cost-vs-quality judgement.

The MVP does not automate the comparison — collation and analysis remain manual operator work. The capture block is the data collection mechanism; the analysis is out of scope for this feature.

Experiment output lives in `workspace/experiments/[experiment-id]/` — e.g. `workspace/experiments/sonnet-vs-opus-phase4-discovery/`. This keeps experiment runs as cross-cutting operator workspace activity, separate from `artefacts/` (pipeline inputs, read-only by convention), and allows a single experiment to span multiple features if needed.

## Out of Scope

- **Automated model routing / cost optimisation** — using captured data to structurally route skill invocations to the cheapest sufficient model without operator intervention. That is a future platform capability; this feature only produces the evidence that would inform it.
- **Always-on quality scoring** — continuous, automated artefact quality measurement across all framework usage. Instrumentation is opt-in and experiment-scoped by design; fleet-wide always-on measurement is a separate initiative with different governance implications.
- **Fleet-scale aggregation** — collating capture data across multiple operators or squads into a shared performance dataset. This feature captures per-experiment, per-operator data only.

## Assumptions and Risks

- **Operator can reliably judge output quality** — the operator review section of the capture block assumes the reviewer can distinguish a better artefact from a worse one. If artefact quality differences are subtle or ambiguous, the operator ratings will be noisy and the comparison inconclusive.
- **Artefact quality differences matter at this scale** — assumes that the quality delta between models is large enough to be worth the cost differential. If both models produce artefacts that are good enough for the use case, the comparison produces evidence for "no change needed" rather than a routing decision.
- **Different models will actually produce observably different outputs on the same skill** — the experiment is only useful if there is signal to capture. If models converge on near-identical artefacts for well-specified skills, the capture data will not support differentiation.

## Directional Success Indicators

After two model runs on the same outer loop scenario, the capture data reveals observable differences in: how many repo files each model drew on without being prompted, how many constraints were inferred from context vs. requiring explicit operator input, and how well the produced artefacts link back to platform constraints, prior decisions, and existing artefacts. A "better" run is one where the model surfaced more of the available context unprompted and the artefact references are richer and more accurate. The capture block makes this comparable across runs rather than relying on memory of which run felt better.

## Constraints

- All platform design constraints in `product/constraints.md` apply in full — in particular: C3 (capture data must not modify skill instructions), C4 (human approval gate before any framework change), C5 (SKILL.md hash recorded as loaded, not fabricated), C7 (one question at a time), C11 (capture data lives in the repo as files, not external services), C13 (structural metrics preferred over self-report where both are available), C15 (metrics must be outcome-oriented, not activity-threshold-oriented).
- The instrumentation config block lives in `context.yml` only — no capture behaviour without explicit operator opt-in per experiment.
- Capture is off by default. Consumers of the framework at scale must not pay the overhead of capture when they have not enabled it.
- The capture block is an appendix to artefacts — it must not modify or constrain the primary artefact content.

---

**Next step:** Human review and approval → /benefit-metric

---

## Clarification log

| # | Question | Answer | Section updated |
|---|---|---|---|
| Q1 | How does the capture block get appended — agent instruction via context.yml, or SKILL.md modification? | Option A: context overlay only. `context.yml` instrumentation block instructs the agent; no SKILL.md changes. Reliability class: structured self-report. Can evolve to turn-by-turn MCP mediation later. | MVP Scope (integration mechanism paragraph added) |
| Q2 | Which outer loop artefacts receive the capture block? | Option B: one block per phase output artefact (`discovery.md`, `benefit-metric.md`, each story, each test plan). Gate artefacts (DoR, DoD) excluded. | MVP Scope (artefact scope paragraph added) |
| Q3 | Where does experiment output live in the repo? | Option A: `workspace/experiments/[experiment-id]/` — cross-cutting operator workspace, not tied to a specific feature artefact folder. | MVP Scope (experiment output location sentence added) |
