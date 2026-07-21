# Decisions Log: Web UI Experience Redesign

Per CLAUDE.md's decisions.md mandate for features with architectural choices. Created at discovery time; entries appended as decisions are made during delivery.

---

**2026-07-21 | SCOPE | discovery /clarify**
**Decision:** Module taxonomy is fully operator-curated per product, with no default/starter set. Every product begins with zero modules.
**Context:** The nine modules confirmed for `skills-framework` this session (Web UI/Product Management, Governance & Gate Enforcement, etc.) are specific to that product's own epic shape.
**Rationale:** A universal starter set risks being either too generic to be useful (e.g. "Core", "Infrastructure") or silently biased toward skills-framework's own structure. Operator-curated with zero defaults keeps the mental model simple: modules mean whatever the person using the product wants them to mean, with no platform assumption baked in.
**Made by:** Hamish King (Founder/Operator), via /clarify, 2026-07-21
**Revisit trigger:** If a second real product is added to the platform and the operator finds recreating module structure from scratch repeatedly painful, reconsider a "copy modules from another product" convenience feature (not a default taxonomy).

---

**2026-07-21 | ARCH | discovery /clarify**
**Decision:** Per-feature health is a real backend computation change, in MVP scope for Epic A — not a deferred rendering-only change. `computeHealthCounts` (`src/web-ui/modules/product-rollup.js`) must be extended to compute health per-feature, not only in aggregate.
**Context:** The session's mockup used test-coverage % as a stand-in for a per-feature "health" signal, explicitly flagged as a placeholder pending this decision. The real backend today only computes one aggregate health count across the whole product (e.g. 53 green / 3 amber / 0 red / 0 unknown) — there is no per-feature breakdown to read from at all.
**Rationale:** The whole point of showing health and coverage as two distinct signals (found necessary during the F4 critique pass) is that they can genuinely disagree. A coverage-derived stand-in defeats that purpose — it's the same signal wearing a second hat, not a second signal. Confirmed explicitly by the operator over the lighter-weight "defer" alternative.
**Made by:** Hamish King (Founder/Operator), via /clarify, 2026-07-21
**Revisit trigger:** When /definition scopes Epic A, confirm exactly what source data `computeHealthCounts` should read per-feature (today's aggregate health computation logic needs to be traced to its actual per-feature inputs before a per-feature version can be written) — this is real technical-design work, not yet done as of this decision.

---

**2026-07-21 | SEC | discovery /clarify**
**Decision:** The impersonation audit log is admin-visible only, retained indefinitely, with no notification to the impersonated user.
**Context:** No other admin or reviewer role exists on this platform today (solo operator); `context.yml` confirms `regulated: false`.
**Rationale:** Matches the existing `credit_audit_log` convention's visibility bar exactly, rather than inventing a new, stricter standard for this one feature. Explicitly the lighter of two options considered (the other being target-user notification after the fact) — chosen as appropriate for a solo-operator platform with no other admins to cross-check the log, though flagged as a candidate to revisit if a second admin is ever added.
**Made by:** Hamish King (Founder/Operator), via /clarify, 2026-07-21
**Revisit trigger:** If a second admin/reviewer role is added to this platform, or if this platform's `regulated` flag in `context.yml` is ever set to `true`, revisit both the visibility scope and whether target-user notification should be added.

---

**2026-07-21 | RISK-ACCEPT | /review (a5-review-1, finding 1-M1)**
**Decision:** Accept story A5's (Roadmap tab) benefit linkage as an honest "indirect" connection to the time-to-identify-health metric, rather than forcing a false direct claim.
**Context:** /review flagged that A5's linkage sentence hedges with "indirectly," unlike every sibling story's direct mechanism statement.
**Rationale:** A5 genuinely supports the metric's spirit (a complete picture of the product, not just its shipped-and-tested portion) rather than the metric's literal timing measurement. An honest indirect linkage is more defensible than inventing a false direct one.
**Made by:** Claude (agent, acting as reviewer), self-acknowledged per the review skill's completion path — flagged for the operator's awareness, not requiring further action.
**Revisit trigger:** If /trace or a future review disputes this linkage, revisit whether A5 belongs in this epic at all, or whether the benefit-metric artefact needs a dedicated "completeness" metric to anchor it properly.

---

**2026-07-21 | SCOPE | /review (d1-review-1, finding 1-M1)**
**Decision:** Accept D1's embedded technical investigation (the session-swap mechanism) as the story's own first implementation task, rather than splitting it into a preceding spike story.
**Context:** /review flagged that the epic's own Complexity Rating rationale suggested considering a technical spike before D1 begins, but /definition did not convert that suggestion into an actual spike story.
**Rationale:** Given this platform's solo-operator scale and the tight coupling between the investigation and D1's own implementation (the investigation's findings directly determine D1's code, not a separable upstream deliverable), keeping it as D1's own first task avoids an extra artefact-and-handoff cycle for a single-person delivery flow. This is not a regulated or multi-team context where a separate spike artefact's audit trail would carry more value.
**Made by:** Hamish King (Founder/Operator) — implicitly, via not requesting a spike story split when this finding was surfaced; recorded here for traceability.
**Revisit trigger:** If D1's implementation reveals the investigation is substantially more complex than expected (e.g. requires touching Redis session internals in a way that risks other in-flight sessions), pause and split it into a proper spike before continuing.

---

**2026-07-21 | ARCH | /definition-of-ready (a1, H-ADAPTER check)**
**Decision:** A1's original hedge language ("D37 applies if this story introduces a new adapter") is resolved definitively at DoR time — A1 does introduce a new injectable adapter (`setModulesAdapter`) for module storage, and a new AC6 was added requiring the D37 wiring test to assert genuine behavioural correctness (two different products resolve to two different, correctly-isolated results), not just that a function reference was assigned.
**Context:** /review's original 1-M1 finding on A1 (hedge language in Architecture Constraints) was never explicitly fixed or logged as RISK-ACCEPT after review — caught as a gap during this DoR run's own H-ADAPTER check, which specifically exists to prevent exactly this class of miss (per CLAUDE.md's D37 rule and the tir-s5/tir-s8 historical incident it was written to prevent).
**Rationale:** Per this repo's own established D37 rule, a hedge like "if this story introduces an adapter" is not acceptable at DoR — the question must be resolved definitively, with a real wiring AC added if the answer is yes. This is a direct fix, not a risk-accept, since the fix was cheap and the underlying gap (an adapter with no wiring AC) is exactly the kind of thing D37 was written to prevent.
**Made by:** Claude (agent), during /definition-of-ready's H-ADAPTER check, 2026-07-21
**Revisit trigger:** None — resolved directly, no further action needed unless the actual implementation reveals `setModulesAdapter` isn't the right shape once real code is written.

---

**2026-07-21 | RISK-ACCEPT | /branch-setup (a1)**
**Decision:** Accept the 37 pre-existing baseline test failures found by `node scripts/run-all-tests.js` on `feature/a1-modules-taxonomy-crud` before any a1 code was written, and proceed with implementation rather than fixing them first.
**Context:** Full-suite baseline run: 345 file(s) run, 37 failed, before any a1 implementation work (confirmed both before and after `npm install`, ruling out a missing-dependency cause). None of the 37 failing files reference `product_modules`, `modules-adapter`, or any a1 route handler — they span unrelated areas (i3.x attribution, ougl journey-state, sec3/sec5 session handling, wuce/wusl chat streaming, etc.) that predate this story.
**Rationale:** Per `/branch-setup`'s own option 2 ("Acknowledge as pre-existing and proceed"), and CLAUDE.md's own verification-scoping learning ("check the specific delta against baseline, not the whole suite, when confirming regression vs pre-existing"), this story's own verification will compare the failing-file list before/after a1's changes rather than requiring a clean 0-failure baseline, which is out of scope for this story to fix.
**Made by:** Claude (agent), during /branch-setup, 2026-07-21
**Revisit trigger:** If any of a1's changes touch a file already on the 37-failure list, or a1's own test run changes the failure count on a file it did not intentionally modify, treat that as a real regression requiring investigation before /branch-complete.

---

**2026-07-21 | ARCH | /implementation-plan (a1)**
**Decision:** Store epic/feature-to-module assignment as a nullable `module_id` column on the existing `journeys` table (`ON DELETE SET NULL`), not a new dedicated table, and treat "epic assigned to a module" as "journey/feature row assigned to a module" for storage purposes.
**Context:** The DoR contract names only `product_modules (id, product_id, tenant_id, name, created_at)` as the new table, but also references "a new `modules` foreign key column on the existing epic-taxonomy representation," and AC3/the test plan require an UPDATE that reassigns "epics" to Unassigned on module delete. There is no persisted `epics` table in this codebase — epic groupings are computed at sync time from `pipeline-state.json` into the `product_rollups.taxonomy` JSONB cache (see `product-rollup.js`'s `computeTaxonomyRollup`). The only persisted, product-scoped per-feature row is `journeys`.
**Rationale:** `journeys` is the closest existing persisted representation of an individual feature/story, and is already product_id/tenant_id-scoped, consistent with ADR-025. This gives A2 (reassign epics between modules) a concrete, real column to write to without inventing a second new table beyond the DoR contract's stated scope.
**Made by:** Claude (agent), during /implementation-plan, 2026-07-21
**Revisit trigger:** If A2's design reveals that epic-level (not per-journey/story) module assignment is actually required — i.e. one module assignment shared across every story under the same epic slug — this column-per-journey approach will need to be revisited, likely in favour of an epic-slug-keyed mapping table.

---

**2026-07-21 | SCOPE | /implementation-plan (a1)**
**Decision:** Add a `GET /products/:id/modules` route handler, even though the DoR contract's "What will be built" section names only the POST/PUT/DELETE routes.
**Context:** AC1 requires the created module to "appear in the product's module list on next page load," and the test plan's own AC1 integration test explicitly drives "POST a create request, then GET the module list again" — neither is satisfiable without a GET endpoint.
**Rationale:** Per CLAUDE.md's B1/D1 rule: "when the [DoR] contract and test plan conflict, the contract is the authoring defect — update the contract to match the ACs and test plan, not the other way around."
**Made by:** Claude (agent), during /implementation-plan, 2026-07-21
**Revisit trigger:** None — this is additive, non-scope-creep (it exists only to make an already-written AC/test pass), and requires no further action.
**2026-07-21 | ARCH | a3 implementation, Task 0 investigation**
**Decision:** The real per-feature health signal source is `feature.health` — a field that already exists directly on each top-level entry of `pipelineState.features[]`, and is confirmed independent of test-coverage data. `computeHealthCounts` is extended to expose it per-feature (as `perFeature: [{slug, name, health}]`) alongside the unchanged aggregate, rather than inventing a new computation.
**Context:** This story's Architecture Constraints required tracing exactly what `computeHealthCounts` reads from `pipeline-state.json` before AC2a (left as a placeholder at DoR time) could be concretized. Traced directly against this repo's own real `.github/pipeline-state.json`: `computeHealthCounts` reads only `feature.health`, never `story.health`, `epic.health` (no such field exists — confirmed across all 66 real epic objects), `testPlan`, or `dodStatus`. 6 real features have zero `testPlan` data anywhere (fully docs/ADR-only) yet still carry an explicit `feature.health`, confirming health and coverage are genuinely separate signals sourced from different schema fields, not one derived from the other.
**Rationale:** Exposing the already-independent `feature.health` field per-feature satisfies AC1/AC2/AC2a without fabricating a new "health" computation or a new data model/migration — the simplest change consistent with "this story adds a per-feature breakdown of the same underlying concept, not a new concept" (story Out of Scope). Per-feature (not per-epic) is the correct granularity because epics carry no independent health field in the real schema; adding one would be new-concept scope, explicitly out of scope for this story.
**Made by:** Claude (agent), during a3 implementation Task 0, 2026-07-21
**Revisit trigger:** If a future story (e.g. A4, or a later epic-level health request) needs epic-granularity health, a new `epic.health` field and its own write path would need to be designed — this decision does not preclude that, it only scopes a3 to the granularity the real schema already supports today.

---

**2026-07-21 | ARCH | c2 implementation, mock-shape verification (pre-implementation)**
**Decision:** Build and test the Billing tab against the real, currently-wired production response shape of `GET /billing/plan-state` — `{ plan: 'trial'|'paid', status: 'active'|'past_due'|'canceled' }` — rather than the c2 test plan's own AC1 fixture (`{ plan: 'trial', trialEndsInDays: 9 }`), which names a field that does not exist anywhere in the real store.
**Context:** Per CLAUDE.md's mock-shape verification rule (the tir-s5/tir-s8 class of mistake), before writing any test I read the real wiring: `handleGetBillingPlanState` (`src/web-ui/routes/billing.js`) returns exactly what `tenantPlan.getPlanState(tenantId)` (`src/web-ui/modules/tenant-plan.js`) reads from the `tenant_plan` table's `plan`/`status` columns — no `trialEndsInDays` or any days-remaining field exists in the SELECT, the table schema, or `DEFAULT_PLAN_STATE`. A mock shaped like the test plan's imagined fixture would have passed every test while rendering a field that can never actually appear in production.
**Rationale:** AC1's requirement ("plan details fetched from `/billing/plan-state`") is satisfied by showing the plan label ("Trial plan"/"Paid plan") next to the status pill — real data only, no fabricated days-remaining figure. This is a corrective finding caught before any test was written, not a deferred gap — no RISK-ACCEPT needed since the story's own ACs (which reference the real endpoint, not the test plan's fixture) are still fully satisfiable with the real shape.
**Made by:** Claude (agent), during c2 implementation-plan/Task 1, 2026-07-21
**Revisit trigger:** If a future story wants to surface trial-days-remaining, that requires a new field added to `tenant_plan` and `getPlanState`'s return shape first — this decision does not preclude that, it only scopes c2 to the data the real schema supports today.
**2026-07-21 | ARCH | /implementation-plan (a2)**
**Decision:** A2's `:epicId` route parameter (`PUT /products/:id/epics/:epicId/module`) is a `journeys.journey_id` value. `reassignEpic(productId, tenantId, journeyId, moduleId)` was added to A1's existing `modules-adapter.js` (no new adapter — confirmed at DoR's H-ADAPTER check) and writes to the already-existing `journeys.module_id` column A1 added. No new table or column migration was needed for this story.
**Context:** Per A1's own ARCH decision above, there is no persisted `epics` table in this codebase — `journeys` is the only persisted, product-scoped per-feature row, and A1 already added `journeys.module_id` explicitly anticipating this story would write to it.
**Rationale:** Confirms and executes on the storage design A1 already committed to, without inventing a second representation of "epic."
**Made by:** Claude (agent), during a2 implementation, 2026-07-21
**Revisit trigger:** None — this is the concrete realisation of a decision already made and recorded at A1.

---

**2026-07-21 | ARCH | /implementation-plan (a2)**
**Decision:** A2's "reflects on next load" integration test (test plan's second integration test, "Components involved: route handler + `_renderProductView` (or its module-grouped successor from A4)") verifies the real persisted `journeys.module_id` value directly after a PUT reassignment, rather than asserting against `_renderProductView`'s rendered HTML. No "Move to ▾" UI control is shipped in this story.
**Context:** Reading `_renderProductView` (`src/web-ui/routes/products.js`) directly shows the current "Epics" section is rendered from `rollupRow.taxonomy` — a JSONB cache computed by `product-rollup.js`'s `computeTaxonomyRollup` directly from `pipeline-state.json` epic slugs at sync time. It has zero dependency on the `journeys` table or `journeys.module_id` at all. Grouping that visible section by module, and rendering a control that writes to `journeys.module_id`, is A4's explicit scope (confirmed still at `definition-of-ready` in `pipeline-state.json` as of this story) — not yet built.
**Rationale:** Testing against `_renderProductView`'s HTML output would either be dishonest (asserting behaviour the current rendering cannot actually exhibit) or force A2 to build A4's rendering work as unplanned scope. Verifying the real persisted store directly is the honest, non-aspirational test of "reassignment reflects on next load" — it is exactly the data A4 will read from once it ships. Per the Coding Agent Instructions ("Do not add scope beyond the ACs/tests"), no UI control is added in this story since there is currently no module-grouped epic row in the rendered page to attach one to. Flagged as a PR comment for operator awareness, not silently deferred.
**Made by:** Claude (agent), during a2 implementation, 2026-07-21
**Revisit trigger:** When A4 ships module-grouped rendering backed by `journeys.module_id`, add the "Move to ▾" UI control and an E2E/manual verification step at that point — the backend capability this story ships (`reassignEpic` + the PUT route) is exactly what A4's control will call.

---

**2026-07-21 | ARCH | a4 implementation, Task 0 investigation**
**Decision:** A4's module grouping (AC1) targets the flat `features`/`journeys` list already rendered at the bottom of `_renderProductView` — the same entities A1/A2's CRUD operates on (`journeys.journey_id`, `journeys.module_id`) — not the pre-existing "Epics" section (`taxonomyHtml`), which is rendered from `rollupRow.taxonomy`, a JSONB cache computed by `computeTaxonomyRollup` directly from the connected repo's `pipeline-state.json` at sync time and carries no `journey_id` or any other join key back to the `journeys` table at all. Grouping the taxonomy section by module is not buildable without inventing a new persisted join key between two independently-sourced data models — out of scope for a rendering-only story.
**Context:** Per A2's own decisions.md ARCH entry, the taxonomy section has "zero dependency on the journeys table or journeys.module_id at all," and flagged that A4 would need to resolve exactly this. Traced directly: `journeys.feature_slug` is set from the operator-chosen slug at `/discovery` start (`journeyStore.createJourney` in `routes/journey.js`), the same slug convention as a top-level `pipeline-state.json` `features[].slug`. `computeHealthCounts`'s `perFeature` (A3) is keyed by this same slug, so `journeys.feature_slug` can be matched against it for a real per-epic health value, falling back to `unknown` when no match exists. No equivalent per-top-level-feature aggregate exists for test coverage — `computeTestCoverageRollup` only returns coverage nested under an epic or flat by *story* slug, never rolled up to a parent top-level feature; extending it to track a parent-feature key is a genuine rollup-computation change (its own dedicated story, matching A3's own precedent), not a rendering change belonging to this DoR contract's stated touch point (`products.js` only).
**Rationale:** Matching `journeys.feature_slug` against `testCoverage.perFeature` (the flat list `computeTestCoverageRollup` already populates across every story it processes) by slug gives a real percentage when a match exists and an honest "No test data yet" fallback (the same convention pr-s5/AC4 already established) otherwise — never a fabricated number. AC3's "N epics and M total stories" uses the epic/journey count for N (same entities as AC1) and `taxonomy.totalCount` for M (the one authoritative, already-computed "total stories in this synced product" figure). Distribution-strip segment sizing uses epic-per-module counts, the only sizing measure directly tied to real module assignment.
**Made by:** Claude (agent), during a4 implementation Task 0, 2026-07-21
**Revisit trigger:** If a future story wants module-grouping applied to the taxonomy epics section itself (not just the flat features/journeys list), or wants exact per-epic test-coverage percentages rather than the slug-match/no-data-fallback approach here, that requires either a new join key between `journeys` and `pipeline-state.json` epics, or extending `computeTestCoverageRollup` to track a parent-feature key — both are new data-model work, not a rendering change.

---

**2026-07-21 | GOV | Epic D (Admin User Impersonation) — named human sign-off given**
**Decision:** Hamish King (Founder/Operator) has given explicit named sign-off for d1, d2, d3, and d4 — the 4 stories in epic-d-admin-user-impersonation, rated High human oversight at `/definition` due to its real session-security semantics. All hard blocks (H1–H9, H-E2E, H-NFR, H-GOV, H-ADAPTER) had already passed at `/definition-of-ready` for all 4 stories; only this named sign-off was outstanding, per each story's own DoR Sign-off section requiring it before assignment to a coding agent.
**Context:** Epics A, B, and C (10 stories total: a1–a5, b1–b2, c1–c3) are all merged into master as of this entry. Epic D is the last remaining work in this feature. d1–d3 have no inter-story blocking dependency beyond their own natural build order (d1 establishes the session/session-swap mechanism; d2 depends on d1's session state existing; d3 is a read-only audit log depending on d1's audit table); d4 has an explicit hard dependency in its own DoR Coding Agent Instructions — "Proceed: Yes — BUT ONLY ONCE D1, D2, AND D3 ARE MERGED" — since it is a review-and-harden pass over the other three stories' real shipped code, not a build-from-scratch story.
**Rationale:** The sign-off requirement exists because this epic changes real session-security semantics (impersonation, privilege boundaries, audit) that a coding agent should not implement fully autonomously without direct human awareness that the epic is proceeding — not because any specific technical concern was found. No technical objection was raised; sign-off was a deliberate process gate, now satisfied.
**Made by:** Hamish King — Founder/Operator, confirmed directly in conversation, 2026-07-21. Recorded by Claude (agent).
**Revisit trigger:** None — this is a one-time gate satisfied for all 4 stories in this epic. d4 still cannot be dispatched until d1–d3 are actually implemented and reviewable, per its own DoR instructions — this sign-off does not bypass that sequencing dependency.
