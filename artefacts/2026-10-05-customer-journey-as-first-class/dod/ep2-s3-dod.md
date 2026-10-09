# Definition of Done: Delivery view: feature and metric annotation rows on stage cards

**PR:** [#967](https://github.com/heymishy/skills-repo/pull/967) | **Merged:** 2026-10-09T20:35:19Z (commit `cde7b52c1f8d39e7a59026560974d8d4d2a790db`)
**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s3.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s3-test-plan.md
**DoR artefact:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep2-s3-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Delivery view shows mapped features + selected metric keys/values, or "No features mapped"/"No metrics selected". `check-ep2-s3-delivery-view.js` (unit + integration tests, scoped jsdom extraction via `extractDeliveryAnnotationsHtml` to avoid the vacuous-assertion gap caught in review), plus the final cross-task review traced the Task1/Task2 CSS-class composition by hand and confirmed via the live AC3 test | `unit`/`integration` | Not live-verified on staging — see Outcome/RISK-ACCEPT below |
| AC2 | ✅ | A feature-not-found mapping shows "⚠️ Feature not found (slug)" with a Remove button; clicking it fires a real DELETE and removes the row from the DOM (success path), leaves it in place with visible error feedback on failure. `check-ep2-s3-delivery-view.js` (markup test + 2 jsdom end-to-end tests added during Task 3's own code-quality review) | `unit`/`integration` | AC2/Out-of-Scope contradiction resolved via a narrow DELETE route (D16); not live-verified on staging |
| AC3 | ✅ | Canvas/Customer experience/Delivery view toggle shows/hides annotation rows via CSS class, zero server round-trip. `check-ep2-s3-delivery-view.js` (jsdom behavioral test: real click → real `getComputedStyle` visibility assertions → zero fetch calls) | `unit` (jsdom behavioral) | Not live-verified on staging |
| AC4 | ✅ | A selected metric key with no recorded value shows "No value recorded". `check-ep2-s3-delivery-view.js` (integration test against a new optional `feature.metricValues` field, D15) | `unit`/`integration` | Not live-verified on staging |

**End-to-end wiring (beyond individual AC tests):** 2 jsdom tests drive a full real click → DELETE fetch → DOM row removal sequence for the Remove button (success and failure paths), added during Task 3's own code-quality review after the reviewer found the client-side click handler had zero behavioral coverage — the same recurring gap already caught in `ep2-s1`/`ep2-s2`/this story's own Task 1.

---

## Scope Deviations

None against the DoR contract's "Modify ONLY" file list (`src/web-ui/routes/journeys.js`, `src/web-ui/server.js`, the new test file — confirmed by the final cross-task review's own `git show --stat` check on all 3 final commits). Two grounding-time decisions expanded scope beyond the story's own original text, both operator-confirmed before implementation began:
- **D15:** new optional `feature.metricValues` field (mirrors `ep2-s2`'s own D12 `metricKeys` precedent) — AC1/AC4 assumed metric values were already readable from `pipeline-state.json`; no such field existed.
- **D16:** a narrow `DELETE /journeys/:id/stages/:stageId/feature-mappings/:mappingId` route — AC2's own "remove affordance" text directly contradicted the story's original Out of Scope wording ("removing mappings deferred for MVP"); resolved by building a deliberately narrow route scoped only to the feature-not-found warning row, not general mapping removal.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 planned, plus 2 additional jsdom end-to-end wiring tests added during Task 3's own code-quality review (11 total).
**Tests passing in CI:** All pass; confirmed in PR #967's CI and independently re-run against merged master (`npm test`: 730 files, 0 failed).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (mapped feature, real metric value) | ✅ | ✅ | Scoped assertion fix during Task 1 review (vacuous-match gap) |
| AC1 (zero metric keys — "No metrics selected") | ✅ | ✅ | |
| AC1 (boundary — "No features mapped") | ✅ | ✅ | Backfilled in Task 2 per D17's documented sequencing |
| AC2 (feature-not-found warning + Remove markup) | ✅ | ✅ | Backfilled in Task 2 per D17 |
| AC4 ("No value recorded") | ✅ | ✅ | Backfilled in Task 2 per D17 |
| AC3 (view toggle, jsdom behavioral) | ✅ | ✅ | Operator-precedence bug in the default-state assertion caught and fixed during Task 2 review |
| (new route) happy-path delete | ✅ | ✅ | |
| (new route) cross-tenant 404 | ✅ | ✅ | |
| (shape) route collision | ✅ | ✅ | |
| End-to-end (Remove click → DELETE → row removed, success) | ✅ | ✅ | Added during Task 3 code-quality review |
| End-to-end (Remove click → failure → row stays, error shown) | ✅ | ✅ | Added during Task 3 code-quality review |

**Gaps:** None in the test-plan sense. All 4 ACs have dedicated passing test coverage, confirmed end-to-end by a final cross-task review.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| View toggle client-side, no server round-trip | ✅ | Click handler is pure `className`/`classList`/`aria-pressed` manipulation; dedicated test asserts zero fetch calls |
| Feature-not-found case handled gracefully | ✅ | No crash, explicit warning text, scoped Remove affordance (D16) |
| No new npm runtime dependencies | ✅ | `package.json`/`package-lock.json` diff empty across all 3 tasks |
| WCAG 2.1 AA — annotation rows readable by screen reader; view toggle keyboard-accessible | ✅ | Toggle uses `role="group"` + `aria-label` + native `<button>` elements with `aria-pressed` kept in sync; confirmed in Task 2's own spec-compliance review (including a manual check of the untested "Customer experience" toggle path) |
| 404-not-403 cross-tenant policy (D13) on the new DELETE route | ✅ | Ownership check before any mutation; dedicated cross-tenant test |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Feature-to-stage mapping adoption | Mechanism complete since `ep2-s2` | **Now fully visible.** This story completes the loop: `ep2-s1` built the picker, `ep2-s2` built the save path, `ep2-s3` makes existing mappings visible on the canvas, making M2 adoption observable by anyone viewing the Delivery view, not just by querying the database directly. |
| M3 — Journey-level metric coverage | No (pre-feature) | **Mechanism now exists** for metric values specifically (D15's `metricValues` field), though nothing populates it yet — mirrors `ep2-s2`'s own D12 precedent for `metricKeys`. |

---

## Outcome

**COMPLETE (RISK-ACCEPT on live-browser confirmation — see below)**

All 4 ACs satisfied with unit/integration-test evidence (11/11 passing, including 2 end-to-end jsdom wiring tests), confirmed end-to-end by a final cross-task review that hand-traced the composition of all 3 tasks together (annotation markup ↔ CSS class ↔ toggle handler ↔ DELETE route attribute plumbing) and found zero integration gaps. No scope deviations beyond the two operator-confirmed grounding decisions (D15, D16). CI fully green. `npm test` on master: 730 files, 0 failed.

This story's own `/verify-completion` and `/branch-complete` steps did not include a live-browser confirmation (same structural constraint as every prior story in this epic: the canvas page cannot render without a real DB-backed journey, and `fake-test-db.js` has no `customer_journeys` support for a local E2E run). A post-merge live-browser confirmation was attempted this session: navigated to `wuce-staging.fly.dev/journeys/862d52d7-ff98-4176-bd9f-81f0f417f8df` (a real journey with 3 stages, used for `ep2-s1`'s/`ep2-s2`'s own prior live checks), but the deploy-triggered session-logout pattern recurred (8th time this session) and the operator was not able to log back in at this time. Per the operator's own instruction, this DoD closes on the existing test evidence alone, with the live confirmation logged as an open `pendingActions` item in `workspace/state.json` to complete when the operator is next available to sign in — not a new browser-automation tooling blocker this time, just ordinary unavailability.

Same two pre-existing CI workflow findings observed on this merge commit, not re-logged in detail (already documented in `ep2-s1`'s/`ep2-s2`'s own DoDs and `capture-log.md`):
1. **Deploy dashboards to GitHub Pages** — repo-configuration issue, unrelated to this story's code.
2. **Improvement Agent — Scheduled Dreaming** — recurring `GH013` branch-protection ruleset conflict.

**Follow-up actions:**
1. Complete the deferred live-browser confirmation once the operator can sign in: open `chrome-verify-1791448856542`'s canvas, switch to Delivery view, confirm the already-saved "Skills Infrastructure and Schema-Migration Pipeline Tracks" mapping (saved during `ep2-s2`'s own live confirmation) renders as an annotation row with "No metrics selected", switch back to Canvas view and confirm the row disappears, then exercise the Remove affordance against a deliberately-broken mapping if one can be safely created.
2. Scope a short-track story for scripted (Playwright) staging verification with persisted/non-interactive auth — still a live follow-up candidate from `ep2-s2`'s own DoD (capture-log.md 2026-10-10), though not the blocker this time.
3. Extend `fake-test-db.js` with `customer_journeys`/`customer_journey_stages` support — still the single largest recurring gap across this feature, now affecting 6 stories' own local E2E/verification attempts identically.
4. Investigate the "Deploy dashboards to GitHub Pages" failure and the recurring "Improvement Agent — Scheduled Dreaming" `GH013` conflict — both logged as pipeline-maintenance follow-ups across multiple DoDs now.

---

## DoD Observations

1. **This is the first story in this feature where every single task (3/3) required a fix-and-re-review cycle.** Task 1: a vacuous test assertion scoped to the wrong DOM region, plus a unicode-emoji-vs-design-system-icon fix. Task 2: an operator-precedence bug (`!x >= 0` always-true) in a default-state assertion — inherited verbatim from this story's own implementation plan, meaning the bug existed in planning before any code was written, and was caught only by code-quality review actually tracing the boolean logic by hand. Task 3: the now-familiar recurring gap (client-side click handler shipped without a genuinely discriminating end-to-end test) plus a fully silent failure path with no user feedback. All 3 were caught and fixed before merge — none reached `master` unresolved — but the density of findings (one per task, 100% hit rate) is notably higher than `ep2-s1`/`ep2-s2`'s own review cycles and worth tracking as a trend.
2. **A real git commit (this session's own D17 decision-log entry) was mistakenly discarded by a dispatched implementer agent**, which misidentified it as the known "skills.js fires a real commit during tests" contamination pattern and used `git reset --soft`/`git checkout --` to discard it while fixing an unrelated finding. Caught immediately by independently diffing the branch's own `git log` against expectation, and the entry was restored via a fresh commit. The implementer's own safety instructions (added to every subsequent Task 2/3 dispatch prompt after this) explicitly warned against discarding unexpected HEAD commits without stopping to report first — no recurrence in Tasks 2 or 3.
3. **The operator completed a deferred live-browser confirmation for `ep2-s2` mid-session** (logging into the staging tab after initially being unable to), which let that story's own DoD be upgraded from a tooling-blocked RISK-ACCEPT to a genuine live confirmation within the same session — a useful precedent that these gaps are often transient scheduling issues, not permanent blockers, and worth re-attempting rather than assuming permanently deferred.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Delivery view: feature
and metric annotation rows on stage cards" (ep2-s3). Check:
1. Does every AC row have a concrete evidence reference (test name or
   observable behaviour)?
2. Is closing this DoD without a live-browser confirmation acceptable,
   given all 4 ACs have passing unit/integration test coverage AND a
   final cross-task review independently traced the composition of all
   3 tasks by hand (class names, data attributes, URL shapes) and found
   no integration gaps?
3. Is the 100% fix-and-re-review hit rate across all 3 tasks (DoD
   Observation 1) worth investigating as its own signal -- e.g. should
   implementation plans themselves get a lighter-weight logic/assertion
   sanity pass before being handed to subagents, given one of the three
   bugs (Task 2's operator-precedence bug) originated in the plan
   itself, not in any implementer's own work?
4. Is the outcome verdict (COMPLETE, RISK-ACCEPT on live-browser
   confirmation) consistent with the AC rows and this story's own
   decisions.md entries (D15, D16, D17)?
```
