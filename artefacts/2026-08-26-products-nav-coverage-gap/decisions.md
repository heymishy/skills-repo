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
**2026-08-26 | ARCH | subagent-execution (pncg-s1, Task 4)**
**Decision:** For `settings.js`'s `/settings` page, add two new OPTIONAL trailing fields to the existing `renderSettingsPage(opts)` function's `opts` object — `opts.navProducts` and `opts.noProductJourneyCount` — and forward them straight into its own `_htmlShell.renderShell()` call as `products`/`noProductJourneyCount`. `renderSettingsPage()` stays a single, synchronous, unsplit function, exactly as it was before this story touched it. The real `GET /settings` handler (`handleGetSettings`) now calls `getProductsNavSummary(pool, tenantId)` itself, then calls `renderSettingsPage()` with the same options object it already builds, plus `navProducts: navSummary.products` and `noProductJourneyCount: navSummary.noProductJourneyCount`. `handleGetSettings` no longer imports or calls `renderShellWithNav`.
**Alternatives considered:** (a) [FIRST ATTEMPT, REVERTED] Split `renderSettingsPage(opts)` into a new body-only `_buildSettingsBody(opts)` helper plus an unchanged `renderSettingsPage(opts)`, with `handleGetSettings` calling `_buildSettingsBody()` + `await renderShellWithNav(pool, tenantId, {...})` itself. This was the first version implemented and committed, and its decisions.md entry (this entry, as originally written) incorrectly claimed it followed this same story's Task 2 precedent. It does not: Task 2 (`products.js`'s `_renderRoadmapTab`/`_renderGuardrailsForm`/`_renderProductNew`) never split any function — it only added `navProducts`/`noProductJourneyCount` as new optional trailing parameters to the existing render functions, with the calling handler fetching `getProductsNavSummary` and passing the results straight in. A code-quality review caught the mismatch and found the split unnecessarily complex: it left `_buildSettingsBody` as a second exported-shape function that exists solely to be called from exactly one place, and left `handleGetSettings` building its own separate, duplicated options object for the `renderShellWithNav()` call rather than reusing the one already built for the body. (b) Make `renderSettingsPage()` itself `async` and swap its own `renderShell()` call for `renderShellWithNav()`. Rejected for the same reason it was rejected the first time this decision was made: many pre-existing unit tests call `renderSettingsPage()` directly and synchronously, and `check-npwe-s1-skills-nav-wiring.js`'s IT2.2/IT2.3 explicitly assert its output has NO Products section when called without the new params — an async signature change would break that contract's shape even before considering the assertion content.
**Rationale:** Parameter-threading (the option finally chosen) preserves the exact same "existing call sites get `undefined` and see no Products section" behaviour as the reverted split, via `html-shell.js`'s existing `if (!products) return '';` guard in `renderProductsSection` — but with no new function, no duplicated options object, and a data-fetch pattern (`getProductsNavSummary` called directly in the handler, passed straight into the render function) that is now identical in shape to Task 2's three call sites, not just described as such.
**Made by:** Claude (agent) implemented the first attempt during Task 4; a code-quality review (agent-run, requested by the operator) identified the precedent mismatch and unnecessary complexity; Claude (agent) then implemented this replacement during the review-driven refactor — a scoped technical correction, not escalated to the operator, since it is a mechanical refactor with no behavioural change to any existing tested contract.
**Revisit trigger:** If a future story needs `renderSettingsPage()`'s Products-nav data fetched somewhere other than directly inside `handleGetSettings` (e.g. a second real caller that also needs the sidebar), reconsider whether parameter-threading is still sufficient or whether a shared fetch-and-render wrapper (mirroring `renderShellWithNav`) is worth introducing for `settings.js` specifically at that point.
---
