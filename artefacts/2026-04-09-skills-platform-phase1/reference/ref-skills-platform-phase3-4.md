# Reference: Skills Platform — Phase 3 and Phase 4 Strategic Horizon

**Document type:** Discovery reference material — strategic horizon  
**Drop into:** `artefacts/2026-04-09-skills-platform-phase1/reference/`  
**Last updated:** 2026-04-09 (queryable trace registry; challenger model moved to Phase 2)

> **Note for the discovery skill:** Strategic context only. Do not generate stories from this document. Informs discovery artefact strategic context and Phase 1–2 design constraints — must not foreclose Phase 3–4 patterns.

---

## Phase 3 — Enterprise scale and autoresearch

### Entry conditions

Phase 3 begins when Phase 2 is stable: improvement agent running, living eval suite growing, cross-team observability operational, 10+ squads consuming without the platform team in the critical path.

### Autoresearch loop at enterprise scale

Phase 2 introduced the improvement agent operating within a single squad's `workspace/` context. Phase 3 elevates this to cross-team scale.

**Cross-team failure pattern aggregation:** The improvement agent reads traces not just from local `workspace/traces/` but from the cross-team trace registry. A pattern in one squad's traces may be isolated. The same pattern across five squads is a platform-level harness gap. Phase 3 makes this aggregation systematic.

**Impact-ranked improvement proposals:** The improvement agent ranks proposed SKILL.md diffs by the number of squads whose failure patterns the change would address. High-impact proposals (affecting 3+ squads) are escalated with cross-team trace evidence.

**Staleness detection at scale:** Staleness signals that appear across multiple squads' traces indicate model-capability improvements that have outpaced platform harness updates. Cross-team staleness aggregation surfaces these faster than any single squad's signal would.

**Anti-overfitting at scale:** The self-reflection gate is enforced at both local and cross-team level. The cross-team eval suite (`platform/suite.json`, distinct from squad-level `workspace/suite.json`) is the regression anchor.

### Standards autoresearch

The autoresearch loop extends beyond SKILL.md files to discipline standards. Recurring standards exceptions across squads surface as proposed standards adjustments to CoP co-owners — not floor weakening, but surface-variant codification. CoP co-owners review and approve; the improvement agent proposes.

### Estimation calibration as an EVAL dimension

Real delivery records (actual vs estimated per story, skill set, surface type) are recorded as a structured corpus. EVAL suite gains an estimation accuracy dimension. Calibration adjustments proposed by the improvement agent when a skill set consistently underestimates.

### EA registry live integration

Phase 3 extends the Phase 2 registry integration from surface type classification to full live querying at discovery time.

**Phase 2 established:** Surface type queried from registry at Phase A start; cross-platform dependency detection for stories spanning multiple surfaces. Squads using `context.yml` Path B continue operating without change.

**Phase 3 extends to:** Live query for platform targets, blast radius, and full dependency graph at discovery time — not just surface type. Cross-platform dependencies detected automatically and tracked in decision trace with separate DoD gates per surface. This removes a class of human error that `context.yml` Path B requires the squad to catch themselves (squad unaware their story touches multiple surfaces).

Path B (`context.yml` explicit declaration) remains valid in Phase 3 and beyond. The registry is an enhancement that removes manual steps; it is not a prerequisite for the platform to function.

### Squad-to-platform skill contribution flow

Squads propose skills upstream via a governed contribution process: PR to platform repo with SKILL.md file, EVAL.md scenarios, performance evidence, and rationale for core-tier inclusion. Distinct from platform engineer publish flow — different review threshold, same approval gate.

### Telemetry — queryable cross-team trace registry <!-- ADDED: 2026-04-09 -->

Phase 3 upgrades the squad-level `workspace/traces/` queryable interface (designed in Phase 1, implemented in Phase 2) to a cross-team trace registry.

**Interface promoted:** The squad-level filter interface (`getTraces(filter)`) promotes to a platform-level query with additional dimensions: squad, tribe, domain, surface type, date range, failure pattern, staleness flag. No schema changes required — the Phase 1 interface was designed to be promotable.

**Improvement agent upgrade:** The improvement agent reads cross-team traces via `getTraces(filter)` — it does not scan a flat directory. At 50-team scale, full directory scans are impractical. The queryable interface is what makes cross-team aggregation tractable.

**OpenTelemetry standard:** Traces adopt OpenTelemetry as the standard. New `standards-composition` span records which standards files were composed, at which version, whether any POLICY.md floor was applied or waived.

**Compliance monitoring report:** Audit agent samples the trace backend across squads, produces periodic attestation that the control model operated as designed. Platform team and risk function review.

**ADR-004 tension — unresolved, must be addressed before Phase 3 begins:** A cross-team registry that 50 squads write to and the improvement agent reads from is a persistent data store — effectively a server. This contradicts ADR-004 (no persistent agent runtime, no hosted service). The resolution options are: (a) git-based aggregation — each squad's `workspace/traces/` is a git repo, a scheduled job aggregates them; workable but has scale and freshness limits. (b) A lightweight hosted store accepted as a platform infrastructure dependency at Phase 3 scale — requires revisiting ADR-004. (c) A read-only shared volume mounted in CI — infrastructure-dependent. This decision must be made as a Phase 2 closing item before Phase 3 design begins.

### Design system version propagation

Design system version changes trigger an advisory list of affected stories. Platform team reviews blast radius before merge.

---

## Phase 4 — Adaptive governance and operational domains

### Entry conditions

Phase 4 begins when the autoresearch loop is stable at enterprise scale, the compliance monitoring report is a regular artefact reviewed by the risk function, and the platform is the default delivery governance framework for enterprise engineering.

### Operational domain standards

Standards model extended to operational domains: incident response, change management, capacity planning. The platform's role is the same — encode the standard, gate against it, produce an auditable trace.

### Agent identity layer

Each agent execution tied to a verifiable identity — not just a role label but a signed identity traceable to a specific model version, instruction set version, and execution context.

### Policy lifecycle management

POLICY.md floor changes acquire a governed lifecycle: proposal → review → staged rollout → measurement → retire or promote.

### Open ADRs deferred to Phase 4

These require Phase 3 operational evidence before they can be made responsibly.

1. **Improvement agent governance model at scale** — at what point does the improvement agent's track record justify a lighter-touch human review process? What evidence threshold qualifies a proposed diff for reduced review scrutiny? (Current answer: never. This ADR revisits at Phase 4 data.)
2. **Azure AI Foundry as enterprise runtime** — feasibility assessment. Decision depends on Azure posture at Phase 4.
3. **Cross-squad improvement agent coordination** — shared improvement queue vs independent agents with cross-team aggregation at platform level. Depends on Phase 3 operational learnings.

*Note: Challenger model was previously an open Phase 4 ADR. It has been moved to Phase 2 as a composition of existing components (improvement agent + dev agent + assurance agent). No new infrastructure required.* <!-- ADDED: 2026-04-09 -->

### What stays human in Phase 4

- Authoring story specs and acceptance criteria
- Setting POLICY.md floors
- Merging SKILL.md changes
- Risk function attestation and compliance sign-off
- Benefit metric definition and outcome interpretation
- Cross-squad priority decisions

---

## Design constraints Phase 3–4 places on Phase 1–2

Phase 1–2 designs must not foreclose these:

1. **Trace schema extensibility** — Phase 3 adds `standards-composition` span; Phase 4 adds agent identity fields. Schema must accommodate without breaking existing traces.
2. **`workspace/suite.json` promotable** — squad-level suite files must be mergeable into platform-level suite without schema changes.
3. **`workspace/results.tsv` cross-team comparable** — schema must include enough context (skill-set hash, surface type) for cross-squad comparison.
4. **Queryable trace interface designed for promotion** — the squad-level `getTraces(filter)` interface must use the same filter dimensions as the Phase 3 cross-team registry will. Design the interface in Phase 1 to match the Phase 3 target.
5. **Improvement agent proposal format** — plain markdown + diff, readable in any git host's PR UI without platform tooling.

---

## Changelog

| Date | Change | Section |
|---|---|---|
| 2026-04-09 | Telemetry section expanded — queryable cross-team trace registry as Phase 3 upgrade from Phase 1/2 interface; OpenTelemetry; staleness detection at scale | §Telemetry |
| 2026-04-09 | Challenger model removed from open Phase 4 ADRs; moved to Phase 2 deliverable | §Open ADRs |
| 2026-04-09 | Design constraints: queryable trace interface promotion added as constraint 4 | §Design constraints |
| 2026-04-07 | Autoresearch loop cross-team aggregation; standards autoresearch; Phase 4 ADRs initial set | All |
