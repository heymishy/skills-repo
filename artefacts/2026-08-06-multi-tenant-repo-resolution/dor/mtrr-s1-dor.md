# Definition of Ready Checklist

## Definition of Ready: Resolve each product's own repo for SaaS export, tenant-scoped

**Story reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s1-tenant-scoped-repo-resolution.md
**Test plan reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/test-plans/mtrr-s1-test-plan.md
**Review artefact:** artefacts/2026-08-06-multi-tenant-repo-resolution/review/mtrr-s1-review-2.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-06

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona matches benefit-metric's own framing |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Cross-tenant data isolation; distinct products supported |
| H6 | Complexity is rated | ✅ | 3 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2, 0 HIGH, 1 MEDIUM (accepted precedent) |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Category E score 5 (Run 2) |
| H-E2E | CSS-layout-dependent AC check | ✅ | Not applicable — server-side logic |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-08-06-multi-tenant-repo-resolution/nfr-profile.md |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable — no named framework |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-NFR-profile | NFR profile presence check | ✅ | |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Platform maintainer |
| H-ADAPTER | Injectable adapter wiring check (D37) | N/A | `ownerRepoForFeature` is an internal helper inside the already-D37-compliant `realExportDataSource`/`setExportDataSource` adapter from `rb-s4` — no separate adapter needed |
| H-INF | Infra-plan gate | N/A | Not set |
| H-MIG | Migration-review gate | N/A | Not set |

**10/10 applicable hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — (Unstable, declared) |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | Already noted in decisions.md |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — acknowledged, RISK-ACCEPT logged in `decisions.md` 2026-08-06 |
| W5 | No UNCERTAIN items left unaddressed | ✅ | — | — |

---

## Standards injection

Domain tags: `[security, data]`. Matched standards files: `.github/standards/security/`, `.github/standards/data/data-standards.md` (if populated). Appended to the coding agent instructions block below.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Resolve each product's own repo for SaaS export, tenant-scoped — artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s1-tenant-scoped-repo-resolution.md
Test plan: artefacts/2026-08-06-multi-tenant-repo-resolution/test-plans/mtrr-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Replace ownerRepoFromEnv() with ownerRepoForFeature(slug, credential) inside export-data-source.js -- do not touch the rest of realExportDataSource's logic (fetchArtefact, realFetchPipelineState calls stay exactly as rb-s4 built them).
- Use the SAME tenant_id scoping pattern already established elsewhere in this codebase (ADR-025) -- do not invent a second isolation mechanism.
- AC3: preserve rb-s4's existing 404-vs-403 status code distinction (ExportNotFoundError/ExportAccessDeniedError) -- only scrub the error BODY of repo/owner/tenant identifiers, do not unify the status codes.
- Before implementing, verify the 3 open [ASSUMPTION] lines from discovery against the real products table schema and pipeline-state.json structure -- if any assumption is wrong, stop and report back rather than silently working around it.
- No new database migration expected -- if the products table's repo-association columns don't reliably carry what's needed, that's a real finding to report, not something to route around.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing (ADR-025 applies).

## Applicable standards (domain: security, data)

[Standards files matched from .github/standards/index.yml for the security and data domains -- inject full content here per standards-injection.js's algorithm]

- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes — named human sign-off before assigning
**Signed off by:** Hamish King — Platform maintainer — 2026-08-06
