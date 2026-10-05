# Story: Automated Playwright timing spec for Metric 1 (filter→sort→dismiss×10)

**Epic reference:** None — short-track (test-infrastructure addition, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope is the real follow-up named in `artefacts/2026-10-04-signals-panel-triage-ux/dod/sptu-s3-dod.md`'s own Follow-up actions (2026-10-06)
**Benefit-metric reference:** References, but does not redefine, Metric 1 — Time-to-triage (`artefacts/2026-10-04-signals-panel-triage-ux/benefit-metric.md`)
**Domain:** [web-ui]

## User Story

As an **operator who wants a repeatable, caveat-free read on Metric 1 (Time-to-triage) without re-running a manual browser walkthrough every time**,
I want **an automated Playwright spec that performs the exact filter→sort→dismiss×10 sequence and records its own wall-clock duration**,
So that **this measurement can be re-run on demand (locally or in CI) with no browser-automation-tool overhead skewing the number**.

## Benefit Linkage

**Metric referenced:** Metric 1 — Time-to-triage. `sptu-s3-dod.md`'s own real, live-timed measurement (2026-10-06, 210.5s) was explicitly caveated as including Claude-in-Chrome automation overhead (screenshot-confirm round-trips, deliberate waits) not present for a real operator. This story closes that gap with a measurement that has no such overhead — Playwright drives the browser directly and natively, with no screenshot/confirm cycle in the loop.
**Important distinction, stated explicitly so this is never conflated with the original measurement:** this spec runs against a small, deterministic seeded fixture (reusing this repo's own established `/test/seed-signals` precedent, extended — see Architecture Constraints), not this repo's own real, ever-changing signal backlog. A fixture is required for a repeatable, CI-safe, cross-run-comparable number; `sptu-s3-dod.md`'s own one-off real-data measurement remains the authoritative "real backlog" data point and is NOT superseded or replaced by this spec. This story adds a second, complementary signal: a fast regression guard against the pure UI-interaction cost, independent of how large the real backlog happens to be on any given day.

## Architecture Constraints

**Existing seeding precedent, confirmed by direct code read:** `src/web-ui/server.js`'s `/test/seed-signals` endpoint (`NODE_ENV=test`-gated, added by `ep2-s1`) already overrides `routes/signals-panel.js`'s `signals-panel.js`'s `_signalsSourceOverride` seam with a fixture array, bypassing the need to wire the real fs-backed `signals-aggregator` adapter (which is NOT wired in the shared Playwright `webServer` config — confirmed via `playwright.config.js`'s `webServer.env`, no `WIRE_SKILL_ADAPTERS=true` set there, and editing that shared block to add it was already explicitly rejected once, by `ep2-s1`'s own file-header comment, as unsafe for every other spec in the suite).

**Current `/test/seed-signals` fixture shape is insufficient for this scenario:** its generated fixtures are all `type: 'note'`, all `timestamp: null` — no `parse-error` type exists to filter out, and no dated signals exist to meaningfully demonstrate sort-by-recency. This story extends the endpoint (backward-compatibly) to accept an optional `signals` array in its POST body for full custom control, falling back to the existing uniform-`count` generator when `signals` is absent — so `ep2-s1`'s and `ep2-s3`'s own existing specs continue to work completely unchanged.

**Timing methodology:** duration is measured in the Node/Playwright test process via `Date.now()` immediately before the first action and immediately after the last assertion — never in browser-page JS state (confirmed by this story's own author's prior mistake in the manual walkthrough: a page-context `Date.now()` timestamp is wiped by this exact flow's own full-page-reload-per-dismiss behaviour).

**Assertion threshold:** this is a fast, local, synchronous-HTTP-round-trip flow (11 total form submissions: 1 filter + 10 dismiss, each a full page reload against a local test server) — a generous but still meaningful ceiling of under 15 seconds is asserted as a regression guard (catches a gross future regression, e.g. an accidentally-added blocking operation on the dismiss path), not a reproduction of the 2-minute human-facing target, which this spec does not attempt to validate (see Benefit Linkage distinction above).

## Dependencies

- **Upstream:** `sptu-s1`–`sptu-s4` (all merged), `dswf-s1`, `wswda-s1` — all contribute to the flow this spec exercises.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a seeded fixture of signals including at least 2 `parse-error`-type signals and at least 10 non-`parse-error`, dated signals, When the Playwright spec applies the "Hide parse-error" filter via a real click, Then the `parse-error` signals are no longer present in the rendered list (real DOM assertion, not an API-level check).

**AC2:** Given the filtered list, When the spec dismisses 10 real (fixture) signals via 10 real sequential clicks on each one's "Dismiss" button, Then all 10 are confirmed persisted via `?showDismissed=true` (`[data-signal-dismissed="true"]` count === 10) — matching the real DoD measurement's own verification method.

**AC3:** Given the full sequence (AC1 + AC2) completes, When the spec measures Node-process wall-clock duration across the whole sequence, Then the duration is asserted to be under 15 seconds, and the actual measured value is printed to the test output for human reference.

**AC4:** Given `/test/seed-signals`'s existing `count`-only callers (`ep2-s1-signals-panel.spec.js`, `ep2-s3-signals-pagination.spec.js`), When this story's extension to accept an optional `signals` array is applied, Then both existing specs continue to pass completely unchanged.

## Out of Scope

- Replacing or superseding `sptu-s3-dod.md`'s own real, one-off, honestly-caveated measurement — both are kept, for different purposes (see Benefit Linkage).
- Wiring the real fs-backed `signals-aggregator`/`dismissed-signals-store` adapters into the shared Playwright `webServer` — explicitly rejected (see Architecture Constraints), matching `ep2-s1`'s own prior rejection of the same idea.
- Running this spec in the default `npm test` chain — per this repo's own `ADR-018` convention (every other `tests/e2e/*.spec.js` file is Playwright-only, run via `npx playwright test`, not bundled into `node scripts/run-all-tests.js`).

## NFRs

- **Performance:** The spec itself asserts a performance ceiling (AC3) — that is its entire purpose.
- **Security:** None identified — reuses the existing `NODE_ENV=test`-gated seeding pattern; no new input surface beyond what `/test/seed-signals` already accepts from a test-only, non-production-reachable endpoint.
- **Accessibility:** N/A — this spec drives real clicks on real rendered elements already covered by `sptu-s4`'s own accessibility ACs; it does not re-test accessibility itself.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
