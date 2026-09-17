# Decisions: Multi-User Role-Aware Synchronous Collaboration

## ep1-s3's DoR touch-points and response-shape assumptions are wrong; corrected against the real codebase before any code was written

**Date:** 2026-09-17
**Context:** Found while planning ep1-s3's implementation, before writing any code — the same class of gap as ep1-s2's DoR inaccuracies (route-prefix convention, a nonexistent "product settings" page), but deeper here since it's about the core data model, not just a route path.

The DoR (`artefacts/new-feature-2b74a292/dor/ep1-s3-dor.md`) states: touch point `src/web-ui/routes/features.js`, endpoint `POST /api/features`, a `features` table with primary key `featureId`, and a JSON response `{featureId, productId, podAssignments: [...], collaborators: [...]}`. None of this matches the real codebase:
1. `src/web-ui/routes/features.js` exists but has nothing to do with feature creation — it handles feature *artefacts* and *ideas* (`handleGetFeatureArtefacts`, `handlePostIdea`, etc.).
2. There is no `/api/features` route anywhere in `server.js`.
3. The real feature-creation handler is `handlePostProductFeature` in `src/web-ui/routes/products.js`, wired at `POST /products/:id/features` (the same route family ep1-s2 already extends with `set-default-pod`).
4. **There is no `features` table with a `featureId` primary key.** What this story's ACs call "a feature" is, in this codebase's real domain model, a **journey** — created via `journey-store.js`'s `createJourney()`/`setJourneyFields()`, which dual-writes to an in-memory Map, disk, and a real Postgres `journeys` table (`journey_id`, `tenant_id`, `product_id`, ... columns, confirmed via `journey-store-pg.js`). `journeyId` is the real, durable, tenant/product-scoped identifier this story's "featureId" concept maps onto.
5. The handler's real response is an **HTTP 303 redirect** to a skill-chat session page (`/skills/:skill/sessions/:sid/chat`) — there is no JSON response body at all, so AC1's literal "the feature is created with podAssignments... recorded against it" cannot be verified by inspecting a response body. It must be verified by querying `pod_assignments` directly after the redirect.

**Decision:** Implement pod-inheritance in `handlePostProductFeature`, injected immediately after the existing `_journeyStore.setJourneyFields(journeyId, {..., tenantId, productId})` call (the earliest point `journeyId`/`tenantId`/`productId` are all in scope AND durably persisted to Postgres via that call's own `_pgWrite`). Reuse `pod_assignments` (from `pod-assignment-store.js`, ep1-s1/ep1-s2) directly — its `feature_id` column was deliberately left nullable in ep1-s1's original migration specifically anticipating this story (see `pod-assignment-store.js`'s own header comment). Write with `feature_id: journeyId`, `assignment_type: 'feature-inherits-product-default'`, matching the DoR's own specified `assignmentType` value. Create a new `feature_collaborators` table (genuinely new, DoR's schema for it is otherwise accurate) keyed by `feature_id: journeyId`. Treat the whole pod-inheritance step as best-effort/non-fatal — matching this handler's own established resilience pattern for its other side effects (disk write, PostHog capture) — a missing or failed pod lookup must never block feature/journey creation itself.
**Rationale:** The underlying intent (a newly-created feature inherits its product's default pod) is unchanged and fully achievable; only the mechanical touch-points needed correcting against what the codebase actually is. Verifying test/AC evidence via direct `pod_assignments`/`feature_collaborators` DB queries (not response-body parsing) is the only way to actually prove this works, given the real handler's redirect-based response shape.
**Story:** ep1-s3 — no AC change; ACs remain accurate to the real, observable outcome (a pod IS assigned and collaborators ARE pre-populated), only the mechanical verification method changes from "read the response body" to "query the database after the redirect."

---

## RISK-ACCEPT: ep1-s2 NFR-Perf-1 (default pod assignment ≤2s) has no automated measurement

**Date:** 2026-09-17
**Context:** Written during `/definition-of-done` for ep1-s2. Same class of gap as `ep1-s1`'s own NFR-Perf-1 RISK-ACCEPT: the story's NFR-Perf-1 ("Default pod assignment completes within 2 seconds") was never given an automated timing assertion — the in-memory fake-pool unit tests don't measure real Postgres latency, and no dedicated timing test was added at any stage.
**Decision:** RISK-ACCEPT. Ship without a formal timing assertion.
**Rationale:** Low risk — `setProductDefaultPod` is a single tenant-scoped SELECT, a COUNT, and one upsert INSERT; no structural reason to approach 2s at this story's scale. Consistent with the same reasoning already accepted for `ep1-s1`'s equivalent NFR.
**Story:** ep1-s2 — no AC change; NFR-Perf-1 remains formally unverified by automation, tracked here rather than silently dropped.

---

## ep1-s2's own AC2 conflicts with its own DoR touch-point contract; scope narrowed to match the contract, not the AC's literal wording

**Date:** 2026-09-16
**Context:** Found while planning ep1-s2's implementation, before writing any code. ep1-s2's AC2 reads: "When a product owner creates a new feature under 'Payments', Then the new feature shows 'Assigned pods: Core Platform Pod (3 members)' automatically, with no manual assignment step" — this describes feature-creation-time pod inheritance. But ep1-s2's own DoR (`artefacts/new-feature-2b74a292/dor/ep1-s2-dor.md`) explicitly lists "Feature creation core logic (ep1-s3 will handle inheritance)" under "Files you MUST NOT modify." This is CLAUDE.md's own documented B1/D1 pattern (a DoR contract's exclusion list contradicting what the test plan/ACs actually require) — except here the conflict is more specific: AC2's entire scope is a near-exact duplicate of `ep1-s3`'s entire dedicated story ("Feature Inherits Product Default Pod on Creation," Dependencies: ep1-s2, whose own 3 ACs cover exactly this: feature creation records podAssignments, `feature_collaborators` is pre-populated, roles are preserved). The epic artefact (`epics/pod-formation-product-assignment.md`) confirms the walking-skeleton slicing intent: ep1-s1 builds the pod, ep1-s2 assigns it as a product default, ep1-s3 makes feature creation actually consume that default. ep1-s2's AC2 describes an end-to-end outcome only truly deliverable once ep1-s3 also ships.
**Decision:** Per CLAUDE.md's own B1/D1 rule ("When the two conflict, the contract is the authoring defect: update the contract to match the ACs and test plan, not the other way around") — but applied to the actual root cause here, which is that AC2's wording, not the DoR's touch-point exclusion, is the authoring defect (the DoR's exclusion correctly anticipates and names ep1-s3 as AC2's real owner). Narrowing ep1-s2's OWN implementation to what its DoR contract actually scopes: AC1 (save the default-pod assignment, return the data, update the UI immediately) and AC3 (non-retroactivity — trivially true, since ep1-s2 never touches any existing feature's own data). AC2's full end-to-end outcome (a newly created feature actually showing the inherited pod) is NOT implemented by ep1-s2's own code — it becomes fully true only once ep1-s3 ships, exactly as the DoR's own exclusion note already said. ep1-s2's implementation plan instead proves the precondition AC2 depends on: `GET /api/products/{productId}` returns a `defaultPod` object in the exact shape ep1-s3's feature-creation code will need to consume (`{podId, name, memberCount}`), verified by a unit test, with an explicit comment marking it as the AC2 handoff contract to ep1-s3.
**Rationale:** Implementing AC2 fully within ep1-s2 would mean touching feature-creation core logic against the DoR's own explicit, signed-off exclusion — and would make ep1-s3's entire subsequent story redundant work. Splitting the outcome across the two stories (as the epic's own walking-skeleton slicing already intended) is the correct, minimal-scope-violation path. This is a story-sequencing/authoring gap from `/definition`, not something to silently paper over — flagged here, and AC2's test in ep1-s2's own test-plan.md will be marked ⚠️ partial (precondition proven, full outcome deferred) rather than a false ✅, when ep1-s2 reaches `/verify-completion` and `/definition-of-done`.
**Story:** ep1-s2 — AC2 is not fully satisfied by ep1-s2's own implementation; its remaining half becomes ep1-s3's own AC1. No change to either story's stated AC text (both remain accurate to what the system will do once both stories ship) — only to what code each individual story's own PR delivers.

---

## RISK-ACCEPT: ep1-s1 AC3 has no UI-level verification path

**Date:** 2026-09-16
**Context:** Written during `/definition-of-done` for ep1-s1, formalizing the gap already described in the "ep1-s1 final review" decision below. AC3 ("When they attempt to assign a member a role that is not in the organisation's known role set, Then the save is rejected...") describes a UI interaction — the shipped Pod Manager UI has no control that lets a user select or type a role for a member being added; every member's role is read directly from their fixed roster entry. AC3 is fully and correctly enforced server-side (`routes/pods.js`'s guard, proven by `tests/check-ep1-s1-pod-creation.js` Part 4) — a malformed or malicious direct API call is still rejected — but no test at any level exercises this through the browser, and none can, as this UI is built.
**Decision:** RISK-ACCEPT. Ship with API-level-only coverage for AC3. Building a role-selection UI control purely to make a UI-level test possible would be scope expansion into real UI work (a new interactive element, new client-side validation states) beyond this bounded MVP story.
**Rationale:** The underlying security/correctness property (invalid roles are rejected) is real and verified; the gap is test-coverage completeness for a UI interaction that doesn't exist yet, not an unguarded system. Revisit when a real per-member role-picker is built — likely alongside `role_definitions` replacing the hardcoded `VALID_ROLES` constant, and likely needed anyway once ep4-s1/ep4-s2 reuse this component with real org data.
**Story:** ep1-s1 — no AC change.

---

## RISK-ACCEPT: ep1-s1 NFR-Perf-1 (pod creation ≤2s) has no automated measurement

**Date:** 2026-09-16
**Context:** Written during `/definition-of-done` for ep1-s1. The story's NFR-Perf-1 ("Pod creation completes within 2s") was never given an automated timing assertion — the implementation plan's own "NFR coverage" section explicitly flagged this as out of scope for the in-memory fake-pool unit tests ("a real Postgres timing assertion is out of scope for this plan's unit tests"), deferring formal verification to `/verify-completion` or later, which never happened either. A live production check performed for this DoD observed pod creation and duplicate-rejection both completing with no perceptible UI lag (sub-second), but this is an informal observation, not a rigorous measurement against the 2s target.
**Decision:** RISK-ACCEPT. Ship without a formal timing assertion.
**Rationale:** Low risk — a single-row insert plus a small per-member insert loop against Postgres has no structural reason to approach 2s at this story's scale (3-4 members), and the live check found no perceptible delay. A dedicated NFR timing test would be low-cost to add later if this endpoint's usage pattern changes (e.g. very large pods) or if latency is ever reported as an issue.
**Story:** ep1-s1 — no AC change; NFR-Perf-1 remains formally unverified by automation, tracked here rather than silently dropped.

---

## ep1-s1 final review: two honest AC-coverage gaps, neither treated as blocking

**Date:** 2026-09-16
**Context:** The mandatory final reviewer (after all 8 implementation-plan tasks completed) found two real gaps between ep1-s1's literal Acceptance Criteria and what the shipped implementation/tests actually verify. Both were present in some form in the original DoR-signed-off plan and were not introduced by scope drift during execution; they were only surfaced by this final cross-check against the AC text.

**Gap 1 — AC3 (invalid role rejection) has no UI-level E2E coverage, and cannot have any as this UI is built.** `pod-manager.html`'s Available roster derives every member's `roleId` directly from their fixed `ORG_ROSTER` entry — there is no UI control anywhere that lets a user select or type an arbitrary (including invalid) role for a member being added. AC3's literal wording ("When they attempt to assign a member a role that is not in the organisation's known role set") describes an interaction this UI does not expose. The implementation plan's own Task 8 E2E spec already reflected this reality by never attempting a UI-level AC3 test — its third test was labeled "AC3" but actually verified the gated-primary-action affordance, a mislabeling now corrected in `tests/e2e/ep1-s1-pod-creation.spec.js`'s header comment and test title. AC3 is fully and correctly enforced at the API layer (`routes/pods.js`'s guard, proven by `tests/check-ep1-s1-pod-creation.js` Part 4) — the gap is UI-level *test coverage*, not a functional defect; a malicious or malformed direct API call is still correctly rejected.
**Decision:** Accept API-level-only coverage for AC3 rather than building a role-selection UI control purely to make a UI-level test possible — that would be meaningful scope expansion (a new interactive element, new validation states) beyond this bounded MVP story, and the "Out of Scope" section already frames ep1-s1 as create-only/no-editing. Flagged here rather than silently left mislabeled.
**Rationale:** Matches this repo's own CSS-layout/AC-classification precedent (B2 in CLAUDE.md) — an AC that can't be verified the way it was originally envisioned should be explicitly classified and documented, not silently claimed as covered by a mislabeled test.
**Story:** ep1-s1 — no AC change. A future story giving the Pod Manager UI a real per-member role-picker (likely needed anyway once `role_definitions` replaces the hardcoded `VALID_ROLES` constant) should add the UI-level AC3 test at that point.

**Gap 2 — AC1's literal "(3 members)" outcome depends on who "the org admin" is, which the current demo roster doesn't resolve.** AC1's script is: admin adds Hamish (conductor), Susan (engineer), Darren (engineer), saves, sees "(3 members)". `pod-manager.html`'s `openModal()` always pre-includes a hardcoded, generic creator (`{ userId: 'me-uuid', name: 'You', roleId: 'conductor' }`) per design.md's "creator pre-included by default" rule. `ORG_ROSTER` is explicitly a demo stand-in for a real users endpoint (see the file's own header comment). If AC1's "org admin" is read as a person distinct from Hamish, following the script literally through the current UI yields 4 members (You + Hamish + Susan + Darren), not 3 — a mismatch with the AC's stated count. If instead "the org admin" IS Hamish (plausible: Hamish is the only `conductor`-tagged demo person, and design.md's pre-inclusion rule exists precisely so the acting admin doesn't have to re-add themselves), the script resolves correctly to exactly 3. The backend layer is unambiguous and correct either way (`handlePostPodsCreate` called with exactly 3 named members yields `memberCount: 3` — proven by unit tests); the ambiguity is purely in the demo UI's disconnected "You" identity vs. real session-derived identity, which a production deployment (fetching the roster from a real users endpoint, per the file's own comment) would resolve naturally since "You" would then genuinely be whichever real person is signed in.
**Decision:** Accept as a demo-fixture limitation, not a product defect. `ep1-s1`'s own E2E test for AC1 already avoids asserting the literal "(3 members)" text for this reason (it only asserts the pod name appears), which in hindsight was the right conservative call rather than an oversight.
**Rationale:** Wiring `ORG_ROSTER` to real session identity is a real-users-endpoint integration, explicitly out of this story's bounded scope (the file's own comment already flags this as future work), not a bug in the pod-creation logic itself.
**Story:** ep1-s1 — no AC change; the AC's "(3 members)" outcome is correctly achievable in a real deployment once the roster is identity-aware, which is tracked as future integration work, not a gap in this story's own logic.

---

## ep1-s1 Task 7 quality review: defer role-tab keyboard/screen-reader accessibility fix

**Date:** 2026-09-16
**Context:** During `/subagent-execution` for ep1-s1 Task 7 (Pod Manager UI), the code-quality reviewer flagged that the role-filter tabs in the Available panel are `<span onclick="...">` elements, not `<button>` elements — not keyboard-focusable/operable, and the active-tab state (`.active` class) isn't exposed to assistive tech (no `aria-pressed`). Two related Minor findings from the same review (no `<label>` on the new search input; `#error-banner`/`#success-banner` lack `role="alert"`/`aria-live` for dynamic status announcements) are logged here too, same reasoning.
**Decision:** Deferred, not fixed in this pass. Unlike the innerHTML/XSS and inline-style findings from the same review (fixed immediately, since those were security-adjacent and narrowly scoped), the `<span onclick>` role-tab pattern was present in the ORIGINAL DoR-signed-off implementation plan's literal code for Task 7 (`artefacts/new-feature-2b74a292/plans/ep1-s1-plan.md`), not introduced by this session's fixes — same category of "copied verbatim from an approved artefact" as the Task 1 test-harness-style decision above. A proper fix (button semantics, `aria-pressed`, focus-visible styling, `aria-live` regions, explicit `<label for>` associations) is a legitimate, cross-cutting a11y pass, not a one-line change, and this component is explicitly reused by ep4-s1/ep4-s2 later in this same epic — better done once, comprehensively, across all reuse sites than piecemeal here.
**Rationale:** Keeps this fix pass narrowly scoped to the two issues (XSS-risk innerHTML, style-block consistency) that were genuinely safe and cheap to fix immediately, without unilaterally expanding Task 7's scope into a full accessibility audit mid-execution. Flagged here so it isn't silently lost — worth a dedicated follow-up story (or folding into whichever of ep4-s1/ep4-s2 first reuses this component) rather than a permanent accept.
**Story:** ep1-s1 — no change to Acceptance Criteria; this is a UI-quality gap with no stated AC or NFR covering keyboard/screen-reader operability of the role-tab filter, search input labeling, or banner announcements.

---

## ep1-s1 Task 1 quality review: accept the ok()/eq() test-harness style as a documented deviation

**Date:** 2026-09-16
**Context:** During `/subagent-execution` for ep1-s1, the code-quality reviewer for Task 1 flagged that `tests/check-ep1-s1-pod-creation.js` uses a bare `ok()/eq()` + console-log-checkmark pattern, while most sibling test files in this story area (`check-arl-s1-user-roles.js`, `check-tir-s1-person-team-schema.js`, `check-si-s2-locale-preference.js`) use a `test(name, fn)` wrapper over `assert` with per-test try/catch isolation. This style was not the implementer's choice — it was copied verbatim from `artefacts/new-feature-2b74a292/plans/ep1-s1-plan.md`'s own Task 1 Step 1 code block, which is DoR-signed-off, and the same `ok()/eq()` pattern is used consistently across all 5 of this plan's test-writing tasks (Tasks 1, 2, 3, 4, 5 all append to the same file in this style).
**Decision:** Accept the deviation for ep1-s1 rather than unilaterally rewriting the already-approved plan's test code mid-execution. The practical downside (a thrown error anywhere in `run()` aborts the whole file with no per-assertion isolation, unlike the `test()/assert` sibling convention) is real but low-severity for this story's test scope (in-memory fake-pool assertions, no I/O flakiness expected).
**Rationale:** Rewriting the plan's test style now would touch 4 more not-yet-executed tasks' worth of already-signed-off plan content, a bigger change than this one quality-review finding warrants. A future story introducing a new test file in this area should default to the repo's dominant `test()/assert` convention rather than copying this one's style.
**Story:** ep1-s1 — no change to Acceptance Criteria; test-harness style only, no behavioural impact. (The reviewer's other flagged item — the test file's header docstring claiming "tenant-isolation and member-insertion-atomicity" coverage — is NOT a defect: the plan's Task 5, appending to this same file, adds exactly those assertions later in this same story's execution.)

---

## Incorporate the reference collaborator-picker wireframe into design.md

**Date:** 2026-09-14
**Context:** `artefacts/new-feature-2b74a292/reference/collaborators-picker-wireframe.html` — a wireframe the operator brought to discovery (redrawn from a screenshot of an internal tool's "who's building this?" flow) — was never consulted when `design.md` was produced. `skills/design/SKILL.md` Step 3 explicitly requires reference materials to be checked and reflected in the UX design; this was missed. `design.md`'s own UX section never described the Pod-creation/collaborator-picker screen at all, despite Epic 1 (Pod Formation) and Epic 4 (Advanced Pod Operations) — 5 of the feature's 13 stories — being built entirely around it.

**Decision:** Amended `design.md` to add a "Reference Materials" section citing the wireframe, a "Pod Creation / Collaborator Picker" UX section describing the two-panel roster/selection screen (adopting the wireframe's role-tagged roster, pre-included creator, and gated primary-action pattern), and a new "Collaborator/Pod picker" component entry. Two of the wireframe's five annotations were evaluated explicitly rather than silently adopted or dropped:
- **Gated primary action** ("Start" disabled until ≥1 required selection) — adopted, generalised from "≥1 Engineer" to "≥1 other member" since Pod composition isn't role-constrained at creation time.
- **Private/discoverable visibility toggle** — deferred. This platform has no existing workspace-wide feature-discoverability model to toggle away from (every feature already requires explicit collaborator assignment); adopting this would need its own discovery pass first.

**Rationale:** The wireframe's central idea — "save this team as a reusable POD" — is literally the origin of this feature's whole Pod data model; it deserved a citation and a properly-described screen, not silent, undocumented absorption into the epics. Documenting it now doesn't change any story's scope (the stories already assumed this screen existed; the design doc simply hadn't described it), so this is additive, not a material rescope requiring the already-passed stories to be reopened.

**Story:** N/A — design-artefact amendment, not a story-level change. Affects context for ep1-s1, ep1-s2, ep4-s1, ep4-s2 (Pod Manager / picker screens) without changing their acceptance criteria.

---

## Known open issue (not resolved by this entry): review artefact inconsistency

**Date:** 2026-09-14
**Context:** While checking the design gap above, found that this feature has two contradictory review artefacts for the same 13 stories: the top-level `review.md` (dated 2025-01-30) verdicts **FAIL — 12 HIGH findings**, every story failing Category C for having only 1 acceptance criterion when the DoR hard block (H2) and review's own Category C both require a minimum of 3. The per-story `review/ep*-review-1.md` files (dated 2026-09-14) verdict **PASS, no findings** on the same stories. Directly re-counting ACs on every story file on disk today confirms the 2025-01-30 `review.md` is the accurate one — all 13 stories still have exactly 1 `Given/When/Then` AC each; none have been expanded to 3. The stories' User Story sections also have a template defect: the "I want" clause is missing and the "So that" clause is populated with raw benefit-linkage prose instead of a real benefit clause (e.g. ep1-s1: "So that Synchronous team access — completing this story enables the first step...").

**Not decided here:** whether to expand every story to 3+ ACs and re-run `/review` (the correct fix per this repo's own gates), or some other path. This is recorded as an open issue for the operator to decide how to proceed — not resolved as part of this design amendment.

**Resolved 2026-09-15 (commit `f22c39f7`, 9 minutes after this entry):** every story was expanded to 3 Given/When/Then ACs using the splits the legacy `review.md`'s own findings called for, and the User Story format defect was fixed across all 13. Confirmed directly against disk on 2026-09-15 during the real outer-loop run (`ep1-s1.md` genuinely has 3 well-formed ACs with correct "I want"/"So that" clauses) and re-verified by a fresh, real `/review` pass the same day — all 13 stories PASS, no findings. This entry was left open in the artefact past the fix; recorded here so a future reader doesn't need to independently re-verify what's already settled.

---

## `ep1-s1` DoR amended to reference the collaborator-picker wireframe design (2026-09-15)

**Context:** `ep1-s1`'s DoR (freshly generated 2026-09-15 as part of driving all 13 stories through the real outer-loop pipeline) described a generic "form with name field, members picker, role dropdown" in its Coding Agent Instructions — it did not reference the "Pod Creation / Collaborator Picker" UX section this same design.md already specifies (two-panel Available/Your-team roster, role chips, gated primary action). Caught before `/branch-setup` by cross-checking design.md against the DoR at the operator's request.

**Decision:** Amended `artefacts/new-feature-2b74a292/dor/ep1-s1-dor.md`'s Coding Agent Instructions to explicitly describe the two-panel picker structure and the "≥1 member beyond creator" gating rule, citing `design.md`'s "Pod Creation / Collaborator Picker" section and the reference wireframe directly, so the binding instructions block is self-sufficient without requiring the coding agent to separately discover and cross-reference design.md on its own.

**Story:** ep1-s1 — no change to Acceptance Criteria; UI structure detail only, consistent with what design.md already specified.

---

## `ep1-s1` branch-setup baseline: 1 pre-existing failure acknowledged (2026-09-15)

**Context:** `/branch-setup`'s clean-baseline check ran the full suite (668 files) before any `ep1-s1` code was written. 1 failure: `tests/check-p3.5-validate-trace.js` (`ps1-exits-0-on-valid-repo-with-ci-flag`), caused by a pre-existing, already-documented local Windows `python3` shim permission issue unrelated to this story — confirmed repeatedly earlier this session across multiple unrelated worktrees and branches.

**Decision:** Acknowledged as pre-existing per `/branch-setup`'s own Step 5 options; proceeding to `/implementation-plan` without fixing it. Not `ep1-s1`'s concern — an environment-level gap, not a code defect in this feature.

---

## `ep1-s1` role validation: hardcoded list, not a `role_definitions` table (2026-09-15)

**Context:** `ep1-s1`'s own DoR assumed "Organisation role definitions exist in a roles table or cache" — false; no such table exists anywhere in this codebase. `design.md`'s Data Model section does describe a `role_definitions` table (`tenantId`, `roleId`, `name`, `stageVisibility`, `canApproveStages`), but that richer shape is for stage-visibility filtering (a different, later concern — "engineer sees test-plan–coding" etc.) — not `ep1-s1`'s "create a pod with members + roles" scope. `design.md`'s own Open Question #5 already states the intended sequencing: "MVP hard-codes core roles (product, engineer, architect, designer, conductor); Phase 2 allows organisations to define custom roles."

**Decision:** `ep1-s1` validates roles against a hardcoded constant (`conductor`, `engineer`, `architect`, `product` — matching this story's own already-signed-off AC3 test expectation exactly; `design.md`'s 5-role list includes "designer", a minor drift between artefacts not resolved here since it doesn't affect this story's scope). No `role_definitions` table is created by this story. When a future story introduces the real `role_definitions` table (stage-visibility, per-tenant custom roles), it should migrate this hardcoded list into seed rows rather than the reverse.

**Story:** ep1-s1 — no change to Acceptance Criteria; implementation-detail simplification confirmed with the operator before writing the implementation plan.
