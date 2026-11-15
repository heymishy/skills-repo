# Contract Proposal - Answer "artefact not found" quickly, and never 503, for a link that cannot name an artefact

**What will be built:**
- `src/web-ui/routes/artefact.js`: an exported `isPlausibleArtefactRef(slug, artefactType)` (allow-list as in the story; never throws) called in `handleArtefactRoute` straight after the existing auth check; a failing value renders the existing "Artefact Not Found" 404 page without any fetch.
- `src/web-ui/adapters/artefact-fetcher.js`: the subdirectory fallback probes are started together (`Promise.allSettled`) and read back in the original priority order; first hit wins; a rejection reached before any hit is thrown; same 3 s probe timeout; at most 24 requests.
- `tests/check-anf-s1-artefact-not-found.js` (new, T1 to T8).

**What will NOT be built:**
- No change to `server.js` (the route already passes `slug` and a decoded `type` with a raw fallback; the validator handles the leftovers); no change to the direct attempts, the trace-based resolution, `ARTEFACT_SUBDIRS`, the 404 or 503 page text, or any other route; no negative cache; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | integration (`handleArtefactRoute`, recording fetcher) |
| AC2 | T2 | integration |
| AC3 | T3a, T3b | integration; real `artefacts/` listing |
| AC4 | T4 | integration with the real route table |
| AC5 | T5 | integration (`fetchArtefact`, delayed `global.fetch` stub) |
| AC6 | T6 | integration |
| AC7 | T7 | integration |
| AC8 | Scenario 9 | live (production-observed) |

**Assumptions:** the route in `server.js` (`/artefact/<seg>/<seg>`) hands `handleArtefactRoute` the raw second segment as the slug and `decodeURIComponent` of the third as the type, falling back to the raw third segment when decoding throws (confirmed by reading `server.js` lines 3496 to 3510); `fetchArtefact` is the only network caller on this route.

`schemaDepends: []`. **Estimated touch points:** Files: `src/web-ui/routes/artefact.js`, `src/web-ui/adapters/artefact-fetcher.js`, `tests/check-anf-s1-artefact-not-found.js` (new). Services: none. APIs: 503 becomes 404 for impossible refs; unknown bare names answer faster.
