## Story: Auto-resolve the single-AC capture target before falling back to manual entry

**Track:** Short-track (`/test-plan -> /definition-of-ready -> coding agent`)

## Background

Builds on `actr-s1`. `handlePostCaptureTrigger`/`handleGetPlaybackEvidence` (`src/web-ui/routes/playback-evidence.js`) currently only ever use a capture target set via `handlePostCaptureTarget`'s manual form (`_journeyStore.setCaptureTarget`) — there is no attempt to resolve a target automatically before showing that form. This story wires `actr-s1`'s pure derivation function into the live single-AC flow.

## User Story

As a **product owner viewing the playback-evidence page for a story whose E2E coverage already names a URL and selector**,
I want **that AC's capture target filled in automatically**,
So that **I only see the manual entry form for ACs where no spec-derived target could be found**.

## Benefit Linkage

**Metric moved:** `m1` — same linkage as `actr-s1`. This is the story that actually removes the friction end-to-end for the single-AC path — `actr-s1` alone is inert until wired in.
**How:** Confirmed with the operator (2026-10-28), direct continuation of `actr-s1`.

## Architecture Constraints

- Reuse the existing `_fetchArtefact`/`fetchArtefact` adapter (`../adapters/artefact-fetcher`), already required into this file — no new adapter, per CLAUDE.md's D37 guidance to prefer an existing adapter when one already covers the read. This is the same adapter already used in this file to read `discovery.md`/`benefit-metric.md` (`_fetchSummaryContent`).
- Resolution source: the story's own `test-plans/<story-slug>-test-plan.md` artefact. Parse its E2E section's `File:` reference for the given AC (confirmed format: `artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s6-test-plan.md` line 149, `**File:** tests/e2e/ppc-s6-responsive-summary.spec.js`), fetch that spec file's content via the same adapter, then run it through `actr-s1`'s function.
- If the test-plan artefact itself is missing, 404s, or names no E2E file for the given AC, auto-resolution is skipped silently — falls through to today's manual-form behaviour. Never a thrown error visible to the operator.
- A manually-set target (`journey.captureTargets`, set via the existing `handlePostCaptureTarget`) always takes priority over an auto-resolved one for an AC where both exist — an operator's explicit override must never be silently replaced by a weaker, auto-derived guess.
- Rendering change only: `_renderPlaybackEvidenceHtml`'s per-AC block must show the resolved url/selector read-only with a visible "Auto-detected from `<spec file>` — Override" control when auto-resolution succeeded, and the existing manual form unchanged when it did not. No change to `handlePostCaptureTrigger`'s own dispatch call shape — it already accepts `{acId, url, selector}` regardless of source.

## Dependencies

- **Upstream:** `actr-s1`.
- **Downstream:** `actr-s3`.

## Acceptance Criteria

**AC1:** Given an AC with no manually-set capture target and a test-plan artefact naming a real E2E spec file that resolves both url and selector, When the playback-evidence page renders, Then that AC's target shows the auto-detected url/selector read-only, with no manual-entry form required before a capture can be triggered.

**AC2:** Given the same AC as AC1, When the operator clicks "Trigger capture" with no manual entry, Then `dispatchCaptureWorkflow` is called with the auto-resolved `{url, selector}` — unchanged request/response shape otherwise.

**AC3:** Given an AC with a manually-set capture target AND a resolvable auto-target, When the page renders, Then the manually-set target is used, not the auto-resolved one — the auto-detected value is never shown as if it were the active target in this case.

**AC4:** Given an AC where the test-plan artefact exists but names no E2E spec for that AC (manual-only per the test-plan's own Step 3a classification), When the page renders, Then today's existing manual-entry form shows unchanged — no behavioural regression for ACs that were never meant to be E2E-derivable.

**AC5:** Given a test-plan artefact fetch that 404s or a spec file fetch that fails for any reason, When the page renders, Then the page still renders successfully with today's manual-entry form for that AC — an auto-resolution failure must never surface as a page error or block the existing fallback.

**AC6:** Given the "Override" control on an auto-detected target, When clicked, Then the existing manual-entry form (`handlePostCaptureTarget`) appears and, on submit, its value takes priority per Architecture Constraint 4 above.

## Out of Scope

- The "Capture all" bulk flow (`actr-s3`).
- Any change to how DoD/review artefacts are read.
- Changing the `test-plan.md` template's own `File:` convention.

## NFRs

- **Security:** The fetched spec file content is tenant-repo content read through the same tenant+product-scoped `_resolveJourney`/`fetchArtefact` path every other read in this file already uses — no new access-control surface. The relative-path guard from `actr-s1` AC3 is the control that matters here: an auto-resolved target must still only ever navigate within the tenant's own `baseUrl`.
- **Performance:** One additional artefact fetch (`test-plan.md`), and only when that resolves, one additional fetch (the named spec file), per AC lacking a manual target — bounded, not fanned out beyond the AC count already being rendered.
- **Accessibility:** The auto-detected read-only display and "Override" control must remain keyboard-operable, matching this page's own existing AC5 convention (`ppc-s6`).
- **Audit:** None beyond existing logging.

## Complexity Rating

**Rating:** 2 — some ambiguity in exactly how the test-plan `File:` line should be parsed robustly across every existing `test-plan.md` in this repo (format sampled from `ppc-s6` only so far); known unknown, not blocking.
**Scope stability:** Stable.
