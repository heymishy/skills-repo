# Definition of Done: Unify `/features/:slug`'s visual language across feature-level and per-story sections

**PR:** https://github.com/heymishy/skills-repo/pull/836 | **Merged:** 2026-09-05 (commit `b5b9cf8b40fa72fa17cee02ce9a972fe576e9688`)
**Story:** artefacts/2026-09-05-feature-page-ux-redesign/stories/fpux.1-unify-feature-page-visual-language.md
**Test plan:** artefacts/2026-09-05-feature-page-ux-redesign/test-plans/fpux.1-test-plan.md
**DoR artefact:** artefacts/2026-09-05-feature-page-ux-redesign/dor/fpux.1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-fpux.1-unify-visual-language.js` T1/T2 (class present, old inline style absent); `fpux.1-visual-consistency-theme.spec.js` AC1 (`.sw-epic-group` computed style matches `.sw-card` exactly) | automated unit + E2E | None |
| AC2 | ✅ | `fpux.1-visual-consistency-theme.spec.js` AC2a/AC2b — light theme resolves to `rgb(255,255,255)`/`rgb(24,24,27)`, dark to `rgb(28,28,26)`/`rgb(244,244,242)`, confirmed different between themes | automated E2E | None |
| AC3 | ✅ | `fpux.1-keyboard-focus.spec.js` — `outlineStyle: solid`, `outlineWidth: 2px` (not the browser's own default `auto`), Enter toggles `open` | automated E2E | None |
| AC4 | ✅ | `fpux.1-contrast-ratio.spec.js` — real WCAG relative-luminance computation, ≥4.5:1 confirmed in both themes | automated E2E | None |
| AC5 | ✅ | `check-fpux.1-unify-visual-language.js` AC5×2 (regression guard) — delete-button id + click handler + DELETE fetch call all byte-present | automated unit | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by `/trace`.

---

## Scope Deviations

None. The one adjacent change — updating `check-fapg-s1-group-artefacts-by-story.js`'s own assertions from the old bare `class="epic"`/`class="story-row"` literals to the new `sw-epic-group`/`sw-story-row` class names — is a required maintenance fix to an existing regression test to reflect this story's own intentional rename, not new or different behaviour beyond the ACs. Logged in the commit message, not a scope deviation.

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12 (exceeds the test plan's own original estimate of 8 — actual implementation produced more granular assertions than initially scoped, all still mapping cleanly to the same 5 ACs)
**Tests passing in CI:** 12 / 12 — confirmed via PR #836's own green CI run (`Lint, typecheck, test, build`: pass, 3m17s) and directly, locally, before merge

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1/T2 `sw-epic-group`/`sw-story-row` class presence, old style absence | ✅ | ✅ | `check-fpux.1-unify-visual-language.js` |
| AC5×2 delete-button regression guard | ✅ | ✅ | Same file |
| E1 `.sw-epic-group` computed style matches `.sw-card` | ✅ | ✅ | `fpux.1-visual-consistency-theme.spec.js` |
| E2a/E2b light/dark theme token resolution | ✅ | ✅ | Same file |
| E3 keyboard focus visibility + operability | ✅ | ✅ | `fpux.1-keyboard-focus.spec.js` |
| E4×2 WCAG 2.1 AA contrast ratio, both themes | ✅ | ✅ | `fpux.1-contrast-ratio.spec.js` |

**TDD verification performed (RED confirmed, not assumed):** every test in this suite was confirmed to fail for the right reason before its corresponding implementation landed — including two test-design bugs caught and fixed before their own commit (the keyboard-focus test initially passed against Chromium's own default UA focus ring; the contrast-ratio test's `parseRgb` initially treated a transparent background as opaque black, letting the ratio compute and pass with no real CSS applied). Both fixed to fail for the right reason, documented in the commit message.

**Coverage gap audit (Step 4):** AC1–AC4 are `CSS-layout-dependent` per the test plan's own Step 3a classification. No `RISK-ACCEPT` was needed or recorded, since Playwright E2E tooling (ADR-018) was configured and used directly for all four — the H-E2E blocking condition ("no tooling") was never met. `layoutGapsAtMerge`: **false** — zero unresolved gaps existed at merge; all four were fully covered by real, passing E2E tests, not deferred to manual verification.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no page-render regression | ✅ (informal) | No automated test per the story's own NFR scope (informal check only, per `nfr-profile.md`); no regression observed during implementation or CI |
| Security — none identified | ✅ N/A | No new data exposure, no new input surface |
| Accessibility — WCAG 2.1 AA | ✅ | AC3/AC4 E2E tests — keyboard operability, focus visibility, ≥4.5:1 contrast in both themes |
| Audit — not applicable | ✅ N/A | No new state-changing action introduced |

`nfr-profile.md` status: all NFRs applicable to this story are verified — see feature-level profile, Compliance section (WCAG 2.1 AA sign-off recorded at DoR, 2026-09-05).

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1: Visual consistency (style-seam count) | ✅ (1 seam, confirmed 2026-09-05) | ✅ 2026-09-05 | E2E test confirms `.sw-epic-group` computed style now matches `.sw-card` exactly — 0 seams |
| M2: Perceived design quality (Apple/SaaS-tier rubric) | ✅ (below bar, confirmed 2026-09-05) | Not yet — automated proxy only | Automated computed-style/contrast verification is done; the metric's own defined measurement method (operator direct subjective review) has not yet been performed |
| M4 (Tier 3): WCAG 2.1 AA conformance | ✅ (not yet audited, confirmed 2026-09-05) | ✅ 2026-09-05 | E2E contrast + keyboard-focus tests confirm conformance on the redesigned components |

**M1 signal: on-track** — evidence: `fpux.1-visual-consistency-theme.spec.js` AC1, computed-style equality confirmed, 2026-09-05.
**M2 signal: not-yet-measured** — evidence note: "Automated verification (computed-style, contrast, focus tests) confirms the technical redesign is correctly applied; the qualitative 'would a design-conscious evaluator consider this on par with a modern SaaS product' operator review has not yet been performed post-deployment."
**M4 signal: on-track** — evidence: `fpux.1-contrast-ratio.spec.js` + `fpux.1-keyboard-focus.spec.js`, both themes ≥4.5:1 and keyboard-operable, confirmed 2026-09-05.

---

## Outcome

**COMPLETE**

All 5 ACs satisfied with concrete, automated evidence. No scope deviations. No test gaps. Two of three contributing metrics (M1, M4) have a real, measured signal as of merge; M2 (the subjective design-quality bar) awaits the operator's own direct post-deployment review, per its own defined measurement method — not a gap in this story's delivery, but the natural next step for the metric owner.

**Follow-up actions:**
1. Operator: perform the direct post-deployment review for M2 (visit `/features/2026-06-22-wuce-multi-tenancy` or another multi-story feature in production, confirm the redesigned page passes the "on par with a modern SaaS product" gut-check) — owner: Hamish King.

---

## DoD Observations

1. **A test plan's own upfront test-count estimate (8) is a floor, not a ceiling.** Actual TDD execution produced 12 tests covering the same 5 ACs more granularly — this is a healthy outcome of test-first discipline surfacing sub-behaviours the plan's own prose only implied (e.g. "old inline style absent" as a separate assertion from "new class present").
2. **Two genuine test-design bugs were caught by strict RED verification, not by code review.** Both (`outline !== 'none'` passing against Chromium's own default; `parseRgb` silently treating transparent as black) would have shipped as false-positive "passing" tests if RED had been assumed rather than actually confirmed. This is the concrete value of TDD's own "watch it fail for the right reason" discipline, worth citing as a positive example in any future retrospective on this convention's ROI.
3. **`/improve` candidate:** the `metrics[].contributingStories` field in `pipeline-state.json` was left empty at `/definition` time despite the benefit-metric artefact's own Coverage Matrix correctly mapping M1/M2/M4 → `fpux.1` — a gap between the markdown artefact (correct) and the JSON state (incomplete) that this DoD is now backfilling. Worth a `/definition` skill-instruction reminder to populate this field at the same time the coverage matrix is written, not defer it.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Unify /features/:slug's visual language across feature-level and per-story sections" (fpux.1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
