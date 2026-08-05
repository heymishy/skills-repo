# Definition of Ready Checklist

## Definition of Ready: Connect a repo by picking from your own accessible repos

**Story reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s2-repo-connection-picker.md
**Test plan reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/test-plans/mtrr-s2-test-plan.md
**Review artefact:** artefacts/2026-08-06-multi-tenant-repo-resolution/review/mtrr-s2-review-1.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-06

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an operator connecting a product to a GitHub repo" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | Repo-connection setup experience |
| H6 | Complexity is rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1, 0 HIGH, 0 MEDIUM, 2 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` declared — code-level, not schema |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Category E score 4 |
| H-E2E | CSS-layout-dependent AC check | ✅ | Checked at /test-plan — AC1/AC4 are DOM-state, not layout-dependent; no gap |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Confidential (shared feature-level profile) |
| H-NFR-profile | NFR profile presence check | ✅ | |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Platform maintainer |
| H-ADAPTER | Injectable adapter wiring check | N/A | No `setX()`-style adapter — UI flow reading existing columns |
| H-INF | Infra-plan gate | N/A | Not set |
| H-MIG | Migration-review gate | N/A | Not set |

**10/10 applicable hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — (Stable, declared) |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | — (no open MEDIUM findings) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — acknowledged, RISK-ACCEPT logged in `decisions.md` 2026-08-06 |
| W5 | No UNCERTAIN items left unaddressed | ✅ | — | — |

---

## Standards injection

Domain tags: `[ui, web-ui]`. Matched standards files: `.github/standards/web-ui/` if populated. Appended to the coding agent instructions block below.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Connect a repo by picking from your own accessible repos — artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s2-repo-connection-picker.md
Test plan: artefacts/2026-08-06-multi-tenant-repo-resolution/test-plans/mtrr-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Write to the exact same prc-s1.1 repo-association columns the existing URL-entry flow already writes to -- no new data model.
- Fallback to the existing URL-entry field is mandatory, not optional, if repo-listing fails for any reason (rate limit, scope, network).
- Cache the repo list within a session -- do not re-call the GitHub API on every render (NFR).
- WCAG 2.1 AA is a hard floor for this UI -- not a tradeable performance NFR.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing.

## Applicable standards (domain: ui, web-ui)

[Standards files matched from .github/standards/index.yml for the ui and web-ui domains -- inject full content here per standards-injection.js's algorithm]

- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness required before assigning
**Signed off by:** Hamish King (platform maintainer and tech lead in this solo-operator context) — 2026-08-06
