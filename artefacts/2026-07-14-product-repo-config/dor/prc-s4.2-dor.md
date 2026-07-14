# Definition of Ready: Delete (detach) a product (prc-s4.2)

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s4.2.md
**Test plan reference:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s4.2-test-plan.md
**Contract:** artefacts/2026-07-14-product-repo-config/dor/prc-s4.2-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## ⚠️ Read this first

This story has no direct metric linkage, by deliberate, twice-confirmed decision (once at `/definition`, once independently re-confirmed at `/review` after the same-agent-self-certification concern was raised — see `decisions.md`). H5 passes on the basis of an honest, explicit "None directly" linkage with real reasoning, not a fabricated connection — matching this feature's own established precedent for handling legitimate scope-without-metric stories.

---

## Contract review

✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So format, named persona | ✅ | |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has a test | ✅ | 2 integration + 1 manual (AC2, UI copy) |
| H4 | Out-of-scope populated | ✅ | GitHub repo deletion, soft-delete/undo |
| H5 | Benefit linkage field references a named metric | ✅ | **Interpreted per this feature's own precedent:** field is populated with an honest "None directly" plus real structural-completeness rationale, twice independently confirmed (decisions.md, /definition and /review). Treated as passing H5's intent (a real, reasoned linkage field, not a blank/fabricated one) rather than its most literal reading (a metric name). |
| H6 | Complexity rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings | ✅ | Review run 2 (post-operator-confirmation): 0/0/0 |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies block is "None" — schema check not required |
| H9 | Architecture Constraints populated | ✅ | "MVP never deletes the underlying GitHub repo"; Category E 5/5 |
| H-E2E | CSS-layout-dependent gap | ✅ | N/A |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | N/A |
| H-NFR3 | Data classification populated | ✅ | Internal |
| H-NFR-profile | Profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | |
| H-ADAPTER | D37 wiring check | N/A | No new adapter |
| H-INF | Infra-plan gate | N/A | |
| H-MIG | Migration-review gate | N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Acknowledged by |
|---|-------|--------|-----------------|
| W1, W2, W3, W5 | Pass cleanly | ✅ | N/A |
| W4 | Verification script reviewed | ⚠️→✅ | `decisions.md` W4 RISK-ACCEPT (all 14 stories) |

---

## Oversight level

**Medium** (per `epic-4-product-crud-and-isolation.md`).

---

## Standards injection

No `domain` field — skipped.

---

## READY / BLOCKED determination

## ✅ READY

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Delete (detach) a product — artefacts/2026-07-14-product-repo-config/stories/prc-s4.2.md
Test plan: artefacts/2026-07-14-product-repo-config/test-plans/prc-s4.2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- The underlying GitHub repo is NEVER deleted, under any circumstance --
  this is the single most important constraint on this story. Assert zero
  calls to any GitHub delete-repo endpoint, do not just assume it.
- Delete the product's own wuce-side data (journeys, standards cache rows)
  fully -- this is a hard delete, no soft-delete/undo needed.
- Confirmation copy must explicitly state the repo will not be deleted.
- Accessing a deleted product must return a clean not-found response, not
  a crash or partial render.
- No dependency on other stories (Dependencies: None) -- can be built
  independently of the rest of this feature's sequencing.
- Architecture standards: read .github/architecture-guardrails.md.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off required for Medium
**Signed off by:** Hamish King (Founder/Operator), 2026-07-14
