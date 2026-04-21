# Discovery: Modernisation Decompose — Bridging /reverse-engineer to the Delivery Pipeline

**Status:** Approved
**Created:** 2026-04-22
**Approved by:** Hamish, 2026-04-22
**Author:** Copilot / Hamish (via problem brief 2026-04-22)

---

## Problem Statement

The `/reverse-engineer` skill produces a system-level corpus artefact (business rules, interface contracts, regulatory inventory, parity test seeds) for a legacy codebase. The `/discovery` skill expects a bounded feature brief as its conversational input — a sentence or two describing a problem, named personas, and scoped MVP. These two units of analysis are incompatible: a 200-rule catalogue cannot be passed to `/discovery`.

The practical consequence: every programme engineer manually decomposes a rev-eng corpus into N candidate features before the outer loop can begin. At ~50-team scale (large-scale Java modernisation — card platforms, payments engines, statement generation, batch processing), different people cut features differently. The downstream artefacts — stories, test plans, DoR contracts — are incomparable across squads, blocking cross-team dependency tracking and programme-level review.

Three related gaps share the same root cause:

1. No corpus-to-feature decomposition step exists in the pipeline. Every team improvises.
2. The outer loop has no convergence criterion. Re-runs of `/reverse-engineer` accumulate artefacts without a defined exit condition.
3. `/definition`'s four slicing strategies (vertical slice, walking skeleton, user journey, risk-first) are greenfield shapes. Modernisation work naturally cuts as parity-first or strangler-fig — neither is offered.
4. `/review` Category A treats non-metric-linked stories as HIGH findings. For pure parity features this is mis-calibrated — the story is traceable to a rule, not a user outcome, and should carry an umbrella parity metric rather than an individual metric per story.

---

## Who It Affects

**Delivery squad lead / modernisation architect** — receives a rev-eng report and must manually decompose it into candidate features before starting the outer loop. Does this by intuition today; no consistent heuristic exists. One bounded context in a ~1M LOC Java monolith typically yields 30–200 extracted rules and 5–40 interfaces.

**Programme lead (multi-squad modernisation)** — owns feature boundary decisions across ~50 squads. Divergent decompositions produce incomparable pipeline artefacts, blocking cross-team review and dependency tracking. Currently has no enforcement mechanism.

**Platform maintainer** — owns the skill library. The `/reverse-engineer` completion statement currently instructs teams to "run /discovery using the pre-populated input in Section 9 of the full report" — but `/discovery` cannot accept a corpus as input. The handoff is broken and the platform maintainer has no consistent decomposition logic to point teams to.

---

## Why Now

The `/reverse-engineer` skill reached maturity in Phase 3. The handoff gap is now the binding constraint in the modernisation pipeline flow. With an enterprise modernisation programme (~50 teams ramping across multiple systems), inconsistency in feature decomposition now scales linearly. Waiting compounds the problem: squads who decompose now will have produced divergent artefacts that require retroactive re-decomposition when the bridging skill lands later. The correct time to fix the handoff is before the programme scales, not during it.

---

## MVP Scope

1. **New skill `/modernisation-decompose`** that takes a completed reverse-engineering report as input and produces `candidate-features.md` — N candidate feature slugs with bounded scope, each pre-populated for a single `/discovery` run.

2. **Concrete Java-specific decomposition heuristics** embedded in the skill: Maven module boundaries, Spring `@Service` clustering, JPA aggregate ownership, `@Transactional` span analysis, and cross-cutting concern isolation as signals for good vs bad feature boundaries.

3. **Outer-loop convergence criterion** defined as a visible metric (not a hard gate) — a measurable ratio (e.g. module coverage percentage, `[VERIFIED]:[UNCERTAIN]` rule rating ratio) written to the corpus artefact and surfaced on the pipeline visualiser per system-slug. Teams self-correct; the platform gains real signal on extraction maturity.

4. **Umbrella parity metric convention** defined as a rule inside the bridging skill: modernisation features produced by `/modernisation-decompose` automatically carry an umbrella Tier-3 parity metric, and every story generated from the candidate feature references it. This resolves the `/review` Category A mis-calibration and the `/definition` slicing gap without requiring formal spec changes to either skill.

---

## Out of Scope

- **Modernisation-specific slicing strategies in `/definition`** (`parity-first`, `strangler-fig` as first-class picker options) — the bridging skill pre-selects `risk-first` with a modernisation flag; adding these options to `/definition` adds noise for the 80% of greenfield users who never see a rev-eng corpus. Deferred unless greenfield/modernisation coexistence in the same repo becomes a concrete need.

- **Corpus-input mode in `/discovery`** (Option C from the brief) — does not solve the scale and consistency problem. Still requires a human to manually pick one area at a time; the 50-team divergence problem remains. Out of scope for this feature.

- **Formal spec changes to `/review` Category A** — the umbrella metric convention is sufficient to resolve the mis-calibration for modernisation work. Formal spec changes to `/review` are governed changes that require their own pipeline chain. Out of scope here.

- **Non-Java codebase decomposition heuristics** (COBOL, PL/SQL, .NET, etc.) — the immediate use case is enterprise Java systems. Other language signals may differ substantially; deferring to avoid premature generalisation. The skill design should accommodate future extension points but not implement them in this iteration.

---

## Assumptions and Risks

**ASSUMPTION-01 — Option A is the correct solution shape.** A new `/modernisation-decompose` bridging skill is preferable to extending `/reverse-engineer` (Option B would make an already-large skill do two jobs with different audiences and review cadences) or extending `/discovery` (Option C doesn't solve the scale problem). Confirmed by brief author.

**ASSUMPTION-02 — Umbrella metric convention is sufficient for `/review` Category A.** We assume that requiring every story from a modernisation candidate feature to reference an umbrella parity metric is enough to prevent false HIGH findings in `/review` Category A — without changing `/review`'s formal spec. Risk: if `/review` Category A checks for metric linkage at story level rather than allowing umbrella inheritance, the convention alone may not suppress the finding. The test-plan must validate this.

**ASSUMPTION-03 — Java boundary signals generalise in enterprise  stack.** Maven module boundaries, Spring `@Service` clustering, JPA aggregate ownership, and `@Transactional` span analysis are the primary decomposition signals. Risk: if the target systems are poorly modularised (pre-Maven, multi-module monolith with circular dependencies), the signals may be ambiguous. The skill must have an explicit escalation path for low-confidence boundaries.

**ASSUMPTION-04 — Convergence as a metric (not a gate) is the right model.** Making outer-loop convergence a hard gate incentivises gaming. A visible metric on the visualiser provides real signal without forcing teams to hit an arbitrary threshold before proceeding. Confirmed by brief author. Risk: teams may re-run `/reverse-engineer` indefinitely without the metric becoming a natural stopping signal.

---

## Directional Success Indicators

- A programme lead can run `/modernisation-decompose` on a rev-eng report covering a card-fee-calculation module (~30 rules, 5 interfaces, 3 `[REGULATORY]` items) and get a `candidate-features.md` they would actually use as-is, without manual editing of feature boundaries.
- Two different people running the skill on the same rev-eng report produce comparable (not identical) feature boundaries — same number of features ±1, same rules in the same feature ±10%.
- The convergence metric (module coverage %, `[VERIFIED]:[UNCERTAIN]` ratio) is visible on the pipeline visualiser for each system-slug within one session of running `/modernisation-decompose`.
- Zero HIGH findings in `/review` for a modernisation story that carries the umbrella parity metric convention.

---

## Constraints

- **SKILL.md changes require human review and approval** (product constraint 4 — non-negotiable). The `/modernisation-decompose` SKILL.md must go through the governed path: feature branch → draft PR → platform team review → merge. The coding agent may not merge.
- **Must not pollute the greenfield pipeline.** The bridging skill must be invocable only when a reverse-engineering report exists. It must not appear as a prompt in greenfield `/discovery` sessions.
- **Artefact-first rule applies.** The new SKILL.md may not be merged without a corresponding story artefact (this discovery → benefit-metric → story → test-plan → DoR) committed to `artefacts/` before or alongside the implementation.
- **No hard convergence gate.** The convergence criterion must be recordable as a metric field, not a pipeline block. Teams must be able to proceed to `/modernisation-decompose` at any convergence level, with the metric visible and annotated.

---

## Architecture / Technical Context

This feature introduces one new artefact scope — **system-level corpus** (`artefacts/[system-slug]/`) — as a distinct tier sitting above the existing **feature-level delivery** scope (`artefacts/[YYYY-MM-DD-feature-slug]/`). The bridging skill consumes the system-level corpus and produces feature-level inputs.

An ADR should be logged to formalise this dual-scope model (candidate: ADR-012) before or alongside the implementation. This prevents the next person reading the repo from encountering the same implicit mismatch.

The convergence criterion field should be written to the corpus artefact (or a companion `corpus-state.md`) rather than `pipeline-state.json`, because it tracks system-level extraction progress rather than feature delivery progress. The pipeline visualiser can read corpus-state as a supplementary data source.

**EA registry:** `ea_registry_authoritative: true` in `context.yml`. No EA registry entry exists for the `/modernisation-decompose` skill (it is a new pipeline skill, not a named application). No blast-radius query needed.
