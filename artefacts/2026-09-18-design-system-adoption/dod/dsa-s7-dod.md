# Definition of Done: Add the "Product in Action" Demo Section to the Landing Page

**PR:** https://github.com/heymishy/skills-repo/pull/909 | **Merged:** 2026-09-19 (merge commit `f53261a4`, verified via `gh pr view 909` — `state: MERGED` — and `git merge-base --is-ancestor` against `origin/master`)
**Story:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s7.md
**Test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s7-test-plan.md
**DoR artefact:** artefacts/2026-09-18-design-system-adoption/dor/dsa-s7-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-19

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | "Product in action" section present with browser-chrome frame (3 traffic-light dots, URL-bar label `skills-framework.fly.dev`), byte-for-byte matching `DESIGN.md`'s mock reference (border-radius, box-shadow, chrome height/colors, dot ordering). Playwright `dsa-s7 AC1` test passes. Live Chrome browser check performed post-fix, both light and dark mode, against the exact code that merged (`git diff feature/dsa-s7 origin/master` on the touched files returns empty — no changes during review). | `live-verified` | None |
| AC2 | ✅ | `.demo-frame__body` contains a single `<p class="demo-frame__placeholder">Demo coming soon</p>` — no `<img>` present (test asserts `.demo-frame img` count = 0), so no broken-image risk. Playwright `dsa-s7 AC2` test passes. Confirmed visually in the same live browser check as AC1. | `live-verified` | None |
| AC3 | ✅ | A code comment immediately above `.demo-frame__placeholder` names the exact single-element swap (replace the `<p>` with an `<img src="/product-demo.gif" ...>` using inline `style`, no new CSS/JS needed). Confirmed by direct code read (both by the implementer's own Task 1 commit and independently by the final cross-task reviewer). Per the test plan's own stated reasoning, this is a maintainability/ergonomics claim about a future edit, not a browser-observable runtime behaviour — code review is the appropriate verification method, not the UI-evidence gate. | `code-review` | None |
| AC4 | ✅ | Every dark/light CSS custom-property value used by the new section (`--danger`, `--warn`, `--success`, `--line`, `--surface-2`, `--muted`, `--muted-2`) independently rgb-converted and compared against `DESIGN.md`'s token tables by the final cross-task reviewer — all match exactly. Playwright `dsa-s7 AC4` test passes. Confirmed visually in the live browser check (both themes). | `live-verified` | None |
| AC5 | ✅ | Playwright `dsa-s7 AC5` tests assert `document.body.scrollWidth <= viewport width` and the frame's own `boundingBox().width <= viewport width` at both 375px and 390px via real `page.setViewportSize()` — both pass. This is real-width-measurement evidence (not mere DOM presence), satisfying the UI-evidence gate's "Playwright evidence" path. A live real-device/narrow-viewport browser check was not additionally performed (this environment's `resize_window` tool is confirmed unable to reach true mobile widths — a known limitation logged earlier this session), but the Playwright evidence class here is sufficient per the gate's own explicit allowance. | `integration-real-code` (UI-evidence gate satisfied via Playwright visible-state assertion) | None |
| AC6 | ✅ | Fresh full `npm test` run at `/verify-completion` time: 681/683 passing; the 2 failures are both pre-existing/environmental (`tests/check-p3.5-validate-trace.js`, documented all session; `tests/check-pcr-s1-test-runner.js`, a wall-clock timing test confirmed as machine-load drift, not a regression), unrelated to this diff. Full `dsa-s3-landing-restyle.spec.js` suite (10 tests: 5 pre-existing `dsa-s3` + 5 new `dsa-s7`) passes. All 8 real CI checks on PR #909 passed post-merge-trigger, including the real-staging `Scenario A E2E (staging)` and `Scenario B E2E (staging)` jobs — independently confirmed via `gh pr checks 909`. | `live-verified` (real CI + real-staging E2E jobs) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded — all 6 ACs satisfied as specified, with two review-driven quality fixes (see DoD Observations) that improved fidelity to the AC intent rather than deviating from it.

---

## Scope Deviations

None. `git log master..feature/dsa-s7` (pre-merge) showed every commit mapped to a task, an AC-fidelity fix, or pipeline bookkeeping — confirmed at `/verify-completion` Step 3 and re-confirmed here: the merged diff touches exactly `src/web-ui/templates/landing.html`, `tests/e2e/dsa-s3-landing-restyle.spec.js`, plus expected bookkeeping (`decisions.md`, `pipeline-state.json`). Nothing in the story's or epic's out-of-scope sections was implemented.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 (one Playwright assertion group per AC1/AC2/AC4/AC5, plus AC3's code-review check and AC6's regression-suite re-run)
**Tests passing in CI:** 6 / 6 — confirmed via `gh pr checks 909` (all 8 CI jobs pass, including `Playwright E2E smoke tests`, `Scenario A/B E2E (staging)`, and `Lint, typecheck, test, build`)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| landing-product-demo-section-present (AC1) | ✅ | ✅ | Live-verified, both themes |
| landing-product-demo-placeholder-honest (AC2) | ✅ | ✅ | Live-verified |
| AC3 swap-in point (code review) | ✅ | ✅ | Confirmed by implementer + final cross-task reviewer |
| landing-product-demo-tokens-match-design-md (AC4) | ✅ | ✅ | Live-verified, both themes; rgb-converted token comparison independently re-derived |
| landing-product-demo-mobile-no-overflow (AC5) | ✅ | ✅ | 375px + 390px, real `setViewportSize()` |
| landing-dsa-s3-regression-suite-still-passes (AC6) | ✅ | ✅ | 9 Node check-scripts + full E2E suite + real-staging CI jobs, all clean against acknowledged baseline |

**Gaps (tests not implemented):** None.

**Coverage gap audit (CSS-layout-dependent ACs):** AC1, AC4, and AC5 are CSS-layout-dependent. All three were classified at DoR time with automated Playwright visual/layout assertions (not left as an undocumented gap) — confirmed by reading `dsa-s7-dor.md`. No RISK-ACCEPT was needed for any of them; each has real automated or live-verified coverage as recorded above. One layout defect *did* ship mid-delivery (the width-inconsistency issue, see DoD Observations) — it was caught by code-quality review's own live browser check before merge, not after, so it never reached production. This is the coverage discipline working as intended, not a gap.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Accessibility — placeholder has a real accessible label, not decorative-only | ✅ | `.demo-frame__placeholder` is a real `<p>` with visible text ("Demo coming soon"), not an empty/decorative element. Additionally, the final cross-task review found and fixed two further accessibility gaps beyond the test plan's original NFR scope: the section now uses a semantic `<section aria-label="Product in action demo">` landmark (matching every sibling section on the page) instead of a bare `<div>`, and the 3 purely-decorative traffic-light dots now carry `aria-hidden="true"`. |
| Performance — placeholder adds no meaningful page-weight | ✅ | The placeholder is a CSS-only styled `<p>`, no image/media file added. Real-GIF file-size budgeting remains explicitly deferred to the follow-up asset story, per the test plan's own stated scope. |

---

## Metric Signal

`dsa-s7` does not appear in `contributingStories` for any of this feature's 3 metrics (`m1` visual consistency across the 4 restyled screens, `m2` design.system DoR gate, `m3` beta user feedback) — it adds supplementary demo/conversion content to the already-shipped `dsa-s3` landing page, not one of the 4 screens `m1` tracks, and is not the DoR-gate mechanism `m2` tracks. No metric signal update applies to this story. This matches the feature's own metrics array (`pipeline-state.json`), which lists only `dsa-s1`/`dsa-s2`/`dsa-s3` under `m1`/`m3` and no stories under `m2` yet.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | — | — | dsa-s7 is not a contributing story for any feature-level metric |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None required to close this story. For context (not blocking): the real, high-definition demo GIF asset itself remains explicitly out of scope for `dsa-s7` and deferred to a future story, per the operator's own scoping decision recorded in `decisions.md` (2026-09-19, "`dsa-s7` created" entry).

---

## DoD Observations

1. **Two review-driven fixes landed during delivery, both logged in `decisions.md` and independently re-verified at each step:**
   - Task 1's code-quality reviewer found the new section reused `.section-centered` (720px), producing a jarring 39% width step-down from the 1024px-wide `.hero-cards-grid` section above it — DESIGN.md's own mock specifies 1000px for this section specifically. Fixed with a scoped `.section-centered--wide` modifier, verified via a throwaway Playwright measurement script and a live Chrome check (light+dark).
   - The final cross-task review found (a) a semantic-markup gap — the new section was a bare `<div>` unlike every sibling section's `<section aria-label="...">` pattern — and (b) a doc-accuracy error in this feature's own `decisions.md` (a "20-test" claim that should have read "10-test", the actual count of `test(` declarations in `dsa-s3-landing-restyle.spec.js`, confirmed via a fresh `npx playwright test` run). Both fixed directly and re-verified against the full test suite.
   - Neither finding reached production — both were caught and fixed pre-merge, within the same delivery session.
2. **`resize_window` mobile-viewport tool limitation reconfirmed** (previously logged for `dsa-s2` and `dsa-s3`): this environment's browser-resize tool cannot reach true 375-390px mobile widths, plateauing around 980-1000px. `page.setViewportSize()` via Playwright remains the only reliable mechanism for genuine narrow-viewport verification here — used for AC5's real evidence in this story too.
3. **Real-staging CI E2E jobs (`Scenario A/B E2E (staging)`) passed post-merge** — this is the same CI gate that caught a real regression on `dsa-s2`'s PR earlier in this feature's delivery (the `a3-product-feature-ideate-canvas.spec.js` PostHog-selector break). Their clean pass here is corroborating evidence this story introduced no equivalent cross-feature regression, not just evidence local to this story's own diff.

None of these observations require a `/improve` feedback entry — both review-driven fixes are examples of the existing two-stage review + final cross-task review process working exactly as designed, not gaps in the process itself.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for dsa-s7 ("Add the 'Product in action' Demo Section to the Landing Page").
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
