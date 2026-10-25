# Review Report: Dashboard-shell UX/CX parity and scope/benefit summary — Run 1

**Story reference:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s6-dashboard-shell-parity.md`
**Date:** 2026-10-26
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** Category E (Architecture compliance) — AC1 and the Architecture Constraints section both direct the implementation to wrap the page using `_htmlShell.renderShell` directly: "Reuse `_htmlShell.renderShell` exactly as every other authenticated page does... confirmed by its use across `products.js`, `settings.js`, kanban board rendering" (Architecture Constraints, line 31) and AC1's own text, "it is wrapped in the same `_htmlShell.renderShell` dashboard shell as every other authenticated page in the product" (line 43). This claim is factually incorrect and, if implemented as literally written, reproduces a documented, three-times-recurring defect in this exact codebase. `html-shell.js` exports only the low-level `renderShell(opts)` (confirmed: `module.exports = { renderShell, renderLoginPage, escHtml, NAV_ITEMS, renderThemeToggle }`) — it has no nav-aware variant. `products.js` and `settings.js` do NOT call `renderShell()` directly; they call `renderShellWithNav(pool, tenantId, opts)`, which fetches `getProductsNavSummary()` and merges `products`/`activeProductId`/`noProductJourneyCount` into `opts` before delegating to `renderShell()`. `/playback` (`playback.js`), this story's own named reference implementation, confirms the same thing directly — it imports `renderShellWithNav` from `./products` (line 21) and calls it, not `renderShell` (lines 185, 204). Per `.github/standards/web-ui/web-ui-patterns.md` ("Every renderShell() caller MUST supply the Products-nav sidebar data — this is the single most common web-ui defect in this repo"), `renderShell()`'s sidebar sub-renderer has a hard early return that silently drops the entire Products sidebar when `products`/`activeProductId`/`noProductJourneyCount` are omitted — confirmed to have recurred independently 3 times (`bvnd-s1`, `pan-s1`, `pncg-s1`, the last a 22-site/10-file repo-wide defect).
  Fix: Change AC1 and the Architecture Constraints bullet to require `renderShellWithNav(pool, req.session.tenantId, opts)` (imported from `src/web-ui/routes/products.js`), not `_htmlShell.renderShell` directly — matching what `products.js`, `settings.js`, and `/playback` actually do, not what this story currently claims they do.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category E (Architecture compliance) — AC2 requires the Scope/Benefit summary content (the tenant's own `discovery.md`/`benefit-metric.md`, fetched via `fetchArtefact`) to render on the page, but neither AC2 nor the Architecture Constraints section requires that content to pass through `escHtml()` before injection. This is an applicable mandatory constraint that exists but isn't referenced: `architecture-guardrails.md`'s Mandatory Constraints (Security) states "No user-supplied content is ever injected into innerHTML without sanitisation" (registry id `MC-SEC-01`), and `web-ui-patterns.md` states `escHtml()` "MUST be applied to every user-supplied or model-supplied string before injecting it into an HTML response body." Reused functions `extractMarkdownSection`/`parseBenefitMetricTargets` do NOT escape internally — confirmed in `playback.js`, where `escHtml()` is applied at the render call site itself (e.g. line 125: `` `<p>${escHtml(problemStatement || 'No problem statement on file.')}</p>` ``), not inside the extraction functions. AC2 says this story "mirrors `/playback`'s own summary layout" but doesn't make the escaping requirement an explicit, testable part of that mirroring — a tenant's own repo content (arbitrary text, not guaranteed free of HTML-like sequences) could otherwise be injected unescaped.
  Risk if proceeding: An implementer reusing only the extraction functions (not the full render call-site pattern) could render tenant-repo content into the page without escaping it, an XSS exposure through the summary section.
  To acknowledge: run /decisions, category RISK-ACCEPT — or add an explicit escaping requirement to AC2/Architecture Constraints before `/test-plan`.

---

## LOW findings — note for retrospective

None.

---

## Summary

1 HIGH, 1 MEDIUM, 0 LOW.
**Outcome:** FAIL

### Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance (E) | 2 | FAIL |

**Traceability:** References epic, discovery, and benefit-metric correctly. "So that" clause ties to the PO's own sign-off orientation, and Benefit Linkage quotes `benefit-metric.md`'s own Metric 3 feedback-loop language verbatim rather than describing a feature in isolation. Metric Coverage Matrix lists `ppc-s6` against m1/m3.

**Scope integrity:** `ppc-s6` was not in `discovery.md`'s own named Out-of-Scope list — correctly flagged and logged as a scope note in `decisions.md` (2026-10-25 SCOPE entry), citing the operator's direct chat instruction as the scope-guard confirmation per `/definition`'s own protocol. Out-of-scope section names four real, specific exclusions, not "N/A".

**AC quality:** All 5 ACs are Given/When/Then, independently testable, minimum-3 satisfied, and the empty/missing-artefact edge case has its own AC (AC4, itself tightened by the CX/UX spike to require naming the specific missing artefact). Scored 4, not 5, because AC1's own implementation-level naming is not just a style choice here — it names the specific function incorrectly (see 1-H1), which is a quality issue in the AC's own precision, not only an architecture-compliance issue.

**Completeness:** Named persona, benefit linkage, out-of-scope, NFRs, complexity (1), and scope stability (Stable) are all populated and specific.

**Architecture compliance:** Scored 2 (FAIL) due to 1-H1 — the AC itself requires implementation that violates the mandatory `renderShellWithNav` pattern documented in `web-ui-patterns.md`, with a confirmed three-times-recurring real defect history in this exact codebase. 1-M1 (escHtml not referenced for AC2's rendered content) is a contributing factor but would not alone drop the score below 3.
