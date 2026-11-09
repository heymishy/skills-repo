## Epic: Nothing deferred gets forgotten just because nobody remembers to look

**Discovery reference:** artefacts/2026-11-08-deferred-decision-follow-through/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-deferred-decision-follow-through/benefit-metric.md
**Slicing strategy:** Walking skeleton

Chosen because story 1 (the generalized record schema) and story 2 (the periodic scan) together form the thin, real end-to-end skeleton this epic needs — a record that gets registered and a scan that resurfaces it. Stories 3 (telemetry enrichment), 4 (self-registration), and 5 (UI rendering) each flesh that skeleton out from a different angle, but none of them stand alone without stories 1 and 2 existing first — story 3 specifically enriches story 2's scan output rather than being independently useful, which is the clearest walking-skeleton signal in this epic.

## Goal

When this epic is complete, a deferred item — a discovery-stage scope cut, a `RISK-ACCEPT`, an unmeasured benefit-metric, a backlog thread — becomes a structured, typed record the moment it's deferred (automatically, for `/discovery`, `/decisions`, and `/benefit-metric`), gets resurfaced by a periodic review scan enriched with real PostHog telemetry when available, and is visible in the same web UI surface initiative 4 built for incident records. The two real, currently-unstructured cases from this session (`tfhc-s1`'s pipeline-integrity failure, the C1-vs-Option-C fork-distribution contradiction) prove the mechanism against real history, not synthetic fixtures — and this epic applies the mechanism to its own future deferrals too, closing the loop on itself.

## Architecture constraints scan (Step 1.5)

`.github/architecture-guardrails.md` exists and was read. Relevant constraints:

- **Governed-file PR requirement, multiplied**: story 4 touches three existing governed `SKILL.md` files (`/discovery`, `/decisions`, `/definition-of-done` — corrected at /review from the original `/benefit-metric`, see `decisions.md`) — each needs its own PR under CLAUDE.md's Platform change policy, not a single combined PR, since they're independent files with independent review surfaces.
- **`product/constraints.md` #9** (design-system compliance): only story 5 touches `src/web-ui/` — `hasDesignSystemTrack: true` required at DoR for that story only.
- **`product/constraints.md` #11** (no persistent agent runtime): stories 2 and 3 are triggered/bounded (a CI job or on-demand script), never a standing watcher.
- **`product/constraints.md` #12** (credentials are structural): if story 3's PostHog pull ever runs outside this interactive session (CI-scheduled), the API key lives in a secrets store, never the agent's own environment.
- **`product/constraints.md` #13** (structural governance preferred over instructional): story 4's hooks must be designed so a test can verify a record was actually created after a real `/decisions` `RISK-ACCEPT` or `/discovery` Out-of-Scope write — not just trust that the instruction fired.
- **Cross-initiative sequencing**: stories 1 and 5 depend on initiative 4 shipping its story 1 (record schema) and story 3 (UI surface) first — confirmed binding at this `/definition` stage, recorded as a Dependencies entry on both stories below, not just prose.
- Verified directly before writing stories: `skills/discovery/SKILL.md:519`, `skills/decisions/SKILL.md:264`, `skills/definition-of-done/SKILL.md:274` each genuinely contain a standardized `## State update — mandatory final step` section, confirming story 4's hook points are real and already standardized (not something this story needs to create from scratch). `/benefit-metric`'s equivalent section (`:295`) was the originally-cited third hook, corrected away at /review 2026-11-09 — its own section runs at authoring time, when it cannot observe a DoD-time "still unmeasured" condition.

No guardrail here is a blocker before decomposing.

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    SCHEMA[workspace/incidents.json\\ngeneralized: type field]\n    SCAN[scripts/lib/deferred-item-scan.js]\n    PH[PostHog stage_completed/\\nartefact_commit_* events]\n    HOOK1[discovery/SKILL.md State update]\n    HOOK2[decisions/SKILL.md State update]\n    HOOK3[definition-of-done/SKILL.md\\nStep 6 / State update]\n    PV[products.js\\n_renderConsolidatedFeaturesSection]\n    HOOK1 -->|ddft-s4| SCHEMA\n    HOOK2 -->|ddft-s4| SCHEMA\n    HOOK3 -->|ddft-s4| SCHEMA\n    SCHEMA -->|ddft-s1| SCAN\n    PH -->|ddft-s3| SCAN\n    SCHEMA -->|ddft-s5| PV"}}---

## Out of Scope

- **Automated trigger-condition detection** — confirmed infeasible (free-text `Revisit trigger` fields across real history); periodic human-review surfacing only.
- **Building new business-level product instrumentation** — surfaces the gap as a record, doesn't close it.
- **Backfilling historical `decisions.md`/`capture-log.md` entries** — new deferrals going forward, plus the 2 seeded real cases, only.
- **Auto-resolving or auto-closing deferred items** — surfaces for human judgment, never closes anything itself.
- **Adding new PostHog instrumentation** — consumes existing events only.
- **Cross-feature strategic prioritization or ranking** — surfaces everything in scope; ranking is a downstream human call.
- **Generalizing the record schema beyond `incident` | `deferred-item`** — narrowly typed for this MVP.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Deferred-item record mechanism existence | 0 structured records — both seeded cases known but unstructured | Both seeded cases exist as structured records | Story 1 |
| Periodic review scan coverage | 0% — `tfhc-s1` never once reached a decision point via any mechanism | 100% of registered records surfaced at least once per scan cycle | Story 2 |
| Real telemetry signal feed quality | 0% of reviews include real cost/commit data today | Cites real figures when available, degrades gracefully when not | Story 3 |
| Self-registration coverage | 0% of new deferrals automatically become records today | 100% of deferrals from all 3 hooked skills register automatically | Story 4 |
| Web UI rendering existence | 0 deferred-item records visible anywhere | Renders ≥1 seeded real record in the shared surface | Story 5 |

## Stories in This Epic

- [ ] Deferred-item record mechanism (generalized schema) — ddft-s1
- [ ] Periodic review scan — ddft-s2
- [ ] Real telemetry signal feed — ddft-s3
- [ ] Self-registration at the moment of deferral — ddft-s4
- [ ] Web UI rendering alongside incident records — ddft-s5

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Story 4 patches three governed skill files that shape every future `/discovery`, `/decisions`, and `/benefit-metric` session — a mistake there has wide blast radius across this repo's whole pipeline, warranting human PR review before merge even though nothing here is regulated or customer-facing.

## Complexity Rating

**Rating:** 2
**Rationale:** Story 1's schema generalization is low-complexity (additive, confirmed safe since neither schema has implementation yet). Story 4 is the most structurally invasive (3 separate governed-file PRs) but each individual hook is simple. Story 3's main complexity is handling sparse/absent telemetry gracefully, not the PostHog query itself.

## Scope Stability

**Stability:** Stable
**Rationale:** Every assumption behind this MVP (schema generalization safety, hook-point existence, telemetry volume) was verified with real code or real data during /clarify — this discovery had the strongest pre-verification discipline of the tranche, and nothing further needed correction at /definition time.
