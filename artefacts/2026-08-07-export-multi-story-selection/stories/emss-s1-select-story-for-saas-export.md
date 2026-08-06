## Story: Let a --from-saas export request specify which DoR-approved story to fetch

**Epic reference:** None — short-track (bounded refactor, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui, api]

## User Story

As an **operator running the bootstrap CLI's `--from-saas <slug>` flow against a feature with multiple DoR-signed-off stories**,
I want to **specify which story's artefact to export, not silently receive whichever one happens to be first in the feature's story array**,
So that **I can reliably fetch the specific story I actually need — increasingly common now that features regularly ship 2+ DoR-signed-off stories (e.g. `mtrr-s1`+`mtrr-s2`, `das-s1`+`das-s2` this session alone)**.

## Benefit Linkage

**Metric moved:** Correctness of the `--from-saas` export path for multi-story features (operational reliability, not a formal benefit-metric artefact — short-track).
**How:** `src/web-ui/adapters/export-data-source.js`'s `findDorApprovedStory(feature)` currently returns `collectStories(feature).find(s => s.dorStatus === 'signed-off' && s.dorArtefact) || null` — the *first* matching story, unconditionally. For any feature with 2+ signed-off stories, every export request silently gets the same first story regardless of which one the operator actually wanted, with no way to request a different one. Adding an explicit, optional story selector closes this gap without changing default behaviour for existing single-story callers.

## Architecture Constraints

- **D37 constraint (N/A — no new adapter required):** `findDorApprovedStory` is an internal, pure data-lookup helper inside the already-D37-wired `setExportDataSource`/`realExportDataSource` adapter pair from `rb-s4` — it calls no external service and needs no adapter of its own, matching `mtrr-s1`'s own H-ADAPTER: N/A precedent for the same reason.
- **Lookup-scoping guard (not classic path traversal — the `story` parameter is resolved against an already-fetched in-memory JSON structure, never used to construct a filesystem path):** the new story-slug parameter must be resolved only against the target feature's own known story slugs, and rejected (not silently ignored, and never resolved against a different feature) if it doesn't match any story on that feature — matching the authorization-scoping spirit of this codebase's existing path-traversal guards (ougl.5/ougl.6) even though the underlying risk shape differs.
- **Backward compatibility is mandatory, not aspirational:** the existing `GET /api/export/:slug` (no story parameter) call shape must continue to work identically — this story is additive, not a breaking change to the CLI's existing `--from-saas <slug>` invocations.

## Dependencies

- **Upstream:** None — `rb-s4`'s `setExportDataSource`/`realExportDataSource` and `findDorApprovedStory` are already merged and in production use.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a feature with 2+ DoR-signed-off stories and no story selector supplied, When `GET /api/export/:slug` is called, Then the response returns the first DoR-signed-off story's artefact — identical to today's existing behaviour (backward-compatible default, unchanged).

**AC2:** Given a feature with 2+ DoR-signed-off stories, When `GET /api/export/:slug?story=<story-slug>` is called with a story slug that exists on that feature and is DoR-signed-off, Then the response returns that specific story's artefact, not the first one.

**AC3:** Given `?story=<story-slug>` is supplied but that slug doesn't exist on the feature, or exists but isn't DoR-signed-off, When the request is made, Then a clear not-found-class error is returned (matching `ExportNotFoundError`'s existing convention and status code) — never a silent fallback to the first story.

**AC4:** Given a multi-story feature, When the operator runs `skills-repo init <dir> --from-saas <slug> --story <story-slug>` (a new companion flag to `--from-saas`), Then the CLI threads the story selector through to the export request and fetches/installs that specific story's artefact.

## Out of Scope

- **Changing the default (no-selector) behaviour** — stays "first found" per AC1's explicit backward-compatibility guarantee. A smarter default (e.g. "most recently signed off") is a separate, larger behaviour-change decision, not in scope here.
- **Any change to how DoR sign-off itself works** — this story only changes which already-signed-off story gets selected for export, not the sign-off process.
- **Exporting multiple stories in a single request** — one story per request, matching the existing single-artefact response shape.

## NFRs

- **Performance:** Negligible — the same single filter/find pass over the feature's stories, now with an additional slug comparison when a selector is supplied.
- **Security:** The story-slug parameter is validated against the target feature's own known story slugs only (never used to construct a filesystem path, never resolved against a different feature) — matches this codebase's existing path-traversal guard pattern.
- **Accessibility:** Not applicable — no UI surface, machine-to-machine API only.
- **Audit:** The existing `export_fetch` audit log gains the selected story slug (or `null` for default) as an additional field — no new audit mechanism, an additive field on the existing log call.

## Complexity Rating

**Rating:** 1 — well understood, small additive change to an existing, already-tested function and route.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
