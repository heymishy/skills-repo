## Definition of Ready: Make the product page fast by caching per-feature decisions and running independent reads in parallel

**Story reference:** artefacts/2026-11-15-product-page-performance/stories/ppp-s1-product-page-performance.md
**Test plan reference:** artefacts/2026-11-15-product-page-performance/test-plans/ppp-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Track:** short

## Contract Proposal
See `artefacts/2026-11-15-product-page-performance/dor/ppp-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** One module gains a cache, one handler is reordered, and tests are added; all 8 ACs map to a named test or a named live scenario. The contract's exclusion list (page content and layout, deferred sections, sidebar query, HTML size, log changes, cross-machine cache, pre-warm, routing, parser) has zero test assertions against it, and the touched files (`decisions-reactive-source.js`, `routes/products.js`, the new test file and one added line in existing handler-driven tests) are exactly the ones the tests need (B1/D1 check: no touched file appears in the exclusion list).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied, as for the earlier short-track stories in this repo.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "a signed-in person opening a product page" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 8 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1 and T9, AC2 T2, AC3 T3, AC4 T4a and T4b, AC5 T5, AC6 T6, AC7 T7, AC8 live scenario 8 |
| H4 | Out of scope populated | ✅ | 5 exclusions |
| H5 | Benefit linkage | ✅ (short-track) | Measured 16 s page load to under 3 s |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC8 live-only, acknowledged |
| H9 | Architecture Constraints populated | ✅ | Names ADR-025 and ADR-011 |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No AC depends on CSS layout |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Security, performance, reliability and memory NFRs in the story |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | No new injectable adapter; the existing `fetchRepoPath` adapter is reused. The test seams (`_setClock`, `_setCacheConfig`) default to real implementations, not to throwing stubs, because they are not adapters to external systems |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI markup changes; `hasDesignSystemTrack` not set |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3 | ✅ | |
| W4 | ⚠️ Pending operator | Verification script scenario 8 needs the operator's approval for a read-only production timing |
| W5 | ⚠️ Accepted | The first page view after each deploy stays slow (cold cache, about the concurrency-16 cold time); recorded in the test plan; AC8 measures the second and later loads |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first.

## Oversight level
**Low** - an in-memory read cache and a reordering of independent reads; no data writes, no schema change. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-15-product-page-performance/stories/ppp-s1-product-page-performance.md
Test plan: artefacts/2026-11-15-product-page-performance/test-plans/ppp-s1-test-plan.md
Contract: artefacts/2026-11-15-product-page-performance/dor/ppp-s1-dor-contract.md
Goal: write tests/check-ppp-s1-decisions-cache.js (T1 to T9) first and confirm every test FAILS for the right reason (the cached function and the seams do not exist; the handler reads sequentially); then implement the cache and the Promise.all reordering. No scope beyond the 8 ACs.
Constraints:
- Do not change the parser or the existing uncached functions' behaviour; add the cached function beside them. The handler switches to the cached function.
- Cache key is owner/repo/slug; never the token; never store the token. Failed fetches are never cached; a failed refresh keeps the stale value. Not-found is cached as empty.
- Before parallelising in handleGetProductView, re-read the handler and keep sequential any read that depends on a previous one (name it in the plan). Each read keeps its current try/catch and fallback value; the rendered HTML must be identical for the same data.
- Existing handler-driven tests that reuse a slug with different mocks get one added _clearDecisionsCache() line per scenario and nothing else.
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first. No new npm dependencies.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges; no production deploy.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No; W4 and W5 advisory.
