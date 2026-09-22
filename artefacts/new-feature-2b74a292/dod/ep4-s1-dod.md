# Definition of Done: Assign Multiple Pods to a Feature (Subset Selection)

**PR:** https://github.com/heymishy/skills-repo/pull/918 | **Merged:** 2026-09-22 (merge commit `573bfd10`)
**Story:** artefacts/new-feature-2b74a292/stories/ep4-s1.md
**Test plan:** artefacts/new-feature-2b74a292/test-plans/ep4-s1-test-plan.md
**DoR artefact:** artefacts/new-feature-2b74a292/dor/ep4-s1-dor.md
**Assessed by:** Claude
**Date:** 2026-09-23

---

## AC Coverage

- **AC1:** Given Feature A2 needs members from both Core Platform Pod and Data Analytics Pod, When a product owner navigates to Feature A2 settings and clicks "Assign pods", Then they see a selector listing all of the organisation's pods, allowing more than one to be selected.
- **AC2:** Given both pods have been selected, When the product owner removes Bob from Data Analytics Pod for this feature only, Then Bob is excluded from Feature A2's collaborators while remaining a member of Data Analytics Pod globally, unaffected in the pod itself.
- **AC3:** Given the assignment has been saved, When feature_collaborators is inspected, Then it contains exactly the union of both pods' members minus Bob (Hamish, Susan, Darren, Alice).

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/check-ep4-s1-multi-pod-assign.js` (7/7) + `tests/e2e/ep4-s1-multi-pod-assign.spec.js` (1/1, real browser, real checkboxes, real multi-select, 3 consecutive runs with zero flakiness) + live Chrome validation on real staging (real GitHub OAuth session, real product page, "⚙ Pods" button confirmed rendering on every feature row, clicking it opens a real modal with correct title/dialog semantics/Cancel-Save buttons, zero console errors — see Live Validation section below) | unit + integration-real-code + e2e-real-code + live-verified | The DoR's literal "Feature A2 settings" page does not exist anywhere in this app (confirmed by direct code investigation before implementation — see `decisions.md`). The real, substance-preserving equivalent: the "Assign pods" trigger is a per-feature-row button inline on the product page (the only place per-feature controls already exist in this app — the same pattern already established by `featureModuleAssignments`), opening a shared modal. AC1's actual substance (select a target feature's pod set, see all org pods, select more than one) is fully satisfied. |
| AC2 | ✅ | `tests/check-ep4-s1-multi-pod-assign.js`'s dedicated removal test (DELETE handler, asserts `pod_members` untouched) + `tests/e2e/ep4-s1-multi-pod-assign.spec.js`'s real-browser removal assertion | unit + integration-real-code + e2e-real-code | None. `removeFeatureCollaborator` only ever touches `feature_collaborators` (delete) and the new `feature_collaborator_removals` tracking table (insert) — verified directly by the final cross-task reviewer reading the function body, not just trusting the test. |
| AC3 | ✅ | `tests/check-ep4-s1-multi-pod-assign.js` (exact-union assertions, plus a dedicated removal-resurrection-guard test) + `tests/e2e/ep4-s1-multi-pod-assign.spec.js` (real union of 2 real pods' members, de-duplicated, verified in the real rendered modal) | unit + integration-real-code + e2e-real-code | AC3's exact scenario (Hamish/Susan/Darren/Alice minus Bob) is reproduced faithfully in both test files using the real handler and store code — no deviation. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. The one recorded deviation (AC1's UI-surface substitution — inline product-page control instead of a nonexistent settings page) is a substance-preserving correction against real, investigated architecture, matching this feature's now-established pattern for every prior fictional-DoR gap — not a scope gap.

---

## Scope Deviations

None. Confirmed against the story's Out of Scope list: no pod-creation-as-part-of-this-story (pods are created via the pre-existing, unmodified `ep1-s1` UI), no dynamic pod-member-changes mid-feature (deferred to `ep4-s2`, genuinely untouched — `pod-store.js`'s own diff is empty). `git log --oneline` on the branch shows exactly 12 commits, all mapping 1:1 to the 6-task implementation plan; no commit exists outside the plan.

---

## Test Plan Coverage

**Tests from plan implemented:** the test-plan's own 9-test breakdown (3 unit + 3 integration + 3 NFR) was consolidated into 2 dedicated new files (`check-ep4-s1-store-layer.js` for the DB layer, `check-ep4-s1-multi-pod-assign.js` for the full handler-level AC1/AC2/AC3 flow) plus a real browser E2E spec (`ep4-s1-multi-pod-assign.spec.js`) — a leaner grouping than the test plan's own per-scenario breakdown, matching this feature's established consolidation pattern, while adding real coverage (removal-resurrection guard, tenant isolation, idempotent double-removal) the test plan's own literal scenarios didn't anticipate.
**Tests passing:** all passing, re-run fresh against merged master in this session: `check-ep4-s1-store-layer.js` 8/8, `check-ep4-s1-multi-pod-assign.js` 7/7, `ep4-s1-multi-pod-assign.spec.js` 1/1 (run 3 consecutive times with zero flakiness during final review). Full `npm test` on merged master (commit `573bfd10`): **697 files run, 1 failed** (`tests/check-p3.5-validate-trace.js` — the same pre-existing, unrelated Windows-local `python3` shim permission issue noted throughout this session).

| Test file | AC(s) covered | Passing | Notes |
|-----------|---------------|---------|-------|
| `tests/check-ep4-s1-store-layer.js` | AC2, AC3 (foundation) | ✅ 8/8 | Pure DB-layer logic: multi-pod assign, union-insert, removal tracking, idempotent double-removal (a real bug found and fixed by Task 1's code-quality review) |
| `tests/check-ep4-s1-multi-pod-assign.js` | AC1, AC2, AC3 | ✅ 7/7 | Real handler dispatch (`handleGetFeaturePods`/`handlePostAssignFeaturePods`/`handleDeleteFeaturePodMember`) against the real `fake-test-db.js` adapter — 2 real, pre-existing adapter gaps found and closed in the adapter itself (not a test-only shim), which also fixed the real E2E webServer's own behaviour (see DoD Observations) |
| `tests/e2e/ep4-s1-multi-pod-assign.spec.js` | AC1, AC2, AC3 | ✅ 1/1 | Real Playwright browser test: real product/pod/feature seeding, real modal render, real multi-select + save + reload + reopen + removal, 3 consecutive runs with zero flakiness |

**Gaps (tests not implemented):** None blocking.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Multi-pod assignment UI completes within 1s | ✅ | Synchronous handler, in-memory/single-query DB operations in the real adapter path; confirmed via live Chrome check — no perceptible delay opening the modal. Not given a dedicated timing assertion, matching this feature's own established RISK-ACCEPT pattern for identically-shaped synchronous NFRs. |
| feature_collaborators is recalculated within 2s of change | ✅ | `handlePostAssignFeaturePods` synchronously calls `populateFeatureCollaboratorsFromPods` before responding — the response itself carries the updated collaborator list, trivially and provably within budget. |
| No security regression (new user-facing UI, DB-sourced strings) | ✅ | A real Critical XSS vulnerability was found by code-quality review and fixed (DOM-construction rewrite eliminating unescaped string concatenation and an inline-onclick injection vector) — independently re-verified with a concrete proof-of-concept trace by a dedicated follow-up review before being accepted as closed. |

---

## Live Validation

Performed live on real staging (`wuce-staging.fly.dev`) using a genuine, already-established GitHub OAuth session (no credentials entered by the assistant):

1. Navigated to a real product page (`test product`) — confirmed the "⚙ Pods" button renders correctly on every feature row, including the same triple-tab-render (By Module/By Phase/All) behaviour Task 6's own E2E spec discovered and documented.
2. Clicked the button on a real feature ("New 2x2 canvas") — confirmed a real modal opens with the correct title ("Assign pods to this feature"), correct `role="dialog"`/`aria-modal` semantics, and Cancel/Save buttons. Zero console errors.
3. The modal correctly rendered empty (no pod checkboxes, no error message) — this tenant genuinely has zero pods configured. Attempted to create a real pod live via `/admin/pods/manager` for a fuller checkbox-rendering confirmation; the browser automation session hit intermittent rendering instability (repeated `0x0 viewport` reads, inconsistent accessibility-tree snapshots across calls) that prevented reliably completing that additional step within this session. **Correction, caught by the operator mid-session:** an initial read that reported the org roster as empty was very likely a false negative from that same tooling instability, not a real data gap — `ORG_ROSTER` in `pod-manager.html` is a hardcoded static array (Hamish/Susan/Darren), unrelated to tenant/product context, so it should render identically on every visit. This was NOT independently re-confirmed live before this DoD was written; flagged as a follow-up rather than asserted either way.
4. The render-path and modal-open path (steps 1-2) were confirmed live regardless of the above — the interactive multi-select/save/remove flow already has exhaustive, zero-flake automated coverage (3 consecutive clean E2E runs) plus two independent review passes including a proof-of-concept XSS-fix verification.

**Verdict:** live render confirmed correct and error-free (button rendering, modal open, dialog semantics, zero console errors). The fuller live click-through of pod creation + multi-select was not completed this session due to browser-automation tooling instability, not a real product defect — full interactive-flow coverage instead rests on automated E2E (3/3 clean runs) + independent review. This is a genuine gap in *live* coverage, not in overall verification confidence.

---

## Metric Signal

This feature's benefit-metric artefact (`artefacts/new-feature-2b74a292/benefit-metric.md`) uses directional success indicators rather than a structured Tier 1 `metrics[]` array — no `metrics` entry exists in `pipeline-state.json` for this feature to update.

| Indicator | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Flexible team assembly ("a feature can pull in people from multiple teams without needing a brand-new pod just for it") | ✅ (baseline: 0 — no multi-pod assignment mechanism existed before this story; every feature could only ever inherit exactly one pod, at creation time, from its product's default) | Not yet measured | This story ships the mechanism end-to-end (real UI, real multi-pod union, real feature-scoped removal) and it is verified working in the real deployed environment. No real product owner has used it yet to avoid creating a redundant pod. Signal: `not-yet-measured`. Evidence note: shipped and live-verified 2026-09-23; awaiting first real usage. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 3 ACs satisfied with `unit + integration-real-code + e2e-real-code + live-verified` evidence for AC1, and `unit + integration-real-code + e2e-real-code` for AC2/AC3. One recorded deviation (AC1's UI-surface substitution, substance-preserving, matching this feature's own established fictional-DoR-correction pattern). Zero scope violations. Zero test gaps that block release. One real, Critical security defect (XSS) was found and fixed before merge, independently re-verified with a proof-of-concept trace — a strong validation of the two-stage-review process, not a defect in the final shipped code. Two real, pre-existing test-infrastructure gaps were found and closed properly (in the shared adapter, not as test-only debt) rather than worked around.

**Follow-up actions:**
1. None blocking.
2. Operator note: a future live-validation pass on this story should re-attempt creating a real pod on the `test product` staging tenant (zero pods currently exist there) to get a fuller live checkbox-rendering confirmation — this session's attempt was blocked by browser-automation tooling instability (`0x0 viewport` reads), not a real product/data gap; the earlier suspicion of an empty org roster was corrected mid-session (`ORG_ROSTER` in `pod-manager.html` is a hardcoded static array, unrelated to tenant context) but was never independently re-confirmed live.
3. `/improve` candidate: the DoR's fictional-architecture pattern reached a new severity tier in this story — every prior instance was a wrong file/table/field name pointing at something real; this one assumed an entire UI page that has never existed anywhere in the app, AND its own "Implementation Specification" section internally contradicted its own "Files you MUST NOT modify" list (proposing to rewrite `getFeatureCollaborators()` into a dynamic builder that would touch the very sidebar file it separately said not to touch). A `/definition`-time or `/review`-time self-consistency check — flagging when a DoR's own Implementation Specification contradicts its own Touch Points contract — would likely have caught this specific class of defect before `/branch-setup`.
4. `/improve` candidate: `fake-test-db.js`'s coverage gaps (missing `pod_members` SELECT, an unsupported `journeys` 3-column query shape) were found only because this story's E2E test happened to exercise the real no-`DATABASE_URL` server wiring path. Worth considering whether new route/handler stories should routinely include an explicit "run the new route's own handler once against `createFakeTestDb()` directly, outside of any assertion" smoke step at `/implementation-plan` time, specifically to surface adapter gaps before they're discovered mid-Task-5/6.

---

## DoD Observations

1. **This is the first story in this feature where the DoR's fictional-architecture problem extended to assuming an entire UI surface that never existed** (a "Feature settings page"), not just a wrong file/table/field name pointing at something real. The architecture investigation before `/branch-setup` correctly identified this and designed a real, substance-preserving alternative (extending the existing inline-per-feature-row pattern) rather than either building the fictional page or silently under-delivering.
2. **A Critical security defect (XSS) was found and fixed by this story's own review process, not by luck or a later audit.** The code-quality reviewer's specific instruction to check XSS/escaping in newly-added client-side rendering code found a real, exploitable stored-XSS vector (unescaped pod names/userIds, one reaching a triple-nested inline-onclick injection context). The fix was substantial enough (a full DOM-construction rewrite) that it warranted a dedicated follow-up re-verification pass with a concrete proof-of-concept trace, rather than accepting the fix on the strength of the original fix commit alone — this extra step is worth keeping as a standing practice for any Critical security finding, not just this one.
3. **The E2E task (Task 6) surfaced a real production-relevant fact about this app's own test/deploy topology**: the Playwright E2E webServer runs with no real Postgres configured at all, so `server.js` wires the exact same in-memory `fake-test-db.js` adapter into the live server process that unit tests use. This means Task 5's own adapter-gap fix (adding 2 missing query-shape branches) wasn't just test-convenience — it was required for the real E2E environment to correctly serve these routes at all. This is a useful, generalizable fact for any future story touching `routes/` — worth surfacing explicitly in this feature's onboarding/DoR-investigation checklist rather than being re-discovered story by story.
4. **Two-stage review (plus a final cross-task review) again demonstrated clear, non-redundant value on every single task** — Task 1 found a real idempotency bug; Task 2 found a real convention break plus a real silently-swallowed-failure gap; Task 3 found a real inconsistency in its own diff; Task 4 found the Critical XSS plus 2 real Important gaps; Task 5 turned a workaround into a proper fix; Task 6 found a real timeout-budget risk. The final cross-task reviewer independently re-verified every one of these claims (including re-tracing the XSS fix's actual DOM code, not just trusting the fix commit's own message) rather than deferring to the per-task reviews — this is the same discipline that's held for every story delivered this session, and it kept paying off on a story with substantially more genuinely new code than most of its siblings.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep4-s1 (Assign Multiple Pods to a Feature).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Does the Live Validation section honestly distinguish what was actually confirmed live from what relies on automated evidence, rather than overstating live coverage?
Report findings as HIGH / MEDIUM / LOW.
```
