## Story: Add a placeholder feature to a journey stage, triggering a new seeded discovery

**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Discovery reference:** artefacts/2026-10-11-journey-cx-redesign/discovery.md
**Benefit-metric reference:** artefacts/2026-10-11-journey-cx-redesign/benefit-metric.md
**Domain:** [web-ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead)**,
I want **to add a placeholder feature to a journey stage and trigger a new `/discovery` run from it**,
So that **the journey map itself can be the source of new pipeline work, not just a record of what already exists**.

## Benefit Linkage

**Metric moved:** M2 — Placeholder-feature trigger actually used
**How:** This story builds the entire mechanism M2 measures — without it, the count is permanently 0.

## Architecture Constraints

- **ADR-025** — multi-tenancy enforced at the application layer. The new mapping write and the trigger action must both use the same ownership-check-before-mutation pattern (`handlePostFeatureMapping`'s own `SELECT cjs.id FROM customer_journey_stages ... JOIN customer_journeys` check, confirmed by reading `src/web-ui/routes/journeys.js` directly) — 404, not 403, for a cross-tenant stage id.
- **ADR-011** — Artefact-first: the new `/discovery` run this story triggers must itself go through the normal discovery → benefit-metric → ... chain; this story does not bypass that pipeline, it only seeds Section 1 of a normal `/discovery` session.
- **No injectable adapter (D37 N/A):** the trigger's own folder-creation and `discovery.md`-seeding are plain `fs` operations, not a call to an external/swappable system — confirmed by this story's own test plan (`jcx-s1-test-plan.md`'s AC2 integration test calls the real handler and asserts directly against real `fs` state, no mock adapter). D37 does not apply.
- **`feature_slug` dual-use, confirmed via `/review` finding 1-M2 (2026-10-11):** for a placeholder row, `feature_customer_journey_stage_mappings.feature_slug` holds the operator-provided placeholder *name* (free text), not a resolvable feature slug — it only becomes a real, resolvable slug once `jcx-s2`'s own conversion step runs. Any code in this story or `jcx-s2` that queries or joins `feature_slug` against `pipeline-state.json` features MUST check `mapping_state = 'linked'` first — never assume `feature_slug` is resolvable without checking that field.

## Dependencies

- **Upstream:** None — this is the first story in the epic (walking skeleton foundation).
- **Downstream:** `jcx-s2` (auto-conversion on discovery approval) depends on this story's own placeholder state field existing first.

## Acceptance Criteria

**AC1:** Given a journey stage with no features mapped to it, When the operator adds a placeholder feature (providing a name, not an existing `feature_slug`), Then a new row is written to `feature_customer_journey_stage_mappings` with an explicit placeholder state (a new state field — today's table has no way to distinguish an intentional placeholder from the existing accidental "feature not found" warning case the Delivery view already shows for an unresolvable `feature_slug`).

**AC2:** Given a stage with a placeholder feature, When the operator triggers it, Then a new `artefacts/[feature-slug]/` folder is created and `/discovery`'s Section 1 (problem statement) is seeded with that stage's own context (name, description, emotion, pain points, opportunities, touchpoints) — confirmed via `/clarify`, 2026-10-11.

**AC3:** Given a cross-tenant journey stage id, When any placeholder-feature or trigger action is attempted against it, Then the request returns 404 (not 403), matching `handlePostFeatureMapping`'s own established cross-tenant policy (decisions.md D13).

**AC4:** Given a stage already has 1+ real (non-placeholder) features mapped to it, When the operator adds a placeholder feature to the same stage, Then both coexist — a stage is not limited to either all-real or all-placeholder mappings.

**AC5:** Given a placeholder feature that has not yet been triggered, When the operator views the stage, Then it renders with a distinct `sw-mapping--placeholder` class and a visible "Placeholder" label — never sharing markup with the existing feature-not-found warning row (`/review` finding 1-M1, revised 2026-10-11).

## Out of Scope

- The auto-conversion from placeholder to linked once the triggered discovery is approved — that is `jcx-s2`.
- Richer discovery seeding beyond Section 1 (e.g. pre-populating Who It Affects or Why Now) — per `/clarify`, confirmed as out of scope for this MVP (Option A chosen over B).
- A finer-grained permission tier for who can trigger — per `/clarify`, confirmed as using the same non-viewer authorization as every other mutating route; `jcx-s5` covers the explicit hardening/verification pass.

## NFRs

- **Performance:** Trigger action completes within normal page-interaction latency (under 2 seconds) — creating a feature folder and seeding one markdown section is lightweight, no heavy computation.
- **Security:** Same CSRF guard and ownership-check-before-mutation pattern as every other mutating route in `journeys.js` (D13). The trigger must not allow path traversal via a crafted feature name (mirrors the `ougl` path-traversal guard convention — `path.resolve` + `startsWith(repoRoot)` check — `CLAUDE.md` Coding standards).
- **Accessibility:** The "add placeholder" and "trigger" affordances meet WCAG 2.1 AA (product/constraints.md #9) — keyboard-operable, visible focus state, matching `ic-s4`'s own established pattern for this app.
- **Audit:** The trigger action is traceable — the created feature folder/artefact should record which journey stage it was triggered from (needed for `jcx-s2`'s own auto-conversion to find its way back).

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable

<!-- Rating 3, not 2: this is the single most novel, highest-uncertainty piece of the whole epic -- a UI action kicking off a backend pipeline run is unprecedented in this app, and the exact feature-folder-creation + Section-1-seeding mechanism has no existing code to model against directly. -->

---CANVAS-JSON: {"type":"data-model","title":"Data model","content":{"mermaid":"erDiagram\n    CUSTOMER_JOURNEY_STAGES {\n        uuid id PK\n        uuid journey_id FK\n        text tenant_id\n        text name\n        integer position\n    }\n    FEATURE_CUSTOMER_JOURNEY_STAGE_MAPPINGS {\n        uuid id PK\n        uuid journey_stage_id FK\n        uuid journey_id FK\n        text tenant_id\n        text feature_slug\n        jsonb metric_keys\n        text mapping_state\n    }\n    CUSTOMER_JOURNEY_STAGES ||--o{ FEATURE_CUSTOMER_JOURNEY_STAGE_MAPPINGS : \"has mappings\""}}---

<!-- mapping_state is the new column this story adds (TEXT NOT NULL DEFAULT 'linked' -- existing rows implicitly mean "linked to a real feature"; new placeholder rows explicitly set 'placeholder'). CUSTOMER_JOURNEY_STAGES is reused with no schema change (AC2 of the csd-s4 marker convention). Column names for both entities match scripts/migrate-schema-journeys.js exactly, confirmed by reading that file directly. -->

