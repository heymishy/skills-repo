# Review Report

## Story: ep1-s1

### HIGH findings

**1-H1:** User story format is malformed. "I want tenant-scoped record, I need a POST route..." reads as a fragment caused by story-splitting that lost the "So that I have a persistent," prefix from the discovery definition. The persona (Outer loop practitioner) and "So that" clause are present but the "I want" field is not independently comprehensible. A reader cannot understand the want without the so-that.

**1-H2:** AC3 ("Another tenant's `tenantId` is used in the request... Then the insert uses only the session `tenantId`") does not test isolation — it tests that the POST handler ignores a rogue `tenantId` in the request body. This is not the same as verifying that a cross-tenant GET or mutation is rejected. AC3 should be: given a request authenticated as tenant A with a journey ID belonging to tenant B, return 403. As written, AC3 will pass even if cross-tenant reads are not guarded.

### MEDIUM findings

**1-M1:** AC4 ("canvas shell page shows 'No stages yet.'") mixes two concerns in one AC: the redirect and the empty-state render. These are independently testable — split into AC4a (redirect) and AC4b (canvas renders empty state). Medium because it does not block correctness but makes the test plan ambiguous.

**1-M2:** Benefit linkage says "M1 — Journey adoption — this story creates the journey record that M1 counts." This is correct but thin — it doesn't identify the mechanism sentence (what specific field/table is measured). Compare to the benefit-metric artefact which names `journeys` table count filtered by `tenantId`. The linkage should mirror that precision.

### LOW findings

**1-L1:** "Dependencies: ep5-s1" is listed but the out-of-scope section says "this story assumes the tables already exist" — those two statements together are correct, but the dependency is not reflected in the story's own AC list (no AC verifies the migration ran successfully before the POST fires). Low because this is a test-plan concern, not a story defect.

**Verdict:** FAIL

---

## Story: ep1-s2

### HIGH findings

None.

### MEDIUM findings

**2-M1:** User story format: "I want to add stages via an '+ Add stage' control that inserts a new stage card at the end of the linear sequence with an inline name field" — the "I want" clause describes the mechanism (a specific control) rather than the capability. Per AC quality standards, the user story should express the desired outcome ("I want to add stages to a journey in sequence") and leave mechanism to ACs.

**2-M2:** AC3 (blank name → 400) does not specify what the inline field shows — "the inline field shows an error state" is vague. The test plan will need to infer what "error state" means. Medium: addressable without story rework.

### LOW findings

**2-L1:** Out-of-scope section omits delete (ep1-s2 defines add/edit; delete is introduced later). Delete is defined in the discovery/definition artefact as part of this epic's ep1-s2 story, but the story artefact's out-of-scope section doesn't name it explicitly. The definition doc says ep1-s2 includes "edit name, and delete stages" in its title but the story artefact ACs only cover add and edit-name. Either add delete ACs or explicitly call it out of scope.

**Verdict:** FAIL (1-H count: 0, but 2-M1 is a structural issue — re-scoring: the "I want" mechanism-description is a MEDIUM per the rubric, not HIGH. PASS threshold met at 3+ on all criteria. Re-evaluating: Traceability 4, Scope 4, AC quality 3, Completeness 3. All ≥3.)

**Verdict:** PASS

---

## Story: ep1-s3

### HIGH findings

None.

### MEDIUM findings

**3-M1:** AC2 ("autosave fires... a success indicator is shown briefly") — "briefly" is not testable. Specify duration or condition (e.g. "indicator dismisses after 2 seconds" or "indicator is visible until the next blur event").

**3-M2:** The "moment of truth" toggle in AC3 says "a PATCH request updates the `journey_stages` record for that field" but doesn't specify which field name (`moment_of_truth: true`). The AC should name the field so the test knows what to assert on the database record.

### LOW findings

**3-L1:** NFRs mention "Autosave on blur (no explicit save button required, but save button optional)" — this introduces optionality into the implementation that the ACs don't address. If a save button is implemented, the test plan needs to know whether both paths (blur and save button) must be tested. Clarify in AC or NFR.

**Verdict:** PASS

---

## Story: ep1-s4

### HIGH findings

None.

### MEDIUM findings

**4-M1:** AC3 (keyboard alternative) says "e.g. up/down controls on the stage card or reorder controls in the side panel" — the "e.g." leaves the implementation undefined at DoR time. The keyboard alternative mechanism must be specified (not "e.g.") because the test plan must assert a specific interaction. The design artefact defers this to story level — this story is that story-level decision point.

**4-M2:** AC1 ("updates `position` values of all affected stages in a single Postgres transaction") — "all affected" is ambiguous for drag-and-drop. Specify whether this is a full rebalance of all stages in the journey or only the contiguous range between the source and target positions.

### LOW findings

**4-L1:** ADR-018 anti-pattern reference is correct ("drop target must not be at exact geometric center") — but the ACs don't include a test case asserting this. This should be a test-plan requirement, but noting it is not in the AC set.

**Verdict:** PASS

---

## Story: ep2-s1

### HIGH findings

None.

### MEDIUM findings

**5-M1:** AC1 says "all features for the tenant's repo" but the discovery/clarify artefacts don't define "tenant's repo" precisely — `pipeline-state.json` is a single file in the local checkout, not scoped by tenant. The AC should say "features from the local `pipeline-state.json`" rather than implying tenant-scoping of the file itself (tenant scoping applies to mappings, not to the feature list).

**5-M2:** AC2 ("filter/search input is available") does not specify whether the filter operates client-side or triggers a server request. For a potentially large feature list, this matters for both implementation and test.

### LOW findings

**5-L1:** Out-of-scope section says "saving the mapping (ep2-s2)" — but ep2-s2 is actually titled "Feature-to-stage mapping: save mapping with metric key selection." The cross-reference is correct but the story-slug reference would be clearer than the title.

**Verdict:** PASS

---

## Story: ep2-s2

### HIGH findings

**6-H1:** AC4 (upsert on `journey_stage_id` + `feature_slug`) is listed as an AC but is actually an NFR/implementation constraint. An AC must describe observable behaviour: "Given I map the same feature to the same stage a second time, When the save completes, Then the stage shows one mapping for that feature, not two." The current AC4 describes database internals ("upsert"), which is not observable behaviour. This matters because a naive implementation could delete-then-insert (not a true upsert) and pass a database-level AC while having different race-condition behaviour.

### MEDIUM findings

**6-M1:** AC1 (metric key picker) says "available DoD metric keys from that feature's record in `pipeline-state.json`" — but `pipeline-state.json` story records don't have a standardised `dodMetrics` field in the schema. The story assumes this field exists. The test plan will need to know the exact path within the `pipeline-state.json` structure where these keys are found. This should be specified in the AC or NFR.

**6-M2:** AC5 (cross-tenant guard) — the guard condition is "cross-tenant `journey_stage_id`" but the story also maps a `feature_slug` which is not tenant-scoped (features are in `pipeline-state.json`, not in Postgres). The guard only needs to verify the stage belongs to the requester's tenant. The AC is correct in what it checks but would benefit from a note clarifying that feature_slug itself is not a tenant-scoped value.

### LOW findings

**6-L1:** Dependency on ep2-s1 is correct — but ep2-s1 is the feature picker modal only; ep2-s2 extends it with metric key selection. The story should note whether ep2-s2 modifies the picker modal or opens a second step. The design artefact describes "after selecting a feature, operator optionally selects metric keys" — this should be explicit in the story ACs rather than implied.

**Verdict:** FAIL

---

## Story: ep2-s3

### HIGH findings

None.

### MEDIUM findings

**7-M1:** User story persona is "Tech lead / squad lead" but the primary user of the Delivery view as described is the outer loop practitioner mapping features. The tech lead consuming the view is a secondary reader. The persona should be "Outer loop practitioner" for the authoring/annotation action, with the tech lead as a secondary persona. As written, the story implies the tech lead is the one toggling the view and reading the annotations — which contradicts how view modes are described in the UX design.

**7-M2:** AC2 (feature-not-found case) says "shown as '⚠️ Feature not found (slug)' with a remove affordance" — the remove affordance is not defined in any other story as an AC. If removing a mapping from the Delivery view is possible here, this story must include the "remove mapping" AC. If it is out of scope, AC2 should say "shown as '⚠️ Feature not found (slug)' — no remove affordance in MVP."

### LOW findings

**7-L1:** Out-of-scope section says "Editing mappings from the Delivery view (deferred)" and "removing mappings (deferred for MVP)" — but AC2 includes a remove affordance. This is a direct contradiction within the story artefact.

**Verdict:** PASS (MEDIUM and LOW do not drop any criterion below 3. However, the 7-L1 contradiction should be noted for the test plan author — AC2 must be reconciled with the out-of-scope list before test-plan can proceed cleanly.)

---

## Story: ep3-s1

### HIGH findings

None.

### MEDIUM findings

**8-M1:** AC1 ("chip/badge using the stage's `emotion` enum value") — the word "chip/badge" is implementation-vague. The AC should specify that the emotion is displayed as a coloured chip (consistent with the design artefact's "colour chip + text label" language). "Chip/badge" introduces optionality.

### LOW findings

**8-L1:** The story says "Dependencies: ep1-s3, ep2-s3" — ep2-s3 (Delivery view) is listed as a dependency. The Customer experience view is a view mode toggle parallel to the Delivery view, not dependent on it. The Delivery view annotation rows are a separate concern. The dependency on ep2-s3 appears to be incorrect; ep3-s1 depends on ep1-s3 (stage attributes exist) but not on ep2-s3 (feature mappings). This should be clarified — if the view toggle mechanism introduced in ep2-s3 is what's being depended on, say so explicitly.

**Verdict:** PASS

---

## Story: ep3-s2

### HIGH findings

**9-H1:** AC6 ("health state indicator updates...without requiring a full page reload") is not testable as written. "Without requiring a full page reload" is a negative constraint on implementation, not an observable behaviour. The AC should describe the trigger: "Given a feature mapping is added to a stage, When the Delivery view is active, Then the health indicator on that stage updates within the current page view (without a reload)." The current AC6 has no "Given" condition, no trigger, and no specific observable outcome.

### MEDIUM findings

**9-M1:** Health computation is specified as "server-side at render time" in both the NFR and design artefact — but AC6 implies real-time update behaviour (updating when "underlying mappings change... without requiring a full page reload"). These two requirements are in tension: server-side computation at render time requires a page render to update; real-time updates without reload implies client-side reactivity or a polling/push mechanism. This tension must be resolved before the test plan can be written.

**9-M2:** The health state definitions (✅ / ⚠️ / ❌) are clear, but there is a missing case: a stage with no mapped features but with metric keys stored (JSONB `metric_keys` on orphaned mappings). This is logically impossible if cascading deletes are correct (per ep1-s2), but the story should confirm this case is covered by cascade rather than leaving a gap.

### LOW findings

**9-L1:** Summary bar ("X of Y stages have metric coverage") — "metric coverage" in the summary bar means ✅ stages only, but this is not explicit in the AC. "Have metric coverage" could be read as ✅ + ⚠️. Add "where 'metric coverage' means at least one feature mapped AND at least one metric key selected (✅ state only)."

**Verdict:** FAIL

---

## Story: ep4-s1

### HIGH findings

None.

### MEDIUM findings

**10-M1:** User story format: "I want a journey list page at `/journeys` that shows all journeys scoped to my tenant" — the "I want" clause describes the solution (a list page at a URL) rather than the capability. Standard format: "I want to see all my journeys in one place so that I can navigate to them." Medium: the intent is clear but the format is non-standard.

**10-M2:** AC3 (new journey form) says "optional description, and optionally associate a product from a picker of existing products for my tenant" — but this AC is a duplicate of ep1-s1's creation flow. The list page story should reference the creation flow (implemented in ep1-s1) rather than re-specifying it. As written, there is an implicit expectation that the list page implements its own creation form. The two forms may have different UX entry points but should share the same route handler — this must be clarified.

### LOW findings

**10-L1:** AC5 (cross-tenant guard) tests GET requests with another tenant's journey ID — but the list page (`GET /journeys`) returns all journeys for the authenticated tenant. The realistic cross-tenant attack surface is a direct `GET /journeys/:id` with a foreign ID (already covered in ep5-s2) and a query that leaks another tenant's records (which AC1 implicitly covers via "scoped to my `tenantId`"). AC5 is redundant with ep5-s2 and could be removed or replaced with a test that the list query returns only the authenticated tenant's records.

**Verdict:** PASS

---

## Story: ep4-s2

### HIGH findings

None.

### MEDIUM findings

**11-M1:** AC2 ("first associated journey ordered by `created_at` ascending") — if a product has multiple journeys, only the first is linked. This creates a UX ambiguity: if a product gains a second journey, the link on the product page does not change. The AC should note this behaviour explicitly ("only the first journey by `created_at` is linked; products with multiple journeys show only one link in MVP") so operators are not surprised.

### LOW findings

**11-L1:** Benefit linkage says "discoverability drives the adoption metric; without visible entry points, M1 cannot reach its target" — this is a reasonable linkage but thin. A nav link does not directly create journey records; it reduces friction for M1. The linkage should say "without discoverability, practitioners cannot reach the creation flow that M1 depends on" to be precise about the mechanism.

**Verdict:** PASS

---

## Story: ep5-s1

### HIGH findings

None.

### MEDIUM findings

**12-M1:** AC4 ("idempotent — safe to run twice without error") — "without error" is a partial definition of idempotency. A truly idempotent migration must also produce no duplicate schema objects (tables, indexes, constraints) on re-run. The AC should say "safe to run twice — tables and indexes already exist are detected and no error is raised; no duplicate tables or indexes are created."

**12-M2:** AC3 (`feature_journey_stage_mappings` table) does not specify the FK relationships (only that the columns exist). The design artefact specifies `journey_stage_id` FK → `journey_stages` and `journey_id` FK → `journeys` with cascading delete. The migration AC must include the FK constraints and cascade behaviours as testable assertions.

### LOW findings

**12-L1:** AC5 (indexes) — the index list is `journeys(tenant_id)`, `journey_stages(journey_id)`, `journey_stages(tenant_id)`, `feature_journey_stage_mappings(journey_stage_id)`, `feature_journey_stage_mappings(tenant_id)`. Missing: `journeys(product_id)` (used in ep4-s2's `ORDER BY created_at` query joining from product page) and `feature_journey_stage_mappings(feature_slug)` (used for "feature not found" lookup in ep2-s3). These are performance considerations, not correctness blockers, but should be evaluated before the migration is final.

**Verdict:** PASS

---

## Story: ep5-s2

### HIGH findings

None.

### MEDIUM findings

**13-M1:** AC6 ("zero cross-tenant data leaks") is a summary assertion rather than a specific observable behaviour with a Given/When/Then. This should be expressed as: "Given the adversarial test suite covers all journey, stage, and mapping routes, When all tests pass, Then no response from any journey route includes data scoped to a tenant other than the authenticated requester." The current AC6 is a verdict, not a testable behaviour.

**13-M2:** AC5 tests `POST /api/journey-stages/:stageId/mappings` using a cross-tenant stage ID. But the route URL pattern as implied by ep2-s2 uses `journey_stage_id` in the body, not in the URL path. If the route is `POST /api/journeys/:id/stages` (for stage creation) and `POST /api/journey-stages/:stageId/mappings` (for mappings), the adversarial test must use the actual route structure. The AC should verify that the route URL shown is the actual implemented route — not an assumed one.

### LOW findings

**13-L1:** The dependency list includes ep1-s1 and ep2-s1 but not ep1-s2 (stage creation routes). The adversarial tests cover `POST /api/journeys/:id/stages` which is implemented in ep1-s2, not ep1-s1 or ep2-s1. Add ep1-s2 to the dependency list.

**Verdict:** PASS

---

## Overall Verdict

**Verdict:** FAIL — 4 stories have HIGH findings that must be resolved before /test-plan.

| Story | HIGH | MEDIUM | LOW | Verdict |
|-------|------|--------|-----|---------|
| ep1-s1 | 2 | 2 | 1 | FAIL |
| ep1-s2 | 0 | 2 | 1 | PASS |
| ep1-s3 | 0 | 2 | 1 | PASS |
| ep1-s4 | 0 | 2 | 1 | PASS |
| ep2-s1 | 0 | 2 | 1 | PASS |
| ep2-s2 | 1 | 2 | 1 | FAIL |
| ep2-s3 | 0 | 2 | 1 | PASS |
| ep3-s1 | 0 | 1 | 1 | PASS |
| ep3-s2 | 1 | 2 | 1 | FAIL |
| ep4-s1 | 0 | 2 | 1 | PASS |
| ep4-s2 | 0 | 1 | 1 | PASS |
| ep5-s1 | 0 | 2 | 1 | PASS |
| ep5-s2 | 0 | 2 | 1 | PASS |

**Total:** 4 HIGH, 24 MEDIUM, 13 LOW across 13 stories.

**Stories with HIGH findings (must fix before /test-plan):**
- ep1-s1: 1-H1 (malformed user story "I want"), 1-H2 (AC3 does not test isolation)
- ep2-s2: 6-H1 (AC4 describes database internals, not observable behaviour)
- ep3-s2: 9-H1 (AC6 has no Given/When/Then; not testable as written)