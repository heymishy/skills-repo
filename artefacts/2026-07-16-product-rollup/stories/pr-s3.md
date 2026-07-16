## Story: Show last-synced freshness and a manual refresh action

**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e1-foundation.md
**Discovery reference:** artefacts/2026-07-16-product-rollup/discovery.md
**Benefit-metric reference:** artefacts/2026-07-16-product-rollup/benefit-metric.md

## User Story

As the **Founder/Operator (Hamish King)**,
I want to **see when a product's rollup was last synced, and refresh it on demand**,
So that **I always know whether I'm looking at current data, and can update it myself without waiting for an automatic process**.

## Benefit Linkage

**Metric moved:** Freshness is visible and refreshable, never silently stale
**How:** This story delivers the metric's entire target directly — a visible last-synced timestamp and a working Refresh action that re-fetches from the connected repo and updates both the timestamp and the rendered rollup.

## Architecture Constraints

- Uses the `/frontend-design` skill for the Refresh control and timestamp display, consistent with how UI work elsewhere in this platform is built.
- MC-SEC-01 (`.github/architecture-guardrails.md`): the timestamp and any rendered text from the synced data must be inserted via safe DOM/templating, never raw `innerHTML` of unsanitised content.
- GitHub API rate limits (5,000 requests/hour per authenticated user token, shared across every GitHub-backed feature) — the Refresh action must not auto-trigger on every page load; it is user-initiated only, per discovery MVP scope item 6.

## Dependencies

- **Upstream:** pr-s2 must be complete — this story adds UI on top of pr-s2's sync mechanism and cached `synced_at` value.
- **Downstream:** None — this closes out Epic 1.

## Acceptance Criteria

**AC1:** Given a product with a previously-synced rollup, When the operator loads `/products/:id`, Then the page shows a human-readable last-synced time (e.g. "Last synced 2 hours ago").

**AC2:** Given the rollup view is showing a last-synced timestamp, When the operator clicks "Refresh," Then a new sync is triggered (pr-s2's mechanism), the timestamp updates to reflect the new sync time, and the rendered rollup values update to match.

**AC3:** Given a product has never been synced, When the operator loads `/products/:id` for the first time, Then the page shows a clear "Not yet synced" state rather than a blank or misleading timestamp, with a visible action to trigger the first sync.

**AC4:** Given a Refresh is in progress, When the operator views the page, Then a loading/in-progress indicator is shown and the Refresh action is disabled until the sync completes or fails — preventing duplicate concurrent syncs from the same product.

## Out of Scope

- Automatic detection of whether the connected repo has actually changed since the last sync — MVP shows time-since-last-sync only, per discovery (detecting real changes needs its own GitHub API call, no cheaper than just re-syncing).
- Background or scheduled sync — deferred, per discovery MVP scope item 6 and Out of Scope.

## NFRs

- **Performance:** The Refresh action's own UI feedback (loading state) should appear within 200ms of the click, independent of how long the underlying sync takes.
- **Security:** Not applicable beyond pr-s2's own NFRs — this story is presentation only.
- **Accessibility:** The Refresh button and last-synced timestamp must be keyboard-accessible and not rely on colour alone to indicate sync-in-progress vs. complete state (matching the existing accessibility mandatory constraint already applied elsewhere in this codebase).
- **Audit:** Not applicable beyond pr-s2's own sync-attempt logging.

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
