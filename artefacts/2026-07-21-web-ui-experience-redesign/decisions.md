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
