## Definition of Ready: Add a products list page so "See all products" shows all products

**Story reference:** artefacts/2026-11-15-products-list-page/stories/pls-s1-products-list-page.md
**Test plan reference:** artefacts/2026-11-15-products-list-page/test-plans/pls-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Track:** short

## Contract Proposal
See `artefacts/2026-11-15-products-list-page/dor/pls-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** A new handler, one route, a link change in the shared shell, and tests; all 7 ACs map to a named test or a named live scenario. The contract's exclusion list (dashboard, toggles' targets, product page, creation, plan limits, new SQL, repair of other pages) has zero test assertions against it, and the touched files (products.js, server.js, html-shell.js and the two test files) are exactly the ones the tests need (B1/D1 check: no touched file appears in the exclusion list).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied, as for the earlier short-track stories in this repo.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "a signed-in person with one or more products" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 7 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T5, AC5 T8, AC6 T6, AC7 live scenario 7 |
| H4 | Out of scope populated | ✅ | 4 exclusions |
| H5 | Benefit linkage | ✅ (short-track) | Closes a navigation gap: no page lists all products |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC7 live-only, acknowledged |
| H9 | Architecture Constraints populated | ✅ | Names ADR-025 and ADR-011 |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No AC depends on CSS layout (see test plan) |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | NFRs in the story (security, performance, accessibility) |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | None introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (skipped, with a recorded decision) | `hasDesignSystemTrack` is not set on this story's state entry, so the gate does not fire. Reason (decisions.md, 2026-11-15): the gate scans whole files and `html-shell.js` already holds 7 pre-existing non-token hex colours, so it would block any change to that file for a reason this change does not touch. The substance is kept by test T7 (no hex colours in the new markup) and by using only CSS variables |

**Hard blocks: 19/19 passed** (2 vacuous, 1 skipped by a recorded decision).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3 | ✅ | |
| W4 | ⚠️ Pending operator | Verification script not yet walked by a human |
| W5 | ⚠️ Pending operator | The page's look is not machine-checked (no CSS-layout AC); the operator's live check AC7 is the look-and-feel confirmation. Also: other pages that call the shell without the product list still hide the Products section (separate follow-up) |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first, in particular the rule that every full-page handler renders through `renderShellWithNav`.

## Oversight level
**Low** - a read-only list page reusing an existing tenant-scoped helper; no data writes. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-15-products-list-page/stories/pls-s1-products-list-page.md
Test plan: artefacts/2026-11-15-products-list-page/test-plans/pls-s1-test-plan.md
Contract: artefacts/2026-11-15-products-list-page/dor/pls-s1-dor-contract.md
Goal: write tests/check-pls-s1-products-list-page.js (T1 to T8) and edit the two assertions in tests/check-jcn-s1-journey-page-nav-products.js first; confirm T1, T2, T3, T4, T5, T6, T7 and T8 FAIL (the handler and route do not exist, the link points at /dashboard) and the edited jcn-s1 assertions fail; then implement. No scope beyond the 7 ACs.
Constraints:
- Use getProductsNavSummary and renderShellWithNav; write NO new SQL. Escape names with the file's existing _escapeHtml. Use only CSS variables in the new markup (no hex colours).
- Change html-shell.js only in renderSeeAllProductsRow and the one call that passes `active` to it; do not touch the file's colours or anything else.
- Register the route in server.js next to /products/new, wrapped in authGuard, using the same _pshPool convention.
- The only existing test changes are the two jcn-s1 assertions named in the test plan.
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first. No new npm dependencies. ASCII only for new code (the repo files already contain arrows and dashes in strings; add no new non-ASCII beyond the existing arrow glyph used by the sibling links).
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges; no production deploy.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No; W4 and W5 advisory.