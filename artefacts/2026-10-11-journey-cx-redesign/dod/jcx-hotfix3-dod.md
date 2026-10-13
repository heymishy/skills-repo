# Definition of Done: Fix CSS specificity bug making the swimlane grid visible in every view

**PR:** https://github.com/heymishy/skills-repo/pull/985 | **Merged:** 2026-10-13
**Story:** short-track bug fix (production visual bug)
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-hotfix3-test-plan.md
**DoR artefact:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-hotfix3-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | The swimlane grid is visible only in the Customer experience view. `check-jcx-hotfix3-cx-grid-visibility.js`: confirmed RED against the bug (grid stayed visible even in the default canvas view) and GREEN against the fix (hidden by default, visible in Customer experience, hidden again in Delivery) | `integration-real-code` (real jsdom `getComputedStyle` against the rendered `<style>` block) | None |

### Verification strength summary
- `integration-real-code`: 1 (real CSS cascade computation via jsdom, not a string-matching check on the CSS text)
- `live-verified`: 1 — see below

---

## Scope Deviations

None. Single-line CSS rule deletion, exactly as scoped.

---

## Test Plan Coverage

**Tests from plan implemented:** 1/1
**Tests passing in CI:** confirmed via PR #985 — all 8 checks green

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (real-cascade visibility fix) | ✅ | ✅ | RED/GREEN confirmed locally before pushing; also verified in a Linux/Node24 container |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Single CSS rule deletion, no new code path |
| Security | ✅ N/A | No new input surface, no auth/data change |
| Accessibility | ✅ N/A | No change to markup, only to which existing markup is visible when |
| Audit | ✅ N/A | No new logging |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Operator CX judgment vs. the reference bar | ✅ (baseline: "Not matching") | Not yet | This fix removes a real visual defect (`jcx-s6`'s own grid bleeding into the Delivery view) that would have directly undermined M1 if left live — operator noticed it immediately via direct Chrome validation |

**Measurement-ready gate:** Not yet.
**Evidence note:** Fix is confirmed correct via a real-cascade regression test and live Chrome re-verification; the actual M1 judgment solicitation is still a separate future action.
**Signal:** `not-yet-measured`
**Date measured:** null

---

## Outcome

**COMPLETE — NO DEVIATIONS**

**Follow-up actions:**
1. **Closed.** Live Chrome re-verification performed directly after deploy on `wuce-staging.fly.dev`: opened the Customer experience tab (correct — persona, grid, all 5 rows render as expected), switched to Delivery — the swimlane grid is gone, only the Delivery tab's own per-stage list shows. The exact bug reported is confirmed fixed, not just unit-tested.
2. **Owner: future session, process.** This is the second CSS-cascade-class bug found by live verification in two consecutive days in this feature (the first being a client/server HTTP-method mismatch in `jcx-hotfix2`, a different class; this one is pure CSS specificity). No dedicated lint/test exists in this repo's own governance checks to catch "a later same-specificity rule silently overriding an earlier conditional one" automatically. Logged in the test plan as a deferred `/improve` candidate, not attempted here.

---

## DoD Observations

1. This bug was invisible to every test written for `jcx-s6` itself (4/4 passing) because none of them exercised the FULL 3-way view-toggle sequence (canvas → customer-experience → delivery) with a real CSS cascade computation — they each checked isolated pieces (does the grid render with the right content, does it carry the right class) without ever confirming it correctly disappears again when switching away. The regression test added here closes that exact gap, and is now the only test in this codebase that exercises the full toggle sequence specifically for the swimlane grid.
2. This confirms the value of the operator's own "validate in chrome" instruction as a standing practice immediately after any CSS/layout-touching merge, not just once per story — this bug shipped past CI (nothing in `npm test` or Playwright's own smoke tests caught it) and was only found by someone actually clicking between the tabs in a real browser.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for jcx-hotfix3 (CSS specificity fix).
Check:
1. Does the AC row have a concrete evidence reference (test name, RED/GREEN confirmation)?
2. Is the DoD Observation about test coverage gaps (no test exercised the full 3-way toggle
   sequence) worth promoting into a standing practice for future CSS/layout-touching stories --
   e.g. a mandatory "toggle through every view and confirm exclusive visibility" test?
3. Is the live Chrome re-verification below sufficient confirmation, or should this be re-checked again?
Report findings as HIGH / MEDIUM / LOW.
```
