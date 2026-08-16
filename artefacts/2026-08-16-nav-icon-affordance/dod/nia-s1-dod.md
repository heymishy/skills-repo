# Definition of Done: Fix affordance mismatch on the sign-out control and theme-toggle button in the shared shell

**PR:** https://github.com/heymishy/skills-repo/pull/745 | **Merged:** 2026-08-16
**Story:** artefacts/2026-08-16-nav-icon-affordance/stories/nia-s1-fix-nav-icon-affordance.md
**Test plan:** artefacts/2026-08-16-nav-icon-affordance/test-plans/nia-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-16-nav-icon-affordance/dor/nia-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: `.sw-signout` has a visible "Sign out" text label, `href` unchanged | ✅ | `AC1` in `check-nia-s1-nav-icon-affordance.js` | Automated test, re-run fresh 2026-08-16 | None |
| AC2: sign-out `onclick` gates navigation behind `confirm()` | ✅ | `AC2` | Automated test, re-run fresh 2026-08-16 | None |
| AC3: theme toggle no longer renders `◑`; renders a CSS-gated sun/moon icon pair | ✅ | `AC3` | Automated test, re-run fresh 2026-08-16 | None |
| AC4: theme toggle class/onclick/aria-label unchanged; `swToggleTheme()` logic unregressed | ✅ | `AC4` | Automated test, re-run fresh 2026-08-16 | None |

4/4 tests re-run fresh on current master. Also re-verified the two sibling tests that already exercise the shared shell this story modified — `check-b2-account-nav.js` (9/9) and `check-acps-s1-admin-credits-shell.js` (3/3) — both still green, confirming no regression to other pages using the same `renderShell()`/`renderSidebar()` code.

---

## Scope Deviations

None in the final merged diff. `git show --stat` on the merge commit confirms exactly `src/web-ui/utils/html-shell.js`, the new test file, and this story's own artefacts were touched.

**Note (not a deviation, a correction to the record):** during branch-complete CI triage, this story's own `decisions.md` initially attributed a CI schema-validation failure to "pre-existing, unrelated repo drift" — that claim was wrong on inspection: the failure was self-caused by this story's own DoR sign-off writing an invalid `category: "accessibility"` guardrail enum value. Corrected transparently in a dedicated CORRECTION entry in `decisions.md` rather than silently edited, per this repo's own established convention (matches `wsi-s1`/`tmss-s1` precedent). Fixed directly, verified, and does not affect this story's own AC coverage or code scope — recorded here per CLAUDE.md's "verify coding-agent dispatch completion independently" guidance, which is exactly what caught it.

---

## Test Plan Coverage

**Tests from plan implemented:** 4/4
**Tests passing in CI:** 4/4

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (sign-out label) | ✅ | ✅ | |
| AC2 (sign-out confirm gate) | ✅ | ✅ | Reuses this codebase's own existing delete-confirmation pattern (`products.js`/`features.js`) rather than inventing a new one |
| AC3 (theme toggle icon) | ✅ | ✅ | Reuses the existing `[data-theme="dark"]` + `@media (prefers-color-scheme: dark)` no-JS-fallback technique already used for color tokens in the same file |
| AC4 (theme toggle logic unregressed) | ✅ | ✅ | |

**Gaps (tests not implemented):** None automated. One RISK-ACCEPT (see NFR Status below) for the genuinely CSS-layout/visual-rendering dimension of AC3 — whether the new sun/moon icon reads as unambiguous to a real human eye — closed via a manual smoke-test scenario in the verification script rather than a Playwright visual-regression test (no existing visual-regression harness for `html-shell.js` elements in this repo; standing one up was judged disproportionate scope for a bounded icon fix).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Accessibility: sign-out control has a non-hover-only affordance signal | ✅ | AC1 — visible text label, not hover-tooltip-only, now legible on mobile touch (the original beta-reported context) |
| B2 (CSS-layout-dependent AC classification) | ✅ (RISK-ACCEPT) | AC3's "does the icon look right to a human" dimension classified as RISK-ACCEPT + manual smoke test per CLAUDE.md's B2 rule, logged in `decisions.md`, with a corresponding Scenario 3 in the verification script — not yet executed against live staging as of this DoD; recommend as a follow-up action |

---

## Metric Signal

Not applicable — no formal benefit-metric artefact for this short-track story. The underlying signal is the beta-reported nav confusion (`artefacts/feedback/beta-001.md`, signals #3/#4) being closed; no automated metric tracks this.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. [Owner: Hamish King] Execute the verification script's Scenario 3 (manual visual check of the sun/moon icon against real staging) — this is the one RISK-ACCEPTed CSS-layout-dependent check not yet independently confirmed post-merge.
2. [Owner: Hamish King] Confirm with the beta user (or a fresh live check) that the sign-out control and theme toggle now read as intended on mobile Safari, matching how signals #3/#4 were originally reported.

---

## DoD Observations

1. This story is a direct, traceable closure of two real beta-reported UX defects: beta feedback → live Chrome validation (both icons independently reproduced — the sign-out arrow genuinely does log out and land on the marketing "OPEN FRAMEWORK" page; the theme toggle genuinely does read as a profile-picture placeholder) → `beta-001.md` triage artefact → dispatched short-track story → merged fix, all within the same session.
2. **Coding-agent self-report correction, independently caught:** this story's dispatched agent confidently misattributed a real CI failure it caused to "pre-existing, unrelated" drift — a textbook instance of exactly what CLAUDE.md's "verify coding-agent dispatch completion independently" guidance exists to catch, and it worked as intended here (see Scope Deviations above for the full correction).
3. **`/improve` candidate:** the recurring pattern across this session of dispatched agents confidently mis-scoping CI-failure root cause (this story, plus similar findings during `bpe-s1`'s own delivery) suggests dispatched coding-agent instructions should include an explicit instruction to verify a "pre-existing, unrelated" claim against the SPECIFIC violation the CI log names, not just a general re-run of an integrity-check script — general re-runs can miss a violation introduced by the story's own very-recent DoR write if the check script's own snapshot timing doesn't align. Not actioned in this DoD; flagged for a future `/improve` pass alongside `bpe-s1`'s own DoD Observation on the same theme.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for nia-s1 (nav icon affordance fix).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
