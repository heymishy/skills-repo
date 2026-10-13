# Definition of Done: Fix "+ Add stage" being invisible and unfocusable outside the Delivery view

**PR:** https://github.com/heymishy/skills-repo/pull/986 | **Merged:** 2026-10-13
**Story:** short-track bug fix (production functional bug, found during `spikes/cx-interaction-design-polish-outcome.md` Part 2)
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-hotfix4-test-plan.md
**DoR artefact:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-hotfix4-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ (RISK-ACCEPT on live re-verification) | "+ Add stage" produces a visible, focused input regardless of active view. `check-jcx-hotfix4-add-stage-visibility.js`: confirmed RED against the bug (Canvas/Customer-experience scenarios failed, Delivery passed) and GREEN against the fix (all 3 scenarios pass) | `integration-real-code` (real jsdom `dispatchEvent` clicks + real ancestor-visibility walk + `document.activeElement` focus check) | RISK-ACCEPT (no post-deploy live-browser re-check — staging session logged out after redeploy, operator chose to skip re-signing-in) |

### Verification strength summary
- `integration-real-code`: 1 (3 sub-scenarios: Canvas, Customer-experience, Delivery-no-regression)
- `live-verified`: 0 — see RISK-ACCEPT below (the ORIGINAL bug itself was confirmed live via `javascript_tool` before the fix; the fix's own live re-check was skipped)

---

## Scope Deviations

None. Single DOM-insertion-point change, exactly as scoped. The view-reset-on-save behaviour and the Part 1 visual-polish findings from the same spike are explicitly out of scope for this hotfix — named as separate, not-yet-scoped follow-ups.

---

## Test Plan Coverage

**Tests from plan implemented:** 1/1 (3 sub-scenarios)
**Tests passing in CI:** confirmed via PR #986 — all 8 checks green

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 — Canvas view scenario | ✅ | ✅ | RED/GREEN confirmed locally before pushing |
| AC1 — Customer-experience view scenario | ✅ | ✅ | RED/GREEN confirmed locally before pushing |
| AC1 — Delivery view scenario (no-regression control) | ✅ | ✅ | Passed both before and after the fix, as expected |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Single DOM-insertion-point change, no new code path or query |
| Security | ✅ N/A | No new input surface, no auth/data change |
| Accessibility | ✅ | The fix directly restores WCAG keyboard-operability for the Add-stage flow (focus now actually reaches the new input) in the two views where it was previously broken |
| Audit | ✅ N/A | No new logging |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Operator CX judgment vs. the reference bar | ✅ (baseline: "Not matching") | Not yet | This fix removes a real functional defect in the very first step of building a journey map — directly relevant to the operator's "feels very clunky" read, found while researching this exact concern |

**Measurement-ready gate:** Not yet.
**Evidence note:** Fix is confirmed correct via a real-DOM-interaction regression test (RED/GREEN); the live browser re-check was explicitly skipped per operator decision (RISK-ACCEPT, `decisions.md`).
**Signal:** `not-yet-measured`
**Date measured:** null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

(Deviation class: one RISK-ACCEPT — no post-deploy live-browser re-verification, operator-approved. No functional/scope deviation in the implementation itself.)

**Follow-up actions:**
1. **Owner: future session.** If a fresh, authenticated staging session becomes available, perform the live re-check that was skipped here: from the Customer-experience view, click "+ Add stage" and confirm a visible, focused input appears.
2. **Owner: future session, product.** The remaining findings from `spikes/cx-interaction-design-polish-outcome.md` — empty-state visual treatment (Part 1), 8px spacing rhythm (Part 1), the view-reset-on-save behaviour (Part 2, finding 2), and the multi-field edit-panel friction (Part 2, finding 3) — are named and traceable but explicitly not yet scoped into a story. Revisit for a scoping decision.
3. **Owner: future session.** The bigger, reference-grounded idea named but explicitly deferred in the spike (editing CX fields directly inline in the swimlane grid, rather than via a side panel, matching Splice/QuestionPro/Figr conventions) remains logged, not lost.

---

## DoD Observations

1. This fix was found by following the operator's own redirect mid-spike — from "the rendered grid looks clunky" to "the step-by-step authoring flow itself is clunky" — which surfaced a genuinely different, more load-bearing class of defect (a functional bug, not a visual-polish gap) that the first framing of the spike would never have found. Worth remembering that "it feels clunky" can point at either layer, and it is worth explicitly checking both rather than assuming the first hypothesis is the whole story.
2. The defect itself (`#sw-journey-stages{display:none}` silently breaking a feature appended into it) is a different root-cause shape than `jcx-hotfix3`'s own CSS-specificity bug, but the same broader class: a view-conditional CSS rule interacting badly with a piece of markup/behaviour that wasn't written with that condition in mind. Two bugs of this general shape in one feature's own history (`jcx-hotfix3`, `jcx-hotfix4`) — worth considering, as a future `/improve` candidate, a standing checklist item for any story that adds a new view-conditional hide/show rule: explicitly enumerate every existing interactive affordance that writes into the now-conditionally-hidden container, not just what's already visible there.
