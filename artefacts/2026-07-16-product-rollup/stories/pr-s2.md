## Story: Sync a product's connected repo and show aggregate DoD status

**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e1-foundation.md
**Discovery reference:** artefacts/2026-07-16-product-rollup/discovery.md
**Benefit-metric reference:** artefacts/2026-07-16-product-rollup/benefit-metric.md

## User Story

As the **Founder/Operator (Hamish King)**,
I want to **trigger a sync of a product's connected repo and see its aggregate DoD status on `/products/:id`**,
So that **I can see, for the first time, real delivery-health data about the product instead of a bare feature count**.

## Benefit Linkage

**Metric moved:** Product shape visible in the web UI
**How:** This is the first rollup dimension to render for real — an operator triggering a sync sees an actual aggregate (count of features at each DoD stage) computed from the connected repo's own governed `pipeline-state.json`, closing the baseline-0% gap the metric names.

## Architecture Constraints

- Follows `sign-off.js`'s `handleArtefactRead` pattern for the GitHub Contents API call (`GET /repos/{owner}/{repo}/contents/{path}`), using `req.session.accessToken` — never a service account (ADR-020).
- CLAUDE.md's D37 injectable adapter rule: the Contents API fetch is wired behind an injectable adapter with a throw-on-unwired stub default (mirroring `repo-adapter.js`'s existing pattern), wired to its real implementation in `server.js` as a separate task from the handler itself.
- CLAUDE.md's mock-shape verification rule: since this reuses the Contents API pattern for a new file type (`pipeline-state.json`, not an artefact `.md`), tests must mock the real GitHub response shape for a JSON file (base64-encoded `content` field), not an assumed shape.
- ADR-025 (Tenant scoping): the cached rollup record is stored against `product_id` (which is itself `tenant_id`-scoped via the `products` table), following the same row-scoping convention as the `standards` table — no new isolation mechanism.
- MC-SEC-02 (`.github/architecture-guardrails.md`): the OAuth token itself is never persisted to the cache table or logged — only the computed rollup data.
- ADR-018 (Playwright E2E): AC2 is browser-facing; an E2E spec covering a real sync + DoD status render should exist in `tests/e2e/` before DoR.

## Dependencies

- **Upstream:** pr-s1 must be complete — this story needs a product row (with `repo_owner`/`repo_name`) to sync against.
- **Downstream:** pr-s3 (freshness/refresh UX) and every story in Epic 2 build directly on this sync mechanism and its cache table.

## Acceptance Criteria

**AC1:** Given a product with a connected repo containing a valid `.github/pipeline-state.json`, When the operator triggers a sync (e.g. a "Sync now" action on `/products/:id`), Then the file is fetched via GitHub's Contents API using the operator's own OAuth token, and a computed rollup record (at minimum: count of features at each `dodStatus` value) is written to a new Postgres table scoped by `product_id`.

**AC2:** Given a sync has completed, When the operator loads `/products/:id`, Then the page renders the cached aggregate DoD status (count of features at each stage) instead of only the existing `featureCount`.

**AC3:** Given the connected repo's `pipeline-state.json` cannot be fetched (e.g. 404, or the token lacks access), When a sync is triggered, Then the sync fails visibly with a clear error message on `/products/:id` — it does not silently show stale or empty data as if it were current.

**AC4:** Given the connected repo's `pipeline-state.json` uses the epic-nested `epics[].stories[]` structure for some features (as this platform's own repo does), When the DoD status is aggregated, Then stories nested inside epics are counted correctly alongside flat `feature.stories[]` entries — not silently skipped.

## Out of Scope

- Every rollup dimension other than DoD status (health, test coverage, AC coverage, discovery scope, taxonomy) — Epic 2.
- Last-synced timestamp display and a dedicated "Refresh" UI affordance — pr-s3 (this story establishes the sync mechanism itself; pr-s3 makes the freshness/refresh UX visible).
- Automatic or scheduled sync — on-demand only, per discovery.

## NFRs

- **Performance:** A sync is a single bounded GitHub Contents API call (one file fetch) plus one Postgres write — no per-feature API calls.
- **Security:** OAuth token used only for the duration of the request; never persisted. Cached rollup data contains no credentials.
- **Accessibility:** Not applicable — no new interactive UI in this story beyond the existing DoD status render (pr-s3 covers the refresh control).
- **Audit:** Sync attempts (success/failure) should be logged with `product_id` and timestamp, consistent with existing audit logging in `dashboard.js`'s action-queue path.

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
