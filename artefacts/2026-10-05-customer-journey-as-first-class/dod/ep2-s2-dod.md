# Definition of Done: Feature-to-stage mapping save with metric key selection

**PR:** [#966](https://github.com/heymishy/skills-repo/pull/966) | **Merged:** 2026-10-09T09:43:41Z (commit `7aed47e660a5b67c5ff8d6a871a9a065604f689d`)
**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s2.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep2-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Selecting a feature shows a metric-key picker (checkbox per `feature.metricKeys` entry) or "No metrics recorded". `check-ep2-s2-feature-mapping-save.js` (shape test + jsdom behavioral test: real click on a feature-picker item → real sub-view/checkbox DOM assertions, reading the real-case `.sw-feature-picker-slug`/`.sw-feature-picker-name` text content, not the lowercased filter attributes) | `unit` only | Not live-verified on staging — see Outcome/RISK-ACCEPT below |
| AC2 | ✅ | Confirming with metric keys selected inserts a complete mapping row (6 columns). `check-ep2-s2-feature-mapping-save.js` (integration test against `makeMappingMockPool`, asserts `BEGIN`→`SELECT...FOR UPDATE`→`INSERT`→`COMMIT` and all 6 inserted columns) | `unit`/`integration` only | Not live-verified on staging |
| AC3 | ✅ | Confirming with zero metric keys selected inserts `metric_keys: []`. `check-ep2-s2-feature-mapping-save.js` (integration test, same mock-pool harness) | `unit`/`integration` only | Not live-verified on staging |
| AC4 | ✅ | Mapping the same feature+stage twice → exactly one row, latest keys win. `check-ep2-s2-feature-mapping-save.js` (integration test: app-level `SELECT...FOR UPDATE` then `UPDATE`-or-`INSERT` inside one transaction, since the real table has no unique constraint to support `ON CONFLICT`) | `unit`/`integration` only | Not live-verified on staging |
| AC5 | ✅ | Cross-tenant `journey_stage_id` → 404, no insert. `check-ep2-s2-feature-mapping-save.js` (integration test: ownership `SELECT` before `pool.connect()`). Wording corrected from the story's original "403" to "404", matching this codebase's established FORBIDDEN-vs-NOT_FOUND convention (`decisions.md` D13) | `unit`/`integration` only | AC text corrected (D13); not live-verified on staging |

**End-to-end wiring (beyond individual AC tests):** 2 additional jsdom tests drive a full real click → select feature → check metric key → click "Save mapping" → `fetch` POST → modal-close (success path) / error-message-render (failure path) sequence through real DOM state, not just markup presence — added during code-quality review after the reviewer found the original success-path test didn't assert the modal actually closed.

---

## Scope Deviations

None against the DoR contract. One test-only fix: the implementation plan's own `makeMappingReqRes` helper (as drafted) was missing a `session.csrfToken`/`body._csrf` pair, causing every integration test to fail against the real `handlePostFeatureMapping` (which correctly calls `_csrf.csrfGuard` first). Fixed by the Task 2 implementer by adding a `MAPPING_CSRF` constant matching this repo's own established `REAL_CSRF` test convention — confirmed by both reviewers as test-helper-only, no production-code or AC-shape change.

No visible stage-card UI change after saving — confirmed correct per story scope: "Delivery view: feature and metric annotation rows on stage cards" is `ep2-s3`'s own separate, not-yet-built scope, explicitly excluded from this story's Out of Scope section.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 planned, plus 2 additional jsdom end-to-end wiring tests added during code-quality review (9 total).
**Tests passing in CI:** All pass; confirmed in PR #966's CI and independently re-run against merged master (`npm test`: 729 files, 0 failed).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (metric-key sub-view shape) | ✅ | ✅ | |
| AC1 (behavioral — real click/checkbox DOM assertions) | ✅ | ✅ | |
| AC2 (insert with keys selected) | ✅ | ✅ | |
| AC3 (insert with zero keys) | ✅ | ✅ | |
| AC4 (upsert — second save updates, doesn't duplicate) | ✅ | ✅ | |
| AC5 (cross-tenant → 404, no insert) | ✅ | ✅ | |
| Route-collision shape test | ✅ | ✅ | |
| End-to-end (success path, modal-close assertion) | ✅ | ✅ | Added during code-quality review |
| End-to-end (failure path, error-message assertion) | ✅ | ✅ | |

**Gaps:** None in the test-plan sense. All 5 ACs have dedicated passing test coverage. The live-browser confirmation committed to in `decisions.md` D14 could not be completed this session — see Outcome below.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Transactional multi-row write (`BEGIN`/`COMMIT`/`ROLLBACK`) | ✅ | `handlePostFeatureMapping` reuses the established `pool.connect()`/`client.query('BEGIN')`/.../`client.release()` pattern from `handlePatchJourneyStagesOrder` |
| Ownership check before transaction opens (404-not-403 cross-tenant policy) | ✅ | `SELECT` via `customer_journey_stages cjs JOIN customer_journeys cj` scoped by `tenant_id`, before `pool.connect()` — matches `decisions.md` D13 |
| CSRF guard on mutating route | ✅ | `_csrf.csrfGuard` called first in `handlePostFeatureMapping`; confirmed by the test-helper fix above (tests failed until a valid CSRF pair was supplied, proving the guard is live) |
| No new npm runtime dependencies | ✅ | `package.json`/`package-lock.json` diff empty (confirmed by the final cross-task reviewer) |
| Modal/sub-view keyboard-accessible (WCAG 2.1 AA) | ✅ | Reuses `ep2-s1`'s existing modal shell (`role="dialog"`/`aria-modal`, Escape-to-close, focus restore); `fmBack` restores the feature-list sub-view without breaking focus trap |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Feature-to-stage mapping adoption | No (pre-feature) | **Mechanism now complete.** `ep2-s1` built the entry point; this story completes the save path. M2 is now fully measurable once real mappings start being saved against real journeys on staging/production. |

---

## Outcome

**COMPLETE (RISK-ACCEPT on live-browser confirmation — see below)**

All 5 ACs satisfied with unit/integration-test evidence (9/9 passing, including 2 end-to-end jsdom wiring tests). No scope deviations beyond the test-only CSRF-helper fix. CI fully green. `npm test` on master: 729 files, 0 failed.

`decisions.md` D14 committed a post-merge live-browser confirmation as a required DoD step for this story (same precedent as `ep2-s1`'s own D11). That confirmation was **started but could not be completed this session**: navigating to `https://wuce-staging.fly.dev/customer-journeys` hit the deploy-triggered session-logout pattern (recurring a 7th time this session), and the required GitHub OAuth re-login could not be completed within this session due to a new browser-automation tooling blocker (see `workspace/capture-log.md`, 2026-10-10 entry, and the new RISK-ACCEPT amendment to D14 in `decisions.md`) — the operator reports this specific re-login friction is new behaviour in the Claude-in-Chrome browser-automation tool itself (working without repeated manual re-login as recently as a week ago), not a change in this repo's own deploy/session behaviour. This DoD is closed on the existing test evidence alone; the live confirmation remains an open `pendingActions` item in `workspace/state.json`, to be completed once a tooling fix (candidate: scripted Playwright verification with a persisted/non-interactive staging auth path) is in place.

Same two pre-existing CI workflow findings observed on this merge commit, not re-logged in detail (already documented in `ep2-s1`'s own DoD and `capture-log.md`):
1. **Deploy dashboards to GitHub Pages** — repo-configuration issue, unrelated to this story's code.
2. **Improvement Agent — Scheduled Dreaming** — recurring `GH013` branch-protection ruleset conflict.

**Follow-up actions:**
1. Scope a short-track story for scripted (Playwright) staging verification with persisted/non-interactive auth, to replace interactive Claude-in-Chrome browser automation for live DoD checks — now blocked twice in a row by the same new tooling regression (logged in `capture-log.md`).
2. Extend `fake-test-db.js` with `customer_journeys`/`customer_journey_stages` support — still the single largest recurring gap across this feature.
3. Investigate the "Deploy dashboards to GitHub Pages" failure and the recurring "Improvement Agent — Scheduled Dreaming" `GH013` conflict — both logged as pipeline-maintenance follow-ups across multiple DoDs now.
4. Document the `branch-complete` gate's missing artefact convention (same gap already logged in `ep2-s1`'s own DoD).

---

## DoD Observations

1. **First story in this feature where a committed live-browser confirmation (D14) could not be delivered for a tooling reason, not a data-safety or fake-test-db reason.** `ep2-s1`'s own AC3 skip (D11) was a deliberate data-safety call; this is an unplanned tooling blocker. Distinguishing the two in `decisions.md` (rather than folding this into D14's own original text) keeps the audit trail honest about why the commitment wasn't met.
2. **The deploy-timing + session-logout pattern has now recurred 7 times this session** without itself blocking prior DoDs (the operator was able to re-authenticate each time) — this is the first occurrence where re-authentication itself became the blocker, which is why it's now being treated as its own distinct gap rather than folded into the existing "deploy-timing" capture-log entries.
3. **All 5 ACs have real integration-test coverage of the transactional upsert path**, including the no-unique-constraint-so-app-level-upsert design (`SELECT...FOR UPDATE` then branch) — this is now the second story (`ep1-s4` being the first) using this codebase's own established transaction pattern, reinforcing it as the reference implementation rather than a one-off.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Feature-to-stage mapping
save with metric key selection" (ep2-s2). Check:
1. Does every AC row have a concrete evidence reference (test name or
   observable behaviour)?
2. Is closing this DoD without the live-browser confirmation committed
   in decisions.md D14 the right call, given the deferral is for a new
   tooling blocker (browser-automation re-login friction) rather than a
   data-safety or code-correctness gap, and all 5 ACs have passing
   integration-test coverage including the transactional upsert path?
3. Should the Playwright/non-interactive-auth tooling fix (Follow-up
   action 1) become its own short-track story now, given it has now
   blocked a committed live-verification step for the first time?
4. Is the outcome verdict (COMPLETE, RISK-ACCEPT on live-browser
   confirmation) consistent with the AC rows and the new decisions.md
   entry?
```
