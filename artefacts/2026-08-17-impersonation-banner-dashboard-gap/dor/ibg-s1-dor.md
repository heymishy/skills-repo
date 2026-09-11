# Definition of Ready Checklist

## Definition of Ready: Thread impersonation state into the /dashboard route's renderShell call

**Story reference:** artefacts/2026-08-17-impersonation-banner-dashboard-gap/stories/ibg-s1-thread-impersonation-into-dashboard.md
**Test plan reference:** artefacts/2026-08-17-impersonation-banner-dashboard-gap/test-plans/ibg-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-11

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "admin who is impersonating a user" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 5/5 (AC1 has 2 tests, one per renderShell call site) |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track — restores `d2`'s own already-established AC1 guarantee, no new metric |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — reuses existing `renderImpersonationBanner`/`renderShell({impersonation})` mechanism exactly, matches `dashboard.js`'s already-correct pattern |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Markup-presence assertions (banner HTML present/absent), not CSS-layout-dependent |
| H-NFR | NFR profile or explicit "None" field | ✅ | Story states "None identified" across all 4 categories |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No feature-level NFR profile — short-track |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track — no NFRs beyond "None" |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapters — reuses existing `renderShell`/`renderImpersonationBanner`/`_csrf.generateCsrfToken` exactly as `dashboard.js` already does |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track, no review | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | No manual verification script required — fully covered by automated behavioural tests (markup presence/absence), consistent with the existing `d2` test's own approach for the same banner mechanism | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Thread impersonation state into the /dashboard route's renderShell call — artefacts/2026-08-17-impersonation-banner-dashboard-gap/stories/ibg-s1-thread-impersonation-into-dashboard.md
Test plan: artefacts/2026-08-17-impersonation-banner-dashboard-gap/test-plans/ibg-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- The ENTIRE change is scoped to src/web-ui/routes/products.js: handleGetDashboard and _renderProductDashboard. Do NOT touch dashboard.js's handleDashboard (already correctly wired), the banner's own rendering logic in html-shell.js, or the /api/admin/impersonate/exit flow.
- Read req.session.impersonation in handleGetDashboard, construct the impersonation object exactly matching dashboard.js's own pattern (lines ~101-104): only when imp.active && imp.target, shape { active: true, targetLogin: imp.target.login, targetTenantId: imp.target.tenantId, csrfToken: await _csrf.generateCsrfToken(req) }, else null.
- Thread this impersonation value into BOTH renderShell call sites reached by this route: the ?view=board branch's direct renderShell() call, and _renderProductDashboard's own renderShell() call (add impersonation as a new trailing parameter to _renderProductDashboard's signature, defaulting safely to null/undefined for the one other test file that may call it directly with the old, shorter argument list — check tests/check-npwe-s1-skills-nav-wiring.js and tests/check-fresc-s1-empty-state-clarity-copy.js for any direct calls before changing the signature, and confirm they still pass unmodified since a trailing optional parameter is backward compatible).
- Do not change the JSON API branch (res.json path) — the impersonation banner is an HTML-rendering concern only.
- Open a draft PR when tests pass — do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — small, well-scoped, single-file short-track fix; operator has authorized "further waves" of this DoD-triage sweep generally)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-11 — proceeding under the operator's standing authorization to continue triage waves autonomously

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
