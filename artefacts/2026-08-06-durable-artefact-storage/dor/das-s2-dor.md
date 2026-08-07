# Definition of Ready Checklist

## Definition of Ready: Require a connected repo before a new product can start its first journey

**Story reference:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s2-require-connected-repo-for-new-products.md
**Test plan reference:** artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s2-test-plan.md
**Review artefact:** artefacts/2026-08-06-durable-artefact-storage/review/das-s2-review-2.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "Real SaaS operator creating a new product for the first time" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Repo-connection-required coverage |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2: PASS, 0 HIGH/MEDIUM/LOW |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` declared — code-level reuse of `mtrr-s2`, not a schema field dependency |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-025, product/constraints.md #9, reuse-not-rebuild note; Category E score 5 |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | All 4 ACs are server-side logic; blocking-message UI is plain semantic HTML, no visual/layout dependence |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-08-06-durable-artefact-storage/nfr-profile.md |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Confidential (shared feature-level profile) |
| H-NFR-profile | NFR profile presence check | ✅ | Present |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Platform maintainer / Product owner |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ N/A | No new injectable adapter — reads existing `products`/`journeys` columns via existing pool access, no new "call an external service on the user's behalf" surface |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass — 18/18 (15 direct passes + 3 explicit N/A).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — (Stable) |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 2: 0 MEDIUM (1-M1 from Run 1 already resolved directly) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — acknowledged, RISK-ACCEPT logged in `decisions.md` (2026-08-07) |
| W5 | No UNCERTAIN items left unaddressed | ✅ N/A | Test plan's Coverage gaps table is "None" | — |

---

## Standards injection

Domain tags: `[ui, web-ui]`. Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`. `ui` domain tag: no separate match beyond `web-ui` — flagged here per the standards-injection algorithm, not silently dropped.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Require a connected repo before a new product can start its first journey — artefacts/2026-08-06-durable-artefact-storage/stories/das-s2-require-connected-repo-for-new-products.md
Test plan: artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s2-test-plan.md
DoR contract: artefacts/2026-08-06-durable-artefact-storage/dor/das-s2-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- The gate check is journey-count-based, NEVER creation-date-based: block
  only when journey count = 0 AND no repo connected. A product with >=1
  existing journey must NEVER be blocked, regardless of when it was created
  or why it has no repo -- this is the exact boundary condition review
  caught and fixed (1-M1); do not regress it.
- Reuse mtrr-s2's existing repo-connection picker as the resolution path --
  do not build a second picker or connection UI.
- Do not touch mtrr-s2's picker behavior (search/filter, URL fallback) at
  all -- this story only adds a gate check before journey-start.
- No retroactive migration or blocking of existing repo-less products --
  the gate is forward-looking only (AC3 is the explicit regression guard
  for this).
- Architecture standards: read .github/architecture-guardrails.md before
  implementing (ADR-025 applies).

## Applicable standards (domain: ui, web-ui)

[Standards files matched from .github/standards/index.yml for the web-ui
domain -- inject full content here per standards-injection.js's algorithm.]

- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — per the epic's own stated allowance: das-s2 (UI/gate logic) can proceed at Medium once das-s1 (the higher-risk write-path change) sets the precedent, matching `mtrr-s2`'s own precedent this session.
**Sign-off required:** No — tech lead awareness required before assigning
**Signed off by:** Hamish King (Platform maintainer and tech lead in this solo-operator context) — 2026-08-07
