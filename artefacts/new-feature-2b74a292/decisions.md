# Decisions: Multi-User Role-Aware Synchronous Collaboration

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
