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
| AC1 | ✅ | Selecting a feature shows a metric-key picker (checkbox per `feature.metricKeys` entry) or "No metrics recorded". `check-ep2-s2-feature-mapping-save.js` (shape test + jsdom behavioral test) + **real staging confirmation (2026-10-10):** `wuce-staging.fly.dev`, opened an existing journey (`chrome-verify-1791448856542`), clicked "Map feature" on the "Buy" stage, confirmed the modal lists the real live feature set, selected "Skills Infrastructure and Schema-Migration Pipeline Tracks" and confirmed the exact text "No metrics recorded" rendered (correct — no feature in the real `pipeline-state.json` has `metricKeys` populated yet, per D12) | `unit` + `live` (staging) | None |
| AC2 | ✅ | Confirming with metric keys selected inserts a complete mapping row (6 columns). `check-ep2-s2-feature-mapping-save.js` (integration test against `makeMappingMockPool`, asserts `BEGIN`→`SELECT...FOR UPDATE`→`INSERT`→`COMMIT` and all 6 inserted columns) | `unit`/`integration` only | The metric-keys-selected save path itself was not live-exercised (no real feature has `metricKeys` populated yet to select from) — the zero-keys save path was (see AC3) |
| AC3 | ✅ | Confirming with zero metric keys selected inserts `metric_keys: []`. `check-ep2-s2-feature-mapping-save.js` (integration test, same mock-pool harness) + **real staging confirmation (2026-10-10):** clicked "Save mapping" with zero metric keys available/selected — the request succeeded, the modal closed cleanly, and the stage card showed no visible change (correct per this story's own scope) | `unit`/`integration` + `live` (staging) | None |
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

**Gaps:** None in the test-plan sense. All 5 ACs have dedicated passing test coverage. The live-browser confirmation committed to in `decisions.md` D14 was completed in a follow-up session on 2026-10-10 — see Outcome below.

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

**COMPLETE**

All 5 ACs satisfied with unit/integration-test evidence (9/9 passing, including 2 end-to-end jsdom wiring tests). No scope deviations beyond the test-only CSRF-helper fix. CI fully green. `npm test` on master: 729 files, 0 failed.

`decisions.md` D14 committed a post-merge live-browser confirmation as a required DoD step for this story (same precedent as `ep2-s1`'s own D11). That confirmation was initially blocked: navigating to `https://wuce-staging.fly.dev/customer-journeys` hit the deploy-triggered session-logout pattern (recurring a 7th time that session), and the required GitHub OAuth re-login could not be completed in that session due to a new browser-automation tooling blocker (see `workspace/capture-log.md`, 2026-10-10 entry, and the RISK-ACCEPT amendment to D14 in `decisions.md`). The operator logged into the staging tab in a follow-up session on 2026-10-10, and the live confirmation was completed then: on `wuce-staging.fly.dev`, opened an existing journey (`chrome-verify-1791448856542`), clicked "Map feature" on the "Buy" stage, confirmed the real live feature list renders, selected a real feature and confirmed "No metrics recorded" renders correctly (no feature in the real `pipeline-state.json` has `metricKeys` populated yet — expected, per D12), clicked "Save mapping" with zero metric keys, and confirmed the request succeeded with the modal closing cleanly and no visible stage-card change (correct per this story's own scope). AC2's metric-keys-selected save path and AC4/AC5 (upsert-replaces-not-duplicates, cross-tenant 404) remain confirmed via integration test only — AC2's keys-selected path has no real feature with `metricKeys` populated to select from yet, and AC4/AC5 are DB-level/API-level checks outside normal UI reach, both consistent with `ep2-s1`'s own AC3 precedent for the same class of gap.

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
2. Is it acceptable that AC2's metric-keys-selected save path and AC4/AC5
   (upsert-replaces-not-duplicates, cross-tenant 404) remain confirmed
   by integration test only, not live, given AC2's path has no real
   feature with metricKeys populated yet to select from and AC4/AC5 are
   DB-level/API-level checks outside normal UI reach?
3. Should the Playwright/non-interactive-auth tooling fix (Follow-up
   action 1) still become its own short-track story, given the
   browser-automation re-login friction it addresses did recur (7
   times) even though it was eventually worked around this time?
4. Is the outcome verdict (COMPLETE) consistent with the AC rows now
   that the live-browser confirmation committed in decisions.md D14 has
   been completed?
```
