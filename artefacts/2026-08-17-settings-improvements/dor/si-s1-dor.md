## Definition of Ready: Relocate the theme toggle into Settings

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s1-relocate-theme-toggle.md
**Test plan reference:** artefacts/2026-08-17-settings-improvements/test-plans/si-s1-test-plan.md
**Contract proposal:** artefacts/2026-08-17-settings-improvements/dor/si-s1-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-17

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "regular team member" |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has a test | ✅ | 5 automated tests cover 4 ACs |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage names a metric | ✅ | "Theme toggle relocation — no usage regression" |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 1: 0 HIGH |
| H8 | No uncovered ACs | ✅ | No gaps |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints populated, no Cat. E HIGH | ✅ | shared shell reuse + no schema change; review Cat. E score 4, 0 HIGH |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-17-settings-improvements/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification populated | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Approved By populated | ✅ | "Hamish King, Platform owner — 2026-08-17" (role not clearly non-engineering — M1 signal recorded) |
| H-ADAPTER | New adapter wiring | ✅ N/A | No new adapter introduced |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ N/A | Review Run 1 had 0 MEDIUM findings | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Unreviewed script may miss edge cases | Acknowledged — RISK-ACCEPT logged in `decisions.md`, 2026-08-17, by Hamish King |
| W5 | No UNCERTAIN gap-table items | ✅ | No gaps | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Relocate the theme toggle into Settings — artefacts/2026-08-17-settings-improvements/stories/si-s1-relocate-theme-toggle.md
Test plan: artefacts/2026-08-17-settings-improvements/test-plans/si-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, no framework (raw http.createServer), injectable-adapter conventions per this codebase's existing style
- Reuse swToggleTheme() and the localStorage 'sw-theme' key exactly as-is — do not modify html-shell.js's toggle logic itself, only its markup location
- Do not redesign the toggle's visual appearance (icon, colours, sizing)
- Architecture standards: read .github/architecture-guardrails.md before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Applicable standards (web-ui):
- Every HTML route view MUST import renderShell()/escHtml() from src/web-ui/utils/html-shell.js — never duplicate or reimplement either function
- escHtml() MUST be applied to every user-supplied or model-supplied string before injecting into an HTML response body
- This applies even though this story's UI changes are small/"no polish needed" — that framing does not licence bypassing the shared shell (see web-ui-patterns.md's tir-s3/wsi-s6 precedent)
- Shell layout changes belong in html-shell.js, not duplicated in individual route files

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required
