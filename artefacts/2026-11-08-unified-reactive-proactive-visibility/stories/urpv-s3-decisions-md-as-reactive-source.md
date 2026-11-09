## Story: Surface decisions.md RISK-ACCEPT/SCOPE entries as a second reactive-work source

**Epic reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/epics/urpv-e1-reactive-work-visibility.md
**Discovery reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **delivery engineer**,
I want to **see RISK-ACCEPT and SCOPE entries logged in my feature's decisions.md surfaced as reactive-work signals in the consolidated features view**,
So that **judgment calls and deviations that happened outside a formal short-track story — real reactive work by this discovery's own definition — aren't invisible just because they never became their own story**.

## Benefit Linkage

**Metric moved:** Reactive-work coverage on the surface
**How:** Short-track stories (urpv-s2) only cover reactive work that became its own formal story. `decisions.md` RISK-ACCEPT/SCOPE entries capture a second, real category of reactive judgment calls (e.g. the `ilce-s3` CI-runner-pin deviation) that never did — this story closes the remaining gap in the coverage metric's own definition, which explicitly names both sources.

## Architecture Constraints

- Reuses the existing `fetchRepoPath` GitHub-contents read primitive (`src/web-ui/adapters/artefact-fetcher.js`), already proven by `decisions-log-writer.js`'s narrower auto-append use case — no new GitHub API code path.
- `product/constraints.md` #9: this story renders new content in `src/web-ui/` — `hasDesignSystemTrack: true` required at DoR.
- ADR-025 (multi-tenancy): the `decisions.md` fetch must use the same `repoOwner`/`repoName`/`accessToken` already resolved per-product, per-tenant — no cross-tenant repo read.
- Per this discovery's own Constraints section and `/decisions` skill conventions: `decisions.md` entries follow a consistent but free-form markdown structure (bolded `**YYYY-MM-DD | CODE | phase**` header line, `**Decision:**`/`**Rationale:**` fields) — the parser built here must tolerate variation in field order and optional fields (e.g. a missing `**Note:**` line), not assume a rigid, fully-schematized format. This is prose convention, not a machine schema.

## Dependencies

- **Upstream:** urpv-s1 (the repo must be connected and syncable; `decisions.md` is fetched live per-request via `fetchRepoPath`, not cached in `product_rollups`, so it does not strictly depend on the taxonomy sync succeeding — but the surrounding page context does).
- **Downstream:** urpv-s4 (the rollup counts decisions.md-sourced reactive entries alongside short-track ones).

## Acceptance Criteria

**AC1:** Given a connected repo's `artefacts/[feature-slug]/decisions.md` contains at least one entry whose header line matches the `RISK-ACCEPT` or `SCOPE` code (per the format already established by `/decisions`, e.g. `**2026-11-08 | RISK-ACCEPT | discovery (/clarify)**`), When the consolidated features view loads for that product, Then each such entry is parsed and surfaced as a reactive-work item, carrying at minimum its date, code, and decision-title text.

**AC2:** Given a `decisions.md` entry's code is something other than `RISK-ACCEPT` or `SCOPE` (e.g. `ARCH`, `ASSUMPTION`, `SLICE`), When the parser processes that file, Then that entry is not surfaced as a reactive-work item — only the two codes this discovery explicitly named are in scope.

**AC3:** Given a `decisions.md` file exists but is malformed or missing an expected header pattern for one entry among several well-formed ones, When the parser processes the file, Then the well-formed entries still render correctly and the malformed one is skipped silently (logged server-side, not surfaced as an error to the viewer) — one bad entry never blocks the rest of the file's real signal.

**AC4:** Given a connected repo has no `decisions.md` file at all for a given feature (or the fetch itself fails, e.g. a 404), When the consolidated features view loads, Then the view renders normally with zero `decisions.md`-sourced reactive items for that feature — never a visible error or a broken page.

## Out of Scope

- Parsing or surfacing any `decisions.md` entry type other than `RISK-ACCEPT`/`SCOPE`.
- Caching `decisions.md` content in `product_rollups` — this story fetches live, per page load (acceptable for MVP; a caching story would be a separate follow-up if load observed in practice).
- Writing to `decisions.md` — this story is read-only; `decisions-log-writer.js`'s existing write path is untouched.

## NFRs

- **Performance:** A live per-feature GitHub fetch on every page load adds real latency for products with many features. `[UNKNOWN BASELINE]` — no current measurement of how many features a typical connected product has or how this scales. Flagged as a risk to watch at DoR/test-plan time, not solved speculatively here.
- **Security:** Same `req.session.accessToken` scoping as the rest of this epic; `decisions.md` content is rendered as escaped text, never raw HTML (MC-SEC-01).
- **Accessibility:** Rendered entries meet the same text-label/contrast requirements as urpv-s2's tag.
- **Audit:** Parse failures logged server-side per AC3, consistent with this epic's existing error-handling pattern.

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
