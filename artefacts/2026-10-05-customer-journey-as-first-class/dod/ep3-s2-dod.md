# Definition of Done: Journey health indicators: per-stage health state and summary bar

**PR:** [#969](https://github.com/heymishy/skills-repo/pull/969) | **Merged:** 2026-10-10T03:12:26Z (commit `5f99d5060ed7a8a526965e0daffd5698afe2d4a2`)
**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s2.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep3-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep3-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | A stage with a mapped feature + selected metric key shows ✅ (check icon) with an accessible label. `check-ep3-s2-journey-health.js` (unit test, multi-mapping edge case independently verified by spec-compliance review) | `unit` only | Not live-verified — no real feature in the shared staging `pipeline-state.json` has `metricKeys` populated yet to select from (same D12 data-availability gap already noted for `ep2-s2`'s own keys-selected path); not a code or test gap |
| AC2 | ✅ | A stage with mapped features but zero metric keys selected shows ⚠️ (warning icon) with an accessible label. `check-ep3-s2-journey-health.js` + **real staging confirmation (2026-10-10):** `wuce-staging.fly.dev`, "Buy" stage (from `ep2-s2`'s own earlier live mapping) showed "⚠️ Needs metrics"; mapping a feature to "Discover" live transitioned it from ❌ to ⚠️ immediately | `unit` + `live` (staging) | None |
| AC3 | ✅ | A stage with no mapped features shows ❌ (close icon) with an accessible label. `check-ep3-s2-journey-health.js` + **real staging confirmation:** "Discover" and "Compare" both showed "❌ No coverage" before any mapping existed | `unit` + `live` (staging) | None |
| AC4 | ✅ | Summary bar shows "X of Y stages have metric coverage". `check-ep3-s2-journey-health.js` + **real staging confirmation:** showed "0 of 3 stages have metric coverage" (correct — no real feature has metric keys populated yet, so no stage can be ✅ covered) | `unit` + `live` (staging) | None |
| AC5 | ✅ | Icon + accessible label together, never colour alone. Test regex ties the CSS class and `aria-label` to the SAME element (verified non-vacuous by code-quality review deliberately swapping each independently and confirming both corruption directions are caught) + **real staging confirmation:** icon and text label both visibly present together for every health state observed | `unit` + `live` (staging) | None |
| AC6 | ✅ | Saving/removing a mapping triggers a reload so health/summary reflect the new state. `window.location.reload()` added to the existing Save-mapping/Remove-mapping success handlers (D18) + **real staging confirmation:** mapping a feature to "Discover" caused the page to reload automatically (no manual refresh) and the indicator updated from ❌ to ⚠️ in the same action | `unit`/jsdom + `live` (staging) | AC6 required modifying two already-shipped handlers (`ep2-s2`, `ep2-s3`) — operator-confirmed (D18) |

---

## Scope Deviations

None against the DoR contract's "Modify ONLY" file list (`src/web-ui/routes/journeys.js`, the new test file — confirmed by each task's own `git show --stat`). One deliberate, operator-confirmed scope expansion: AC6 required adding `window.location.reload()` to two previously-merged stories' own shipped handlers (`ep2-s2`'s Save-mapping, `ep2-s3`'s Remove-mapping) — logged as `decisions.md` D18.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 planned.
**Tests passing in CI:** All pass; confirmed in PR #969's CI and independently re-run against merged master (`npm test`: 732 files, 0 failed, after one transient unrelated flake on the first post-merge run — see Outcome below).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1/AC5 (covered state, icon+label) | ✅ | ✅ | Multi-mapping edge case independently verified by spec-compliance review |
| AC2/AC5 (partial state, icon+label) | ✅ | ✅ | Multi-mapping edge case independently verified |
| AC3/AC5 (none state, icon+label) | ✅ | ✅ | |
| AC4 (summary bar count) | ✅ | ✅ | |
| AC6 (Save triggers reload) | ✅ | ✅ | Required a jsdom workaround (VirtualConsole/jsdomError counting) since this repo's installed jsdom (25.0.1) makes `location.reload` non-stubbable directly — independently reproduced by a reviewer (disabled the reload lines, confirmed the 2 tests fail correctly, restored, confirmed 6/6 pass again) |
| AC6 (Remove triggers reload) | ✅ | ✅ | Same mechanism |

**Gaps:** None in the test-plan sense. All 6 ACs have dedicated passing test coverage.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Health state indicators: icon + label, not colour alone (MC-A11Y-02) | ✅ | Confirmed by both test and live check for all 3 health states |
| Health computation server-side at render time (no background job) | ✅ | Pure function over already-fetched `mappingsByStage` data, computed inline in `handleGetJourneyCanvas` |
| No new npm runtime dependencies | ✅ | `package.json`/`package-lock.json` diff empty |
| WCAG 2.1 AA | ✅ | `role="img"` + `aria-label` on every health indicator |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M3 — Journey-level metric coverage | Mechanism complete since `ep2-s3` (mappings) | **Now fully visible and actionable.** This story is the capstone of the M3 chain: `ep2-s1`/`ep2-s2` built mapping, `ep2-s3` made it visible per-stage, `ep3-s2` aggregates it into a single glanceable health signal plus a journey-level summary. M3 becomes fully measurable (and self-evident to any practitioner viewing the canvas) once real features start populating `metricKeys`/`metricValues` (D12/D15's own deferred write path). |

---

## Outcome

**COMPLETE**

All 6 ACs satisfied with unit/jsdom-test evidence (6/6 passing), confirmed by both a spec-compliance review (which independently verified the multi-mapping edge case for AC1/AC2 and reproduced the AC6 jsdom workaround's discrimination by hand) and a code-quality review (clean on both tasks, full suite green both times, 732/732). No scope deviations beyond the one operator-confirmed decision (D18). CI fully green on PR #969.

Post-merge, a live-browser confirmation was completed the same session: `wuce-staging.fly.dev`, the summary bar showed "0 of 3 stages have metric coverage" correctly (no real feature has metric keys populated yet), "Discover" and "Compare" both showed ❌ "No coverage" before mapping, "Buy" (from `ep2-s2`'s own earlier live mapping) showed ⚠️ "Needs metrics", and mapping a feature to "Discover" live caused the page to reload automatically and the indicator to update to ⚠️ in the same action — confirming AC2, AC3, AC4, AC5, and AC6 all live. AC1's ✅ "covered" state could not be live-exercised: no real feature in the shared staging `pipeline-state.json` has `metricKeys` populated yet (the same data-availability gap already logged for `ep2-s2`'s own keys-selected save path) — this is a pre-existing data gap, not a code or test gap, and AC1's logic was independently verified (including the multi-mapping case) by spec-compliance review.

**CI investigation note:** the first post-merge `npm test` run on master showed 1 failure (`tests/check-pcr-s1-test-runner.js`). Re-ran it in isolation (14/14 passed clean) and re-ran the full suite once more (732/0 clean) — confirmed this was the same known, pre-existing transient git-commit-during-tests contamination flake already documented in this repo's own learnings, not a regression from this story.

A second, new CI finding was investigated this session: the scheduled "Fleet Aggregation" workflow has been failing on every hourly run for 8+ hours, with a credential/auth error in its own checkout step (`terminal prompts disabled`) — confirmed unrelated to any of this session's commits (pre-dates `ep3-s2`'s merge by many hours, same error on every run). Logged in `capture-log.md`, not fixed this session.

Same two pre-existing CI workflow findings also observed on this merge commit, not re-logged in detail: **Improvement Agent — Scheduled Dreaming** (`GH013` conflict) and **Deploy dashboards to GitHub Pages** (repo-configuration issue, observed on the immediately-prior commit).

**Follow-up actions:**
1. AC1's ✅ covered state remains live-unverified due to data availability, not a gap in this story's own implementation — will be naturally confirmable once any future story defines the `metricKeys`/`metricValues` write path (D12/D15).
2. Investigate the new "Fleet Aggregation" scheduled-workflow credential failure (logged in `capture-log.md` 2026-10-10) — now a third distinct, currently-live CI/infra gap alongside the two already-logged ones.
3. Scope a short-track story for scripted (Playwright) staging verification with persisted/non-interactive auth — still a logged follow-up candidate, not yet scoped.
4. Extend `fake-test-db.js` with `customer_journeys`/`customer_journey_stages` support — still the single largest recurring gap across this feature.

---

## DoD Observations

1. **This story's AC6 required a genuinely non-obvious jsdom workaround** (counting `VirtualConsole` `jsdomError` events instead of stubbing `location.reload` directly, which this repo's installed jsdom version makes impossible) — the implementer documented it thoroughly in the test file itself, and a reviewer independently reproduced the exact discrimination (disable → 2 tests fail correctly → restore → 6/6 pass) rather than taking the report on trust. This is a strong instance of the "verify, don't trust" discipline this session has applied consistently to subagent reports.
2. **A decisions.md entry was initially missing** for the AC6 reload-gap decision (it existed only in the test plan and DoR, not `decisions.md` itself) — caught by Task 2's own spec-compliance review, not by me proactively, and fixed directly as D18. Worth tightening the grounding workflow so a genuine architectural decision always gets logged to `decisions.md` at the moment it's made, not just to whichever artefact is being written at that moment.
3. **The post-merge CI investigation habit established after `ep2-s3`'s own missed-failure incident paid off twice this session**: once catching the `pcr-s1` flake cleanly (re-run, confirmed transient, moved on without alarm) and once catching a genuinely new, unrelated infra gap (Fleet Aggregation's credential failure) that would otherwise have gone unnoticed since it doesn't block merges or deploys.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Journey health indicators:
per-stage health state and summary bar" (ep3-s2). Check:
1. Does every AC row have a concrete evidence reference (test name or
   observable behaviour)?
2. Is it acceptable that AC1's ✅ covered state remains live-unverified,
   given it's a data-availability gap (no real feature has metricKeys
   populated yet) rather than a code or test gap, and AC1's underlying
   logic was independently verified for the multi-mapping case?
3. Should the new "Fleet Aggregation" CI credential failure (Follow-up
   action 2) be investigated now, given it's been failing hourly for
   8+ hours and is a third distinct CI/infra gap alongside the two
   already logged?
4. Is the outcome verdict (COMPLETE) consistent with the AC rows and
   this story's own decisions.md entries (icon-set correction, D18)?
```
