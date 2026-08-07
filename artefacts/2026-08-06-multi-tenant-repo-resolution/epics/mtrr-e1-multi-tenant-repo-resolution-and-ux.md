## Epic: Every operator's own connected repo resolves correctly, and connecting one is a picker, not a URL field

**Discovery reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/discovery.md
**Benefit-metric reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/benefit-metric.md
**Slicing strategy:** Risk-first

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    EXPORT[routes/export.js\\n(existing, rb-s4)]\n    OLDENV[ownerRepoFromEnv()\\n(existing, GITHUB_REPO env var)]\n    NEWLOOKUP[ownerRepoForFeature(slug, credential)\\n(new, mtrr-s1)]\n    PRODUCTS[(products table\\nowner/repo columns, prc-s1.1)]\n    TENANT[tenant_id scoping\\n(ADR-025, existing)]\n    PICKER[Repo-connection picker UI\\n(new, mtrr-s2)]\n    GHAPI[GitHub API\\nlist accessible repos]\n    URLFALLBACK[URL-entry fallback\\n(existing, prc-s1.x)]\n    EXPORT --> OLDENV\n    OLDENV -.removed.-> NEWLOOKUP\n    NEWLOOKUP --> PRODUCTS\n    NEWLOOKUP --> TENANT\n    EXPORT --> NEWLOOKUP\n    PICKER --> GHAPI\n    PICKER --> PRODUCTS\n    PICKER -.fallback.-> URLFALLBACK"}}---

## Goal

A request for any product's feature slug resolves that product's own connected repo — never a single hardcoded deployment-wide repo, never another tenant's data — regardless of how many products or tenants exist. Separately, connecting a product to a repo becomes a guided pick-from-your-own-repos flow instead of a bare URL field, with a safe fallback if repo-listing isn't available.

## Out of Scope

- **Supporting a product connected to more than one repo** — preserves the existing one-repo-per-product model exactly.
- **A full audit of other single-repo/env-var assumptions elsewhere in the codebase** — tracked separately as its own discovery-stage stub (`2026-08-06-single-repo-assumption-audit`), not part of this epic's story budget.
- **Building a new repo-creation flow** — `prc-s2.1` already handles creating a new GitHub repo from product creation; this epic only changes how an *existing* repo is *connected/selected*.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Cross-tenant data isolation | Real risk today, unguarded | Zero leaks, CI-enforced | mtrr-s1 replaces the single-repo resolution with a tenant-scoped per-product lookup |
| Distinct products supported | 1 | All connected products | mtrr-s1's lookup works per-product, not per-deployment |
| Repo-connection setup experience | Bare URL field | Pick from accessible repos | mtrr-s2 replaces the URL field with a picker |

## Stories in This Epic

- [ ] mtrr-s1: Resolve each product's own repo for SaaS export, tenant-scoped — artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s1-tenant-scoped-repo-resolution.md
- [ ] mtrr-s2: Connect a repo by picking from your own accessible repos — artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s2-repo-connection-picker.md

## Human Oversight Level

**Oversight:** High
**Rationale:** `mtrr-s1` is a security/data-isolation fix touching an existing production code path with real cross-tenant leak risk if done wrong — this needs human sign-off before merge, not autonomous agent judgment alone. `mtrr-s2` (UI/UX) can proceed at Medium oversight once `mtrr-s1` sets the precedent, but the epic-level default is High given the security-sensitive story it contains.

## Complexity Rating

**Rating:** 3

<!-- High ambiguity: real security-fix risk, multi-tenancy scoping correctness, and 3 open [ASSUMPTION] lines from discovery not yet resolved via /clarify. -->

## Scope Stability

**Stability:** Unstable

<!-- Depends on resolving the 3 open discovery assumptions (products-table data quality, feature-to-product traceability, GitHub API scope sufficiency) before implementation can be fully bounded. -->
