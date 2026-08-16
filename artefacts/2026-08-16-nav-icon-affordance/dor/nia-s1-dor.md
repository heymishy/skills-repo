## Definition of Ready: Fix affordance mismatch on the sign-out control and theme-toggle button

**Story reference:** artefacts/2026-08-16-nav-icon-affordance/stories/nia-s1-fix-nav-icon-affordance.md
**Test plan reference:** artefacts/2026-08-16-nav-icon-affordance/test-plans/nia-s1-test-plan.md
**Review artefact:** artefacts/2026-08-16-nav-icon-affordance/review/nia-s1-review-1.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "signed-in wuce user" (any authenticated user) |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 4/4 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 5 exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Short-track substitute: two validated High-severity beta signals from `beta-001.md`, same pattern as `tmss-s1`/`pcr-s1` precedent |
| H6 | Complexity is rated | ✅ | Rating: 2, justified (design judgment, not scope uncertainty) |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review PASS, 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | 1 gap (AC3 visual legibility), explicitly RISK-ACCEPTed in `decisions.md`, not silent |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block is "None" — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated with real design reasoning (confirm() convention, CSS theme-token pattern reuse); review ran C/D only (short-track), no Category E findings |
| H-E2E | CSS-layout-dependent AC gap check | ⚠️→✅ | AC3 IS CSS-layout-dependent (visual legibility of the icon). Classified per CLAUDE.md's B2 rule: RISK-ACCEPT + manual smoke test (verification script Scenario 3) + `decisions.md` RISK-ACCEPT entry + `workspace/state.json` `pendingActions` post-deployment smoke test item — all three present, so the gap is closed per B2's own requirement, not left open |
| H-NFR | NFR profile exists or story has explicit "NFRs: None" | ✅ | `artefacts/2026-08-16-nav-icon-affordance/nfr-profile.md` created |
| H-NFR2 | Compliance NFR with named clause has documented sign-off | ✅ | No compliance NFR named — not applicable |
| H-NFR3 | Data classification field in NFR profile not blank | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence check | ✅ | Story NFR section has real content (Accessibility is a primary driver, not boilerplate) → profile created and populated |
| H-GOV | Governance approval check | ✅ (N/A) | No `discovery.md` exists — short-track deliberately skips discovery. Treated as not-applicable per the `tmss-s1`/`pcr-s1` precedent; recorded as an ASSUMPTION entry in `decisions.md` (citing `tmss-s1`'s own identical reasoning rather than re-deriving) |
| H-ADAPTER | Injectable adapter wiring check | ✅ (N/A) | No new adapter (`setX()`) introduced by this story |
| H-INF | Infra-plan gate check | ✅ (N/A) | `hasInfraTrack` not set |
| H-MIG | Migration-review gate check | ✅ (N/A) | `hasMigrationTrack` not set |

**Result: 15/15 hard blocks passed (4 not-applicable, explicitly recorded as such; 1 CSS-layout-dependent AC explicitly classified per B2, not silently skipped).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — (0 MEDIUM findings) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases; agent may verify against wrong criteria | RISK-ACCEPTed — see `decisions.md`, 2026-08-16 entry, citing `tmss-s1`'s identical rationale (solo-operator repo, no separate domain-expert role available) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — (the one gap — AC3 visual legibility — is explicitly classified and closed via manual verification, not left UNCERTAIN) | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix affordance mismatch on the sign-out control and theme-toggle button — artefacts/2026-08-16-nav-icon-affordance/stories/nia-s1-fix-nav-icon-affordance.md
Test plan: artefacts/2026-08-16-nav-icon-affordance/test-plans/nia-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Change ONLY `renderSidebar`'s `.sw-signout` element and `renderShell`'s
  `themeToggle` constant (plus their supporting CSS in `DESIGN_SYSTEM_CSS`)
  in `src/web-ui/utils/html-shell.js`. Do not touch `NAV_ITEMS`,
  `requireAdmin` gating, the sidebar's product-list rendering, or any other
  element in this file.
- Sign-out: add a visible "Sign out" text label (not hover-title-only) and
  gate the anchor's navigation behind `onclick="return confirm('Sign out of
  wuce?')"`, matching the `confirm()`-gated destructive-action pattern
  already used in `src/web-ui/routes/products.js` (module/product delete)
  and `src/web-ui/routes/features.js` (journey delete). Keep `href` as
  `/auth/logout`, unchanged.
- Theme toggle: replace the single `◑` character with two icon child
  elements (sun-style, moon-style), each with a distinct class name. Add
  CSS rules gating visibility by `[data-theme="dark"]` and the existing
  `@media (prefers-color-scheme: dark)` no-JS fallback pattern already used
  for color tokens in `DESIGN_SYSTEM_CSS` — copy that exact technique, do
  not invent a new one. Do NOT modify `SHELL_JS`'s `swToggleTheme` function
  body — it already sets `data-theme` correctly; the new CSS keys off that
  existing attribute. Keep `class="sw-theme-toggle"`, `onclick=
  "swToggleTheme()"`, and `aria-label="Toggle dark mode"` on the outer
  `<button>` unchanged.
- Before writing any test, grep `tests/` for `sw-signout`, `sw-theme-toggle`,
  `swToggleTheme`, `/auth/logout`, `title="Sign out"` to see which existing
  tests touch this markup (already identified in this story's DoR contract:
  `tests/check-b2-account-nav.js` and `tests/check-acps-s1-admin-credits-
  shell.js` — both assert on substrings that remain unchanged, so no
  CORRECTION is expected, but re-verify directly before assuming so).
- Architecture standards: read `.github/standards/web-ui/web-ui-patterns.md`
  and `.github/architecture-guardrails.md` before implementing. Do not
  introduce patterns listed as anti-patterns or violate named mandatory
  constraints or Active ADRs.
- Run the full suite (`npm test`) after every task and compare against the
  fresh baseline established at branch-setup — any new failure beyond that
  baseline must be root-caused and fixed (or documented as a CORRECTION in
  `decisions.md`) before committing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required — operator (Hamish King) requested and is directly reviewing this work in-session; scope is bounded to one file and two named elements, no new adapters, no new routes, no new data flows. (Complexity 2 reflects design judgment already resolved and documented in this DoR + `decisions.md`, not remaining ambiguity that would warrant raising oversight.)
