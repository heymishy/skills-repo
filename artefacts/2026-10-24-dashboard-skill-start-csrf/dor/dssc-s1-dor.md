# Definition of Ready: Fix missing CSRF token on dashboard "Run a skill" start forms

**Story reference:** artefacts/2026-10-24-dashboard-skill-start-csrf/stories/dssc-s1-fix-missing-csrf-on-dashboard-skill-start-forms.md
**Test plan reference:** artefacts/2026-10-24-dashboard-skill-start-csrf/test-plans/dssc-s1-test-plan.md
**Assessed by:** Claude (session)
**Date:** 2026-10-24
**Track:** Short-track (`/test-plan → /definition-of-ready → coding agent`)

---

## Contract Proposal

**What will be built:**
- `src/web-ui/views/dashboard-view.js`'s `renderDashboard(data)` — accept a new `data.csrfToken` field; embed `csrfField(data.csrfToken)` (imported from `../middleware/csrf`) inside each skill card's `<form>`, alongside the existing `method`/`action` attributes.
- `src/web-ui/routes/dashboard.js`'s `handleDashboard` — generate `await csrf.generateCsrfToken(req)` (the `csrf` module is not yet imported in this file; add the require) and pass it as `csrfToken` into the existing `renderDashboard({...})` call.
- `src/web-ui/routes/products.js`'s `handleGetDashboard` — generate `await _csrf.generateCsrfToken(req)` (the `_csrf` module is already imported in this file, used for `_renderProductNew`) and thread it through `_renderProductDashboard(...)` → `_dashboardView.renderDashboard({...})`. `_renderProductDashboard`'s own signature gains one new parameter (`csrfToken`), consistent with how it already accepts `impersonation` as a pass-through object.

**What will NOT be built:**
- No change to `src/web-ui/middleware/csrf.js` itself.
- No change to any other form in the codebase.
- No removal of `csdl-s1`'s diagnostic logging (separate follow-up, tracked in that story's own decisions.md).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `renderDashboard_embedsCsrfField_inEachSkillStartForm`, `handleDashboard_rendersRealCsrfToken_matchingSession` | unit |
| AC2 | `handleGetDashboard_rendersRealCsrfToken_matchingSession`, `handleGetDashboard_rendersRealCsrfToken_onZeroProductsOnboardingBranch` | unit |
| AC3 | `gateAdvance_skillStartForm_withCorrectCsrfToken_passesGuardAndReachesHandler` (real, unmocked `csrf.generateCsrfToken`/`csrf.csrfGuard`) | integration |
| AC4 | Re-run of 7 existing pre-fix test files, pass counts compared against baseline | regression |
| AC5 | Full suite (`node scripts/run-all-tests.js`) | regression |

**Assumptions:**
- `products.js`'s `handleGetDashboard` is confirmed (via `server.js`'s own route dispatch, lines 3102-3107) to be the handler actually serving `/dashboard` whenever `process.env.DATABASE_URL` is set — true on `wuce-staging` (confirmed via `flyctl secrets list`) and, by the same deploy config, true on production. `dashboard.js`'s `handleDashboard` is the fallback used only when `DATABASE_URL` is unset (e.g. some local/dev configurations) — both must be fixed since either could be the live path depending on environment.
- `_renderProductDashboard`'s zero-products branch has no skill-start cards at all (confirmed by reading its own code and an existing comment marking that branch "UNCHANGED" from a prior story) — no `_csrf` assertion applies there, only a no-crash regression check.

**Estimated touch points:**
Files: `src/web-ui/views/dashboard-view.js`, `src/web-ui/routes/dashboard.js`, `src/web-ui/routes/products.js`
Services: None external
APIs: None new — reuses the existing `csrf.generateCsrfToken`/`csrf.csrfField`/`csrfGuard` mechanism

**Contract Review outcome:** ✅ Clean — no gaps found. The fix pattern is already proven and in production use elsewhere in this exact codebase (`_renderProductNew`/`handleGetProductNew`, and `jgcc-s1`'s in-chat gate-confirm fix), so there is unusually low implementation risk for a security-touching change.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: Product Owner / platform maintainer |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC5 all covered |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items named |
| H5 | Benefit linkage field references a named metric | ✅ | "Direct bug-fix enabler" — short-track, no formal metric artefact (same convention as `csdl-s1`) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No in-feature upstream story; no schema fields involved |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 4 constraints named; short-track, no `/review` run |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | Hidden input field, no visual/layout surface |
| H-NFR | NFR profile exists | ✅ N/A | Short-track — NFRs stated directly in the story (Performance/Security/Accessibility/Audit, all addressed) |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | N/A | No new data classification — CSRF tokens are not PCI/sensitive |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank entry | ✅ N/A | Short-track has no discovery artefact by design — same recurring, already-accepted gap as `pcr-s1`/`p35tf-s1`/`cptr-s1`/`jgcc-s1`/`csdl-s1` (6th occurrence; the standing revisit trigger for an explicit short-track H-GOV branch in `/definition-of-ready` remains overdue, reaffirmed here) |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter introduced — reuses the existing, already-wired `csrf.js` module directly |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable — low risk | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track, no `/review` | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — acknowledged; matches this session's established solo-maintainer RISK-ACCEPT pattern (same as every other feature this session) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table: None | — |

**Outstanding decision to log:** W4 RISK-ACCEPT (see `decisions.md`).

---

## Standards injection

Domain tags: `[web-ui, security]`. Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/security/security-standards.md` — both confirmed present in `.github/standards/index.yml`. Both attached to the Coding Agent Instructions block below by path.

---

## Oversight level

**Medium** (per the story's own Human Oversight Level note) — this touches a security-relevant form (CSRF) on the dashboard route that serves staging/production whenever `DATABASE_URL` is set, even though the fix itself is a narrow, well-precedented field addition with unusually low risk given the existing proven pattern.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Fix missing CSRF token on dashboard "Run a skill" start forms — artefacts/2026-10-24-dashboard-skill-start-csrf/stories/dssc-s1-fix-missing-csrf-on-dashboard-skill-start-forms.md
Test plan: artefacts/2026-10-24-dashboard-skill-start-csrf/test-plans/dssc-s1-test-plan.md
Contract: see Contract Proposal section above (this DoR is both artefacts combined, per short-track convention)

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Mirror the existing `_renderProductNew`/`handleGetProductNew` pattern
  (products.js) exactly for how a csrfToken is generated and threaded
  through to a render function.
- Both `dashboard.js`'s handleDashboard AND `products.js`'s
  handleGetDashboard must be fixed — the shared `renderDashboard()` view
  function is used by both, and either could be the live path depending on
  whether DATABASE_URL is set.
- Do not touch src/web-ui/middleware/csrf.js.
- Do not touch any form other than the dashboard's "Run a skill" cards.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Also read the two standards files matched above in full:
  .github/standards/web-ui/web-ui-patterns.md and
  .github/standards/security/security-standards.md.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Hamish King — Platform maintainer / Product owner (solo repo — both roles), 2026-10-24
