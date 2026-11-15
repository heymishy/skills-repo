## Test Plan: Answer "artefact not found" quickly, and never 503, for a link that cannot name an artefact

**Story reference:** artefacts/2026-11-16-artefact-not-found/stories/anf-s1-artefact-not-found.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-anf-s1-artefact-not-found.js`. Seams: `handleArtefactRoute` with `setFetcher` and a recording stub (AC1 to AC3, AC7), the real `createApp()` route table with a signed-in test session as in `tests/check-ure-s1-malformed-escape-404.js` and `global.fetch` replaced by a recording stub (AC4), and `fetchArtefact` with `global.fetch` stubbed (AC5, AC6). Existing `tests/check-adlr-s1-artefact-link-resolution.js` and `tests/check-cat-s5-artefact-fetch-integration.js` are left unchanged and must keep passing.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Control character, leftover `%`, empty or over-long: 404, no GitHub request, no report | - | 1 (T1) | - | - | - | 🟢 |
| AC2 | Traversal-shaped type or slug: same 404 | - | 1 (T2) | - | - | - | 🟢 |
| AC3 | Well-formed requests unchanged; every real slug passes | - | 2 (T3a fetch and render, T3b real directory listing) | - | - | - | 🟢 |
| AC4 | Real route table: the two reported urls 404 with no fetch; unauthenticated still 302 | - | 1 (T4) | - | - | - | 🟢 |
| AC5 | Unknown bare name: not found in under 1.5 s | - | 1 (T5) | - | - | - | 🟢 |
| AC6 | Probe priority, earlier failure still raises, at most 24 requests | - | 1 (T6, three cases) | - | - | - | 🟢 |
| AC7 | Real upstream failure still 503 | - | 1 (T7) | - | - | - | 🟢 |
| AC8 | Live: 404 quickly, no issue | - | - | - | 1 | Live-only | 🟡 |
| NFR | Validation never throws; value not echoed | 1 (T8) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the deployed app | AC8 | Live-only | Verification scenario 9; `production-observed` |

No AC depends on CSS layout; no B2 classification needed.

## Test Data Strategy

**Source:** Synthetic, real shapes. The broken escape is produced by the route's own path (`%E0%A4%A` stays raw as the slug; the decode of the type fails and falls back to the raw segment). The slug list for T3b is read from the real `artefacts/` directory at test time. **PCI/sensitivity:** No. **Owner:** self-contained.

## Tests (new file `tests/check-anf-s1-artefact-not-found.js`)

- **T1 (AC1).** Signed-in session; for slug/type pairs `('%00','%00')`, `('%E0%A4%A','discovery')`, `('2026-01-01-x','%E0%A4%A')`, `('', 'discovery')`, a 300-character slug, a 300-character type: status 404, body contains `artefact not found`, body does not contain the input, recording fetcher called 0 times, zero error reports. Fails today (the fetcher is called, or 503).
- **T2 (AC2).** Types `../x`, `a/../b`, `a//b`, `/a`, `.hidden`, slug `a/b`, slug `..`: same 404 and 0 fetcher calls. Fails today (fetcher called).
- **T3a (AC3).** Slug `2026-01-01-example-feature` with types `discovery`, `dor/psh-s1-dor`, `v1.2-notes`: fetcher called once with the same arguments as today, status 200.
- **T3b (AC3).** Every directory name under the real `artefacts/` (including `archived`'s children) passes the slug check.
- **T4 (AC4).** Real `createApp()` router, signed-in test session, `global.fetch` replaced by a recording stub: GET `/artefact/%00/%00` and `/artefact/%E0%A4%A/discovery` each answer 404 and the stub is never called; an unsigned request answers 302 to `/`. Fails today (503).
- **T5 (AC5).** `global.fetch` stub answers 404 after 150 ms; `fetchArtefact('f', 'nope', 't')` rejects with `ArtefactNotFoundError` in under 1500 ms. Fails today (about 3.6 s).
- **T6 (AC6).** Three cases with `global.fetch` stubs: (a) the hit is at `artefacts/f/dor/x.md` and a later candidate also exists but answers first: the earlier one's content is returned; (b) a 500 at an earlier candidate than the hit: `ArtefactFetchError`; (c) all 404: at most 24 requests were made.
- **T7 (AC7).** Fetcher stub that throws `ArtefactFetchError`: 503, body contains `Unable to load artefact`.
- **T8 (NFR).** The validator returns false (never throws) for `undefined`, `null`, a number, an object and a string with lone surrogates.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real GitHub latency not exercised | Tests use a stub with an injected delay | AC8 samples production |

**Total automated tests:** 10 (T1, T2, T3a, T3b, T4, T5, T6, T7, T8; T6 has three cases) plus AC8 live.
