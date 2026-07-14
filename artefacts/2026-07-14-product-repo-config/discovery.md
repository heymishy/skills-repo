# Discovery: Per-Product Git Repo Configuration and Management

**Status:** Draft — awaiting approval
**Created:** 2026-07-14
**Approved by:** [Name + date — filled in after human review]
**Author:** Claude (agent), with Hamish King (Founder/Operator)

---

## Problem Statement

Every tenant (an individual, team, or org) already owns its own set of products in `wuce`'s data model — but a product has no concept of *where its work lives*. Outer-loop skill runs write artefacts into one server-wide location: either an ephemeral local path shared across every tenant and product, or (for sign-off/annotation) a single hardcoded GitHub repo shared by everyone. There's no way for a product to declare its own Git location, starting with GitHub — no create/clone/configure flow, and product creation today only writes AI-generated context text into Postgres columns with no git backing at all. A product's outer-loop artefacts and its skills framework (SKILL.md sidecar, pipeline-state.json, standards) belong together in one repo — mirroring how this very skills-repo is structured. Multiple repos become relevant on the inner-loop, code side instead: a larger product's actual codebase may already be split across several repos (frontend/backend/services), and a coding agent working the inner loop would need to operate across those — a separate, later problem from the immediate gap, which is that a product has zero repos of any kind today. The real reason this needs to be git-tracked rather than DB rows: it's what lets a web-UI operator and an engineer running an IDE or coding agent pair — both working off the exact same artefact set in the exact same repo, syncing state through ordinary git rather than a bespoke export/import step. Today that pairing is impossible; the operator's outer-loop work in `wuce` and an engineer's inner-loop work in a real repo have no shared ground truth.

## Who It Affects

**Primary persona A: Web UI operator running the outer loop.** Works entirely in `wuce`'s browser UI, against a product that's already configured with its own repo. Runs discovery through DoR there, producing artefacts that land as real commits in that product's repo — not DB rows, not an ephemeral local path.

**Primary persona B: Engineer actively pairing from a different surface.** Working the same repo concurrently, not sequentially — reviewing, commenting on, or refining artefacts from an IDE or coding agent surface (Claude Code, Copilot, etc.) while persona A is still working in the browser, both seeing the same git state in real time rather than one waiting for the other to finish and hand off.

**Secondary persona: Tenant admin configuring a new product.** Whoever creates a product needs to point it at a GitHub repo (new or existing) before persona A or B can do anything — today this step doesn't exist at all.

## Why Now

This session just pushed `team-identity-roles` and most of `beta-readiness-infra` to DoD-complete — `wuce` itself is maturing toward real beta readiness. But every outer-loop run that produced this work happened via Claude Code directly against this skills-repo checkout — `wuce`'s own web UI has never actually been used to run its own pipeline, despite being the product whose entire purpose is running exactly this pipeline for other teams. That's the trigger: before pushing `wuce` toward real customers, prove the workflow it's meant to sell actually works by dogfooding it on the platform's own repo — outer loop in the browser, inner loop in an IDE/coding agent, both against the same git history. Today that's not possible even for the operator's own use, let alone a future customer's.

## MVP Scope

1. **Product ↔ repo association.** A product gains a git repo reference (provider, owner, name — GitHub only for MVP). One repo per product for now.
2. **Repo configuration flow.** When creating (or later editing) a product, the operator either creates a new GitHub repo or connects an existing one they already have — using their own OAuth token, matching the existing ADR-020 identity pattern (never a service account).
3. **New-repo bootstrap.** A freshly created repo gets seeded with the skills framework using the tooling that already exists for this (`scripts/platform-init.js`'s flat-copy, or the ADR-014 sidecar model) — so it looks like a working pipeline installation from the first commit, the same shape as this skills-repo.
4. **Standards become real git-tracked files in the product repo**, not DB-only rows — the inner-loop coding agent needs to reference them directly during implementation, and an engineer needs to review and contribute to them from an IDE surface, same as any other file in the repo.
5. **Route existing write paths to the product's repo.** Both the local artefact-write path (`journey.js`) and the existing GitHub Contents API write-back (sign-off, annotation, and now standards) stop reading a single global `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` and instead resolve the target repo per-product.
6. **Product management UX.** Edit (rename, description, change repo association) and delete (detach only — MVP never deletes the underlying GitHub repo itself, only the `wuce` product record and its link to it).

## Out of Scope

- **Multi-repo-per-product for inner-loop code** (e.g. separate frontend/backend/services repos under one product) — explicitly deferred; MVP is one repo per product covering artefacts, framework, and standards together.
- **Non-GitHub providers** (GitLab, Bitbucket, etc.) — MVP is GitHub only; the write mechanism (ADR-020, Contents API + OAuth token) is GitHub-specific by design for now.
- **Deleting the underlying GitHub repo** — product deletion in `wuce` only detaches the association; the actual repo is never deleted by the platform, to avoid an AI-driven flow ever destroying a real customer's git history.
- **Real-time collaborative editing** between the web UI operator and an IDE-side engineer (e.g. live cursors, CRDT-style simultaneous editing of the same file) — ordinary git commit/pull/merge is the sync mechanism; no special realtime layer.
- **Backfilling existing products' already-DB-stored content into git** — this feature applies to newly-configured products going forward; migrating today's handful of existing products (all the operator's own) is a separate, much smaller follow-up if needed at all.

## Assumptions and Risks

[ASSUMPTION] The existing GitHub OAuth App's token scope already includes repo creation (`repo` or `contents:write`-equivalent for a new repo, not just reading/writing contents of an existing one) — unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] Team members authenticated via Google or email/password (not GitHub OAuth) have no GitHub token in session, so under the existing ADR-020 pattern (user's own OAuth token, never a service account) they cannot write to a product's repo at all — unconfirmed how MVP should handle this, requires /clarify before scope is locked.

[ASSUMPTION] New-repo bootstrap (seeding the skills framework into a freshly created repo) can be done entirely via the GitHub Contents API (many small file writes under the user's token) without needing a local `git clone`/`git push` — unconfirmed; if false, this story needs actual git tooling as a new dependency, a materially bigger scope. Requires /clarify before scope is locked.

[ASSUMPTION] Today's single global `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` in production actually points at this skills-repo itself (the operator's own dogfood target) — unconfirmed from code alone, requires /clarify before scope is locked.

[ASSUMPTION] Converting standards from DB rows to git-tracked files means the files become the source of truth and the `standards` table becomes a read cache/index (not a parallel, potentially-diverging copy) — unconfirmed which direction the cutover goes, requires /clarify before scope is locked.

**Risks — what could make this not worth building:**

A product's linked GitHub repo being renamed, deleted, or having access revoked outside `wuce` must surface as a clear, visible error at the point of the next write attempt — never fail silently. Detection/re-link UX beyond that error surface isn't scoped yet.

`wuce` still has zero paying customers. This is a real architecture investment justified right now by the operator's own dogfooding need — worth staying honest that "two people pairing across web UI and IDE" is a hypothesis about what a future team customer wants, not yet validated by real usage.

## Directional Success Indicators

**Time from idea to DoR-ready, git-committed artefact.** Baseline: `[UNKNOWN BASELINE — currently impossible, not just slow]`. Target: achievable end-to-end via `wuce`'s web UI alone. Measured via: a real dogfood run producing a DoR-signed-off story with visible commits in the product's own repo history.

**Products with a configured repo.** Baseline: 0% (no product has one today). Target: 100% of newly-created products have a repo before their first outer-loop run is allowed. Measured via: `products.repo_owner`/`repo_name` non-null.

**Cross-tenant repo isolation.** Baseline: `[UNKNOWN BASELINE — untested, only one real tenant exists today]`. Target: two different tenants' outer-loop runs commit to two different, non-overlapping repos. Measured via: an automated E2E spec, matching the existing `bri-s3.4` cross-tenant isolation pattern.

## Constraints

- Must reuse ADR-020's identity model (user's own GitHub OAuth token, never a service account) for every repo write — no new auth pattern.
- Must reuse existing bootstrap tooling (`platform-init.js` and/or the ADR-014 sidecar model) rather than inventing a third distribution mechanism.
- Solo-operator delivery capacity — same constraint the rest of this platform is built under.
- No new persistent infrastructure assumed (Postgres, Fly) unless the local-clone assumption above resolves toward needing one — ties directly to the unresolved bootstrap-mechanism assumption.

## Contributors

- Hamish King — Founder/Operator

## Reviewers

- [Name — Role]

## Approved By

Pending

---

## /clarify recommendation

This discovery contains 5 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- The existing GitHub OAuth App's token scope already includes repo creation (`repo` or `contents:write`-equivalent for a new repo, not just reading/writing contents of an existing one) — unconfirmed, requires /clarify before scope is locked.
- Team members authenticated via Google or email/password (not GitHub OAuth) have no GitHub token in session, so under the existing ADR-020 pattern (user's own OAuth token, never a service account) they cannot write to a product's repo at all — unconfirmed how MVP should handle this, requires /clarify before scope is locked.
- New-repo bootstrap (seeding the skills framework into a freshly created repo) can be done entirely via the GitHub Contents API (many small file writes under the user's token) without needing a local `git clone`/`git push` — unconfirmed; if false, this story needs actual git tooling as a new dependency, a materially bigger scope. Requires /clarify before scope is locked.
- Today's single global `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` in production actually points at this skills-repo itself (the operator's own dogfood target) — unconfirmed from code alone, requires /clarify before scope is locked.
- Converting standards from DB rows to git-tracked files means the files become the source of truth and the `standards` table becomes a read cache/index (not a parallel, potentially-diverging copy) — unconfirmed which direction the cutover goes, requires /clarify before scope is locked.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

---

**Next step:** Run /clarify to resolve the 5 assumptions above, then human review and approval → /benefit-metric
