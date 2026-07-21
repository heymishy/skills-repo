## Definition of Ready: Curate a Modules taxonomy for a product

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a1-modules-taxonomy-crud.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a1-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-21

---

**CONTRACT REVIEW:** Contract Proposal (see `a1-dor-contract.md`) reviewed against all 6 ACs and the test plan. No mismatches found — every AC has a named test approach consistent with its Given/When/Then wording. ✅ Contract review passed.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "Hamish King (Founder/Operator...)" |
| H2 | At least 3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has at least one test | ✅ | AC1–AC6 all covered per test plan |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | "Time to identify the least-healthy area of a large product" |
| H6 | Complexity rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, Run 1, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 3 constraints (ADR-025, escaping, D37) |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs in this story |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-07-21-web-ui-experience-redesign/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs apply (regulated: false) |
| H-NFR3 | Data classification not blank | ✅ | "Internal" (NFR profile) |
| H-GOV | Discovery Approved By populated, non-engineering-only | ✅ | "Hamish King — Founder/Operator — 2026-07-21" — Founder/Operator is a non-engineering leadership role, not an engineering IC title |
| H-ADAPTER | New adapter has wiring AC | ✅ | AC6 added at DoR time (see decisions.md ARCH entry) — fixed a gap found during this check |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | Stable |
| W3 | MEDIUM findings acknowledged | ✅ | — | Resolved directly (decisions.md ARCH entry, 2026-07-21) rather than risk-accepted |
| W4 | Verification script reviewed by domain expert | ⚠️ | Script not yet reviewed by a human before coding begins | Operator to review `a1-verification.md` before assigning to coding agent |
| W5 | No uncertain gap-table items | ✅ | — | Gap table is empty |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Curate a Modules taxonomy for a product — artefacts/2026-07-21-web-ui-experience-redesign/stories/a1-modules-taxonomy-crud.md
Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Follow this repo's existing D37 injectable-adapter pattern exactly (see
  setCreditsAdapter/setGetUserRole in server.js for the reference shape).
  The stub default MUST throw, not return null/empty.
- All module names must pass through _escapeHtml before rendering.
- Module records must be scoped by product_id and tenant_id -- verify with
  a real cross-tenant test, not just a single-tenant happy path.
- Read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only (this repo's solo-operator context: the operator IS the tech lead)
**Signed off by:** Hamish King (Founder/Operator) — awareness confirmed by proceeding with this DoR run
