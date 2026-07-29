# Definition of Ready Checklist

## Definition of Ready: List products directly in the sidebar; remove the redundant "Run a Skill" and "Journeys" nav items

**Story reference:** artefacts/2026-07-30-product-aware-navigation/stories/pan-s1-product-aware-navigation.md
**Test plan reference:** artefacts/2026-07-30-product-aware-navigation/test-plans/pan-s1-product-aware-navigation-test-plan.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-30

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Operator-identified navigation friction, validated via an approved design mockup |
| H6 | Complexity is rated | ✅ | Rating 3, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review by design |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Extends existing `renderShell`/`renderSidebar`, reuses `handleGetDashboard`'s existing query, explicit bounded-scope decision (3 of ~63 call sites) |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | All ACs are DOM-structure/content assertions, not visual-layout claims |
| H-NFR | NFR profile exists | ✅ N/A short-track | NFRs stated directly in story |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Product names/journey counts — tenant-scoped, already-visible data, not new PII exposure |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry** | No discovery artefact — short-track skips /discovery by design; scope validated via approved mockup instead |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced — this is a pure rendering/query-shape change |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set — no schema change, reuses existing `products`/`journeys` columns |

**All hard blocks pass — with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable — validated via approved mockup before this DoR | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No /review run (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Solo-operator posture, same basis as prior short-track stories this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's one gap (exhaustive testing of ~60 unwired call sites) has an explicit, reasoned mitigation (representative snapshot test) | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: List products directly in the sidebar; remove the redundant "Run a Skill" and "Journeys" nav items — artefacts/2026-07-30-product-aware-navigation/stories/pan-s1-product-aware-navigation.md
Test plan: artefacts/2026-07-30-product-aware-navigation/test-plans/pan-s1-product-aware-navigation-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. Do NOT wire the new
`products` parameter into any renderShell call site beyond the 3 named
below -- this is a deliberate, tested scope boundary (AC5/IT3), not an
oversight to "helpfully" fix while in the file.

Constraints:
- Read src/web-ui/utils/html-shell.js, src/web-ui/routes/products.js
  (handleGetDashboard, handleGetProductView), and src/web-ui/routes/journey.js
  (handleGetJourney) in full before writing anything.
- Extend renderShell(opts) with new optional keys: opts.products
  (Array<{productId, name, journeyCount}>), opts.activeProductId (string),
  opts.noProductJourneyCount (number). Thread these into renderSidebar's
  signature as new trailing optional parameters. When products is omitted
  (every existing call site except the 3 below), renderSidebar's output
  must be BYTE-FOR-BYTE unchanged from before this story (IT3).
- Remove the `skills` and `journey` entries from NAV_ITEMS entirely. Do
  NOT delete the /skills or /journey routes themselves in server.js --
  only their NAV_ITEMS entries.
- Extract handleGetDashboard's existing products query (SELECT product_id,
  name, created_at FROM products WHERE tenant_id = $1, plus its existing
  per-product journey-count computation) into a small shared helper
  function (e.g. in a new or existing adapter/module file -- your choice
  of location, following this repo's existing module-organisation
  conventions). handleGetDashboard, handleGetProductView, and
  handleGetJourney each call this shared helper to populate
  opts.products/opts.activeProductId/opts.noProductJourneyCount.
- handleGetJourney's own journeys query changes from "all journeys for
  this tenant" to "journeys for this tenant WHERE product_id IS NULL" (or
  the equivalent in-memory filter, matching however journeys are
  currently stored/queried in that handler) -- AC4. The "start a new
  feature" form on this page is UNCHANGED (still creates a no-product
  journey) -- do not add a product picker (explicitly out of scope).
- Write a new test file (e.g. tests/check-pan-s1-product-aware-navigation.js)
  covering U1-U7 and IT1-IT4 exactly as described in the test plan.
- Open a draft PR when tests pass -- do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — touches a shared, widely-used rendering function (`renderShell`/`renderSidebar`, ~63 call sites total) and changes the default navigation experience for every user; the deliberate 3-of-63 wiring boundary is the main risk to verify carefully, not the individual page changes themselves.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King — Platform owner — approved the design mockup directly, 2026-07-30
