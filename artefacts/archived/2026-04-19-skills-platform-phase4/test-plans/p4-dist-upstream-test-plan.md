# Test Plan: Upstream authority configuration from context.yml

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-upstream.md
**Epic:** E2 — Distribution model
**Complexity:** 1 (Stable)
**Test type:** Unit + governance check

---

## Test matrix

| ID | Description | Type | AC | Method | Pass condition |
|----|-------------|------|----|--------|----------------|
| T1 | upstream module exists at declared path | Unit | — | `fs.existsSync` | `src/distribution/upstream.js` present |
| T2 | `getUpstreamUrl` returns URL from context.yml | Unit | AC1 | Call with fixture config | Returns configured URL, not hardcoded value |
| T3 | `getUpstreamUrl` with no `skills_upstream.repo` throws named error | Unit | AC2 | Call with empty config | Error message matches AC2 exact string |
| T4 | `getUpstreamUrl` with changed URL returns new URL | Unit | AC3 | Call with URL-B config | Returns URL-B |
| T5 | lockfile `upstreamSource` matches config URL | Unit | AC3 | Inspect fixture lockfile output | Field equals configured URL |
| T6 | `loadContextConfig` validates `skills_upstream` schema | Unit | AC4 | Pass malformed config | Throws named schema error, not raw exception |
| T7 | ADR-004 governance — no hardcoded skills-repo URL in dist source files | Governance | AC4 | Scan `src/distribution/**` for `github.com/heymishy` | Zero matches outside test fixtures |
| T-NFR1 | Upstream URL not resolved speculatively (no network call at config-read time) | Security | NFR | Inspect module — no DNS/http call in `loadContextConfig` | No `http`, `https`, `dns`, `fetch` call in config-read path |
| T-NFR2 | Config read completes without filesystem errors on valid input | Correctness | NFR | Call with fixture | No thrown error |

---

## Test descriptions

### T1 — Module exists
`src/distribution/upstream.js` must exist. If absent, all remaining tests skip as not-yet-implemented.

### T2 — getUpstreamUrl with valid config
Call `getUpstreamUrl({ skills_upstream: { repo: 'https://example.com/org/repo.git' } })`. Expect return value `'https://example.com/org/repo.git'`.

### T3 — Missing repo field → named error
Call `getUpstreamUrl({})` and `getUpstreamUrl({ skills_upstream: {} })`. Both must throw or return an error object whose message equals `"No upstream source configured — set skills_upstream.repo in .github/context.yml"` exactly.

### T4 — URL update reflected immediately
First call with URL-A, then call with URL-B config. Expect URL-B. (No caching between calls for different config objects.)

### T5 — Lockfile upstreamSource
When `writeLockfile` (or equivalent) is called with a config containing `skills_upstream.repo = URL-X`, the lockfile's `upstreamSource` field equals `URL-X`.

### T6 — Schema validation error
Call `loadContextConfig` with `{ skills_upstream: { repo: 12345 } }` (non-string repo field). Expect named error identifying the invalid field, not a raw type error.

### T7 — ADR-004 governance scan
Read all files in `src/distribution/` recursively. Confirm zero occurrences of `github.com/heymishy` or `skills-repo.git` outside a comment block labelled `test` or `fixture`.

### T-NFR1 — No speculative network call
Source-read `src/distribution/upstream.js`. Confirm `loadContextConfig` function body contains no `require('http')`, `require('https')`, `require('dns')`, or global `fetch` call.

---

## Coverage

| AC | Tests |
|----|-------|
| AC1 | T2, T4 |
| AC2 | T3 |
| AC3 | T4, T5 |
| AC4 | T6, T7 |
| NFR: Security | T-NFR1 |
| NFR: Correctness | T-NFR2 |
