# Test Plan: Read and render a single pipeline artefact in plain prose

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.2-read-render-artefact.md
**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e1-walking-skeleton.md
**Test plan author:** Copilot
**Date:** 2026-05-02

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Authenticated → /artefact/[slug]/discovery → Contents API → rendered HTML prose | 3 | 1 | — | — | — | 🟢 |
| AC2 | Markdown table → HTML table with visible column headers | 2 | — | — | 1 | Layout-dependent | 🟡 |
| AC3 | Unknown feature slug → "artefact not found" message | 2 | 1 | — | — | — | 🟢 |
| AC4 | GitHub API rate-limit/network error → human-readable message; technical detail logged | 3 | 1 | — | — | — | 🟢 |
| AC5 | Discovery artefact → Status, Approved by, Created metadata bar visible | 2 | — | — | 1 | Layout-dependent | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Table visually rendered with visible borders and column headers (visual rendering) | AC2 | Layout-dependent | CSS rendering and visual border presence requires a browser/screenshot; DOM test confirms element structure only | DOM-state test confirms `<th>` elements exist; visual confirmation is manual 🟡 |
| Metadata bar displayed above prose content (layout position) | AC5 | Layout-dependent | Vertical order in rendered HTML is testable via DOM structure, but visual rendering in viewport requires a browser | DOM order confirmed via unit test; visual confirmation is manual 🟡 |

---

## Test Data Strategy

**Source:** Fixtures — static JSON fixtures committed to `tests/fixtures/github/`; markdown fixtures in `tests/fixtures/markdown/`
**Named shared fixtures from wuce.1:** `tests/fixtures/github/user-identity.json` used to seed authenticated session in integration tests

### Fixtures required

| Fixture path | Purpose | Used by |
|---|---|---|
| `tests/fixtures/github/contents-api-discovery-md.json` | GitHub Contents API response for a discovery.md file (base64-encoded content) | wuce.2, wuce.5, wuce.14 |
| `tests/fixtures/github/contents-api-not-found.json` | GitHub Contents API 404 response | wuce.2, wuce.3 |
| `tests/fixtures/github/contents-api-rate-limit.json` | GitHub Contents API 403 rate-limit response | wuce.2, wuce.3 |
| `tests/fixtures/markdown/discovery-sample.md` | Sample discovery markdown — includes a table, Status/Approved by/Created fields | wuce.2 |

### Fixture contents

**`tests/fixtures/github/contents-api-not-found.json`:**
```json
{
  "message": "Not Found",
  "documentation_url": "https://docs.github.com/rest/repos/contents"
}
```

**`tests/fixtures/github/contents-api-rate-limit.json`:**
```json
{
  "message": "API rate limit exceeded for user ID 99001.",
  "documentation_url": "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting"
}
```

**`tests/fixtures/markdown/discovery-sample.md`** (abbreviated — full file committed to tests directory):
```markdown
## Discovery: Example Feature

**Status:** Approved
**Approved by:** Test Stakeholder
**Created:** 2026-01-15

## Summary

This is sample discovery content for testing.

## Constraints

| Constraint | Impact |
|------------|--------|
| No external CDN | Medium |
| OAuth only | Low |
```

**`tests/fixtures/github/contents-api-discovery-md.json`:**
```json
{
  "type": "file",
  "name": "discovery.md",
  "path": "artefacts/2026-01-01-example-feature/discovery.md",
  "sha": "abc123def456",
  "size": 1024,
  "content": "<base64 encoded content of discovery-sample.md>",
  "encoding": "base64",
  "download_url": "https://raw.githubusercontent.com/example/repo/main/artefacts/2026-01-01-example-feature/discovery.md"
}
```

Note: The implementing agent must populate `content` with the actual base64 of `discovery-sample.md`.

---

## Unit Tests

### AC1 — Contents API fetch and HTML rendering

**T1.1** `fetchArtefact(featureSlug, artefactType, token) calls Contents API with correct path`
- **AC:** AC1
- **Precondition:** Mock `fetch` to return `contents-api-discovery-md.json`; `GITHUB_API_BASE_URL` and `GITHUB_REPO` set in env
- **Action:** Call `fetchArtefact('2026-01-01-example-feature', 'discovery', 'gho_test_fixture_token_wuce1')`
- **Expected:** `fetch` called with URL containing `artefacts/2026-01-01-example-feature/discovery.md`; Authorization header contains `Bearer gho_test_fixture_token_wuce1`
- **Fails before implementation:** Yes

**T1.2** `fetchArtefact decodes base64 content from GitHub Contents API response`
- **AC:** AC1
- **Precondition:** Mock returns `contents-api-discovery-md.json` with base64-encoded `discovery-sample.md` content
- **Action:** `const content = await fetchArtefact('2026-01-01-example-feature', 'discovery', token)`
- **Expected:** Returned string is decoded markdown (not base64); contains `## Discovery: Example Feature`
- **Fails before implementation:** Yes

**T1.3** `renderArtefactToHTML(markdown) returns HTML string with heading elements`
- **AC:** AC1
- **Precondition:** Pass `discovery-sample.md` content
- **Action:** `const html = renderArtefactToHTML(markdown)`
- **Expected:** Result contains `<h2>`, `<p>`, and `<ul>` or `<li>` elements; is a string
- **Fails before implementation:** Yes

### AC2 — Markdown table renders as HTML table

**T2.1** `renderArtefactToHTML converts markdown table to <table> element with <th> headers`
- **AC:** AC2
- **Precondition:** Markdown input contains a pipe-delimited markdown table with two columns
- **Action:** `const html = renderArtefactToHTML(markdown)`
- **Expected:** Output contains `<table>`, `<th>`, `<td>` elements; pipe characters `|` do not appear in `<td>` content
- **Fails before implementation:** Yes

**T2.2** `renderArtefactToHTML table has correct number of header cells matching column count`
- **AC:** AC2
- **Precondition:** Markdown table with columns `Constraint` and `Impact`
- **Action:** Parse rendered HTML; count `<th>` elements
- **Expected:** Exactly 2 `<th>` elements with text `Constraint` and `Impact`
- **Fails before implementation:** Yes

### AC3 — Artefact not found

**T3.1** `fetchArtefact throws ArtefactNotFoundError when Contents API returns 404`
- **AC:** AC3
- **Precondition:** Mock `fetch` to return `contents-api-not-found.json` with status 404
- **Action:** `await fetchArtefact('unknown-feature', 'discovery', token)`
- **Expected:** Throws `ArtefactNotFoundError` (named error class, not a generic Error)
- **Fails before implementation:** Yes

**T3.2** `artefact route handler returns 404 page with "artefact not found" message when ArtefactNotFoundError thrown`
- **AC:** AC3
- **Precondition:** Mock `fetchArtefact` to throw `ArtefactNotFoundError`
- **Action:** Call artefact route handler
- **Expected:** Response status 404; response body contains "artefact not found" (case-insensitive); does not contain raw GitHub API error JSON
- **Fails before implementation:** Yes

### AC4 — GitHub API error handling

**T4.1** `fetchArtefact throws ArtefactFetchError when Contents API returns 403`
- **AC:** AC4
- **Precondition:** Mock `fetch` to return `contents-api-rate-limit.json` with status 403
- **Action:** `await fetchArtefact('example-feature', 'discovery', token)`
- **Expected:** Throws `ArtefactFetchError` with `cause` containing the GitHub error message
- **Fails before implementation:** Yes

**T4.2** `fetchArtefact throws ArtefactFetchError when fetch rejects (network error)`
- **AC:** AC4
- **Precondition:** Mock `fetch` to reject with `new Error('ECONNREFUSED')`
- **Action:** `await fetchArtefact('example-feature', 'discovery', token)`
- **Expected:** Throws `ArtefactFetchError`
- **Fails before implementation:** Yes

**T4.3** `artefact route handler returns human-readable error and logs technical detail when ArtefactFetchError thrown`
- **AC:** AC4
- **Precondition:** Mock `fetchArtefact` to throw `ArtefactFetchError` with technical detail; mock logger
- **Action:** Call artefact route handler
- **Expected:** Response body contains "Unable to load artefact" (or equivalent human-readable message); response body does NOT contain the raw technical error string; logger called with the technical error detail
- **Fails before implementation:** Yes

### AC5 — Metadata bar extraction

**T5.1** `extractMetadata(markdown) returns Status, Approved by, and Created fields`
- **AC:** AC5
- **Precondition:** Markdown string from `discovery-sample.md` containing `**Status:** Approved`, `**Approved by:** Test Stakeholder`, `**Created:** 2026-01-15`
- **Action:** `const meta = extractMetadata(markdown)`
- **Expected:** `meta.status === 'Approved'`; `meta.approvedBy === 'Test Stakeholder'`; `meta.created === '2026-01-15'`
- **Fails before implementation:** Yes

**T5.2** `renderArtefactToHTML places metadata section before prose content in DOM order`
- **AC:** AC5
- **Precondition:** Markdown with metadata fields and prose content
- **Action:** `const html = renderArtefactToHTML(markdown, meta)`
- **Expected:** In the returned HTML string, the metadata `<div>` or `<section>` with class `metadata-bar` appears before the `<article>` or `<main>` prose element
- **Fails before implementation:** Yes

---

## Integration Tests

**IT1** `GET /artefact/:slug/discovery returns 200 with rendered HTML for valid slug`
- **ACs:** AC1
- **Precondition:** Authenticated session (access token from `oauth-token-exchange-success.json`); mock Contents API to return `contents-api-discovery-md.json`
- **Action:** `GET /artefact/2026-01-01-example-feature/discovery`
- **Expected:** Status 200; Content-Type `text/html`; body contains `<h2>` elements; body does not contain raw markdown syntax (`##`, `**`)
- **Fails before implementation:** Yes

**IT2** `GET /artefact/:slug/discovery returns 404 page for unknown slug`
- **ACs:** AC3
- **Precondition:** Authenticated session; mock Contents API to return 404
- **Action:** `GET /artefact/nonexistent-feature/discovery`
- **Expected:** Status 404; body contains "artefact not found" message; no raw GitHub JSON in body
- **Fails before implementation:** Yes

**IT3** `GET /artefact/:slug/discovery returns error page when GitHub API returns rate-limit error`
- **ACs:** AC4
- **Precondition:** Authenticated session; mock Contents API to return 403 rate-limit response
- **Action:** `GET /artefact/example-feature/discovery`
- **Expected:** Status 503 (or 500); body contains "Unable to load artefact"; no GitHub API message in body
- **Fails before implementation:** Yes

---

## NFR Tests

**NFR1** `renderArtefactToHTML strips <script> tags from rendered output`
- **NFR:** Security — XSS prevention
- **Precondition:** Markdown input containing `<script>alert('xss')</script>`
- **Action:** `const html = renderArtefactToHTML(maliciousMarkdown)`
- **Expected:** Output does not contain `<script>` tag; `alert` string absent from output
- **Fails before implementation:** Yes

**NFR2** `renderArtefactToHTML strips <iframe> tags from rendered output`
- **NFR:** Security — XSS prevention
- **Precondition:** Markdown input containing `<iframe src="https://attacker.example"></iframe>`
- **Action:** `const html = renderArtefactToHTML(markdown)`
- **Expected:** Output does not contain `<iframe>` tag
- **Fails before implementation:** Yes

**NFR3** `artefact read event is logged with user ID, feature slug, artefact type, and timestamp`
- **NFR:** Audit
- **Precondition:** Mock logger; authenticated session with user ID 99001
- **Action:** Call artefact route handler for `discovery` type on slug `example-feature`
- **Expected:** Logger called with `event: 'artefact_read'`, `userId: 99001`, `featureSlug: 'example-feature'`, `artefactType: 'discovery'`, ISO timestamp
- **Fails before implementation:** Yes

---

## Gap table

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Table visible borders (visual CSS rendering) | AC2 | Layout-dependent | CSS border styling requires browser rendering | DOM confirms `<th>` elements; visual check is manual 🟡 |
| Metadata bar displayed above prose content (visual layout position) | AC5 | Layout-dependent | CSS flexbox/grid ordering requires browser; DOM order is tested in T5.2 | DOM order confirmed by T5.2; visual check is manual 🟡 |
