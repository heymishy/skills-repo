## Implementation Plan: Surface decisions.md RISK-ACCEPT/SCOPE entries as a second reactive-work source

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s3-decisions-md-as-reactive-source.md
**Test plan reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s3-decisions-md-as-reactive-source-test-plan.md

---

## File map

| File | Change |
|------|--------|
| `src/web-ui/modules/decisions-reactive-source.js` (new) | `parseReactiveDecisions` (tolerant parser), `fetchReactiveDecisionsForFeature` (live fetch via the existing `fetchRepoPath`, never rejects), `fetchReactiveDecisionsForFeatures` (bounded concurrency, deduplicated slugs) |
| `src/web-ui/routes/products.js` | `handleGetProductView` fetches decisions items (async, before the synchronous render) and passes them as a new trailing parameter through `_renderProductView` to `_renderConsolidatedFeaturesSection`, which renders them via a new `_renderDecisionsReactiveSection` (all text through `_escapeHtml`, DESIGN.md tokens only) |
| `tests/check-urpv-s3-decisions-md-as-reactive-source.js` (new) | Unit tests for AC1-AC4 plus integration tests that drive the real `handleGetProductView` entry point with the real adapter seam (`setFetchRepoPath`) mocked |

## Task 1 (AC1, AC2, AC3) - tolerant parser

- Failing test first: the parser unit tests (well-formed RISK-ACCEPT, SCOPE with varied field order, mixed codes, malformed entry among good ones).
- Implementation: split on `---` segments; match the `**YYYY-MM-DD | CODE | phase**` header; report only the leading token of the code (real files contain `RISK-ACCEPT (informational)`, `SCOPE + DESIGN`); keep only RISK-ACCEPT/SCOPE; a segment with a `**Decision:**` field but no header, or a reactive header with no Decision field, is logged server-side and skipped.

## Task 2 (AC4, ADR-025) - live fetch that never throws

- Failing test first: 404 and generic failure resolve to `[]`; fetch called with the product's own owner/repo/accessToken and literal `artefacts/<slug>/decisions.md` path; unsafe slugs are never fetched.
- Implementation: call `artefact-fetcher.fetchRepoPath` (the already-wired adapter), catch everything, log non-404 failures.

## Task 3 (AC1, AC3, AC4, MC-SEC-01) - route + render wiring (separate task per D37 spirit: handler vs wiring)

- Failing test first: real `handleGetProductView` calls with a mocked adapter: items render, malformed entry dropped, 404 renders normally, script text escaped, correct per-tenant fetch arguments, no fetch without a connected repo or token.
- Implementation: add the async fetch in `handleGetProductView`, the new trailing parameters, and `_renderDecisionsReactiveSection`. Production wiring of `fetchRepoPath` already exists in `server.js` (`setFetchRepoPath(realFetchRepoPath)`); the page route is already registered at `server.js` (`handleGetProductView`).

## Verification commands

```
node tests/check-urpv-s3-decisions-md-as-reactive-source.js
node scripts/check-design-tokens.js src/web-ui/modules/decisions-reactive-source.js
node scripts/check-design-tokens.js src/web-ui/routes/products.js
```
Expected: 16 passed; module PASS; products.js reports only the pre-existing, RISK-ACCEPTed non-token colours (none introduced by this story).

## Open merge-blocking item (not performed by the coding agent)

The DoR requires real `decisions.md` fetch latency to be measured against a connected product and recorded in `nfr-profile.md` before merge. This needs a live GitHub token and a connected product, so it is left to the operator.
