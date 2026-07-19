# Definition of Ready Checklist

## Definition of Ready: Give every product a UI path to connect or create a GitHub repo

**Story reference:** artefacts/2026-07-19-product-repo-connect-ux/stories/rpc-s1.md
**Test plan reference:** artefacts/2026-07-19-product-repo-connect-ux/test-plans/rpc-s1-test-plan.md
**Assessed by:** Claude (agent, autonomous, short-track)
**Date:** 2026-07-19

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | product-rollup Metric 1/Metric 2 |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | MC-SEC-01 referenced |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-19-product-repo-connect-ux/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry (2026-07-19)** | No discovery artefact — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** RISK-ACCEPT logged in `artefacts/2026-07-19-product-repo-connect-ux/decisions.md` |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | No gaps recorded | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Give every product a UI path to connect or create a GitHub repo — artefacts/2026-07-19-product-repo-connect-ux/stories/rpc-s1.md
Test plan: artefacts/2026-07-19-product-repo-connect-ux/test-plans/rpc-s1-test-plan.md
DoR contract: artefacts/2026-07-19-product-repo-connect-ux/dor/rpc-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. Extend _renderProductView
(src/web-ui/routes/products.js:104) with a Connect-repo affordance for
unconnected products, wired to the two EXISTING handlers
(handlePostProductRepoCreate, handlePutProductEdit's repo-association path)
— do not write any new repo-creation or repo-association logic.

Constraints:
- Read handlePostProductRepoCreate and handlePutProductEdit's current
  implementations in full before designing the new form markup, so the
  request shape you build actually matches what they expect.
- Use _escapeHtml for any repo owner/name value rendered back to the page
  (MC-SEC-01) — verified by IT3.
- New form controls must be keyboard-accessible with proper labels, matching
  this file's existing accessibility conventions.
- Do not touch handlePostProductRepoCreate or handlePutProductEdit's own
  logic — this story is UI-only.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — pure UI addition wiring to already-working, already-tested backend handlers; low risk of regression since no existing logic changes.
**Sign-off required:** No
**Signed off by:** Hamish King (Founder/Operator) — found this gap directly during live staging verification, 2026-07-19
