## Story: Multi-feature navigation and artefact browser

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e2-phase1-full-surface.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **programme manager or business lead**,
I want to browse all features in a repository and navigate to any artefact for any feature from a single index view,
So that I can get a complete picture of the pipeline without asking an engineer for links or a status summary.

## Benefit Linkage

**Metric moved:** P4 — Status self-service rate
**How:** A programme manager who can browse all features and their artefacts can answer "what phase is feature X in?" and "what has been approved so far?" without engineering involvement — directly advancing the ≥9/10 self-service target.

## Architecture Constraints

- ADR-012: feature list and artefact index must be resolved via the SCM adapter pattern — `listFeatures(token)` and `listArtefacts(featureSlug, token)` — not inline GitHub API calls
- ADR-004: repository configuration read from environment / `context.yml` — the feature browser only shows repositories in the configured list
- Mandatory security constraint: the server must validate the user's read access to each repository before serving the feature list — no enumeration of private repos the user cannot access

## Dependencies

- **Upstream:** wuce.2 (artefact view), wuce.5 (action queue links into this navigation for feature context)
- **Downstream:** wuce.7 (programme status view builds on the same feature index)

## Acceptance Criteria

**AC1:** Given an authenticated user navigates to `/features`, When the page loads, Then they see a list of all features in the configured repositories, each showing: feature slug, current pipeline stage, last-updated date, and a link to the artefact index for that feature.

**AC2:** Given an authenticated user clicks on a feature, When the feature artefact index loads, Then they see a list of all available artefacts for that feature (discovery, benefit-metric, stories, test-plans, dor) with the artefact type, creation date, and a link to view each one.

**AC3:** Given a feature has artefacts in multiple pipeline stages, When the feature index is displayed, Then artefacts are grouped by stage (Discovery, Definition, Test Plan, DoR) with the stage label visible.

**AC4:** Given an authenticated user clicks a specific artefact link from the feature index, When the artefact view loads, Then the content is rendered using the same artefact view implemented in wuce.2.

**AC5:** Given a configured repository contains no artefacts directory, When the feature browser attempts to load it, Then the repository entry is shown as "No artefacts found" rather than an error page.

## Out of Scope

- Artefact search or keyword filtering across all features — post-MVP
- Sorting features by owner, team, or priority — progressive enhancement
- Viewing artefacts from non-GitHub repositories — deferred (discovery out-of-scope item 3)
- Creating or editing artefacts from the browser — read-only in Phase 1 (except sign-off in wuce.3)
- Dependency graph or cross-feature dependency view — post-MVP

## NFRs

- **Security:** Server validates read access per repository before listing. No private repo enumeration for unauthorised users.
- **Performance:** Feature list (up to 50 features, 10 repositories) loads in under 4 seconds.
- **Accessibility:** Feature list and artefact index meet WCAG 2.1 AA — lists labelled, headings hierarchical, links descriptive.
- **Audit:** Feature index and artefact view access logged with user ID, feature slug, and timestamp.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
