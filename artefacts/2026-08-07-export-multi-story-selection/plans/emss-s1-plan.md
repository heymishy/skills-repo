# Implementation Plan: Let a --from-saas export request specify which DoR-approved story to fetch

**Story reference:** artefacts/2026-08-07-export-multi-story-selection/stories/emss-s1-select-story-for-saas-export.md
**DoR contract reference:** artefacts/2026-08-07-export-multi-story-selection/dor/emss-s1-dor-contract.md
**Test plan reference:** artefacts/2026-08-07-export-multi-story-selection/test-plans/emss-s1-test-plan.md
**Plan author:** Coding agent (Claude Code)
**Date:** 2026-08-07

## Pre-implementation findings

`req.query` is already populated by `server.js`'s `router()` (via `parseQuery(parsed.searchParams)`, `src/web-ui/server.js` line ~1793) before any route handler is called, including `handleExportRoute`. No change to `server.js`'s routing/dispatch code is required — `routes/export.js` can read `req.query.story` directly from the `req` object it already receives.

The DoR contract's assumption that `s.slug` is the correct story identifier is only half the existing convention. Grep across `src/web-ui/modules/product-rollup.js` (lines 140, 214, 285) shows the codebase's actual established pattern is `story.slug || story.id` — a fallback, since some in-repo fixtures and older story objects carry only `id`. This plan uses the same fallback for the new selector match, rather than `slug` alone, to stay consistent with existing story-identification logic elsewhere in the codebase.

A correctness risk was found in `cli/lib/saas-fetch.js`: it has its own local, duplicated copy of `findDorApprovedStory` (deliberately duplicated per its own header comment, to avoid a cross-package require). If the CLI's copy is not also given the `--story` selector, then when a caller requests a non-default story, the server will correctly return that story's `artefactContent`, but the CLI would independently re-derive the *default* (first) story's `dorArtefact` path to write that content to — silently writing story B's content under story A's file path. `saas-fetch.js` is already a named touch point in the DoR contract, so this fix is in scope, not scope creep: it is required for AC2/AC4 to be genuinely correct end-to-end, not just at the HTTP-request-URL level the test plan's AC4 test explicitly checks.

AC3 requires a status-code distinction from today's existing "nothing signed off at all" case: when no selector is given and nothing is signed off, the existing `ExportNotDorApprovedError` (409) must still fire unchanged (AC1 backward compatibility). When a selector *is* given and it does not resolve (either the slug doesn't exist on the feature, or it exists but isn't signed off), the DoR contract mandates `ExportNotFoundError` (404) instead — this is a new branch, not a change to the existing no-selector path.

## Tasks

1. **Write failing unit tests** for `findDorApprovedStory(feature, storySlug)` (AC1, AC2, AC3) and the route-level `?story=` handling (AC2, AC3), plus the NFR audit-log test, in a new `tests/check-emss-s1-select-story-for-saas-export.js`. Confirm they fail against the current, unmodified code before writing any implementation.
2. **Write failing integration test** for the CLI `--story` flag threading through to the constructed request URL (AC4), in the same test file, using a mocked HTTP fetch (mirrors `tests/check-rb-s4-saas-connected-bootstrap.js`'s `createMockSaasFetch` pattern).
3. **Implement `findDorApprovedStory(feature, storySlug)`** in `src/web-ui/adapters/export-data-source.js` — optional second parameter; unset behaves exactly as today (first signed-off story with a `dorArtefact`); set, filters to the signed-off story whose `slug || id` matches.
4. **Implement `realExportDataSource(slug, credential, storySlug)`** — thread the optional third parameter to `findDorApprovedStory`; when a selector was supplied and no story matches, throw `ExportNotFoundError(slug)` (AC3); when no selector was supplied and nothing matches, keep the existing `ExportNotDorApprovedError(slug)` behaviour unchanged (AC1).
5. **Implement `handleExportRoute` query-param read** in `src/web-ui/routes/export.js` — read `req.query && req.query.story`, thread it as the adapter's third argument, and add `storySlug: storySlug || null` to the existing `export_fetch` audit log call. Update the module's D37 header comment to reflect the new 3-arg adapter signature.
6. **Implement CLI `--story` flag parsing** in `cli/bin/init.js` — mirrors the existing `--from-saas` value-flag parsing exactly (value lookup, `consumedIndices` exclusion so it's never mistaken for the target directory, an error if `--story` is given with no value). No validation that `--from-saas` is also present is needed in the parser itself — `runInit` only consumes `opts.story` inside its existing `if (opts.fromSaas)` block, which is what makes `--story` a true no-op companion flag when `--from-saas` is absent (DoR constraint).
7. **Thread the flag through `cli/lib/init.js`'s `runInit`** — pass `opts.story` into `fetchFromSaas`'s options object.
8. **Implement `cli/lib/saas-fetch.js`** — add `story` to `fetchFromSaas`'s `opts`; append `?story=<encoded>` to the constructed request URL when present; pass the same selector into its local `findDorApprovedStory(feature, storySlug)` copy (updated with the same optional second parameter as step 3) so the file it writes to disk matches the story the server actually returned content for.
9. **Run the new test file alone** — confirm all new tests pass.
10. **Run the full suite** (`npm test`) — confirm zero new regressions against the pre-implementation baseline count.
11. **Manually walk the verification script's 3 scenarios** where feasible without a running server (fixture-driven, matching the existing test's mocked-fetch approach); note anything that could not be verified this way.

## Out of scope (per story + contract)

- Changing the no-selector default behaviour.
- Exporting multiple stories in one request.
- Any change to DoR sign-off itself.
