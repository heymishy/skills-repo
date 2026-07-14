## Story: Bootstrap a newly created repo with the skills framework

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-2-full-config-and-bootstrap.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **tenant admin configuring a new product**,
I want to **have a freshly created repo already contain a working skills-pipeline installation**,
So that **outer-loop work can start immediately without a manual setup step**.

## Benefit Linkage

**Metric moved:** Metric 1 — Time from idea to DoR-ready, git-committed artefact
**How:** Without this story, a newly created repo is empty and outer-loop work has nowhere real to write structured content — bootstrap is what makes "create new repo" actually usable, not just theoretically configured.

## Architecture Constraints

ADR-014: reuse the `.skills-repo/` sidecar + `skills-lock.json` model as the primary approach, or `scripts/platform-init.js`'s flat-copy logic as the fallback content source. Per the `/clarify` resolution: attempt bootstrap via the Contents/Git Data API (batch multi-file commit using the tree/blob/commit endpoints) first; fall back to a local `git clone` + `git push` (still under the user's OAuth token) only if the API-only approach proves too complex during implementation. ADR-020: still the user's own token, even for the fallback path.

## Dependencies

- **Upstream:** prc-s2.1 (needs a newly created, empty repo to bootstrap)
- **Downstream:** None within this epic — Epic 3's standards conversion assumes a bootstrapped repo exists as its target.

## Acceptance Criteria

**AC1:** Given a newly created, empty repo, When bootstrap runs, Then the repo's first commit contains the skills framework content (equivalent to what `scripts/platform-init.js` copies: `.github/skills/`, `.github/templates/`, `scripts/`), committed under the operator's own identity.

**AC2:** Given bootstrap runs, When the implementation is inspected, Then a Contents/Git Data API call sequence (tree/blob/commit) is present and was genuinely invoked for the primary path — independently verifiable regardless of whether a fallback path (AC4) also exists in the codebase. *(Corrected 2026-07-14 per /review finding 1-M1 — original wording made AC2's outcome depend on AC4's conditional branch, violating independent testability. See decisions.md.)*

**AC3:** Given bootstrap succeeds, When the repo is inspected, Then it is structurally equivalent to a repo that had `platform-init.js` run against it directly — same directory structure, same files.

**AC4:** Given the API-only approach proves genuinely too complex during implementation (per the `/clarify` resolution's explicit fallback), When the fallback local-clone path is used instead, Then this is recorded as a `decisions.md` entry explaining why, and the fallback still uses the operator's own OAuth token over HTTPS, never a service account.

## Out of Scope

- Bootstrapping standards files — Epic 3's standards conversion happens after this epic, so bootstrap in this story only needs to seed the framework, not product-specific standards content yet.
- Customizing bootstrap content per-tenant beyond the standard skills framework.

## NFRs

- **Performance:** Bootstrap should complete within a reasonable UI wait time — target under 30 seconds for the typical file count in `.github/skills/` + `.github/templates/` + `scripts/`. If this can't be hit via the API-only approach, that's itself evidence for AC4's fallback.
- **Security:** Same token model as every other write path.
- **Accessibility:** Not applicable — background operation, needs a clear loading/success state.
- **Audit:** Bootstrap completion logged with the resulting first-commit SHA.

## Complexity Rating

**Rating:** 3
<!-- Highest-ambiguity story in the whole feature — the actual unresolved technical question from /clarify. -->
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
