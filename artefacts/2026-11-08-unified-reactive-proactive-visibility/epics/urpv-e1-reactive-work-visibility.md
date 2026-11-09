## Epic: Engineers and team leads see reactive work alongside planned work, not just half the picture

**Discovery reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/benefit-metric.md
**Slicing strategy:** Vertical slice

Chosen because each of the four stories below is independently demo-able and delivers a complete, observable piece of value on its own — a fixed sync bug, a visible reactive/planned tag, a second real data source rendered, a rollup count — rather than one story being an incomplete skeleton the others flesh out. The dependency between them is data availability (story 1 must ship before 2-4 show real data), not structural incompleteness, so vertical slice fits better than walking skeleton.

## Goal

When this epic is complete, a product connected to a GitHub repo (including this repo's own dogfooded product row) shows its repo's reactive work — short-track stories and `decisions.md` RISK-ACCEPT/SCOPE entries — directly alongside its planned story work in the existing consolidated features view (`_renderConsolidatedFeaturesSection`, `src/web-ui/routes/products.js`), visually tagged, with a basic reactive-vs-planned load count. Connecting a repo to a product reliably pulls its real `pipeline-state.json` data in immediately, without a manual refresh step first.

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    PRC[routes/product-repo.js\\n_applyRepoChange]\n    PRR[modules/product-rollup.js\\ntriggerProductSync]\n    PSA[adapters/pipeline-state-fetch-adapter.js]\n    PV[routes/products.js\\n_renderConsolidatedFeaturesSection]\n    AF[adapters/artefact-fetcher.js\\nfetchRepoPath]\n    PAS[modules/pod-assignment-store.js\\ngetFeaturePodAssignments]\n    PRC -->|urpv-s1: auto-trigger sync on connect| PRR\n    PRR --> PSA\n    PRR -->|computeTaxonomyRollup / mergeFeatureSources, carries track| PV\n    PV -->|urpv-s2: track tag| PV\n    PV -->|urpv-s3: decisions.md entries| AF\n    PV -->|urpv-s4: pod rollup| PAS"}}---

## Architecture constraints scan (Step 1.5)

`.github/architecture-guardrails.md` exists and was read. Relevant constraints surfaced before decomposition:

- **ADR-025** (multi-tenancy): all queries this epic's stories touch must remain `tenant_id`-scoped, consistent with every other query in `src/web-ui/routes/products.js`.
- **ADR-011 / Artefact-first**: this epic itself satisfies ADR-011 for the dashboard behavioural changes it introduces — no story here proceeds without this chain.
- **ADR-007** (EA registry surface-type mapping): no EA registry entry exists for `src/web-ui/routes/products.js`, and no `architecture.surface_type` Path B declaration exists in `context.yml` either (confirmed at discovery). Proceeding without an auto-injected surface type — a known, already-logged gap, not a blocker.
- **Mandatory constraint MC-A11Y-02** (colour not sole indicator): the reactive/planned tag introduced in story 2 must carry a text label or icon, not colour alone.
- **`product/constraints.md` #9** (design-system compliance): stories 2, 3, and 4 touch `src/web-ui/` with visible rendering changes — `hasDesignSystemTrack: true` and `H-DESIGN` gate compliance required at DoR. Story 1 is backend-only (no rendering change) and does not require this flag.
- **CLAUDE.md / D37 injectable adapter rule**: story 1 reuses the *existing*, already-wired `pipelineStateFetchAdapter` (`pipeline-state-fetch-adapter.js`) via the existing `triggerProductSync` function — it does not introduce a new injectable adapter, so D37's four mandatory requirements do not newly apply here (no new stub-default, no new wiring task). This is explicitly called out so `/review` doesn't flag a missing D37 compliance check for an adapter this story doesn't create.

No guardrail here is a blocker before decomposing.

## Out of Scope

- **Incident records, patch/deploy events, and fork-sync status as data sources** — these artefact types don't exist yet (scope of the incident-triage-and-respond and CI/CD-automation initiatives); this epic's rendering/rollup is artefact-source-agnostic so it can pick them up later without a redesign.
- **A scheduled/periodic background resync mechanism** — explicitly considered and deferred in `decisions.md` (2026-11-09, SCOPE). Story 1 only fixes sync-on-connect; an always-on polling mechanism is a distinct, larger capability deferred until real evidence of ongoing staleness justifies it.
- **True per-individual-engineer attribution** — story 4's rollup is scoped to pod-level counts via the existing `pod_assignments` mechanism (`pod-assignment-store.js`), not a new per-engineer identity/assignment system. For a product with no pod configured (e.g. this repo's own personal-scope dogfooded product), items fall into a single "Unassigned" bucket — a real, honest degenerate case, not an error.
- **Freeform ticket creation or manual task entry** — excluded by `product/mission.md`'s boundary; nothing here adds a manual entry UI.
- **Live enterprise-fork sync/drift status** — deferred past this MVP per discovery.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Reactive-work coverage on the surface | 0% — confirmed today, zero short-track stories visually tagged, zero `decisions.md` reactive entries rendered | 100% of existing short-track stories and `decisions.md` RISK-ACCEPT/SCOPE entries rendered | Stories 1 (makes real data reach the page at all), 2 (tags short-track items), and 3 (renders `decisions.md` entries) together close this gap |
| EM/team-lead real usage for load visibility | Not yet established — no usage metric can exist before ship | ≥1 observed instance of a team lead using the rollup for a real planning/reporting decision within month 1 | Story 4 ships the rollup this metric measures usage of |
| Rollup completeness (undercount risk) | Not yet established — genuinely unmeasured today | A real spot-check completed within month 1, whatever number it turns out to be | Story 4 is the prerequisite the spot-check compares against — without it, there's nothing to spot-check |

## Stories in This Epic

- [ ] Auto-sync a product's `pipeline-state.json` immediately on repo connection — urpv-s1
- [ ] Tag short-track features as reactive work in the consolidated features view — urpv-s2
- [ ] Surface `decisions.md` RISK-ACCEPT/SCOPE entries as a second reactive-work source — urpv-s3
- [ ] Reactive-vs-planned load rollup by pod — urpv-s4

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches a production multi-tenant web-ui surface (`src/web-ui/routes/products.js`) serving real connected products, and modifies a GitHub-API-backed sync path (story 1) — not customer-PII-sensitive and not a regulated/PCI path, but warrants a human PR review checkpoint before merge rather than fully autonomous proceed.

## Complexity Rating

**Rating:** 2
**Rationale:** Most of the underlying mechanisms (taxonomy sync, pod assignment, decisions.md read primitive) already exist and are proven — this is substantially a "carry a field through" and "add a read call" epic, not new infrastructure. Rated 2 rather than 1 because story 3's `decisions.md` entry parsing and story 4's pod-join have real, if bounded, design ambiguity.

## Scope Stability

**Stability:** Stable
**Rationale:** The MVP was corrected and locked at /definition time against the real, verified architecture (see decisions.md, 2026-11-09 ARCH + SCOPE entries) — not against an unverified assumption, which is what made the original (pre-correction) scope unstable.
