## Story: Resolve each product's own repo for SaaS export, tenant-scoped

**Epic reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/epics/mtrr-e1-multi-tenant-repo-resolution-and-ux.md
**Discovery reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/discovery.md
**Benefit-metric reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/benefit-metric.md
**Domain:** [security, data] — story's scope is a tenant-scoped data-access lookup with direct cross-tenant leak risk if implemented wrong.

## User Story

As **every real SaaS operator/user other than the one hardcoded-repo owner**,
I want **the SaaS export endpoint to resolve my own product's connected repo, not a single deployment-wide repo**,
So that **I can use `--from-saas` correctly regardless of which product I'm working in, without any risk of seeing another tenant's data**.

## Benefit Linkage

**Metric moved:** Cross-tenant data isolation for the export feature; Number of distinct products that can successfully use `--from-saas`
**How:** Replacing the single global `GITHUB_REPO` lookup with a tenant-scoped, per-product lookup is the entire mechanism both metrics measure — there is no cross-tenant isolation or multi-product support without this fix.

## Architecture Constraints

- **ADR-025** (multi-tenancy enforced at the application layer) — the new lookup must use the same `tenant_id` scoping pattern already established elsewhere in this codebase (see `wuce-multi-tenancy` epic's own storage-scoping stories for the reference pattern) — it must not introduce a second, parallel isolation mechanism.
- **`product/constraints.md` #12** (credentials are structural, never in the agent's environment) — the credential remains the caller's own; no service account is introduced by this fix.
- **Reuse, not reimplementation:** `src/web-ui/adapters/export-data-source.js`'s existing `ownerRepoFromEnv()` function is being replaced by `ownerRepoForFeature(slug, credential)` — the rest of `realExportDataSource`'s logic (fetching the artefact, resolving the DoR-approved story) is unchanged.
- **No new database migration expected** (`prc-s1.1` already added the repo-association columns this lookup reads) — confirm this at implementation start; if the columns don't reliably carry the needed data, that's a real finding requiring a decision, not something to route around silently.
- **Platform-availability note (D2-platform applied):** the tenant-scoped products lookup this story needs is within this same codebase's delivery control (an existing table, existing scoping pattern) — not a wait on an external dependency.

## Dependencies

- **Upstream:** None — this replaces existing, already-merged `rb-s4` code directly.
- **Downstream:** `mtrr-s2` (repo-connection UX) reads the same products-table repo-association data, but does not depend on this story's own lookup logic to function.

## Acceptance Criteria

**AC1:** Given two different products, each with its own connected repo, When a request is made for a feature slug belonging to product A using a credential authorized for product A, Then the endpoint resolves product A's own repo (not a shared or hardcoded value) and returns product A's own artefact content.

**AC2:** Given the same two products, When a request is made for a feature slug belonging to product B using a credential authorized for product B, Then the endpoint independently resolves product B's own repo and returns product B's own content — proving the lookup is genuinely per-request and per-product, not a shared or cached resolution. This mirrors the D37 behavioural-correctness lesson from `rb-s4`: two different inputs must resolve to two different, individually-correct outputs, not merely "the new function was called."

**AC3:** Given a credential that is not authorized for the product owning the requested feature slug, When the request is made, Then the endpoint returns a 403 (matching the existing `ExportAccessDeniedError` behaviour, preserving `rb-s4`'s existing 404-vs-403 status code distinction) — but the error body must not reveal which repo, owner, or tenant the slug belongs to (no repo/owner name, no tenant identifier in the message), regardless of whether the slug exists in another tenant's repo or doesn't exist anywhere.

**AC4:** Given the fix is deployed, When the code is inspected, Then `ownerRepoFromEnv()` and any reference to the `GITHUB_REPO` environment variable are fully removed from the export path — this is a full replacement, not an additive fallback that could still resolve via the old, unscoped path under any condition.

## Out of Scope

- Supporting a product connected to more than one repo — preserves the existing one-repo-per-product model.
- Any UI/UX change to repo connection — that's `mtrr-s2`.
- Auditing other parts of the codebase for the same single-repo/env-var pattern — tracked separately (`2026-08-06-single-repo-assumption-audit`).

## NFRs

- **Security:** The tenant-scoped lookup must not allow an unauthorized credential to infer another tenant's product/repo existence via timing differences or distinguishable error responses (AC3).
- **Performance:** The lookup (a database query against the products table) adds no more than 500ms versus the previous env-var read.
- **Accessibility:** Not applicable — server-side logic only.
- **Audit:** The existing `export_fetch` audit log entry is extended to record which product was resolved for the request, in addition to the feature slug already logged.

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
