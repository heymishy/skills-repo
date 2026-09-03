# Definition of Ready Checklist

## Definition of Ready: Module-less products get the full grouped/collapsed/filterable features UI, and health counts render in one place, not three

**Story reference:** artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/stories/ppg-s1-decouple-modules-gate-and-consolidate-health-counts.md
**Test plan reference:** artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/test-plans/ppg-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs (5 + 1 regression guard) |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | Time to First Actionable Content — same metric the `dashboard-triage` epic (`pdt-s1`–`pdt-s4`) targeted; live-verified gap evidence cited |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependency on `pdt-s1`/`pdt-s2`/`pdt-s3` (all merged, DoD-complete) — no incomplete-upstream risk |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (reuse of existing, already-tested grouping functions; precise removal/consolidation scope for `triageStripHtml` and `healthHtml`). No review ran (short-track), so no Category E findings exist to check |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent language — presence/shape assertions on server-rendered HTML strings, matching `pdt-s1`/`pdt-s2`/`pvc-s1`'s own established convention |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as pcr-s1/pst-s1/pgft-s1/psbf-s1 precedent** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction to proceed ("Yes please and perhaps we need a default module or remove that design being dependent on having a module... please do that and other suggestions as short track"). Recorded transparently, matching the identical, already-logged H-GOV gap pattern for every prior short-track story in this repo. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced — pure rendering/template change |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 19/19 (13 direct passes + 6 explicit N/A), with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case for a UI change touching several previously-independent stories' own rendering code | **Acknowledged — proceed.** Operator (Hamish King) directly diagnosed and requested this fix in-session, having personally viewed the live production gap. Bounded, well-scoped template change; all touched grouping functions are reused completely unchanged and already tested. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's Coverage gaps table is "None" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Module-less products get the full grouped/collapsed/filterable features UI, and health counts render in one place, not three — artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/stories/ppg-s1-decouple-modules-gate-and-consolidate-health-counts.md
Test plan: artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/test-plans/ppg-s1-test-plan.md
DoR contract: artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/dor/ppg-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. Two fixes in one story:
(1) _renderConsolidatedFeaturesSection's tabbed/grouped/collapsed UI
(pdt-s1) currently only renders when modules.length > 0 -- remove that
gate so it renders for every non-empty product, reusing
groupItemsByModule's/groupItemsByPhase's already-correct zero-modules
behaviour unchanged; (2) health-status counts currently render in 3
duplicate places (Overall-line breakdown, pdt-s2's own triageStripHtml,
and the uncounted health-filter chip bar) -- consolidate onto the single
chip bar (adding real counts to it) and remove the other two.

Constraints:
- Do NOT modify groupItemsByModule, groupItemsByPhase, computeHealthCounts,
  or computeOverallHealthSignal in product-rollup.js -- reuse unchanged.
- Preserve the exact existing "No features yet." empty-state message and
  its exact trigger condition (items.length === 0), regardless of
  module count.
- The By Module tab's bulk-assign bar must render ONLY when
  modules.length > 0 -- there is nothing to assign to otherwise.
- Default active tab: "By Phase" when modules.length === 0, "By Module"
  otherwise (unchanged for the modules>0 case).
- tests/check-pdt-s2-triage-summary-strip.js's own 5 tests must be
  rewritten (not just patched) to assert the new consolidated chip-bar
  behaviour -- do not leave stale assertions for the removed
  pdt-triage-strip class.
- tests/check-pdt-s3-deemphasize-unknown-health.js requires NO changes
  -- confirmed its own assertions only check the single Overall label,
  not the removed per-status breakdown. Run it to confirm, do not edit it
  unless it genuinely fails.
- No new npm dependencies.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — this story touches shared rendering code built by several previously-independent stories (`pdt-s1`, `pdt-s2`, `pvc-s1`, `a4`, `bmau-s1`), warranting tech-lead-equivalent awareness even though every underlying data function is reused unchanged. No formal named sign-off required beyond the operator's own direct review in this session.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — reviewed story, contract, test plan, NFR profile, and this DoR directly in-session, 2026-09-03
