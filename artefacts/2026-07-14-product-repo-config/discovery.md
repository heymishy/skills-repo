# Discovery: Per-Product Git Repo Configuration and Management

**Status:** Approved
**Created:** 2026-07-14
**Approved by:** Hamish King — Founder/Operator — 2026-07-14
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

[RESOLVED via code inspection, 2026-07-14] The existing GitHub OAuth App's token scope already includes repo creation. Confirmed: `src/web-ui/auth/oauth-adapter.js` requests `scope=repo,read:user` (plus `read:org` when `TENANT_ORG_ALLOWLIST` is set) — the `repo` scope grants full read/write access including repo creation (`POST /user/repos`). No OAuth App reconfiguration needed.

[RESOLVED via /clarify, 2026-07-14] Team members authenticated via Google or email/password have no GitHub token in session and cannot write to a product's repo under ADR-020's pattern. MVP restricts outer-loop repo writes to GitHub-authenticated users only; a Google/email-authenticated user gets a clear "link your GitHub account to write" prompt, reusing the existing account-linking flow (`routes/account-linking.js`). Forward-looking note: the same account-linking mechanism is the natural extension point for other git providers (GitLab, Bitbucket) later — linking additional identities, not just GitHub.

[RESOLVED via /clarify, 2026-07-14] New-repo bootstrap should prefer the GitHub Contents/Git Data API only (batch multi-file commits via the tree/blob/commit endpoints, no local clone, zero new dependencies) — the cleanest option and the default target. If that proves too complex during implementation, the fallback is a local `git clone` + `git push` (still under the user's OAuth token) used *only* for the initial bootstrap commit, reusing `scripts/platform-init.js`'s existing flat-copy logic; every write after that first commit (artefacts, standards, sign-offs) goes through the Contents API as normal either way. `/definition` should attempt the API-only approach first and only fall back if the implementation genuinely warrants it.

[RESOLVED via /clarify, 2026-07-14] Confirmed: production's `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` point at this skills-repo itself. `fly secrets list` confirms both are set and deployed; direct evidence in this repo's own git history — commit `2292a930`, message `"sign-off: artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md approved by heymishy"`, matching `commitSignOff`'s exact message template — proves wuce's sign-off write-back has already landed real commits here.

[RESOLVED via /clarify, 2026-07-14] Files are the source of truth for standards. The `standards` table becomes a read-optimized index/cache rebuilt from git content on each write — not a parallel, independently-editable copy. `standards.js`'s existing list/edit/promote/opt-out routes will need rework to read-through from git (via the cache) and write-through to git on every mutation, rather than being purely DB-driven.

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
- No new persistent infrastructure assumed (Postgres, Fly) for the default bootstrap path (Contents/Git Data API only); only if implementation falls back to the local-clone path does a local working directory become a transient, non-persistent requirement.

## Contributors

- Hamish King — Founder/Operator

## Reviewers

- [Name — Role]

## Approved By

Hamish King — Founder/Operator — 2026-07-14

---

## Clarification log

[2026-07-14] Clarified via /clarify:
- Q: Does the GitHub OAuth App's token scope include repo creation?  A: Resolved via code inspection (no operator question needed) — `scope=repo,read:user` already requested in `oauth-adapter.js`; `repo` scope includes creation.
- Q: How should non-GitHub-authenticated team members (Google/email) write to a product's repo?  A: MVP restricts repo writes to GitHub-authenticated users; Google/email users get a "link your GitHub account" prompt via the existing account-linking flow. Other git providers can extend the same linking mechanism later.
- Q: Should new-repo bootstrap use the Contents/Git Data API only, or is a local git clone acceptable?  A: Prefer Contents/Git Data API only (no new dependency); fall back to a local clone (reusing `platform-init.js`) only for the initial bootstrap commit if the API-only approach proves too complex.
- Q: Should git-tracked standards replace the DB table (files as source of truth), or should the DB stay authoritative with a sync step?  A: Files are the source of truth; the `standards` table becomes a read-optimized cache/index rebuilt from git.
- Q: Does production's `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` actually point at this skills-repo?  A: Confirmed — `fly secrets list` shows both set, and commit `2292a930` in this repo's own history is a real wuce sign-off write-back.

---

**Next step:** Human review and approval → /benefit-metric
