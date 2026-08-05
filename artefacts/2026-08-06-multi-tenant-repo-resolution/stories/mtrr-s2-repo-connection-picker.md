## Story: Connect a repo by picking from your own accessible repos

**Epic reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/epics/mtrr-e1-multi-tenant-repo-resolution-and-ux.md
**Discovery reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/discovery.md
**Benefit-metric reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/benefit-metric.md
**Domain:** [ui, web-ui] — story's scope is a UI flow change to the existing product-repo-connection surface.

## User Story

As **an operator connecting a product to a GitHub repo**,
I want **to pick from a list of my own accessible repos rather than typing or pasting a URL**,
So that **connecting a repo is fast and error-free, without needing to already know or look up the exact URL**.

## Benefit Linkage

**Metric moved:** Repo-connection setup experience
**How:** Replacing the bare URL-entry field with a picker sourced from the operator's own GitHub credential directly targets the metric's baseline ("bare URL-entry form, no guidance") and its target ("pick from accessible repos").

## Architecture Constraints

- **GitHub API rate limits** — listing an operator's accessible repos must not be re-fetched on every page render; cache appropriately.
- **Reuse, not reimplementation:** the picker writes to the exact same `prc-s1.1` repo-association columns the existing URL-entry flow already writes to — no new data model, only a new UI path to populate the same fields.
- **Fallback required, not optional:** if GitHub API rate-limiting or an OAuth-scope gap prevents listing repos, the flow must fall back to the existing URL-entry field rather than leaving the operator stuck — per the risk explicitly flagged in discovery/benefit-metric.
- **Design system compliance:** per this platform's own constraint, WCAG 2.1 AA is a hard floor for this UI change, not a performance NFR to trade off.

## Dependencies

- **Upstream:** None functionally — reads the same `prc-s1.1` columns `mtrr-s1` reads, but does not depend on `mtrr-s1`'s lookup logic to implement its own UI flow.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given an operator with GitHub OAuth connected opens the repo-connection flow, When the page loads, Then they see a list of their own accessible repos to choose from — not a bare URL-entry field as the primary path.

**AC2:** Given the operator selects a repo from the list and confirms, When the selection completes, Then the product's repo-association columns (`prc-s1.1`) are populated with exactly the same data shape the existing URL-entry flow would have written — same underlying fields, only the input method changed.

**AC3:** Given GitHub API rate-limiting or an OAuth-scope issue prevents listing the operator's repos, When this occurs, Then the flow falls back to the existing URL-entry field, with a clear message explaining why the picker isn't available — the operator is never left with no way to proceed.

**AC4:** Given an operator has a large number of accessible repos, When the list is displayed, Then it supports search/filter so the operator can find the right repo without scrolling an unfiltered, unusably long list.

## Out of Scope

- Building a new repo-*creation* flow — `prc-s2.1` already handles creating a new GitHub repo from product creation; this story only changes how an *existing* repo is selected/connected.
- Any change to the export endpoint's own repo-resolution logic — that's `mtrr-s1`, already merged independently by the time this ships.

## NFRs

- **Performance:** The repo list loads and is interactive within 2 seconds under normal network conditions; results are cached to avoid a repeat GitHub API call on every render.
- **Security:** No change to credential handling beyond what's already in place for GitHub OAuth login.
- **Accessibility:** WCAG 2.1 AA — hard floor per this platform's design-system constraint, not a tradeable performance NFR.
- **Audit:** Not applicable beyond what's already logged for product-repo connection changes.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
