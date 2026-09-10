# Contract Proposal — Make the "Continue to next stage" action persistently reachable regardless of scroll position

**Story:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s2-persistent-next-stage-action.md
**Date:** 2026-09-10

---

**What will be built:**
The `.sw-journey-gate` div's existing `style="..."` attribute (`src/web-ui/routes/skills.js:4569`) gains `position: sticky; bottom: 0; z-index: <value>` (or an equivalent stylesheet rule targeting the existing `.sw-journey-gate` class), reusing the same underlying technique as `.sw-imp-banner`. The `class="sw-journey-gate"` attribute itself is preserved as the exact literal string `lsbm-s1`'s own existing test anchors on.

**What will NOT be built:**
No JS-based scroll listener or custom positioning logic. No change to the form, CSRF field, button copy, or "Artefact saved — advance to next stage" caption. No sticky header/toolbar elsewhere on the page.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `AC1: gate stays visible when scrolled up through history` | E2E |
| AC2 | `gate-confirm-form-unchanged` | Integration |
| AC3 | `AC3: short session — control not misplaced` | E2E |
| AC4 | `substep-affordance-markup-unaffected` | Integration |
| AC5 | `AC5: sticky control doesn't create a dead zone` | E2E |

**Assumptions:**
Assumes `position: sticky` can be added via the existing inline `style` attribute without needing a new stylesheet rule (simplest path, matches `.sw-imp-banner`'s own inline-vs-stylesheet choice — that one uses a stylesheet rule, but either achieves the same effect; implementation may choose either as long as `class="sw-journey-gate"` stays the literal opening-tag string `lsbm-s1` depends on). Assumes the sub-step affordance's own z-index/position isn't already conflicting with a sticky bottom element — not confirmed by direct testing before this contract, flagged as AC5's own job to catch if wrong.

**Estimated touch points:**
Files: `src/web-ui/routes/skills.js` (one div's styling), possibly `src/web-ui/utils/html-shell.js` (if a shared stylesheet rule is added instead of inline style), `tests/check-wnl-s2-journey-gate-sticky.js` (new), `tests/e2e/wnl-s2-journey-gate-sticky.spec.js` (new).
Services: None.
APIs: None.
