# Definition of Done: Customer experience view: emotion, pain points, opportunities annotation rows

**PR:** [#968](https://github.com/heymishy/skills-repo/pull/968) | **Merged:** 2026-10-10T00:16:36Z (commit `ae84f4e2f156c3dcffefac39e3e58a54bb7ec2f6`)
**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s1.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep3-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep3-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Customer experience view shows emotion chip+label, pain points, opportunities for a populated stage. `check-ep3-s1-customer-experience-view.js` (unit test, combined with AC4) + **real staging confirmation (2026-10-10):** `wuce-staging.fly.dev`, set emotion/pain points/opportunities on a real stage via the side panel, switched to Customer experience view, confirmed all three rows render with the real saved values | `unit` + `live` (staging) | None |
| AC2 | ✅ | A stage with nothing set shows "Not set" for all three rows, none omitted — including a hand-traced confirmation of the real `''`-vs-`null` save path from `ep1-s3`'s own side-panel autosave (spec-compliance review). `check-ep3-s1-customer-experience-view.js` + **real staging confirmation:** the journey's other two stages (no emotion/pain points/opportunities set) correctly showed "Not set" for all three rows | `unit` + `live` (staging) | None |
| AC3 | ✅ | Canvas/Customer experience/Delivery view toggle shows/hides annotation rows via CSS class, zero server round-trip — reuses `ep2-s3`'s own existing, fully generic view-toggle click handler unmodified; this story adds only a new CSS rule pairing. `check-ep3-s1-customer-experience-view.js` (jsdom behavioral test) + **real staging confirmation:** clicked between Canvas/Customer experience/Delivery views repeatedly, each click instantly showed/hid the correct annotation rows | `unit` + `live` (staging) | None |
| AC4 | ✅ | Emotion shown via both a colour chip AND a text label, not colour alone (MC-A11Y-02). Test regex anchored specifically on the colour-modifier CSS class (`sw-stage-emotion-chip--positive`), not just the base class — tightened during code-quality review after the implementer deliberately broke the real code and confirmed the test caught it, then restored the correct implementation. + **real staging confirmation:** selecting "positive" and saving rendered a real green colour chip with the literal text "positive" visibly inside it, not colour alone | `unit` + `live` (staging) | None |

---

## Scope Deviations

None against the DoR contract's "Modify ONLY" file list (`src/web-ui/routes/journeys.js`, the new test file — confirmed by `git show` on the final commit). No new query, no new route, no new `<script>` block or click handler — this story is pure rendering, reusing `ep1-s3`'s own already-existing `emotion`/`pain_points`/`opportunities` columns and `ep2-s3`'s own already-existing, fully generic view-toggle mechanism unmodified.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3 planned (the first test case covers both AC1 and AC4 together, per the test plan's own design).
**Tests passing in CI:** All pass; confirmed in PR #968's CI and independently re-run against merged master (`npm test`: 731 files, 0 failed).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 + AC4 (emotion chip+label, pain points, opportunities) | ✅ | ✅ | Regex tightened to anchor on the colour-modifier class during code-quality review |
| AC2 ("Not set" for all three, none omitted) | ✅ | ✅ | Scoped to the Customer experience annotation block specifically during code-quality review (was page-wide) |
| AC3 (view toggle, jsdom behavioral) | ✅ | ✅ | Reuses `ep2-s3`'s own existing toggle handler unmodified |

**Gaps:** None in the test-plan sense. All 4 ACs have dedicated passing test coverage.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| View toggle client-side, no server round-trip | ✅ | No new JS — reuses `ep2-s3`'s own existing handler; dedicated test asserts zero fetch calls |
| Emotion display: colour chip + text label (MC-A11Y-02) | ✅ | Both the CSS modifier class (driving colour) and the literal enum text render together; confirmed by a test anchored on the specific modifier class |
| WCAG 2.1 AA | ✅ | Reuses existing, already-accessible toggle control (`role="group"`, `aria-pressed`) from `ep2-s3`; new content is plain text/chip markup, no new interactive elements |
| No new npm runtime dependencies | ✅ | `package.json`/`package-lock.json` diff empty |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Journey adoption | No (pre-feature) | **Mechanism now exists.** A richer canvas with multiple view modes (now Canvas + Delivery + Customer experience) is the hypothesis this story's benefit linkage is built on; M1's own adoption signal becomes measurable once usage data accumulates post-release. |

---

## Outcome

**COMPLETE**

All 4 ACs satisfied with unit-test evidence (3/3 passing, including 1 jsdom behavioral test), confirmed by both a spec-compliance review (which hand-traced the real `''`-vs-`null` save path and the exact CSS-class string match against `ep2-s3`'s own toggle handler) and a code-quality review (one fix-and-re-review cycle: two test-rigor findings, both fixed and independently re-confirmed — including the implementer deliberately breaking the real implementation to prove the tightened AC1/AC4 test actually catches a regression, before restoring the correct code). No scope deviations. CI fully green. `npm test` on master: 731 files, 0 failed.

A live-browser confirmation was initially blocked post-merge: the deploy-triggered session-logout pattern recurred (9th time this session), and the operator signed off before completing sign-in. The operator logged in during a later turn the same session, and the live confirmation was completed then: on `wuce-staging.fly.dev`, set emotion ("positive"), pain points, and opportunities on a real stage via the side panel, switched to Customer experience view, and confirmed all three rows render correctly — including a real green colour chip with the literal text "positive" (AC4), and the journey's other two untouched stages correctly showing "Not set" for all three rows (AC2). The view toggle itself was exercised repeatedly across all three views with correct show/hide behaviour (AC3). `ep2-s3`'s own deferred live confirmation was completed in the same staging visit — see that story's own DoD, updated separately.

Same pre-existing CI workflow finding observed on this merge commit, not re-logged in detail (already documented repeatedly in this feature's own prior DoDs and `capture-log.md`): **Improvement Agent — Scheduled Dreaming** — recurring `GH013` branch-protection ruleset conflict. (The "Deploy dashboards to GitHub Pages" failure did not recur on this merge commit's own run.)

**Follow-up actions:**
1. Scope a short-track story for scripted (Playwright) staging verification with persisted/non-interactive auth — still a logged follow-up candidate (`capture-log.md` 2026-10-10), not yet scoped as its own story.
2. Extend `fake-test-db.js` with `customer_journeys`/`customer_journey_stages` support — still the single largest recurring gap across this feature.
3. Investigate the recurring "Improvement Agent — Scheduled Dreaming" `GH013` conflict.

---

## DoD Observations

1. **Smallest, cleanest story in this feature to date.** Complexity 1, single task, zero new infrastructure (no query, no route, no script handler) — pure reuse of two prior stories' own already-shipped mechanisms (`ep1-s3`'s columns, `ep2-s3`'s view toggle). One review cycle, two Minor/Important test-rigor findings, both fixed cleanly.
2. **The implementer's own mutation-testing style verification** (deliberately breaking the real implementation to confirm the tightened test would catch the regression, then restoring the correct code via `git checkout --`) is a notably more rigorous fix-verification technique than used elsewhere in this feature so far — worth considering as a standard practice for future fix-and-re-review cycles when a reviewer flags a non-discriminating assertion specifically.
3. **This closes the live-browser-confirmation question with a cleaner answer than `ep2-s3`'s own 9th-occurrence deploy-logout pattern:** this time it was ordinary operator unavailability (explicit "sign off"), not an ambiguous tooling blocker — no new capture-log entry needed, the existing pattern already covers it.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Customer experience view:
emotion, pain points, opportunities annotation rows" (ep3-s1). Check:
1. Does every AC row have a concrete evidence reference (test name or
   observable behaviour)?
2. Is the live-browser confirmation (emotion chip colour+text, pain
   points, opportunities, "Not set" fallback, view toggle) sufficient
   evidence alongside the 3/3 passing tests?
3. Is the outcome verdict (COMPLETE) consistent with the AC rows now
   that the live-browser confirmation has been completed?
```
