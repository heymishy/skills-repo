# Definition of Done: De-emphasize Unknown Health Visually

**PR:** https://github.com/heymishy/skills-repo/pull/817 | **Merged:** 2026-09-02
**Story:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s3.md
**Test plan:** artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s3-test-plan.md
**DoR artefact:** artefacts/2026-09-02-product-dashboard-triage/dor/pdt-s3-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-pdt-s3-deemphasize-unknown-health.js` — "AC1: Unknown-health item renders plain 'Unknown' text..." | Automated unit test | Literal color/no-background requirement was already true pre-existing; only the "?" glyph was new work — see Scope Deviations |
| AC2 | ✅ | Same file — "AC2: real Healthy/Warning/Blocked items keep their existing colored labels, unchanged" | Automated unit test (regression guard, passed with no code change) | None |
| AC3 | ✅ | Same file — "AC3: Overall line shows an honest Unknown state, not a misleading green Healthy..." | Automated unit test covering both the no-rollup-data and all-Unknown-items scenarios | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

One deviation, disclosed at implementation time: AC1's literal text ("displays in quiet grey text without a colored badge background") was found, via direct code investigation, to already be true everywhere in the codebase before this story — `unknown` already mapped to `var(--muted)` in every health-color assignment, and no health badge anywhere in this codebase has ever carried a `background-color`. The genuine remaining gap was the `"? Unknown"` label's `?` glyph reading with the same visual weight as the real `✓`/`⚠`/`✕` signal glyphs, even in a muted color. Implemented by dropping the glyph (plain `"Unknown"` text), leaving the already-correct color token untouched. Full reasoning in the implementation plan's "Investigation note."

No other scope deviations. `computeHealthCounts` was not touched, per the Architecture Constraint. The AC3 fix for the Overall-line's misleading green-when-unknown fallback was implemented entirely within `_renderProductView` (`products.js`) — `computeOverallHealthSignal` (`product-rollup.js`) was deliberately left untouched, honoring the story's file-scope constraint.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 4 / 4 (confirmed via the merged PR's "Lint, typecheck, test, build" check — pass)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: Unknown-health item renders plain "Unknown" text, no "?" glyph | ✅ | ✅ | |
| AC2: real Healthy/Warning/Blocked items keep their existing colored labels | ✅ | ✅ | Passed immediately as a regression guard — no code change touched this branch |
| AC3: Overall line shows an honest Unknown state | ✅ | ✅ | Covers both the no-rollup-data and all-Unknown-items scenarios |
| NFR-Accessibility: muted Unknown token meets WCAG 2.1 AA contrast | ✅ | ✅ | Passed immediately — color token unchanged by this story |

**Gaps (tests not implemented):** None.

**Additional evidence:** two pre-existing assertions in `check-pr-s2-products-route.js` hardcoded the literal `"? Unknown"` text — both updated to match the new label, with inline comments explaining the supersession. Full local suite: 597 file suites, 0 new failures (1 pre-existing, unrelated Windows `pwsh`-invocation failure in `check-p3.5-validate-trace.js`, confirmed identical on master before this branch started). A separate `check-pr-s2-product-rollup.js` test that directly tests `computeOverallHealthSignal` itself (`{green:0,amber:0,red:0,unknown:0} → 'green'`) was checked and confirmed unaffected, since that function itself was never modified — only `_renderProductView`'s local override of the *displayed* signal.

**E2E:** No local or `@real-staging` Playwright spec references health labels, badges, or the Unknown state specifically (checked via grep across `tests/e2e/*.spec.js`) — no coverage gap to flag. Both real-staging E2E jobs passed cleanly on the merged PR's first run.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Accessibility — de-emphasized Unknown treatment remains readable | ✅ | `NFR-Accessibility` unit test computes WCAG 2.1 AA contrast for `--muted` against `--bg` in both light (4.63:1) and dark (4.78:1) themes — both comfortably above the 4.5:1 threshold. Unaffected by this story since the color token itself was not changed, only the glyph and the Overall-line fallback logic. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 2 — Health-Signal Trustworthiness | ✅ (51%, 115/224, Unknown items rendered as competing-weight badges) | Yes — this is the only story contributing to Metric 2 | This story directly implements Metric 2's own stated mechanism (moving Unknown from a competing-weight label to a de-emphasized one). Measurement is now possible: on `skills-framework` staging, the same 115 previously-competing Unknown items should now render without the "?" glyph, and any product with zero real health signal should show an honest "Overall: Unknown" rather than a misleading green "Healthy." A live re-check against `skills-framework` staging is the natural verification step, not performed as part of this DoD run (no browser session active in this session) — recorded as `not-yet-measured` pending that check. |

Metric 1 (Time to First Actionable Content) does not list `pdt-s3` in its `contributingStories` — no signal action for this story.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None blocking. A live staging re-check of Metric 2 (confirming the 51%→0% competing-badge reduction on the real `skills-framework` product) would close out Metric 2's own measurement — worth doing opportunistically, not a gap in this story's own delivery.

---

## DoD Observations

1. This is the first story in this feature where a story's own AC premise (the discovery's live-Chrome observation) turned out to be only partially accurate against the current code — the "colored badge background" framing didn't literally match what was found (no badge backgrounds exist anywhere in this codebase for health indicators), yet the underlying UX complaint (Unknown reads as visually competing) was still real and correctly addressed via the glyph, once traced to its actual cause. Worth folding into the same `/improve` note already flagged in `pdt-s1-dod.md`/`pdt-s2-dod.md`: discovery-time live observations are a strong signal for *what's wrong*, but the *specific mechanism* still needs code-level confirmation before implementation, every time, even when the AC text sounds precise.
2. A second, independently-discovered defect (the Overall-line's silent green fallback with zero real signal) was found only through investigating AC3's own literal precondition, not named anywhere in the discovery, story, or DoR. This is the kind of finding `/trace` and `/improve` should have visibility into: `computeOverallHealthSignal`'s all-branches-fall-through-to-green design is a real, generically-applicable presentation defect (also latent in `pdt-s1`'s own per-group rolled-up status indicator, which calls the same function and was deliberately left unchanged in this story per its narrower AC3 scope — an all-Unknown module/phase group would still show a green "Healthy" chip today). Flagging as a candidate for a small follow-up story if the operator wants full consistency across both the page-level Overall line and the per-group indicators.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for De-emphasize Unknown Health Visually (pdt-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
