# Definition of Ready Checklist

## Definition of Ready: Bootstrap an existing repo from a DoR-approved SaaS artefact

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s4-saas-connected-bootstrap.md
**Test plan reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s4-test-plan.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-05

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a SaaS-hosted consumer reaching the outer-loop/inner-loop boundary" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs (AC5 added at DoR) |
| H3 | Every AC has at least one test in the test plan | ✅ | AC5 coverage added |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | SaaS-to-inner-loop conversion rate |
| H6 | Complexity is rated | ✅ | 3 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 3, 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs | ✅ | All 5 ACs covered, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` declared — code-level dependency, not schema |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Category E score 5 |
| H-E2E | CSS-layout-dependent AC check | ✅ | Not applicable |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence check | ✅ | |
| H-GOV | Discovery Approved By populated | ✅ | Same as rb-s1 |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ | **Initially FAILED** — story introduced an implied injectable adapter (`setExportDataSource`, per the test plan's `setFetcher`-style mock pattern) with no AC scoping production wiring. Fixed: AC5 added, requiring the stub to throw (not return empty/fake data) and the production wiring to be verified by a behavioural-correctness test (two different features → two different, individually-correct payloads), not just an assignment check. Re-reviewed (Run 3), now PASS. |
| H-INF | Infra-plan gate | N/A | Not set |
| H-MIG | Migration-review gate | N/A | Not set |

**10/10 applicable hard blocks passed** (1 initially failed and fixed during this DoR run — see H-ADAPTER).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | — (Run 3 has 0 open findings) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — acknowledged, combined RISK-ACCEPT in `decisions.md` 2026-08-05 |
| W5 | No UNCERTAIN items left unaddressed | ✅ | — | — |

---

## Standards injection

Domain tags: `[api, security]`. Matched standards files: `.github/standards/api/api-design.md`, `.github/standards/security/` (if populated). These are appended to the coding agent instructions block below.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Bootstrap an existing repo from a DoR-approved SaaS artefact — artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s4-saas-connected-bootstrap.md
Test plan: artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s4-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- D37 injectable adapter rule is mandatory for this story: `setExportDataSource`'s stub default MUST throw ("Adapter not wired: exportDataSource. Call setExportDataSource() with a real implementation before use.") — never return null/empty. The wiring test MUST assert behavioural correctness (two different features resolve to two different, individually-correct payloads) — not merely that a function reference was assigned. This is AC5, non-negotiable.
- Credential handling per product/constraints.md #12: never in a file, never in an agent-readable env var, never logged (NFR-Security).
- Reuse scripts/platform-fetch.js's existing "resolve source, copy/write content, log the fetch" shape for the CLI-side fetch logic — do not invent an unrelated mechanism.
- Mirror artefact.js's existing setFetcher pattern for the new endpoint's adapter — do not invent a differently-shaped adapter convention.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing.

## Applicable standards (domain: api, security)

[Standards files matched from .github/standards/index.yml for the api and security domains — inject full content here per standards-injection.js's algorithm]

- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness required before assigning
**Signed off by:** Hamish King (platform maintainer and tech lead in this solo-operator context) — 2026-08-05
