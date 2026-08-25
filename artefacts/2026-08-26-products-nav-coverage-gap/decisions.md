# Decision Log: 2026-08-26-products-nav-coverage-gap

**Feature:** Wrap the Products-nav fetch in a shared helper and wire it to every page that's currently missing it
**Discovery reference:** None — short-track (see `CLAUDE.md` short-track flow)
**Last updated:** 2026-08-26

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-26 | ARCH | discovery/scoping (pncg-s1)**
**Decision:** Fix all 22 confirmed missing-Products-nav sites via one new shared helper (`renderShellWithNav`) rather than 22 individual copy-pasted fixes, or splitting into several smaller stories.
**Alternatives considered:** (a) Patch all 22 sites directly with no new abstraction — smaller diff per site, but leaves the underlying mistake-prone pattern (forgetting to pass `products`) fully repeatable for any future new page. (b) Split into several smaller stories by file/area — smaller PRs, easier review, but 3-4x the process overhead for one root cause. (c) Fix only the originally-reported `/org/kanban` page and track the rest as backlog.
**Rationale:** The operator explicitly chose the shared-helper approach after seeing all four options, specifically because it also makes the bug class structurally harder to reintroduce (a future new page importing `renderShellWithNav` from the start, rather than needing to remember `getProductsNavSummary` + `products`/`activeProductId`/`noProductJourneyCount` every time).
**Made by:** Hamish King (operator), explicit choice among 4 presented options.
**Revisit trigger:** If a future page is added and still forgets to use `renderShellWithNav` (i.e. reverts to calling raw `renderShell`), that's a signal the helper alone isn't sufficient — worth considering a lint rule or the structural test's manifest becoming a standing CI gate rather than a one-time story artefact.
---
**2026-08-26 | RISK-ACCEPT | definition-of-ready (pncg-s1)**
**Decision:** Proceed to the coding loop without a domain-expert (operator) read-through of pncg-s1's AC verification script before implementation begins (DoR Warning W4).
**Alternatives considered:** The operator reviewing the 4 scenarios in `artefacts/2026-08-26-products-nav-coverage-gap/verification-scripts/pncg-s1-verification.md` before sign-off — the standard W4 path, and the one explicitly recommended given this story's larger blast radius (22 pages, 10 files) compared to `fresc-s1`.
**Rationale:** Despite the larger surface area, the actual defect being fixed is mechanically simple and repeated (one missing `products` param, 22 times) and is comprehensively covered by the test plan's structural test (verifies all 22 sites, not a sample) plus a full-suite regression run and each affected page's own pre-existing test file. The operator judged this test-plan-level coverage sufficient without an additional manual pre-code read-through.
**Made by:** Hamish King (operator), explicit choice via DoR W4 prompt ("Acknowledge and proceed") after being shown the elevated-risk framing.
**Revisit trigger:** If `/verify-completion`'s post-implementation walkthrough or the post-merge smoke test surfaces anything the structural/functional test split missed, revisit whether pre-code verification-script review should be mandatory (not optional) for stories above some site/file-count threshold.
---
