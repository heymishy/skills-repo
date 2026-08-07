# Discovery: Multi-Tenant Repo Resolution for SaaS Export + Repo-Connection UX

**Status:** Approved
**Created:** 2026-08-06
**Approved by:** Hamish King — Platform maintainer — 2026-08-06
**Author:** Human (Hamish King), scoped conversationally with Claude Code

---

## Problem Statement

The SaaS export endpoint (`src/web-ui/adapters/export-data-source.js`) resolves which GitHub repo to read a feature's artefact + pipeline-state from via a single server-side `GITHUB_REPO` environment variable — one repo, fixed at deployment time. This breaks down for the SaaS's actual expected shape: it's a multi-tenant app, and this SaaS's own product-repo-config capability (`prc-s1.x`/`prc-s2.x`) means any operator running more than one product has, by design, one distinct connected GitHub repo per product — never a shared repo across products. So any multi-product operator (which, given the platform's own multi-tenant design, is the typical case, not an edge case) hits this the moment they try `--from-saas` against any product other than whichever one repo happens to be in `GITHUB_REPO`. Today there's no error message hinting this is the cause — it either looks like the feature slug doesn't exist, or, worse, silently returns a different product's data if the slug happens to collide across repos.

## Who It Affects

Effectively every real operator/user of the SaaS other than whoever's repo happens to be hardcoded into the single deployment-wide `GITHUB_REPO` value. Since that's one fixed repo across the entire deployment, no external tenant's product repo will ever match it — this isn't "gets worse once you have multiple products," it's the baseline case for literally any real customer: `--from-saas` only ever works for the one repo the deployment operator happened to configure (in practice, likely their own dev/test repo), and fails or misbehaves for every other tenant's product from the very first attempt.

## Why Now

This gap was just found during post-delivery review of `rb-s4`, immediately after merge and before any real external tenant has used `--from-saas` in production — the cheapest possible moment to fix it. It's also urgent given this SaaS is on the pre-launch beta path (per `product/roadmap.md`'s "Commercialisation track — wuce SaaS beta path," no live paying customers yet): shipping beta access with this gap live means the first real multi-product customer to try this feature either gets a confusing failure, or — worse — silently receives another tenant's data if feature slugs happen to collide across repos. Given this platform's own existing multi-tenancy work (`ADR-025`, the `wuce-multi-tenancy` epic) treats cross-tenant data isolation as a hard requirement elsewhere in the same codebase, this is really a data-isolation defect hiding inside a brand-new feature, not just a rough edge — worth closing before beta traffic exists, not after.

## MVP Scope

Replace the single global `GITHUB_REPO` env var with a per-request lookup: given a feature slug, resolve which product owns it, then read that product's own connected repo (owner/repo, from `prc-s1.1`'s repo-association columns), scoped by the caller's credential/authorized access. Additionally, since this touches the same product-repo-connection data, improve that connection UI/UX — today it's a bare form that just asks for a repo URL; this is the natural moment to make it a proper guided flow (e.g. list the operator's own accessible repos via their GitHub credential, confirm/create, show connection status clearly) rather than a raw URL field.

The smallest version of the resolution fix: the export endpoint's `ownerRepoFromEnv()` is replaced with `ownerRepoForFeature(slug, credential)`, doing a tenant-scoped products-table lookup instead of reading an env var. No change to the CLI's own interface (`--from-saas <slug>` stays exactly as-is) — that part of the fix is entirely server-side.

## Out of Scope

- **Supporting a product connected to more than one repo** — out of scope; preserves the existing one-repo-per-product model exactly.
- **Changing the CLI's own `--from-saas <slug>` interface** — the resolution fix is server-side; no new flag or argument is added.
- **A full audit of the rest of the codebase for other single-repo/env-var assumptions** — explicitly out of scope for this initiative, but not silently dropped: logged as a distinct future story reference (see State update below) so it's tracked rather than lost.

## Assumptions and Risks

**Assumptions:**
- [ASSUMPTION] The products table's owner/repo columns (from `prc-s1.1`) are reliably populated for every product that has a connected repo — unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] Every feature slug in `pipeline-state.json` can be reliably traced back to a specific owning product (a stable product/tenant association exists for all features, including older ones predating the multi-tenancy retrofit) — unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] Listing an operator's own accessible repos via their GitHub credential (for the improved connection UI) works within existing OAuth scopes already granted at login, without needing a new consent/re-auth step — unconfirmed, requires /clarify before scope is locked.

**Risks — what could make this not worth building:**
- If real customer usage stays overwhelmingly single-product-per-tenant, the urgency argument (every non-hardcoded-repo operator is affected) may be more theoretical than practical until multi-product adoption actually happens — worth validating against real beta usage once available, not just the design-level argument.
- If the repo-connection UI/UX improvement scope grows large enough to meaningfully delay the underlying data-isolation fix, the two should be sequenced (resolution-logic fix first, UX polish second) rather than let UX work block closing a real security gap.

## Directional Success Indicators

1. **Cross-tenant data isolation for the export feature.** Baseline: real risk today — a slug collision across repos can return another tenant's data (no test currently guards this). Target: zero cross-tenant leaks, enforced by a dedicated isolation test matching this platform's existing pattern (the `wuce-multi-tenancy` "Cross-tenant isolation spec — 20x repeat, zero-tolerance" CI check). Measured via: that CI check passing on every PR touching this endpoint, permanently.
2. **Number of distinct products that can successfully use `--from-saas`.** Baseline: 1 (only whichever repo is hardcoded in `GITHUB_REPO`). Target: every product with a connected repo works correctly, regardless of count. Measured via: a test asserting at least 2 distinct products' repos resolve correctly and independently.
3. **Repo-connection setup experience.** Baseline: `[UNKNOWN BASELINE]` — no current measurement exists for the bare URL-field flow; qualitative baseline is "asks for a raw URL, no guidance." Target: an operator can connect a repo by picking from their own accessible repos (via GitHub credential) rather than needing to know/paste a URL. Measured via: a UX walkthrough confirming the new flow requires no external documentation to complete.

## Constraints

- **`product/constraints.md` #12** (credentials are structural, never in the agent's environment) — the per-request repo resolution still uses the caller's own GitHub credential, not a service account; no change to this existing rule.
- **ADR-025** (multi-tenancy enforced at the application layer) — the new product→repo lookup must respect existing `tenant_id` scoping; it must not introduce a second, parallel isolation mechanism.
- **No new database migration expected** — `prc-s1.1` already added the repo-association columns this fix reads from; this should be query-logic-only, not a schema change. Flag at /definition if that assumption turns out wrong.
- **GitHub API rate limits** — the improved repo-connection UI (listing an operator's own accessible repos) must be mindful of GitHub's API rate limits, especially if it lists repos on every page load rather than caching.

## Contributors

- Hamish King — Platform maintainer / Product owner

## Reviewers

- (none — approved without separate review pass)

## Approved By

Hamish King — Platform maintainer — 2026-08-06

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- The products table's owner/repo columns (from `prc-s1.1`) are reliably populated for every product that has a connected repo — unconfirmed, requires /clarify before scope is locked.
- Every feature slug in `pipeline-state.json` can be reliably traced back to a specific owning product (a stable product/tenant association exists for all features, including older ones predating the multi-tenancy retrofit) — unconfirmed, requires /clarify before scope is locked.
- Listing an operator's own accessible repos via their GitHub credential (for the improved connection UI) works within existing OAuth scopes already granted at login, without needing a new consent/re-auth step — unconfirmed, requires /clarify before scope is locked.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

**Next step:** Human review and approval → /benefit-metric
