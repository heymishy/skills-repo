# Definition of Done: Add a Triage Summary Strip for Blocked/Warning Counts

**PR:** https://github.com/heymishy/skills-repo/pull/816 | **Merged:** 2026-09-02
**Story:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s2.md
**Test plan:** artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s2-test-plan.md
**DoR artefact:** artefacts/2026-09-02-product-dashboard-triage/dor/pdt-s2-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-pdt-s2-triage-summary-strip.js` — "AC1: strip renders Blocked and Warning counts when present" | Automated unit test against `_renderProductView`'s returned HTML | None |
| AC2 | ✅ | Same file — "AC2: strip Blocked count reuses the existing pvc-health-chip filter mechanism, not a parallel one" | Automated unit test, asserts byte-identical class/attribute/handler to the existing chips plus the real `pvcFilterByHealth` function's presence on the page | Real element is `<button>`, not `<a>` — see Scope Deviations below |
| AC3 | ✅ | Same file — "AC3: zero Blocked and zero Warning shows a clear 'nothing blocked' state" | Automated unit test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

One deviation, disclosed at implementation time: the DoR's own NFR target ("Strip counts are real `<a>` elements, keyboard-operable") and the test plan's NFR-Accessibility test both assumed `<a>` elements. Code investigation of the actual reusable mechanism (`pvc-health-chip` buttons + `pvcFilterByHealth(this)`, a pure client-side filter with no URL/anchor-based routing) found it is entirely `<button>`-based. The story's own NFR text (not just the DoR summary) explicitly permits "links **or buttons**," and the harder Architecture Constraint — reuse the existing mechanism, don't build a parallel one — means using buttons (identical class/handler to the existing chips) is the only way to genuinely satisfy AC2. Implemented with `<button type="button">` elements; the NFR-Accessibility test was written to match. Full reasoning recorded in the implementation plan's "Investigation note."

No other scope deviations. The story's Out of Scope items ("stalled 30+ days" count, "new this week" count) were not touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5 (confirmed via the merged PR's "Lint, typecheck, test, build" check — pass)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: strip renders Blocked and Warning counts when present | ✅ | ✅ | |
| AC2: strip Blocked count reuses the existing pvc-health-chip filter mechanism | ✅ | ✅ | |
| AC3: zero Blocked and zero Warning shows a clear "nothing blocked" state | ✅ | ✅ | |
| NFR-Performance: strip reuses existing healthCounts, no new query/computation | ✅ | ✅ | |
| NFR-Accessibility: strip counts are real, keyboard-operable `<button>` controls | ✅ | ✅ | Adjusted from the test plan's `<a>` assumption — see Scope Deviations |

**Gaps (tests not implemented):** None.

**Additional evidence:** full local suite: 596 file suites, 0 new failures (1 pre-existing, unrelated Windows `pwsh`-invocation failure in `check-p3.5-validate-trace.js`, confirmed identical on master before this branch started). This change is purely additive — a new block inserted between two existing sections — so no pre-existing test required updating (unlike `pdt-s1`, which removed functionality other tests depended on).

**E2E:** No local or `@real-staging` Playwright spec references the triage strip or the `pvc-health-chip`/`pvcFilterByHealth` mechanism specifically (checked via grep across `tests/e2e/*.spec.js`) — no coverage gap to flag. On the merged PR, both real-staging E2E jobs (`Scenario A E2E (staging)`, `Scenario B E2E (staging)`) passed cleanly on the first run this time.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no new query/computation | ✅ | `NFR-Performance` unit test confirms the strip renders from the already-computed `healthCounts` object; code review confirms no new query added. |
| Accessibility — real, keyboard-operable controls | ✅ | `NFR-Accessibility` unit test confirms real `<button type="button">` elements (not a bare div/span with a click handler). |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Time to First Actionable Content | ✅ (~40 screens of static text before any interactive content) | Not yet — full target requires pdt-s4 (breadcrumb) to also ship; `pdt-s1` and `pdt-s2` are both now merged | `pdt-s2` adds the very first genuinely clickable, attention-directing content on the page (the triage strip), a second real structural contribution toward the target alongside `pdt-s1`'s static-dump removal. Full measurement still waits on `pdt-s4`. |

Metric 2 (Health-Signal Trustworthiness) does not list `pdt-s2` in its `contributingStories` — no signal action for this story.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None. Metric 1's full measurement is deferred to `pdt-s4`'s own DoD run (the last remaining contributing story), not a gap in this story.

---

## DoD Observations

1. This is the second story in this feature (after `pdt-s1`) where the DoR/test-plan's own NFR target named the wrong concrete HTML element shape (`<a>` vs. the actual `<button>`-based mechanism), each time resolved by reading the story's own NFR text (which was looser/more accurate than the DoR's own summarised "NFR TARGETS" bullet) plus the harder reuse constraint. Worth folding into the same light `/improve` note already flagged in `pdt-s1-dod.md`: DoR authoring for `src/web-ui/routes/products.js` rendering stories should confirm concrete element shapes against the actual reused mechanism, not assume a shape.
2. Unlike `pdt-s1`, this story's diff was purely additive with zero cross-story test coupling — a useful contrast confirming the earlier DoD observation about `_renderProductView`'s shared helpers: coupling risk is specific to touching *shared rendering helpers*, not to touching `_renderProductView` itself.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Add a Triage Summary Strip for Blocked/Warning Counts (pdt-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
