## Epic: Journey maps read as journey maps, and can seed new pipeline work directly from a stage

**Discovery reference:** artefacts/2026-10-11-journey-cx-redesign/discovery.md
**Benefit-metric reference:** artefacts/2026-10-11-journey-cx-redesign/benefit-metric.md
**Slicing strategy:** Walking skeleton — the placeholder-feature trigger mechanism (new, high-uncertainty: a UI action kicking off a backend pipeline run, never done before in this app) is proven thinnest-first (`jcx-s1`/`jcx-s2`) before the better-understood presentation work (emotion curve, persona card) follows.

## Goal

An operator opens the Customer experience tab and sees an actual journey map — a connected emotion curve across stages, a persona card, and (where relevant) one or more features mapped to each stage, including placeholder features for work that doesn't exist yet. From any stage, the operator can add a placeholder feature that, on trigger, opens a new `/discovery` run seeded with that stage's own context — and once that discovery is approved, the mapping automatically converts from placeholder to a real, linked feature. The journey map becomes a legitimate source of new pipeline work, not just a record of what already exists.

## Out of Scope

- **Restyling or rebuilding the free-form canvas** (`ic-s1`–`ic-s4`) — its purpose is reframed in documentation only; its shipped implementation is untouched (per `decisions.md`'s DESIGN entry, 2026-10-11).
- **Per-stage illustration/storyboard** — supplementary per the CX spike, not in this epic; can be added later without restructuring what this epic ships.
- **Hustle-Badger-style build-order callouts** — explicitly deferred, not decided in scope.
- **Multi-persona support per journey map** — single-persona scope for this epic.
- **Downstream lifecycle beyond the placeholder→linked conversion** — e.g. what happens if the resulting feature is later abandoned or renamed; out of scope for this epic, a follow-up question.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Operator CX judgment vs. the reference bar | Not matching (operator's own feedback, 2026-10-11) | Operator judges the redesigned tab as genuinely matching/approaching the reference examples | `jcx-s3`/`jcx-s4` deliver the emotion curve and persona card directly |
| M2 — Placeholder-feature trigger actually used | 0 | ≥1 triggered and reaching `/discovery` approval within 4 weeks of release | `jcx-s1`/`jcx-s2` build the trigger and its full lifecycle end to end |
| M3 — Emotion/persona data actually populated | Unknown exact % (confirmed mostly empty) | ≥25% of touched stages populated within 4 weeks | `jcx-s3`'s emotion curve (with empty state) is the mechanism that prompts this |

## Stories in This Epic

- [ ] `jcx-s1` — Placeholder-feature data model + end-to-end trigger
- [ ] `jcx-s2` — Auto-convert placeholder to linked mapping on discovery approval
- [ ] `jcx-s3` — Emotion curve on the Customer experience tab
- [ ] `jcx-s4` — Persona card on the Customer experience tab
- [ ] `jcx-s5` — Authorization/tenant-scoping hardening pass across the trigger + mapping-conversion surface

## Human Oversight Level

**Oversight:** Medium
**Rationale:** `jcx-s1`/`jcx-s2` introduce a genuinely new trigger surface (UI action kicking off a backend pipeline run) — the first of its kind in this app. Not High, since the actual blast radius is bounded (only creates a draft discovery artefact requiring further human approval gates downstream), but Medium is warranted for a coding agent to pause for human review at PR on those two stories specifically.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity, known unknowns (the trigger mechanism's own wiring), but no spike needed beyond the CX best-practice spike already completed -->

## Scope Stability

**Stability:** Stable

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    ROUTE[routes/journeys.js\\nhandleGetJourneyCanvas]\n    SEEDER[adapters/discovery-seeder.js\\ncreates artefacts/ folder,\\nseeds discovery.md Section 1]\n    SCANNER[adapters/persona-scanner.js\\nscans discovery.md\\nWho It Affects]\n    TRIGGER[routes/journeys.js\\nhandleTriggerPlaceholderFeature]\n    MAPPING[routes/journeys.js\\nhandlePostPlaceholderFeature\\nhandleConvertPlaceholderMapping]\n    SERVER[server.js\\nroute wiring + inline migrations]\n    DB[(customer_journeys\\nfeature_customer_journey_stage_mappings)]\n    ROUTE --> SCANNER\n    ROUTE --> MAPPING\n    TRIGGER --> SEEDER\n    SEEDER --> SERVER\n    MAPPING --> DB\n    SERVER --> DB"}}---
