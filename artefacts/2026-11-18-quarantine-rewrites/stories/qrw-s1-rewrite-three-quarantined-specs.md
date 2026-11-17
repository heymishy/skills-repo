## Story: Three quarantined browser specs are rewritten against the product as it is and join the core suite

**Epic reference:** None - short-track (test maintenance, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: the quarantine reasons in `tests/e2e/capability-matrix.json` (entered 2026-11-17), the lpw-s1 to lpw-s5 stories in `artefacts/2026-11-17-local-playwright-suite-trust/`, and the current markup in `src/web-ui/views/chat-view.js` and `src/web-ui/server.js`.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui] [tests]

## User Story

As **the operator who merges pull requests on the strength of the core browser suite**,
I want **the reference-upload, dsda-s1 and iwu2 specs to test what the product does today and run in the core lane**,
So that **three capabilities (the strategy grounding modal and upload, the editable story list, the right-panel layout) are covered again instead of sitting in quarantine until the 2026-12-15 review date turns the unit suite red**.

## Benefit Linkage

**Metric moved:** None formal. Each spec is quarantined because the product moved on and the spec did not. The matrix says what to rewrite: reference-upload enters through a new-product checkbox no form emits; dsda-s1 expects a redirect to the stories page that the review autostart replaced; iwu2 looks for `#assumption-cards` on discovery (ideate only) and `#draft-content` (gone since dsa-s4).
**How:** reference-upload creates a journey the way the page does and opens `/journey/:id/reference-modal` directly; dsda-s1 asserts the real post-definition redirect (the review session) and opens `/journey/:id/stories` directly; iwu2 asserts the ideate layout for the assumption section and discovery's `#artefact-panel` for the draft. All three move to the core lane with their quarantine fields removed.

## Architecture Constraints

- Test files and the capability matrix only. No change to anything under `src/`.
- The specs keep their original intent (what each AC or T-number proved); only how they reach the page, and the markup they name, change.
- Core job runs with `--workers=1`; each spec creates its own journeys or sessions and names them uniquely.

## Dependencies

- **Upstream:** lpw-s2 (capability matrix and lanes), lpw-s3 (reason on every quarantined entry), lpw-s4 and lpw-s5 (the previous moves to core).
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given the reference-upload spec, When it runs, Then T9 to T15 each reach the reference modal by creating a journey (CSRF-protected `POST /api/journey`) and opening `/journey/:id/reference-modal`, and all seven pass; T15 asserts the uploaded file appears on `/journey/:id/reference` instead of only that an endpoint did not return 500.
**AC2:** Given the dsda-s1 spec, When it drives discovery, benefit-metric, design and definition through the mock gateway, Then it asserts the redirect after definition is the review session, opens `/journey/:id/stories`, edits the textarea and the submit lands on a review session.
**AC3:** Given the iwu2 spec, When it runs, Then the assumption assertions (present, placeholder text, region and label, before the canvas, 38% cap) run against an ideate session, the draft assertions (present, region, label "Artefact draft") run against `#artefact-panel` on a discovery session, and `#assumption-cards` is absent on discovery.
**AC4:** Given the capability matrix, When the three entries are read, Then each has `lane: core` and no `reason`, `owner`, `entered` or `reviewBy`, the matrix guard tests pass, and the quarantined count is 13.
**AC5:** Given the whole core lane run with `--workers=1`, When it finishes, Then it passes with the three added (39 specs), and no file under `src/` changed.

## Out of Scope

- Adding a UI entry to the reference modal (a product follow-up recorded in the matrix reason; the modal still has no way in from the journey form).
- The other 13 quarantined specs.
- The `TypeError` the server logs when a chat page opened on a bare JSON-API session sends its first turn (observed, recorded in `decisions.md`).

## NFRs

- **Reliability:** no fixed sleeps; each wait is on a URL or a locator; each spec uses unique names.
- **Cost:** no model call (mock gateway only).

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
