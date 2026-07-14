## Story: Create a new GitHub repo directly from product creation

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-2-full-config-and-bootstrap.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **tenant admin configuring a new product**,
I want to **create a brand-new GitHub repo directly from the product-creation flow**,
So that **I don't need to leave wuce and manually create a repo before I can start**.

## Benefit Linkage

**Metric moved:** Metric 2 — Products with a configured repo
**How:** Extends the repo-configuration flow (prc-s1.2 covered "connect existing") to also cover "create new," the second of the two required paths named in the discovery's MVP scope item 2.

## Architecture Constraints

ADR-020: repo creation uses the operator's own OAuth token (`POST /user/repos`) — confirmed during `/clarify` that the existing `repo` scope already grants this, no OAuth App reconfiguration needed.

## Dependencies

- **Upstream:** prc-s1.1 (schema)
- **Downstream:** prc-s2.2 (the newly created repo is what gets bootstrapped)

## Acceptance Criteria

**AC1:** Given a tenant admin creating a new product, When they choose "create a new repo" and provide a name, Then a new GitHub repo is created under their account via the Contents/Git Data API using their own OAuth token, and the product's `repo_*` columns are set to it.

**AC2:** Given a repo name that already exists on the operator's GitHub account, When creation is attempted, Then it fails with a clear "that name is already taken" error rather than silently overwriting or erroring opaquely.

**AC3:** Given a tenant admin without a GitHub token in session (Google/email auth), When they reach the "create a new repo" option, Then they see the same "link your GitHub account" prompt as prc-s1.2 AC3 — consistent behaviour across both repo-configuration paths.

**AC4:** Given repo creation succeeds, When the product record is checked immediately after, Then `repo_provider`/`repo_owner`/`repo_name` are populated before the operator is shown the bootstrap step (prc-s2.2) — no window where the product looks configured but isn't.

## Out of Scope

- Repo visibility/privacy settings beyond GitHub's own default — can be a follow-up if it matters.
- Custom `.gitignore`/license selection at creation time — the bootstrap story (prc-s2.2) handles what content actually lands in the repo.

## NFRs

- **Performance:** Repo creation is a single synchronous API call; acceptable to block the UI briefly.
- **Security:** Same as prc-s1.2 — never store the token itself.
- **Accessibility:** Standard form.
- **Audit:** Repo creation logged via existing PostHog pattern.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
