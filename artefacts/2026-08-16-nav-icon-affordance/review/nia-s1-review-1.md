# Review Report: Fix affordance mismatch on the sign-out control and theme-toggle button — Run 1

**Story reference:** artefacts/2026-08-16-nav-icon-affordance/stories/nia-s1-fix-nav-icon-affordance.md
**Date:** 2026-08-16
**Categories run:** C — AC quality / D — Completeness (short-track scope, per `skills/review/SKILL.md`'s "C and D only (short-track stories)" option — confirmed genuinely short-track: bounded to two named elements in one file, `src/web-ui/utils/html-shell.js`, both root-caused and validated live against staging already, no unintended downstream impact since neither element's `class`, `href`, or click-handler name changes)
**Outcome:** PASS

---

### Category C: AC quality

For each AC:
- AC1 (visible "Sign out" text label): Given/When/Then ✓ | Observable (text node present in `.sw-signout`, `href` unchanged) ✓ | Independently testable ✓ | Uses "contains"/"remains", not "should" ✓
- AC2 (confirm() gate before navigation): Given/When/Then ✓ | Observable (onclick handler invokes `confirm()` with a specific message, returns `false` on cancel) ✓ | Independently testable ✓ | No "should" ✓
- AC3 (sun/moon icon pair replacing `◑`, CSS-gated by theme): Given/When/Then ✓ | Observable (glyph absent, two icon elements present, CSS selectors present) ✓ | Independently testable ✓ | No "should" ✓
- AC4 (no regression to class/handler/toggle behaviour): Given/When/Then ✓ | Observable (`class`, `onclick`, `aria-label` unchanged; `swToggleTheme()` still flips `data-theme` + persists to `localStorage`) ✓ | Independently testable ✓ | No "should" ✓

4 ACs (minimum 3 met). No HIGH findings (all in Given/When/Then, all ≥3 ACs).

**MEDIUM-adjacent observation (not scored as a finding):** AC3 asserts on implementation-shaped detail (CSS selector gating mechanism) rather than pure end-user-facing behaviour. This mirrors the same structurally-necessary pattern already accepted in `tmss-s1`'s own review (AC1/AC2 asserting on shell wrapper markup) — for a visual/affordance fix, the deliverable *is* specific markup/CSS, and there is no purely behavioural way to describe "shows the correct themed icon" without referencing how that correctness is achieved. Not treated as a defect.

**AC quality score (1–5): 4** — well-formed, independently testable, no "should" language; one point held back for the same structurally-necessary reason as the `tmss-s1` precedent (implementation-artefact-shaped ACs, inherent to a markup/CSS-shaped story, not a rewrite-required issue).

### Category D: Completeness

For each field against `.github/templates/story.md`:
- User story in As/Want/So format ✓
- Named persona — "signed-in wuce user," explicitly scoped as global/non-admin-only, matching the actual element (rendered for every authenticated user, not gated by `isAdmin`) ✓
- Benefit linkage populated — explains the mechanism (two independently confirmed, live-validated High-severity beta signals from `beta-001.md`) and is explicit this is a short-track substitute for a formal benefit-metric artefact ✓
- Architecture Constraints populated with real design reasoning (not boilerplate) — both fix choices are justified against existing codebase conventions (confirm() pattern from `products.js`/`features.js`; CSS-driven theme-state technique already used for color tokens in the same file) rather than invented fresh ✓
- Out of scope populated — 5 explicit exclusions, none blank or "N/A", including an explicit call-out that a full profile/account menu is intentionally not being built here ✓
- NFRs populated — Performance/Security/Accessibility/Audit all addressed; Accessibility given real substantive reasoning (touch devices have no hover state, so a hover-only `title` was never a real affordance signal for the reported device class) rather than a boilerplate "unchanged" ✓
- Complexity rated — 2, with justification explaining why (design judgment, not scope uncertainty) ✓
- Scope stability declared — Stable ✓

No HIGH or MEDIUM findings.

**Completeness score (1–5): 5** — every template field populated with real, specific content, directly traceable to the validated beta-001 triage and to concrete existing codebase conventions found before writing the fix.

---

## Summary

**Total findings:** 0 HIGH, 0 MEDIUM (2 non-scored observations noted above)
**Outcome:** PASS — ready for `/test-plan`.
