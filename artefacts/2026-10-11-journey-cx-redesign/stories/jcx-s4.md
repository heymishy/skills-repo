## Story: Persona card on the Customer experience tab, pre-populated from the product's own discovery artefacts

**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Discovery reference:** artefacts/2026-10-11-journey-cx-redesign/discovery.md
**Benefit-metric reference:** artefacts/2026-10-11-journey-cx-redesign/benefit-metric.md
**Domain:** [web-ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead)**,
I want **a persona card on the Customer experience tab, pre-populated from personas already named in this product's own discovery artefacts**,
So that **I don't have to re-type a persona from scratch when one was likely already named during the feature's own discovery — I just confirm or adjust it**.

## Benefit Linkage

**Metric moved:** M1 — Operator CX judgment vs. the reference bar
**How:** Persona framing is a core, best-practice-confirmed journey-map element (`spikes/cjm-best-practice-outcome.md`, finding 4) — this is the second of the two headline elements (alongside `jcx-s3`'s emotion curve) that close the gap to the reference examples. Pre-population (vs. a blank form) is what makes this genuinely low-friction rather than just another field to fill in.

## Architecture Constraints

- **New entity confirmed via reuse-check (ADR-026, 2026-10-11):** no existing table covers end-customer persona data — confirmed by checking `customer_journeys`, `customer_journey_stages`, and all other journey-related tables directly; the only "persona" hits anywhere in this codebase are unrelated admin-impersonation code. Proceeding as a genuinely new addition, not a reuse.
- **Persona pre-population is scoped by product, not the whole repo** — `customer_journeys.product_id` already exists (confirmed by reading `server.js`'s own inline migration directly); the legacy `journeys` table (`journey-store-pg.js`) holds `feature_slug` values scoped by `product_id`. The pre-population scan reads `artefacts/[feature_slug]/discovery.md`'s own "Who It Affects" section for each `feature_slug` associated with this journey's `product_id`.
- **ADR-025** — the new `customer_journeys` columns must remain tenant-scoped through the existing ownership-check pattern; no new cross-tenant read path introduced by the scan (the scan only reads `artefacts/` files on local disk, matching `handleGetJourneyCanvas`'s own existing `pipeline-state.json`-reading precedent — not a new DB query pattern).

## Dependencies

- **Upstream:** None — `product_id` already exists on `customer_journeys`; no upstream story needed.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a journey associated with a product that has 1+ features with a discovery artefact naming a persona (the "Who It Affects" section), When the operator opens the persona card editor for the first time (no persona set yet), Then the card offers the discovered persona(s) as selectable suggestions — not a blank form with no starting point.

**AC2:** Given a product with no features that have a discovery artefact, or none naming a persona, When the operator opens the persona card editor, Then it falls back to a plain blank-entry form — no broken empty state, no error.

**AC3:** Given the operator selects a suggested persona (or types their own), When they save, Then `customer_journeys` is updated with `persona_name`, `persona_role`, `persona_goal` (new `TEXT` columns, confirmed via operator sign-off 2026-10-11) and the persona card on the Customer experience tab renders it.

**AC4:** Given a journey with a persona already set, When the operator opens the editor again, Then it shows the currently-saved persona for editing — not re-offering the original discovery-sourced suggestions as if nothing were saved yet.

**AC5:** Given multiple features under the same product name different personas in their own discovery artefacts, When suggestions are offered, Then all distinct personas found are shown as separate options — the scan does not silently pick one or merge them.

## Out of Scope

- Multi-persona support per journey — single-persona scope, confirmed at `/discovery`/`/clarify`.
- Automatically re-syncing the persona card if the source discovery artefact's "Who It Affects" section changes after the journey's persona was already saved — one-time pre-population suggestion, not an ongoing sync.
- Parsing arbitrary free-text discovery artefacts with fuzzy NLP — the scan reads the "Who It Affects" section as plain text and surfaces it as a suggestion string; it does not attempt to extract structured name/role/goal fields from prose automatically (the operator confirms/edits into the 3 fields).

## NFRs

- **Performance:** The discovery-artefact scan reads a bounded number of files (features under one product, not the whole repo) — expected to complete well within normal page-interaction latency.
- **Security:** No new cross-tenant exposure — `artefacts/` files are read the same way `handleGetJourneyCanvas` already reads `pipeline-state.json` (local filesystem, not tenant-partitioned data).
- **Accessibility:** Persona card and its editor meet WCAG 2.1 AA (product/constraints.md #9).
- **Audit:** None — persona data is descriptive, not sensitive.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

---CANVAS-JSON: {"type":"data-model","title":"Data model","content":{"mermaid":"erDiagram\n    CUSTOMER_JOURNEYS {\n        uuid id PK\n        text tenant_id\n        text name\n        text description\n        uuid product_id FK\n        text persona_name\n        text persona_role\n        text persona_goal\n    }"}}---

<!-- persona_name/persona_role/persona_goal are new TEXT columns on customer_journeys, confirmed via operator sign-off 2026-10-11 (option 1: new end-customer persona, DB columns, pre-populated from discovery.md scan). product_id already exists (confirmed by reading server.js's own inline migration directly) -- no FK change needed, just the 3 new descriptive columns. -->
