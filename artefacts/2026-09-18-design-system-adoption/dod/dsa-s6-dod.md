# Definition of Done: Fix Mobile-Responsiveness Gaps on the Already-Shipped Artefact Viewer and Dashboard

**PR:** https://github.com/heymishy/skills-repo/pull/912 | **Merged:** 2026-09-20 (merge commit `6d0e83e2`, confirmed via `gh pr view 912` — `state: MERGED` — and `git pull origin master` fast-forwarding the primary checkout from `99e7723d` to `6d0e83e2`)
**Story:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s6.md
**Test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s6-test-plan.md
**DoR artefact:** artefacts/2026-09-18-design-system-adoption/dor/dsa-s6-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-20

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `dashboard-mobile-no-horizontal-overflow` (Playwright, real `document.body.scrollWidth` measurement at 375px/390px) passes, closing the previously-measured 140px overflow. Additionally confirmed on real deployed staging (`wuce-staging.fly.dev`): operator loaded `/dashboard` at narrow width post-merge and confirmed no sideways scroll. | `live-verified` (real staging check, real Chromium-engine Playwright test at real target viewports) | None |
| AC2 | ✅ | `dashboard-mobile-grid-collapses-legibly` (Playwright) asserts real `getComputedStyle().gridTemplateColumns` track count (=1 for both `.sw-skill-grid` and `.sw-cols`), real `getBoundingClientRect()` widths on cards/columns (≥280px legibility floor), and a real rendered line-count check (`Range.getClientRects()`) confirming "Definition of ready" does not mid-word-wrap. Operator confirmed on real staging: dashboard "looks responsive" at narrow width. | `live-verified` (staging) + `integration-real-code` (Playwright) | None |
| AC3 | ✅ | `artefact-viewer-mobile-no-overflow-no-content-collapse` (Playwright) asserts real `scrollWidth` and `.sw-doc`'s real `getBoundingClientRect()` width (≥250px), directly disproving the previously-measured 0px/14px content-column collapse. Satisfies `DESIGN.md`'s own verification bar ("a real viewport-width check... DOM presence or desktop-only computed-style assertions do not satisfy this") — `page.setViewportSize()` to 375/390px is a real, non-desktop-only rendering check. | `integration-real-code` (Playwright, real Chromium rendering, not a live staging session) | None. Not independently confirmed on staging — see Follow-up Actions #1 |
| AC4 | ✅ | `artefact-viewer-mobile-stacks-body-first` (Playwright) asserts a genuine single-track grid collapse (not merely a squeezed 2-column grid) AND real rendered `top` position (`.sw-doc` above `.sw-artefact-sidebar`), correctly distinguishing true stacking from a narrow-but-still-2-column state. Confirmed during the final cross-task review that `.sw-doc` was already emitted before `.sw-artefact-sidebar` in DOM order (verified directly in source, not just trusted from the plan). | `integration-real-code` (Playwright) | None. Same staging-check gap as AC3 — see Follow-up Actions #1 |
| AC5 | ✅ | `dsa-s1-artefact-viewer-restyle.spec.js` (8/8) and `dsa-s2-dashboard-restyle.spec.js` (8/8) both re-run in isolation, pre-merge and independently reconfirmed by the final cross-task reviewer. Full `run-all-tests.js` (685 files) shows only the 2 already-documented pre-existing baseline failures (`check-p3.5-validate-trace.js`, `check-pcr-s1-test-runner.js`), no new failures. Post-merge CI on the PR (`gh pr checks 912`): all 8 jobs green, including `Playwright E2E smoke tests` and `Lint, typecheck, test, build`. | `integration-real-code` (pre-merge regression re-run) + CI-confirmed post-merge | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded — all 5 ACs were satisfied as written, with no scope or wording corrections needed during delivery (unlike `dsa-s5`, this story's ACs required no post-implementation text correction).

---

## Scope Deviations

None. `git log f468ad97..HEAD` (pre-merge, on `feature/dsa-s6`) showed every commit mapping to a task, a real implementation-detail correction (the inline-style/media-query specificity fix — see DoD Observations #1), the final cross-task review's own trivial DoR fix-forward, or pipeline bookkeeping. `gh pr view 912 --json files` confirms the merged diff touches exactly `src/web-ui/routes/artefact.js`, `src/web-ui/views/dashboard-view.js`, the new `tests/e2e/dsa-s6-mobile-responsiveness.spec.js`, and expected artefact/bookkeeping files. Nothing in the story's out-of-scope section was implemented — `html-shell.js` untouched, no new routes/functionality, `dsa-s1`'s and `dsa-s2`'s own DoD artefacts were not retroactively amended, `DESIGN.md`'s own text was not "corrected" (per the story's own explicit exclusion).

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5 — confirmed via `gh pr checks 912` (all 8 CI jobs pass) and independently re-run locally by both the Task 3 verifier and the final cross-task reviewer

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| dashboard-mobile-no-horizontal-overflow (AC1) | ✅ | ✅ | Also confirmed live on staging post-merge |
| dashboard-mobile-grid-collapses-legibly (AC2) | ✅ | ✅ | Also confirmed live on staging post-merge |
| artefact-viewer-mobile-no-overflow-no-content-collapse (AC3) | ✅ | ✅ | Not independently confirmed live on staging — Playwright evidence only |
| artefact-viewer-mobile-stacks-body-first (AC4) | ✅ | ✅ | Not independently confirmed live on staging — Playwright evidence only |
| dsa-s6-regression-suite-still-passes (AC5, realised via re-running dsa-s1's/dsa-s2's own full suites) | ✅ | ✅ | 8/8 + 8/8, isolated runs, independently reconfirmed twice this session |

**Gaps (tests not implemented):** None.

**Coverage gap audit (CSS-layout-dependent ACs):** All 5 ACs are CSS-layout-dependent. RISK-ACCEPTed at DoR time (`dsa-s6-dor.md`, H-E2E: PASS — Playwright already configured, no gap). The manual verification script (`dsa-s6-verification.md`) was reviewed at DoR (W4: ✅) but not formally walked scenario-by-scenario during a dedicated pre-code sign-off session — its 5 scenarios map 1:1 to the 5 automated E2E tests, which were executed. A live post-merge smoke test WAS performed (dashboard, AC1/AC2, on real staging by the operator) — see AC1/AC2 evidence above; the artefact-viewer scenarios (AC3/AC4) were not smoke-tested live post-merge.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: no measurable page-load regression (CSS/markup-only, no new network calls) | ✅ | Confirmed by inspection: the diff adds only `@media` CSS rules and one `<style>` block; no new network calls, no new data fetches, no new script execution added to either page. Not formally timed (matches this feature's own established precedent of not measuring page-load timing for CSS-only restyle stories where the change class makes a regression implausible). |
| Security: none identified | ✅ N/A | Story's own NFR section states "None identified" — confirmed; no new routes, no new data flows, no new auth logic. |
| Accessibility: WCAG 2.1 AA, no regression + this fix directly serves accessibility | ✅ | No existing accessibility property (contrast, keyboard navigation, ARIA) was touched or altered by this diff — confirmed via the diff itself (pure `grid-template-columns` changes, no attribute/markup changes affecting a11y tree). The fix's own accessibility benefit (illegible near-invisible content at narrow widths was itself an a11y failure) is inherently realised by AC3 passing. |
| Audit: none identified | ✅ N/A | Story's own NFR section states "None identified" — confirmed. |

The feature-level `nfr-profile.md` does not list `dsa-s6` in its per-row "Applies to story" columns (written before this story existed) — assessed against the story's own NFR section directly instead, per `/definition-of-done`'s own fallback instruction. See DoD Observations #2.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m1: Visual consistency across the 4 real screens | ✅ (already at target: 4/4) | Unaffected by this story — target was already fully reached at `dsa-s4`'s own DoD (2026-09-19) | **`dsa-s6` is deliberately NOT added to `m1`'s `contributingStories`.** `m1`'s own literal, scripted-check target text — "4 of 4 screens match `DESIGN.md` **token values**" — concerns color/font token consistency, not responsive layout. `dsa-s6` is a pure CSS grid/`@media` fix; it touches zero token values and does not move `m1`'s own literal target, which remains satisfied exactly as it was pre-`dsa-s6`. The story's own Benefit Linkage text argues a broader claim — that `dsa-s6` makes "screens match `DESIGN.md`" more completely true in the *responsive-behavior* dimension, which `DESIGN.md` itself added after `m1` was originally defined — but this is a different, newer claim than what `m1`'s own target text literally measures. Recording this honestly rather than silently stretching `m1`'s scope. See DoD Observations #3 for a possible `/improve` candidate (splitting `m1` into token-consistency and responsive-consistency sub-targets, or updating its target text now that `DESIGN.md`'s own definition of "matching" has grown). |

No other feature metric (`m2`, `m3`) has `dsa-s6` in scope — `m2` is `dsa-s5`'s own metric (DoR governance tooling, unrelated); `m3` (beta user feedback) has no new contributing evidence from this story (no new user-facing exposure event beyond what `dsa-s1`-`dsa-s4` already established).

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. AC3/AC4 (artefact viewer) were not independently confirmed on real deployed staging, unlike AC1/AC2 (dashboard, confirmed live by the operator post-merge). The Playwright evidence is genuinely sufficient per `/verify-completion`'s and `/definition-of-done`'s own UI-evidence-gate rules (real Chromium-engine rendering at the target viewports, not DOM-presence-only), so this is not a blocking gap — but if the operator wants full staging parity with the dashboard check, load `/artefact/2026-05-02-web-ui-copilot-execution-layer/discovery` (or any real artefact page) on `wuce-staging.fly.dev` at ~375-390px and confirm the document body is visible and appears above the Sign-off/Comments sidebar.
2. Consider whether `m1`'s own target text should be updated (or split) to explicitly cover responsive-behavior consistency now that `DESIGN.md` itself treats it as part of "matching" — currently `m1`'s literal scripted-check target is token-values-only and was reached before `dsa-s6` existed, so this story's real, valuable contribution (closing a genuine mobile-usability gap on 2 of the 4 screens) has no metric of record. This is a metric-definition gap, not a delivery gap.
3. The `gate-advance` validator-gap finding from earlier in this session (H7/`schemaDepends` literal-string requirements silently bypassed by `dsa-s2`/`dsa-s4`/`dsa-s5`'s own DoR sign-offs) remains logged in `workspace/capture-log.md` and un-investigated — not `dsa-s6`-specific, carried forward as a standing note.

---

## DoD Observations

1. **A real CSS-specificity bug was found and fixed mid-delivery, not assumed away**: the first Task 2 implementation attempt (identical pattern to Task 1's dashboard fix) had no effect, because `artefact.js`'s `.sw-artefact-layout` set `grid-template-columns` via an inline `style=""` attribute, which always outranks a stylesheet `@media` rule regardless of specificity. Fixed by moving the base declaration into the stylesheet (matching Task 1's own pattern) rather than reaching for `!important` — confirmed via direct grep at final review that no `!important` remained in the committed code. Full reasoning trail in `decisions.md`.
2. **A mid-session subagent dispatch hit the account's monthly spend limit and left no commit.** Rather than re-dispatching (risking the same failure), Task 2 was implemented directly in the coordinating session, since full context was already held. The dead agent had left an uncommitted, superseded alternative fix (using `!important`) in a `git stash` entry — compared directly against the final implementation, confirmed fully superseded, and left in place (the auto-mode classifier blocks `git stash drop` as a hard-to-reverse action; harmless to leave since the working tree already holds the correct, committed, tested state). Logged in `decisions.md` as a process note.
3. **`m1`'s own target text is now narrower than what this feature's own `DESIGN.md` considers "matching"** — see Metric Signal section above. Flagged as a possible `/improve` candidate: either split `m1` into two sub-targets (token consistency, already met; responsive consistency, now also met via `dsa-s1`/`dsa-s2`/`dsa-s6`) or broaden `m1`'s own target wording. Not actioned in this DoD, since changing a metric's own definition is a feature-level decision, not something a single story's DoD should do unilaterally.
4. **Live-check evidence is asymmetric across this story's own 2 screens** (dashboard: real staging confirmation; artefact viewer: Playwright only) purely because Chrome connectivity issues this session meant only one screen got checked before the operator's own limited manual-check time was used. Both screens have equally strong automated Playwright evidence; only the *supplementary* live-human-eyes layer differs. See Follow-up Actions #1.

None of these observations require an immediate `/improve` feedback entry beyond what's already captured in `decisions.md` and `workspace/capture-log.md` — item 3 is a genuine candidate for a future `/improve` pass on this feature's own metric definitions, not an urgent action.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for dsa-s6 ("Fix Mobile-Responsiveness Gaps on the Already-Shipped Artefact Viewer and Dashboard").
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
