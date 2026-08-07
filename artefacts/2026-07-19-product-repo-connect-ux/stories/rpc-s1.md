# Story: Give every product a UI path to connect or create a GitHub repo

**Epic reference:** None — short-track (bounded UX gap fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the live gap found during staging verification of the product-rollup epic
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an operator who has just created a new product**,
I want **a visible way, on the product's own page, to connect an existing GitHub repo or create a new one**,
So that **the product can actually be synced (product-rollup epic) instead of being permanently stuck at "Not yet synced" with no path forward**.

## Benefit Linkage

**Metric moved:** Product-rollup's own Metric 1 (product shape visible in the web UI) and Metric 2 (freshness visible and refreshable) — both are structurally unreachable for any manually-created product today, since there is no way to give it a repo to sync from.
**How:** `handlePostProductRepoCreate` (create a brand-new GitHub repo, `POST /products/:id/repo/create`) and the repo-editing path in `handlePutProductEdit` both exist and are wired to real routes, fully functional at the API level — confirmed via direct code read of `src/web-ui/routes/products.js`. Neither is reachable from any UI element on the product page. This story closes the gap between working backend and unreachable frontend, discovered live on `wuce-staging` on 2026-07-19 when a manually-created product had no path to a repo at all.

## Architecture Constraints

- Reuses `handlePostProductRepoCreate` and `handlePutProductEdit`'s existing repo-association logic exactly as-is — this story is additive UI only, no change to either handler's own behaviour.
- `_renderProductView` (`src/web-ui/routes/products.js:104`) is the function to extend — it already renders "Delete product," "Kanban," and "New feature" as buttons/links/forms in the same header area; the new repo-connect affordance should follow the same visual/markup pattern.
- MC-SEC-01 (`.github/architecture-guardrails.md`): any new form/button must use safe DOM/templating, consistent with the rest of this file's existing `_escapeHtml` usage — no raw interpolation of user-supplied repo owner/name values.

## Dependencies

- **Upstream:** None — the backend handlers this story surfaces already exist and are merged.
- **Downstream:** Every product-rollup story (pr-s1 through pr-s7) becomes actually usable end-to-end for manually-created products once this ships — today they only work for the one self-registered skills-framework product.

## Acceptance Criteria

**AC1:** Given a product with no connected repo, When the operator views that product's page, Then a visible "Connect repo" (or equivalent) affordance is present — not just for products created via the repo-creation flow, every product without a repo shows this.

**AC2:** Given the operator clicks "Connect repo" and chooses to create a new GitHub repo, When they submit, Then the request reaches the existing `handlePostProductRepoCreate` handler and the product's page subsequently shows the newly created repo's owner/name — no new backend logic, this call already works when reached directly.

**AC3:** Given the operator clicks "Connect repo" and chooses to connect an existing repo (owner + name), When they submit, Then the request reaches the existing repo-association path in `handlePutProductEdit` and the product's page subsequently shows the connected repo.

**AC4:** Given a product already has a connected repo, When the operator views that product's page, Then the repo-connect affordance is replaced by the repo's own name/owner display (and, if edit is supported by the existing handler, a way to change it) — never shown alongside a redundant "connect" prompt once already connected.

## Out of Scope

- Any change to `handlePostProductRepoCreate` or `handlePutProductEdit`'s own logic — reused exactly as-is.
- Repo disconnection (removing a repo association without deleting the whole product) — not covered by any existing handler; a separate story if wanted.
- Validating that a connected repo actually contains a `pipeline-state.json` before allowing the connection — that's product-rollup's own sync-time validation (pr-s2 AC3), not a pre-condition to enforce here.

## NFRs

- **Performance:** Not applicable — a UI addition calling already-existing handlers.
- **Security:** MC-SEC-01 — safe templating for any repo owner/name value rendered back to the page (untrusted user input).
- **Accessibility:** New form controls must be keyboard-accessible and properly labelled, matching this codebase's existing accessibility mandatory constraint.
- **Audit:** Not applicable beyond what `handlePostProductRepoCreate`/`handlePutProductEdit` already log.

## Complexity Rating

**Rating:** 2 — the backend logic is done and confirmed working; the remaining work is UI/form design and correctly wiring two distinct paths (create-new vs. connect-existing) into one coherent affordance without duplicating logic.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
