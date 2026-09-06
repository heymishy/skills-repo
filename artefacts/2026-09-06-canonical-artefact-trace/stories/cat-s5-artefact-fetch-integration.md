## Story: Opening any single document resolves through the canonical trace, not independent logic

**Epic reference:** artefacts/2026-09-06-canonical-artefact-trace/epics/canonical-artefact-trace.md
**Discovery reference:** artefacts/2026-09-06-canonical-artefact-trace/discovery.md
**Benefit-metric reference:** artefacts/2026-09-06-canonical-artefact-trace/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Developer/engineer**,
I want **`/artefact/:slug/:type` to resolve a document's real path using the same canonical trace `/features/:slug` uses**,
So that **the two routes can never disagree with each other about where a document lives — closing the exact class of gap `adlr-s1` fixed for one route in isolation**.

## Benefit Linkage

**Metric moved:** Bugs of this class per session
**How:** `artefact-fetcher.js`'s own resolution-order logic (`adlr-s1`'s fix) is currently independent of `feature-story-structure.js`'s. This story makes both routes consume the same trace, so a future fix to resolution logic happens once, not twice.

## Architecture Constraints

- Must not break the existing `/artefact/:slug/:type` URL shape — `adlr-s1`'s link-encoding convention (already shipped, already load-bearing for every currently-generated link) remains compatible, per the discovery artefact's own named constraint.
- `journey.js`'s gate-confirm fetch (line 921) and `export-data-source.js`'s SaaS export fetch are named regression surfaces (per the design artefact's own integration-point audit) — both call `fetchArtefact` directly and must keep working unchanged; this story's own regression coverage is `cat-s6`, not duplicated here.

## Dependencies

- **Upstream:** cat-s1 (trace builder), cat-s2 (label table) — the fetch/resolve logic consumes the trace's own path resolution instead of `artefact-fetcher.js`'s independent `ARTEFACT_SUBDIRS`-based fallback probe.
- **Downstream:** cat-s6 (regression verification for the two named non-trace consumers).

## Acceptance Criteria

**AC1:** Given a correctly-generated link from `cat-s4`'s own rendering (a URL-encoded relative path, e.g. `dor%2Fpsh-s1-dor`), when `/artefact/:slug/:type` resolves it, then it returns the exact same document `adlr-s1`'s existing direct-path resolution already returns — no behavioural change for the already-working case.

**AC2:** Given a link to a document that only the canonical trace's inference (from `cat-s3`) can locate — e.g. an unregistered document on `phase4` that the trace grouped by filename pattern — when `/artefact/:slug/:type` is opened for it, then it resolves to the real file, not a 404, using the trace's own resolved path rather than `artefact-fetcher.js`'s independent bare-name subdirectory probe.

**AC3:** Given a document the trace classifies as `orphaned-registration` (a registered slug with no matching file), when its artefact link is opened, then it returns a real 404 with a clear message distinguishing "this document doesn't exist" from `adlr-s1`'s existing "artefact not found" for a never-registered path — an operator should be able to tell these apart.

**AC4:** Given the existing `ArtefactNotFoundError`/`ArtefactFetchError` error-handling contract in `artefact.js` (postgres-fallback, error page rendering), when this story's changes land, then that contract is unchanged — this story swaps the resolution logic feeding into the existing error handling, not the error handling itself.

## Out of Scope

- `journey.js`'s and `export-data-source.js`'s own call sites — those keep calling `fetchArtefact` with a bare `stageName`/artefact type exactly as they do today; this story does not require them to adopt trace-based resolution (verified unaffected in `cat-s6`).
- Any change to the GitHub Contents API interaction itself (auth, timeout, retry) — unchanged from `adlr-s1`.

## NFRs

- **Performance:** No regression vs. `adlr-s1`'s existing bounded-probe behaviour; the common case (a correctly-encoded link) still resolves in 1-2 requests.
- **Security:** None identified — no new input surface.
- **Accessibility:** Not applicable — backend resolution logic.
- **Audit:** Unchanged — existing `artefact_read` audit logging in `artefact.js` continues to fire identically.

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
