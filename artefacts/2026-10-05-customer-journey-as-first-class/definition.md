Slicing strategy: walking-skeleton

## Epic 1 — Journey Entity and Stage Management

Goal: Operators can create a journey, define its stages with full attribute richness, reorder stages via drag-and-drop, and edit individual stage attributes via a side panel. This epic establishes the foundational journey entity and the stage authoring experience — everything needed for a practitioner to build the skeleton of a journey before features or metrics are attached.
Out of scope:
- Feature-to-stage mapping (Epic 2)
- Health indicators and customer experience annotation views (Epic 3)
- Navigation links and journey list page (Epic 4)
- Database migration (Epic 5)

Oversight: High
Oversight rationale: First epic of a net-new entity type; establishes data model, route handlers, and stage authoring UX patterns that all subsequent epics depend on.
Complexity: 2
Scope stability: Stable

### ep1-s1 — Create journey entity: POST route, Postgres insert, and journey canvas shell
Persona: Outer loop practitioner (PO / SME / discovery lead)
Domain: web-ui

So that journey canvases have a durable, tenant-scoped record, I need a POST route that creates a journey in Postgres and redirects to a canvas shell page at `/journeys/:id`.

Benefit linkage: M1 — Journey adoption — this story creates the journey record that M1 counts.

Architecture constraints: ADR-025 (application-layer tenant_id scoping) — `tenantId` from `req.session.tenantId` must be set on every insert; no cross-tenant query path. ADR-027 (live SaaS features are app code, not skills) — journey routes live in `src/web-ui/routes/journeys.js`. ADR-016 (two-file state authority) — `pipeline-state.json` is not written by journey routes. No new npm runtime dependencies (product/constraints.md #11).

Given I submit a valid journey creation form (name provided, `tenantId` from session),
When the POST handler processes the request,
Then a `customer_journeys` record is inserted into Postgres with `id` (UUID), `tenant_id`, `name`, `description` (nullable), `product_id` (nullable), `created_at`, `updated_at`, and the response redirects to `/journeys/:id`.

Given I submit a journey creation form with no name,
When the POST handler processes the request,
Then a 400 response is returned and no record is inserted.

Given another tenant's `tenantId` is used in the request,
When the POST handler processes the request,
Then the insert uses only the session `tenantId` — no cross-tenant insert is possible.

Given I am redirected to `/journeys/:id` after creation,
When the canvas shell page renders,
Then the journey name is displayed and the stage area shows the empty state "No stages yet. Add your first stage."

Out of scope: Stage creation (ep1-s2), feature mapping (ep2-s2), journey list page (ep4-s1), database migration script (ep5-s1 — this story assumes the tables already exist).
Dependencies: ep5-s1
NFR: `tenantId` set on every insert per ADR-025. Injectable adapter pattern (D37) for Postgres calls. No new npm runtime dependencies.
Complexity: 1
Scope stability: Stable

### ep1-s2 — Add and name stages: POST route, inline name entry, and stage card rendering
Persona: Outer loop practitioner (PO / SME / discovery lead)
Domain: web-ui

So that I can build out the skeleton of a journey, I need to add stages via an "+ Add stage" control that inserts a new stage card at the end of the linear sequence with an inline name field.

Benefit linkage: M1 — Journey adoption — stages are the substance of a journey; without stages a journey is an empty shell with no M2 or M3 signal.

Architecture constraints: ADR-025 — `tenantId` set on every `customer_journey_stages` insert. Stage `position` column is an integer ordinal; new stages are appended at `max(position) + 1`. No new npm runtime dependencies.

Given I click "+ Add stage" on the journey canvas,
When the new stage card renders,
Then a new stage card appears at the end of the sequence with an inline name field in focus.

Given I type a name and submit (Enter or blur),
When the POST handler saves the stage,
Then a `customer_journey_stages` record is inserted with `journey_id`, `tenant_id`, `name`, `position` (appended at end), `created_at`, `updated_at`, and the stage card renders with the saved name.

Given I submit with no name (blank),
When the handler processes the request,
Then a 400 response is returned, no record is inserted, and the inline field shows an error state.

Given the stage is saved,
When the canvas re-renders,
Then the stage card shows the stage name and a "Edit stage" affordance.

Out of scope: Stage attribute editing beyond name (ep1-s3), drag-and-drop reorder (ep1-s4), health indicators (ep3-s2), feature mapping (ep2-s2).
Dependencies: ep1-s1, ep5-s1
NFR: Injectable adapter for Postgres calls (D37). WCAG 2.1 AA — inline name field keyboard-accessible. No new npm runtime dependencies.
Complexity: 1
Scope stability: Stable

### ep1-s3 — Stage side panel: edit all optional attributes
Persona: Outer loop practitioner (PO / SME / discovery lead)
Domain: web-ui

So that I can enrich a stage beyond its name, I need a side panel that opens when I click a stage card and lets me edit all optional stage attributes with autosave on blur.

Benefit linkage: M3 — Journey-level metric coverage — pain points, opportunities, and emotion attributes are surfaced in health views; richer stages support more meaningful metric attribution.

Architecture constraints: ADR-025 — all `customer_journey_stages` updates scoped to `tenantId`. Side panel must trap focus when open; Escape closes it (WCAG 2.1 AA). Design system reference (`artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`) must be consulted before implementing the side panel component.

Given I click a stage card,
When the side panel opens,
Then the panel displays editable fields for: description (textarea), customer actions (textarea), touchpoints (textarea), channel (select: web, mobile, in-person, phone, email, other), emotion (select: positive, neutral, negative, mixed), pain points (textarea), opportunities (textarea), moment of truth (toggle/checkbox).

Given I edit a field and move focus away (blur),
When autosave fires,
Then a PATCH request updates the `customer_journey_stages` record for that field and a success indicator is shown briefly.

Given I toggle "moment of truth" on,
When the stage card re-renders,
Then a visible moment-of-truth indicator (icon + label) appears on the stage card.

Given the side panel is open,
When I press Escape,
Then the side panel closes and focus returns to the stage card that opened it.

Given the side panel is open,
When a keyboard user navigates within the panel,
Then focus is trapped inside the panel until it is closed (WCAG 2.1 AA focus management).

Out of scope: View mode annotation rows (ep3-s1 and ep2-s3), health indicators (ep3-s2), feature mapping from the side panel (ep2-s2).
Dependencies: ep1-s2
NFR: WCAG 2.1 AA focus management. Autosave on blur (no explicit save button required, but save button optional). Design system component patterns. No new npm runtime dependencies.
Complexity: 2
Scope stability: Stable

### ep1-s4 — Drag-and-drop stage reorder with keyboard alternative
Persona: Outer loop practitioner (PO / SME / discovery lead)
Domain: web-ui

So that I can arrange stages in the correct customer sequence, I need to reorder stage cards by dragging them and also via a keyboard-accessible alternative.

Benefit linkage: M1 — Journey adoption — stage ordering is essential for a journey to be meaningful; without it practitioners cannot represent their intended customer flow.

Architecture constraints: No new npm runtime dependencies — drag-and-drop must be implemented using the browser's native HTML5 drag-and-drop API or an equivalent zero-dependency approach. Position rebalancing on drop: update all affected `position` values in a single transaction. WCAG 2.1 AA — keyboard alternative required (up/down controls or reorder via side panel).

Given I drag a stage card to a new position in the sequence,
When I drop it,
Then a PATCH request updates the `position` values of all affected stages in a single Postgres transaction, and the canvas re-renders the stages in the new order.

Given a drop fails (network error),
When the error response is received,
Then the stage cards revert to their pre-drag order (optimistic UI rollback) and a toast error "Stage order not saved — please try again" is shown.

Given I want to reorder stages without drag-and-drop,
When I use the keyboard alternative (e.g. up/down controls on the stage card or reorder controls in the side panel),
Then I can move a stage earlier or later in the sequence and the order is persisted.

Given the reorder is complete,
When the canvas re-renders,
Then the updated stage sequence is reflected in the stage cards' visual order.

Out of scope: Parallel stage structures (deferred per design decisions), undoing a reorder beyond the rollback-on-error behaviour.
Dependencies: ep1-s2
NFR: No new npm runtime dependencies — native HTML5 drag-and-drop or zero-dependency equivalent. WCAG 2.1 AA keyboard alternative. Position updates in a single Postgres transaction. No colour-only indicators.
Complexity: 2
Scope stability: Stable

## Epic 2 — Feature Mapping and Delivery View

Goal: Operators can map existing features (from `pipeline-state.json`) to journey stages, select which DoD metric keys from each feature are relevant to that stage, and view a Delivery annotation row on the canvas showing mapped features and metric values. This epic closes the loop between the pipeline's existing delivery evidence and the journey canvas.
Out of scope:
- Customer experience annotation rows (Epic 3)
- Health indicators (Epic 3)
- Journey list and navigation (Epic 4)
- Database migration (Epic 5)

Oversight: High
Oversight rationale: Bridges two previously independent data sources (`pipeline-state.json` and the journey Postgres tables); requires correct tenant scoping of all mapping records and read-only handling of `pipeline-state.json`.
Complexity: 2
Scope stability: Stable

### ep2-s1 — Feature picker: read pipeline-state.json and render feature list in modal
Persona: Outer loop practitioner (PO / SME / discovery lead)
Domain: web-ui

So that I can select features to map to a journey stage, I need a feature picker modal that reads `pipeline-state.json` at request time and presents a filterable list of features.

Benefit linkage: M2 — Feature-to-stage mapping adoption — the feature picker is the mechanism that enables mappings; without it M2 cannot be measured.

Architecture constraints: ADR-016 (two-file state authority) — `pipeline-state.json` is read-only here; no write path. ADR-029 (local filesystem is canonical for artefact content) — read `pipeline-state.json` from the local checkout via `fs.readFileSync`; do not cache or duplicate feature metadata in Postgres. No new npm runtime dependencies.

Given I click "Map feature" on a stage card or in the Delivery view,
When the feature picker modal opens,
Then it displays a list of features from `pipeline-state.json` (all features for the tenant's repo), each showing the feature name and slug.

Given the feature list is long,
When the modal renders,
Then a filter/search input is available to narrow features by name or slug.

Given `pipeline-state.json` cannot be read (file not found or parse error),
When the modal attempts to load,
Then an error state is shown: "Features could not be loaded. Check that pipeline-state.json exists." — no modal crash.

Given I close the modal without selecting a feature,
When the modal closes,
Then no mapping is created and the canvas is unchanged.

Out of scope: Metric key selection (ep2-s2), saving the mapping (ep2-s2), Delivery view annotation rows (ep2-s3).
Dependencies: ep1-s2, ep5-s1
NFR: Read `pipeline-state.json` via `fs.readFileSync` (ADR-029). No Postgres write in this story. No new npm runtime dependencies. Modal keyboard-accessible (WCAG 2.1 AA).
Complexity: 1
Scope stability: Stable

### ep2-s2 — Feature-to-stage mapping: save mapping with metric key selection
Persona: Outer loop practitioner (PO / SME / discovery lead)
Domain: web-ui

So that a stage reflects which features contribute to it and which metrics are relevant, I need to select a feature from the picker, optionally choose metric keys from that feature's DoD record, and save the mapping.

Benefit linkage: M2 — Feature-to-stage mapping adoption — this story creates the `feature_customer_journey_stage_mappings` record that M2 counts. M3 — Journey-level metric coverage — metric key selection is the mechanism that populates stage-level metric data.

Architecture constraints: ADR-025 — `tenantId` set on every `feature_customer_journey_stage_mappings` insert. ADR-016 — `pipeline-state.json` read-only (metric keys sourced from DoD record, not written back). No new npm runtime dependencies.

Given I select a feature in the feature picker modal,
When the feature is selected,
Then a metric key picker is shown listing available DoD metric keys from that feature's record in `pipeline-state.json` (or "No metrics recorded" if none exist).

Given I select one or more metric keys and confirm,
When the mapping is saved,
Then a `feature_customer_journey_stage_mappings` record is inserted with `journey_stage_id`, `journey_id`, `tenant_id`, `feature_slug`, `metric_keys` (JSONB array of selected keys), `created_at`.

Given I confirm without selecting any metric keys,
When the mapping is saved,
Then a `feature_customer_journey_stage_mappings` record is inserted with `metric_keys: []` — a feature can be mapped without metric keys.

Given a mapping already exists for this feature + stage combination,
When I attempt to add a duplicate mapping,
Then the existing mapping is updated (upsert on `journey_stage_id` + `feature_slug`) rather than creating a duplicate record.

Given a cross-tenant `journey_stage_id` is used in the request,
When the insert is processed,
Then a 403 response is returned and no record is inserted.

Out of scope: Removing a mapping (deferred), editing metric keys after initial save (deferred for MVP), Delivery view annotation rendering (ep2-s3).
Dependencies: ep2-s1, ep5-s1
NFR: Upsert on `journey_stage_id` + `feature_slug`. `tenantId` guard on all inserts (ADR-025). Injectable adapter for Postgres calls (D37). No new npm runtime dependencies.
Complexity: 2
Scope stability: Stable

### ep2-s3 — Delivery view: feature and metric annotation rows on stage cards
Persona: Tech lead / squad lead
Domain: web-ui

So that I can see at a glance which features and metrics are attached to each stage, I need a Delivery view on the canvas that shows feature names and metric values as annotation rows below each stage card.

Benefit linkage: M2 — Feature-to-stage mapping adoption — the Delivery view surfaces existing mappings, making the M2 metric visible. M3 — Journey-level metric coverage — metric values are displayed at the stage where they are relevant.

Architecture constraints: View toggle is client-side (no server round-trip) per the design decision in `design.md`. No new npm runtime dependencies.

Given I switch to the Delivery view on the journey canvas,
When the view renders,
Then each stage card shows annotation rows listing: the names and slugs of all mapped features (or "No features mapped" if none), and for each feature the selected metric keys and their values from `pipeline-state.json` (or "No metrics selected" if `metric_keys` is empty).

Given a mapped feature no longer exists in `pipeline-state.json`,
When the Delivery view renders that stage,
Then the feature is shown as "⚠️ Feature not found (slug)" with a remove affordance — no crash, no silent omission.

Given I switch between Canvas, Customer experience, and Delivery views,
When the view toggle is activated,
Then annotation rows show or hide via CSS class without a server round-trip.

Given the Delivery view renders metric values,
When a metric key has no recorded value in `pipeline-state.json`,
Then the metric row shows "No value recorded" — not blank, not an error.

Out of scope: Editing mappings from the Delivery view (deferred), removing mappings (deferred for MVP), health indicators (ep3-s2), customer experience annotation rows (ep3-s1).
Dependencies: ep2-s2
NFR: View toggle client-side. Feature-not-found case handled gracefully. No new npm runtime dependencies. WCAG 2.1 AA — annotation rows readable by screen reader.
Complexity: 2
Scope stability: Stable

## Epic 3 — Journey Health and Customer Experience Views

Goal: Operators can switch to a Customer experience view to see emotion, pain points, and opportunities as annotation rows, and can see per-stage health indicators (✅ / ⚠️ / ❌) computed from feature and metric coverage, plus a summary bar showing overall journey metric coverage. This epic surfaces the journey health signal that makes the canvas actionable for tech leads and squad leads.
Out of scope:
- Feature mapping (Epic 2)
- Navigation and journey list (Epic 4)
- Database migration and tenant isolation tests (Epic 5)

Oversight: Medium
Oversight rationale: Builds on data already established by Epics 1 and 2; health computation logic is the primary risk area.
Complexity: 2
Scope stability: Stable

### ep3-s1 — Customer experience view: emotion, pain points, opportunities annotation rows
Persona: Outer loop practitioner (PO / SME / discovery lead)
Domain: web-ui

So that I can review the customer experience dimension of each stage alongside delivery context, I need a Customer experience view that shows emotion, pain points, and opportunities as annotation rows below each stage card.

Benefit linkage: M1 — Journey adoption — a richer canvas with multiple view modes makes journeys more valuable to practitioners, supporting sustained adoption beyond initial creation.

Architecture constraints: View toggle is client-side (no server round-trip). Emotion display must use colour chip + text label (MC-A11Y-02 — not colour alone). No new npm runtime dependencies.

Given I switch to the Customer experience view on the journey canvas,
When the view renders,
Then each stage card shows annotation rows for: emotion (chip/badge using the stage's `emotion` enum value, or "Not set"), pain points (text or "Not set"), and opportunities (text or "Not set").

Given a stage has no emotion, pain points, or opportunities set,
When the Customer experience view renders for that stage,
Then all three annotation rows show "Not set" — no rows are hidden or omitted.

Given I switch between Canvas, Customer experience, and Delivery views,
When the view toggle is activated,
Then annotation rows show or hide via CSS class without a server round-trip, consistent with ep2-s3 view toggle behaviour.

Given an emotion value is displayed,
When the annotation row renders,
Then the emotion is shown using both a colour chip and a text label (not colour alone, per MC-A11Y-02).

Out of scope: Health state indicators (ep3-s2), Delivery view annotation rows (ep2-s3), editing stage attributes from the canvas view (editing is via the side panel per ep1-s3).
Dependencies: ep1-s3, ep2-s3
NFR: View toggle client-side (no server round-trip). Emotion display: colour chip + text label (MC-A11Y-02). WCAG 2.1 AA. No new npm runtime dependencies.
Complexity: 1
Scope stability: Stable

### ep3-s2 — Journey health indicators: per-stage health state and summary bar
Persona: Tech lead / squad lead
Domain: web-ui

So that I can assess where a journey has metric coverage gaps and where delivery work is missing, I need per-stage health state indicators on the canvas and a summary bar showing overall journey metric coverage.

Benefit linkage: M3 — Journey-level metric coverage — health indicators make M3 visible and actionable on the canvas.

Architecture constraints: Health state indicators must use icon + label, not colour alone (MC-A11Y-02). Health computation is server-side at render time (no separate background job). No new npm runtime dependencies.

Given a stage has at least one mapped feature AND at least one metric key selected across its mappings,
When the canvas renders,
Then the stage card displays a ✅ health indicator with an accessible label.

Given a stage has mapped features but no metric keys selected across any of its mappings,
When the canvas renders,
Then the stage card displays a ⚠️ health indicator with an accessible label.

Given a stage has no mapped features and no metric keys,
When the canvas renders,
Then the stage card displays a ❌ health indicator with an accessible label.

Given the journey canvas loads,
When the summary bar renders,
Then it displays "X of Y stages have metric coverage" where X is the count of ✅ stages and Y is the total stage count.

Given health state indicators are displayed,
When a screen reader or keyboard user focuses a stage card,
Then the health state is communicated via both a visual icon and an accessible label (not colour alone, per MC-A11Y-02).

Given health state is computed,
When the underlying feature mappings or metric keys change (add, remove, update),
Then the health state indicator updates to reflect the current state without requiring a full page reload.

Out of scope: PostHog-derived health signals (out of scope per discovery), journey-level aggregated health score across multiple journeys, automated alerts when health degrades.
Dependencies: ep2-s2, ep3-s1
NFR: Health state indicators: icon + label (MC-A11Y-02). Health computation server-side at render time. WCAG 2.1 AA. No new npm runtime dependencies.
Complexity: 2
Scope stability: Stable

## Epic 4 — Navigation, Entry Points, and Journey List

Goal: Operators can navigate to the journey canvas from natural entry points in the product UI — a "Journeys" item in the main navigation and a "View journey" link on the product detail page. The journey list page at `/journeys` provides an index of all journeys for the tenant with empty state guidance and a "New journey" creation flow.
Out of scope:
- Journey canvas and stage management (Epic 1)
- Feature mapping and delivery view (Epic 2)
- Health indicators and customer experience view (Epic 3)
- Database migration and tenant isolation tests (Epic 5)

Oversight: Low
Oversight rationale: UI wiring and navigation — low risk, builds on established patterns.
Complexity: 1
Scope stability: Stable

### ep4-s1 — Journey list page: index of all journeys for the tenant
Persona: Outer loop practitioner (PO / SME / discovery lead)
Domain: web-ui

So that I can navigate to an existing journey or create a new one, I need a journey list page at `/journeys` that shows all journeys scoped to my tenant.

Benefit linkage: M1 — Journey adoption — the list page is the primary entry point for creating and accessing journeys; it is the mechanism by which M1 is measured.

Architecture constraints: ADR-025 — all journey records returned must be scoped by `tenantId`; cross-tenant records must never appear. ADR-027 — list page is app code in `src/web-ui/routes/journeys.js`. Design system reference for UI components. No new npm runtime dependencies.

Given I navigate to `/journeys`,
When the page renders,
Then I see a list of all journeys scoped to my `tenantId`, each showing the journey name, optional description (truncated if long), the associated product name (or "No product" if `product_id` is null), and the count of stages.

Given no journeys exist for my tenant,
When the page renders,
Then I see the empty state message "No journeys yet. Create your first journey." with a prominent "New journey" call to action.

Given I click "New journey",
When the creation form or modal opens,
Then I can enter a journey name (required), optional description, and optionally associate a product from a picker of existing products for my tenant.

Given I submit a valid new journey (name provided),
When the creation completes,
Then the journey record is saved to `customer_journeys` scoped to my `tenantId` and I am redirected to `/journeys/:id`.

Given another tenant's journey ID is used in the request,
When the request is processed,
Then a 403 response is returned and no journey data is returned.

Out of scope: Journey deletion (deferred), journey search/filter (deferred for MVP), cross-org journey sharing.
Dependencies: ep1-s1
NFR: All journey records tenant-scoped per ADR-025. Product picker filtered by `tenantId`. WCAG 2.1 AA. No new npm runtime dependencies.
Complexity: 1
Scope stability: Stable

### ep4-s2 — Navigation and entry points: "Journeys" nav link and product page link
Persona: Outer loop practitioner (PO / SME / discovery lead)
Domain: web-ui

So that I can reach the journey canvas from natural points in the product UI, I need a "Journeys" link in the main navigation and a "View journey" link on the product detail page when a journey is associated with that product.

Benefit linkage: M1 — Journey adoption — discoverability of the journey canvas drives the adoption metric; without visible entry points, M1 cannot reach its target.

Architecture constraints: Design system reference (`artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`) must be consulted before adding nav items. No new npm runtime dependencies.

Given I am on any page in the web UI,
When the main navigation renders,
Then a "Journeys" link is visible and navigates to `/journeys`.

Given I am on a product detail page and that product has at least one associated journey,
When the product detail page renders,
Then a "View journey" link is displayed that navigates to `/journeys/:id` for the first associated journey (ordered by `created_at` ascending).

Given I am on a product detail page and that product has no associated journeys,
When the product detail page renders,
Then no "View journey" link is shown (no broken link, no empty placeholder).

Given the "Journeys" nav link is rendered,
When a keyboard user navigates the main nav,
Then the "Journeys" link is reachable and activatable via keyboard alone (WCAG 2.1 AA).

Out of scope: Multiple journey links on a product page (only first journey linked in MVP), journey creation from the product detail page.
Dependencies: ep4-s1
NFR: Nav link and product page link follow design system reference. WCAG 2.1 AA. No new npm runtime dependencies.
Complexity: 1
Scope stability: Stable

## Epic 5 — Database Migration and Tenant Isolation Hardening

Goal: The three new Postgres tables (`customer_journeys`, `customer_journey_stages`, `feature_customer_journey_stage_mappings`) are created via an idempotent migration script, and all journey routes are covered by adversarial tenant isolation tests verifying that cross-tenant access is structurally impossible. This epic is the foundational prerequisite for all other epics and the security backstop for the entire feature.
Out of scope:
- All journey canvas functionality (Epics 1–4)
- Rollback scripts (deferred)
- Performance/load testing of isolation guards

Oversight: High
Oversight rationale: Database migration and security hardening — any error here has structural consequences for all other epics.
Complexity: 2
Scope stability: Stable

### ep5-s1 — Database migration: create journeys, journey_stages, and feature_journey_stage_mappings tables
Persona: Outer loop practitioner (PO / SME / discovery lead)
Domain: web-ui

So that the journey canvas has durable, tenant-scoped storage, I need a Postgres migration script that creates the three new tables with all required columns, constraints, and indexes.

Benefit linkage: M1 — Journey adoption — without the migration, no journey records can be created and M1 cannot be measured.

Architecture constraints: Migration follows existing `migrate-schema-*.js` naming convention. ADR-025 — all three tables include `tenant_id` column. No new npm runtime dependencies.

Given the migration script is run against a Postgres database,
When the migration completes,
Then the `customer_journeys` table exists with columns: `id` (UUID PK), `tenant_id` (text, not null), `name` (text, not null), `description` (text, nullable), `product_id` (UUID, nullable, FK → products), `created_at` (timestamptz), `updated_at` (timestamptz).

Given the migration script is run,
When the migration completes,
Then the `customer_journey_stages` table exists with all columns from the design artefact: `id`, `journey_id`, `tenant_id`, `name`, `position`, `description`, `customer_actions`, `touchpoints`, `channel`, `emotion`, `pain_points`, `opportunities`, `moment_of_truth`, `created_at`, `updated_at`.

Given the migration script is run,
When the migration completes,
Then the `feature_customer_journey_stage_mappings` table exists with columns: `id`, `journey_stage_id`, `journey_id`, `tenant_id`, `feature_slug`, `metric_keys` (JSONB, default `[]`), `created_at`.

Given the migration is run on a database that already has data,
When the migration completes,
Then existing data is unaffected and the migration is idempotent (safe to run twice without error).

Given the migration script is run,
When the migration completes,
Then indexes exist on: `journeys(tenant_id)`, `journey_stages(journey_id)`, `journey_stages(tenant_id)`, `feature_journey_stage_mappings(journey_stage_id)`, `feature_journey_stage_mappings(tenant_id)`.

Out of scope: Seed data, rollback script, migration for future columns not in MVP scope.
Dependencies: None
NFR: Follows `migrate-schema-*.js` naming convention. Idempotent. No new npm runtime dependencies.
Complexity: 1
Scope stability: Stable

### ep5-s2 — Tenant isolation hardening: adversarial path and cross-tenant guard tests for journey routes
Persona: Tech lead / squad lead
Domain: web-ui

So that journey data is structurally protected against cross-tenant access, I need adversarial test coverage verifying that all journey routes enforce tenant isolation and reject requests attempting to access another tenant's journey data.

Benefit linkage: M1 — Journey adoption — operator trust in the platform depends on isolation being provably correct; adoption of a multi-tenant feature requires this confidence.

Architecture constraints: ADR-025 — all guards use `requireJourneyAccess`/`isSameTenant` pattern. Adversarial test pattern follows wuce-multi-tenancy Phase 5 (14/14 adversarial path-traversal tests). No new npm runtime dependencies.

Given a request is made to `GET /journeys/:id` using a journey ID that belongs to a different tenant,
When the request is processed,
Then a 403 response is returned and no journey data is included in the response body.

Given a request is made to `PUT /api/journeys/:id` using a journey ID that belongs to a different tenant,
When the request is processed,
Then a 403 response is returned and the journey record is not modified.

Given a request is made to `DELETE /api/journeys/:id` using a journey ID that belongs to a different tenant,
When the request is processed,
Then a 403 response is returned and the journey record is not deleted.

Given a request is made to `POST /api/journeys/:id/stages` using a journey ID that belongs to a different tenant,
When the request is processed,
Then a 403 response is returned and no stage is created.

Given a request is made to `POST /api/journey-stages/:stageId/mappings` using a stage ID that belongs to a different tenant,
When the request is processed,
Then a 403 response is returned and no mapping is created.

Given all journey and stage routes are exercised in the adversarial test suite,
When all tests pass,
Then zero cross-tenant data leaks are found — no journey, stage, or mapping record belonging to tenant B is returned to a request authenticated as tenant A.

Out of scope: Cross-org sharing (out of scope per discovery), performance/load testing of isolation guards, testing non-journey routes.
Dependencies: ep5-s1, ep1-s1, ep2-s1
NFR: Follows adversarial test pattern from wuce-multi-tenancy Phase 5. All guards use ADR-025 pattern. No new npm runtime dependencies.
Complexity: 2
Scope stability: Stable