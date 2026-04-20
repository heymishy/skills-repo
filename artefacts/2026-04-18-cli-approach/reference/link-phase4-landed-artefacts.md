# Link: Phase 4 landed artefacts (from heymishy master)

**This is a pointer file.** All targets are in-tree — master was merged into this branch 2026-04-18. Paths below are repo-relative to this reference folder.

These supersede (or substantially clarify) several sections of the original strategic horizon document (`link-ref-skills-platform-phase4-5.md`). Read these first; treat phase4-5 as backgrounder.

---

## 1. Canonical architectural decisions

- **ADR register (includes ADR-013 Phase 4 enforcement architecture):** [`../../../.github/architecture-guardrails.md`](../../../.github/architecture-guardrails.md)
- **Phase 4 decisions log** (includes Spike C resolution — upstream authority, lockfile, sidecar, zero-commit): [`../../2026-04-19-skills-platform-phase4/decisions.md`](../../2026-04-19-skills-platform-phase4/decisions.md)

## 2. Phase 4 outer-loop foundation

- **Discovery:** [`../../2026-04-19-skills-platform-phase4/discovery.md`](../../2026-04-19-skills-platform-phase4/discovery.md)
- **Benefit-metric:** [`../../2026-04-19-skills-platform-phase4/benefit-metric.md`](../../2026-04-19-skills-platform-phase4/benefit-metric.md)
- **Experiment scorecard / NFR profile / scope accumulator:** in the same folder.

## 3. Spike outputs (DoD-complete)

- **Spike A — governance extractability:** DoD [`../../2026-04-19-skills-platform-phase4/dod/p4-spike-a-dod.md`](../../2026-04-19-skills-platform-phase4/dod/p4-spike-a-dod.md) · raw output [`../../2026-04-19-skills-platform-phase4/spikes/spike-a-output.md`](../../2026-04-19-skills-platform-phase4/spikes/spike-a-output.md)
- **Spike B1 — CLI + MCP boundary enforcement:** DoD [`../../2026-04-19-skills-platform-phase4/dod/p4-spike-b1-dod.md`](../../2026-04-19-skills-platform-phase4/dod/p4-spike-b1-dod.md) · raw output [`../../2026-04-19-skills-platform-phase4/spikes/spike-b1-output.md`](../../2026-04-19-skills-platform-phase4/spikes/spike-b1-output.md)
- **Spike B2 — orchestration + schema enforcement** (**not** CLI, despite earlier phase4-5 doc suggesting otherwise): DoD [`../../2026-04-19-skills-platform-phase4/dod/p4-spike-b2-dod.md`](../../2026-04-19-skills-platform-phase4/dod/p4-spike-b2-dod.md) · raw output [`../../2026-04-19-skills-platform-phase4/spikes/spike-b2-output.md`](../../2026-04-19-skills-platform-phase4/spikes/spike-b2-output.md)
- **Spike C — distribution model:** raw output [`../../2026-04-19-skills-platform-phase4/spikes/spike-c-output.md`](../../2026-04-19-skills-platform-phase4/spikes/spike-c-output.md)

## 4. Directly CLI-relevant

- **E3 epic (structural enforcement):** [`../../2026-04-19-skills-platform-phase4/epics/e3-structural-enforcement.md`](../../2026-04-19-skills-platform-phase4/epics/e3-structural-enforcement.md)
- **CLI enforcement DoR + story + test-plan + verification:** [`../../2026-04-19-skills-platform-phase4/dor/p4-enf-cli-dor.md`](../../2026-04-19-skills-platform-phase4/dor/p4-enf-cli-dor.md) · [`../../2026-04-19-skills-platform-phase4/stories/p4-enf-cli.md`](../../2026-04-19-skills-platform-phase4/stories/p4-enf-cli.md) · [`../../2026-04-19-skills-platform-phase4/test-plans/p4-enf-cli-test-plan.md`](../../2026-04-19-skills-platform-phase4/test-plans/p4-enf-cli-test-plan.md) · [`../../2026-04-19-skills-platform-phase4/verification-scripts/p4-enf-cli-verification.md`](../../2026-04-19-skills-platform-phase4/verification-scripts/p4-enf-cli-verification.md)
- **Enforcement decision DoR** (which mechanism for which surface): [`../../2026-04-19-skills-platform-phase4/dor/p4-enf-decision-dor.md`](../../2026-04-19-skills-platform-phase4/dor/p4-enf-decision-dor.md)

## 5. Parallel Opus draft (alternative framing)

- [`../../2026-04-19-skills-platform-phase4-opus/`](../../2026-04-19-skills-platform-phase4-opus/) — earlier Opus-generated Phase 4 draft with different epic numbering (e1-e4 mapping differently). Compare if useful; likely superseded by the non-opus folder above.

## 6. Previously-pointer reference (status: backgrounder)

- `link-ref-skills-platform-phase4-5.md` (this folder) → the strategic horizon document that originally informed this feature. Still useful for framing and the five-mechanism matrix; several forward-looking sections now answered by the spike DoDs and decisions above.

---

## What the clarify agent should take from these

- **Spike B2 is not CLI.** heymishy's B2 scope is orchestration-schema-enforcement; CLI is a separate mechanism (see `p4-enf-cli`). The cli-approach feature's earlier framing as "Spike B2 reference implementation" is off — CLI is one mechanism within E3 (structural enforcement), not specifically B2.
- **Spike C resolved the distribution questions** §16 had deferred (§16.1, 16.2, 16.3, 16.8, 16.9, 16.10). Read Spike C output; fold conclusions into discovery rather than listing them as spike-deferred.
- **Spike A resolved governance extractability** — the major unknown in the phase4-5 strategic doc. Verdict is in its DoD: determines whether the feature is positioned as an adapter around a shared core, or a separate implementation aligning on skill format + trace schema only.
- **ADR-013 is the canonical Phase 4 enforcement architecture decision.** Reconcile any discovery claims that imply a different architecture.
