## Story: Show a product's own guardrails and standards, read live from its connected repo

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-1-repo-backed-viewing.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **tech lead viewing their product in the web UI**,
I want **to see the real, current content of `.github/architecture-guardrails.md` and the `standards/` folder from my product's connected repo**,
So that **I know what applies to my product without leaving the web UI or cloning the repo**.

## Benefit Linkage

**Metric moved:** Guardrail/standard visibility in the web UI
**How:** This story delivers the product-level half of the view the metric measures — without it, a tech lead has no way to see product-specific guardrails/standards in the web UI at all, which is the exact gap the discovery's Problem Statement names.

## Architecture Constraints

- **Reuse `wugs-s1`'s new fetch function** — this story is a consumer of the extended `artefact-fetcher.js`, not a second GitHub-API call site (ADR-012).
- **Multi-tenancy (ADR-025):** the product's `repo_owner`/`repo_name` columns (already present on the `products` table, confirmed via `products.js`'s existing `SELECT repo_owner, repo_name FROM products WHERE product_id = $1` pattern used by `handlePostProductSync`) are the source of which repo to read — no new tenant-scoping mechanism invented, reuse the existing column pair.
- **New route, existing nav pattern:** follow the same `getProductsNavSummary`/`renderShell` wiring pattern already used by `_renderProductView`/`_renderStandardsTab` (per `rapp-s2`'s own fix) — `products: navSummary.products`, `activeProductId: productId` — do not repeat the missing-nav bug this feature's own predecessor fix (`rapp-s2`) just closed.

## Dependencies

- **Upstream:** `wugs-s1` (fetch function) must be complete.
- **Downstream:** `wugs-s3` (org-level view) renders alongside this on the same page; `wugs-s4` (no-repo fallback) is the negative-path sibling of this story.

## Acceptance Criteria

**AC1:** Given a product with a connected repo containing `.github/architecture-guardrails.md`, When the guardrails/standards view is rendered, Then the real, current content of that file is displayed.

**AC2:** Given a product with a connected repo containing a `standards/` folder with entries, When the view is rendered, Then each standards entry (by discipline name) is listed, sourced from the real folder listing — not a hardcoded or cached list.

**AC3:** Given a product's connected repo has no `standards/` folder or no `architecture-guardrails.md` file, When the view is rendered, Then the product-level section shows an explicit "none found in this repo" state — not a crash, not a silently empty section indistinguishable from a loading state.

**AC4:** Given the GitHub API call fails (network error, rate limit, revoked token), When the view is rendered, Then the product-level section shows a clear error state naming the failure, and the rest of the page (nav, org-level section) still renders — a fetch failure for one section does not break the whole page.

**AC5:** Given the page renders, When inspected, Then the full products-nav sidebar is present (`getProductsNavSummary` wired) and `activeProductId` matches the current product — regression guard against the `rapp-s2`-class bug.

## Out of Scope

- **Org-level content** — `wugs-s3`'s scope.
- **Editing any displayed content** — Epic 2.
- **Caching fetched content across requests** — live read only, per `decisions.md`.

## NFRs

- **Performance:** No hard target — accept GitHub API latency as a known, logged tradeoff (see discovery.md Risk section); page must not hang indefinitely — a reasonable fetch timeout (e.g. 10s) with a clear timeout error state is expected.
- **Security:** No user-supplied content is rendered without escaping (matches `MC-SEC-01` guardrail — repo file content is untrusted external input from the tenant's own repo, must be HTML-escaped before rendering).
- **Accessibility:** Error and empty states must be conveyed via text/label, not colour alone (`MC-A11Y-02`).
- **Audit:** None — read-only view, no state-changing action.

## Complexity Rating

**Rating:** 1 — straightforward consumer of `wugs-s1`'s adapter plus the already-proven nav/render pattern.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (Medium)
