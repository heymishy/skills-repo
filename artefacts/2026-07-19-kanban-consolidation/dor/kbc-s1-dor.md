# Definition of Ready Checklist

## Definition of Ready: Consolidate kanban rendering into one shared pattern; retire /features, /actions, /status

**Story reference:** artefacts/2026-07-19-kanban-consolidation/stories/kbc-s1.md
**Test plan reference:** artefacts/2026-07-19-kanban-consolidation/test-plans/kbc-s1-test-plan.md
**Assessed by:** Claude (agent, autonomous, short-track)
**Date:** 2026-07-19

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | Maintainability of the kanban/board feature surface |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Both design decisions recorded with operator confirmation |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-19-kanban-consolidation/nfr-profile.md` |
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
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case in the removal's blast radius | **Acknowledged — proceed.** Operator confirmed the outright-removal decision directly, knowing the risk. RISK-ACCEPT logged in `artefacts/2026-07-19-kanban-consolidation/decisions.md` |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Gap is explicitly operator-accepted | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Consolidate kanban rendering into one shared pattern; retire /features, /actions, /status — artefacts/2026-07-19-kanban-consolidation/stories/kbc-s1.md
Test plan: artefacts/2026-07-19-kanban-consolidation/test-plans/kbc-s1-test-plan.md
DoR contract: artefacts/2026-07-19-kanban-consolidation/dor/kbc-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. Generalise
src/web-ui/views/kanban-view.js's renderKanban into a shared renderer used by
product, org, AND tenant scope; add a new GET /dashboard?view=board tenant
board; remove /features, /actions, /status, /status/export outright.

Constraints:
- Read src/web-ui/views/kanban-view.js, handleGetProductKanban and
  handleGetOrgKanban (src/web-ui/routes/products.js), handleGetFeatures
  (src/web-ui/routes/features.js), and every /features-/actions-/status-
  related route registration in server.js in full before writing anything.
- Before deleting features.js or the status/actions handler modules, grep
  the ENTIRE codebase (not just server.js) for every export those files
  provide (e.g. _listArtefacts, renderFeaturesList, handleGetIdeas/
  handlePostIdea/handleDeleteIdea if they live in the same file) — some may
  be used by routes this story is not removing (e.g. /api/ideas). Extract
  and keep anything still needed; only delete what is genuinely dead once
  the removal lands.
- The tenant-scope aggregate (AC4) must genuinely merge journeys across
  ALL of a tenant's products — U4 specifically tests a 2-product tenant to
  catch an implementation that accidentally only looks at one product.
  Reuse handleGetDashboard's existing Promise.all parallelisation pattern
  for the per-product queries.
- renderKanban's "ideas" argument must become optional (U7) — product/org/
  tenant scopes have no equivalent concept today; do not force them to
  supply an empty ideas array as a workaround, make the renderer handle its
  absence cleanly.
- AC5/U8/U9: after removal, grep the full server.js AND the full tests/
  directory for any remaining reference to the removed routes/handlers —
  zero tolerance for dangling references or silently-failing tests.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — this story removes existing, previously-shipped routes/handlers outright (a real, operator-accepted risk if any undiscovered internal or external dependency exists) and touches a shared rendering pattern used across three scopes — warranting more awareness than the other two short-track stories from this same session, even though both open design questions are now resolved.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Founder/Operator) — directed this consolidation and confirmed both design decisions directly, 2026-07-19
