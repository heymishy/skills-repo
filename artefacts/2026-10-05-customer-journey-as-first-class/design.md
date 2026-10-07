# Design: Customer Journey as First-Class Entity

**Status:** Draft
**Date:** 2026-10-05
**Feature slug:** 2026-10-05-customer-journey-as-first-class

---

## Entry condition confirmation

- Discovery artefact: ✅ `artefacts/2026-10-05-customer-journey-as-first-class/discovery.md` — Approved
- Clarify artefact: ✅ `artefacts/2026-10-05-customer-journey-as-first-class/clarify.md` — Clarified
- Benefit-metric artefact: ✅ `artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md` — Active

---

## Solution Architecture

### Overview

The feature introduces a `journeys` entity as a first-class tenant-scoped resource in the existing Postgres-backed web UI. It follows the established adapter pattern (ADR-025 application-layer multi-tenancy, ADR-026 reuse-existing-entities, ADR-027 live features are app code not skills).

The journey canvas is a new web UI page served by `src/web-ui/server.js`, backed by new route handlers under `src/web-ui/routes/journeys.js`. Journey data is stored in three new Postgres tables (`journeys`, `journey_stages`, `feature_journey_stage_mappings`). No new npm dependencies are introduced.

---CANVAS-JSON: {"type":"system-architecture","title":"As designed: System architecture","content":{"mermaid":"flowchart TD\n    Browser[\"Browser — Journey Canvas\"]\n    Server[\"src/web-ui/server.js\"]\n    Routes[\"src/web-ui/routes/journeys.js\"]\n    JourneyStore[\"src/web-ui/adapters/journey-store-pg.js (extended)\"]\n    Postgres[(\"Postgres\")]\n    PipelineState[\".github/pipeline-state.json (read-only)\"]\n    Browser --> Server\n    Server --> Routes\n    Routes --> JourneyStore\n    JourneyStore --> Postgres\n    Routes --> PipelineState"}}---

### Integration points

- **Postgres** — existing connection pool via `src/web-ui/adapters/journey-store-pg.js` (extended with journey-specific queries); three new tables added via a new migration script
- **`pipeline-state.json`** — read-only at feature-mapping time to populate the feature picker (features available to map to a journey stage); never written by journey routes
- **`src/web-ui/server.js`** — existing URL dispatch extended with `/journeys` route prefix
- **GitHub OAuth session** — existing `req.session.accessToken`, `req.session.userId`, `req.session.tenantId` used for all auth and tenant scoping; no new auth mechanism

### Data and state

Three new Postgres tables, all scoped by `tenantId`:

**`journeys`**
- `id` (UUID PK)
- `tenant_id` (FK → tenants)
- `name` (text, required)
- `description` (text, nullable)
- `product_id` (FK → products, nullable — a journey may span multiple products or be product-agnostic)
- `created_at`, `updated_at`

**`journey_stages`**
- `id` (UUID PK)
- `journey_id` (FK → journeys)
- `tenant_id` (FK → tenants)
- `name` (text, required)
- `position` (integer — ordinal for drag-and-drop ordering; rebalanced on reorder)
- `description` (text, nullable)
- `customer_actions` (text, nullable)
- `touchpoints` (text, nullable)
- `channel` (text enum: web, mobile, in-person, phone, email, other — nullable)
- `emotion` (text enum: positive, neutral, negative, mixed — nullable)
- `pain_points` (text, nullable)
- `opportunities` (text, nullable)
- `moment_of_truth` (boolean, default false)
- `created_at`, `updated_at`

**`feature_journey_stage_mappings`**
- `id` (UUID PK)
- `journey_stage_id` (FK → journey_stages)
- `journey_id` (FK → journeys)
- `tenant_id` (FK → tenants)
- `feature_slug` (text — matches `pipeline-state.json` feature slug; not a FK, as pipeline-state.json is not a DB table)
- `metric_keys` (JSONB array — which DoD metric keys from that feature are surfaced at this stage)
- `created_at`

No changes to `pipeline-state.json` schema. No `journeyStageId` field on feature records. The association lives entirely in `feature_journey_stage_mappings`.

---CANVAS-JSON: {"type":"data-model","title":"As designed: Data model","content":{"mermaid":"erDiagram\n    JOURNEYS {\n        uuid id PK\n        text tenant_id FK\n        text name\n        text description\n        uuid product_id FK\n        timestamptz created_at\n        timestamptz updated_at\n    }\n    JOURNEY_STAGES {\n        uuid id PK\n        uuid journey_id FK\n        text tenant_id FK\n        text name\n        integer position\n        text description\n        text customer_actions\n        text touchpoints\n        text channel\n        text emotion\n        text pain_points\n        text opportunities\n        boolean moment_of_truth\n        timestamptz created_at\n        timestamptz updated_at\n    }\n    FEATURE_JOURNEY_STAGE_MAPPINGS {\n        uuid id PK\n        uuid journey_stage_id FK\n        uuid journey_id FK\n        text tenant_id FK\n        text feature_slug\n        jsonb metric_keys\n        timestamptz created_at\n    }\n    PRODUCTS {\n        uuid id PK\n        text tenant_id FK\n        text name\n    }\n    JOURNEYS }o--|| PRODUCTS : \"scoped to (optional)\"\n    JOURNEY_STAGES }|--|| JOURNEYS : \"belongs to\"\n    FEATURE_JOURNEY_STAGE_MAPPINGS }|--|| JOURNEY_STAGES : \"maps to\"\n    FEATURE_JOURNEY_STAGE_MAPPINGS }|--|| JOURNEYS : \"scoped to\""}}---

### Hosting / runtime

Existing Node.js process — no new service, no new runtime. Journey routes are added to the existing `src/web-ui/server.js` URL dispatch table. Postgres connection is shared via the existing pool in `journey-store-pg.js`.

### Key build decisions

| Decision | Choice | Rationale |
|---|---|---|
| Stage ordering data model | `position` integer column, rebalanced on reorder | Ordered list is sufficient for linear MVP; avoids linked-list complexity while keeping the column queryable for drag-and-drop persistence |
| Feature-to-stage association storage | Postgres join table, not `pipeline-state.json` field | Per clarify.md: delivery state stays independent from business-context associations; join table is queryable and tenant-scoped |
| Feature picker data source | `pipeline-state.json` read at request time | No duplication of feature metadata into Postgres; pipeline-state.json is already the canonical delivery record (ADR-016) |
| Journey canvas rendering | Server-rendered HTML + client-side JS for drag-and-drop | Consistent with existing web UI pattern; no new framework dependency |
| Parallel stages | Deferred — linear sequence only in MVP | Parallel stages require a directed graph model and a significantly more complex canvas layout; linear ordered list keeps scope bounded and does not close the door on a future `parentStageId` extension |

### Non-functional requirements

- All journey and stage data must be scoped by `tenantId` — guard pattern per ADR-025
- No new npm runtime dependencies (product/constraints.md #11)
- Journey canvas keyboard-accessible, WCAG 2.1 AA (product/constraints.md #9)
- Cross-tenant journey sharing must be structurally impossible — `tenantId` on all three tables, no cross-tenant FK or query path
- Design system reference: `artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md` — must be consulted before any new UI components are introduced

---

## UX / Interaction Design

### Entry point

The journey canvas is accessible from:
1. A "Journeys" item in the main navigation (new nav link)
2. A "View journey" link on the product detail page, when a journey is associated with that product

### Primary flow

**Creating a journey:**
1. Operator navigates to `/journeys` — sees a list of existing journeys (empty state on first use: "No journeys yet. Create your first journey.")
2. Operator clicks "New journey" — inline form or modal: journey name (required), optional description, optional product association (product picker from existing products table)
3. Journey created — redirected to `/journeys/:id` (the journey canvas)

**Building stages on the canvas:**
1. Canvas shows a horizontal linear sequence of stage cards (empty: "Add your first stage")
2. Operator clicks "+ Add stage" — new stage card appears at the end; name field focused inline
3. Stage name entered — stage saved; additional attributes available via "Edit stage" (side panel)
4. Drag-and-drop to reorder: stage cards are draggable; `position` column updated on drop

**Editing stage attributes:**
1. Operator clicks a stage card — side panel opens showing all optional attributes
2. Fields are editable inline (autosave on blur or explicit save button)
3. Moment of truth toggle — prominent visual indicator on the stage card when enabled

**Canvas view modes:**
- **Canvas** (default): name + health state indicator + moment of truth icon + feature/metric counts
- **Customer experience**: adds emotion chip + pain points + opportunities as annotation rows below each stage card
- **Delivery**: adds feature list + metric values as annotation rows below each stage card
- **Customise**: individual attribute toggles layered on top of current view

View mode is a client-side toggle — no server round-trip required; annotation rows show/hide via CSS class.

**Mapping features to stages:**
1. From the Delivery view (or stage side panel), operator clicks "Map feature" on a stage
2. Feature picker modal — list of features from `pipeline-state.json` (filterable by name/slug); operator selects one or more
3. After selecting a feature, operator optionally selects which DoD metric keys from that feature are relevant to this stage (metric picker, populated from feature's DoD record)
4. Mapping saved to `feature_journey_stage_mappings`

**Journey health view:**
- Health state per stage is computed at render time: ✅ (≥1 feature mapped AND ≥1 metric attached) / ⚠️ (features mapped but no metrics, or metrics attached but no features) / ❌ (no features, no metrics)
- Summary bar at top of canvas: "X of Y stages have metric coverage"

### Edge cases and error states

| Scenario | Behaviour |
|---|---|
| Journey with no stages | Empty state message on canvas; "Add your first stage" CTA |
| Stage with no attributes beyond name | Renders with name only; health state ❌; no annotation rows visible in any view |
| Feature in picker no longer exists in `pipeline-state.json` | Show as "⚠️ Feature not found (slug)" — allow removal of mapping |
| Drag-and-drop reorder fails (network error) | Optimistic UI reverted; toast error "Stage order not saved — please try again" |
| Tenant isolation violation attempt | 403 response from guard; no data returned |

### Design system / components

Per product/constraints.md #9 and the design system reference (`artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`):
- Consult DESIGN.md before implementing any new UI component
- Reuse existing card, modal, side panel, and drag-and-drop patterns where present
- New components (stage card, canvas view mode toggle, health indicator) must follow the design system token set

### Accessibility

- WCAG 2.1 AA minimum
- Drag-and-drop must have a keyboard alternative (up/down controls within the stage card, or accessible reorder via side panel)
- All canvas view mode toggles keyboard-accessible
- Health state indicators must use both colour and icon/label (not colour alone — per MC-A11Y-02)
- Side panel must trap focus when open; Escape closes it

---

## Decisions and open questions

### Decisions made

| Decision | Rationale |
|---|---|
| Linear stage sequence (not parallel) for MVP | Parallel stages require a directed graph model and significantly more complex canvas layout; linear ordered list is sufficient for MVP and does not close the door on a future `parentStageId` extension |
| Predefined canvas views (Canvas / Customer experience / Delivery) + individual attribute toggles | Maps to real practitioner workflows; gives three immediately useful modes without requiring everyone to build their own view from scratch |
| All stage attributes except Name are optional | Supports progressive enrichment; a stage can be created with just a name and filled in over time |
| Feature-to-stage mapping stored in Postgres join table, not `pipeline-state.json` | Keeps delivery state (pipeline-state.json) independent from business-context associations (ADR-016); join table is queryable and tenant-scoped |
| `product_id` on `journeys` is nullable | A journey may span multiple products or be product-agnostic; forced product association would be too restrictive for cross-product journeys |
| No new npm runtime dependencies | Per product/constraints.md #11 |

### Deferred to definition

- Exact Postgres migration script naming and sequencing (follows existing `migrate-schema-*.js` convention)
- Pagination strategy for the feature picker modal (if `pipeline-state.json` contains many features)
- Whether the "Customise" view mode persists per-user or per-session (session-level is simpler for MVP)
- Keyboard alternative UX for drag-and-drop reorder (up/down buttons vs. reorder modal — to be decided at story level)

### Open questions (blocking)

None — all discovery assumptions were resolved in the clarify session. PostHog MCP integration is confirmed out of scope for MVP (metrics come from manual DoD captures via feature mappings).

### Assumptions from prior artefacts

- ADR-025 (wuce-multi-tenancy) application-layer tenant_id scoping applies to all three new tables — confirmed in clarify.md
- ADR-026 (reuse existing entities) — `products` table is used as-is; no new product primitive
- ADR-027 (live SaaS features are app code, not skills) — journey routes live in `src/web-ui/routes/`, not as a SKILL.md skill
- ADR-016 (two-file state authority) — `pipeline-state.json` is read-only for feature picker; no journey data written to it

---

## Attribution

**Contributors:**
- Hamish King — Product Owner / Operator — 2026-10-05

**Design session:**
- 2026-10-05 — `/design` session; stage attribute model, canvas view modes, UX interaction design, data model finalised

**Reviewers:**
- Pending

**Approved By:**
- Pending