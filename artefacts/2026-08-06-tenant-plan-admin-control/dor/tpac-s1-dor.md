# Definition of Ready Checklist

## Definition of Ready: Give admins a real control to lift a tenant's journey cap, separate from credits

**Story reference:** artefacts/2026-08-06-tenant-plan-admin-control/stories/tpac-s1-admin-plan-state-control.md
**Test plan reference:** artefacts/2026-08-06-tenant-plan-admin-control/test-plans/tpac-s1-test-plan.md
**Review artefact:** artefacts/2026-08-06-tenant-plan-admin-control/review/tpac-s1-review-2.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-08-06

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an admin (ADMIN_GITHUB_LOGINS)..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Operational-efficiency metric, short-track (no formal benefit-metric artefact) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2: PASS, 0 HIGH/MEDIUM/LOW |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-025 + reuse-not-reinvent note; Category E score 5 |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | No layout-dependent ACs — server-rendered HTML/text assertions only |
| H-NFR | NFR profile exists | ⚠️ N/A | Story has explicit NFRs field (4 categories) — no separate feature-level nfr-profile.md for this short-track feature |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ N/A | No feature-level NFR profile for short-track; story-level NFRs cover Security/Performance/Accessibility/Audit directly |
| H-NFR-profile | NFR profile presence check | ✅ N/A | Story NFR section is populated (not "None"/blank), but short-track stories in this repo's established precedent (pcr-s1) proceed without a separate nfr-profile.md when the story's own NFR section is complete — see decisions.md GAP entry |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry (2026-08-06)** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via operator's direct in-session instruction to proceed (matches pcr-s1/stis-s1 precedent). |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapters introduced — reuses already-D37-wired `setPlanState`/`setPlanStateAdapter` |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 15/15 (10 direct passes + 5 explicit N/A), with the H-GOV and H-NFR-profile notes recorded transparently, matching established short-track precedent.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — (Stable) |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 2: 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | Acknowledged — proceed, RISK-ACCEPT logged in decisions.md (2026-08-06), matching this session's established pattern |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's Coverage gaps table is "None" | — |

---

## Standards injection

Domain tags: `[web-ui]`. Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`. Appended to the coding agent instructions block below.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Give admins a real control to lift a tenant's journey cap, separate from credits — artefacts/2026-08-06-tenant-plan-admin-control/stories/tpac-s1-admin-plan-state-control.md
Test plan: artefacts/2026-08-06-tenant-plan-admin-control/test-plans/tpac-s1-test-plan.md
DoR contract: artefacts/2026-08-06-tenant-plan-admin-control/dor/tpac-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Reuse tenant-plan.js's existing setPlanState(tenantId, plan, status) directly
  -- do not modify its internals or add a new adapter.
- The new admin control is ADDITIVE to /admin/credits -- do not merge it into
  or change the existing credits-adjustment form/route.
- AC3 is a regression guard: a test asserting credits-only adjustment does NOT
  lift the cap must exist and pass -- this is the single most important
  behaviour this story must NOT break.
- Gate the new route with the same requireAdmin live role check
  admin-credits.js's existing routes already use -- no new authorization
  mechanism.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.

## Applicable standards (domain: web-ui)

[Full content of .github/standards/web-ui/web-ui-patterns.md -- inject here
per standards-injection.js's algorithm]

- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — touches tenant plan/billing-adjacent state, even though admin-gated and narrowly scoped; warrants tech-lead-equivalent awareness before assigning, not formal named sign-off.
**Sign-off required:** No (Medium — awareness only)
**Signed off by:** Hamish King (Platform maintainer / Product owner) — 2026-08-06
