## Story: Connect an existing GitHub repo to a product

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-1-walking-skeleton.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **tenant admin configuring a new product**,
I want to **connect a GitHub repo I already own to that product**,
So that **the product has a real destination for outer-loop writes**.

## Benefit Linkage

**Metric moved:** Metric 2 — Products with a configured repo
**How:** This story is the write path that populates the `repo_*` columns prc-s1.1 created, using the operator's own OAuth token per ADR-020.

## Architecture Constraints

ADR-020: repo connection must verify the authenticated user's own GitHub OAuth token has access to the named repo (`GET /repos/{owner}/{repo}` with the user's token, not a service account). ADR-012: implement as an injectable D37 adapter (`setRepoAdapter`/`getRepoAdapter`-shaped) so it can be tested without live GitHub calls.

## Dependencies

- **Upstream:** prc-s1.1 (needs the schema columns)
- **Downstream:** prc-s1.3 (write-back resolution needs a configured repo to resolve to)

## Acceptance Criteria

**AC1:** Given a tenant admin with a valid GitHub OAuth session, When they submit an owner/repo they have access to, Then the product's `repo_provider`/`repo_owner`/`repo_name` are set and a confirmation is shown.

**AC2:** Given a tenant admin submits an owner/repo they do NOT have access to (or that doesn't exist), When the connect action runs, Then it is rejected with a clear error and no columns are written.

**AC3:** Given a tenant admin is authenticated via Google or email/password (no GitHub token in session), When they attempt to connect a repo, Then they see a clear "link your GitHub account first" prompt directing them to the existing account-linking flow, and no repo is connected.

**AC4:** Given a product already has a repo connected, When a tenant admin submits a different repo, Then the association is updated to the new repo — re-linking is supported, not blocked.

**AC5 (D37 wiring):** Given the `setRepoAdapter`/`getRepoAdapter` pair is left unwired, When any code path calls the adapter, Then it throws `Adapter not wired: repoAdapter. Call setRepoAdapter() with a real implementation before use.` — never a silent empty/safe-looking return. Given `server.js` wires the adapter to a real implementation at startup, When two different owner/repo submissions are made by two different sessions, Then each resolves to its own correct, independently-verifiable access result (one succeeds, one is rejected) — not merely "a function reference was assigned," per this repo's own D37 wiring-test standard (CLAUDE.md).

## Out of Scope

- Creating a brand-new repo — that's Epic 2, prc-s2.1.
- Any bootstrap/seeding of the connected repo's content — Epic 2.
- Non-GitHub providers — out of scope per discovery.

## NFRs

- **Performance:** Repo-access verification completes within a normal request/response cycle — no async job needed for MVP.
- **Security:** Never store the OAuth token itself against the product — only owner/repo strings; the token stays session-scoped as it already does elsewhere.
- **Accessibility:** Standard form accessibility, no new pattern.
- **Audit:** Repo connection/re-connection is logged (who, when, which repo) — reuses the existing PostHog capture pattern already in `products.js`.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable — real GitHub API interaction, first time this app verifies repo access rather than just reading/writing content.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
