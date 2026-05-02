# AC Verification Script: wuce.2 — Read and render a single pipeline artefact in plain prose

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.2-read-render-artefact.md
**Test plan reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.2-read-render-artefact-test-plan.md
**Verification script author:** Copilot
**Date:** 2026-05-02

---

## Pre-verification checks

```bash
# 1. Jest tests pass
npx jest tests/wuce.2 --ci
# Expected: 0 failures

# 2. Fixture files exist
ls tests/fixtures/github/contents-api-discovery-md.json
ls tests/fixtures/github/contents-api-not-found.json
ls tests/fixtures/github/contents-api-rate-limit.json
ls tests/fixtures/markdown/discovery-sample.md
```

---

## AC1 — Authenticated user → artefact URL → rendered HTML prose

**Automated evidence (Jest):** T1.1, T1.2, T1.3, IT1

```bash
npx jest tests/wuce.2 --ci --testNamePattern="AC1|fetchArtefact|renderArtefactToHTML|GET /artefact"
```

**Expected:** All named tests pass.

**Manual confirmation:**
1. Start app locally with test credentials; sign in
2. Navigate to `/artefact/[valid-feature-slug]/discovery`
3. Confirm page renders heading hierarchy, paragraphs, and lists — no raw `##`, `**`, or `_` syntax visible
4. View page source — confirm HTML `<h2>`, `<p>` elements present

**Pass condition:** Page renders prose HTML; no raw markdown visible. ✅ / ❌

---

## AC2 — Markdown table renders as HTML table with visible column headers

**Automated evidence (Jest):** T2.1, T2.2

```bash
npx jest tests/wuce.2 --ci --testNamePattern="AC2|table|<th>|<table>"
```

**Expected:** Both table tests pass; output contains `<th>` elements.

**Manual confirmation (layout-dependent gap):**
1. Navigate to an artefact containing a markdown table (use `discovery-sample.md` content if needed)
2. Confirm the table is rendered with visible borders (not pipe-delimited text)
3. Confirm column headers are bold/styled (`Constraint`, `Impact`)
4. Confirm table is not styled as a code block

**Pass condition:** Visible HTML table with styled headers. ✅ / ❌

---

## AC3 — Unknown feature slug → "artefact not found" message

**Automated evidence (Jest):** T3.1, T3.2, IT2

```bash
npx jest tests/wuce.2 --ci --testNamePattern="AC3|ArtefactNotFoundError|not found"
```

**Expected:** All tests pass; 404 response with human-readable message; no raw GitHub JSON in response.

**Manual confirmation:**
1. Navigate to `/artefact/this-feature-does-not-exist/discovery`
2. Confirm user-facing message says "artefact not found" (or equivalent)
3. Confirm no JSON, no stack trace, no GitHub error JSON visible in the page

**Pass condition:** Friendly 404 message; no technical detail in UI. ✅ / ❌

---

## AC4 — GitHub API error → human-readable message; technical detail in logs only

**Automated evidence (Jest):** T4.1, T4.2, T4.3, IT3

```bash
npx jest tests/wuce.2 --ci --testNamePattern="AC4|ArtefactFetchError|rate.limit|network error|Unable to load"
```

**Expected:** All tests pass; route returns human-readable string; logger receives technical detail.

**Manual confirmation:**
1. Simulate a rate-limit scenario by temporarily setting an invalid access token; navigate to any artefact URL
2. Confirm the page shows "Unable to load artefact — please try again" (or similar)
3. Confirm no GitHub API message (e.g. "API rate limit exceeded") is visible in the browser page

**Pass condition:** Human-readable message in UI; GitHub error detail not visible. ✅ / ❌

---

## AC5 — Discovery artefact → Status, Approved by, Created fields in metadata bar

**Automated evidence (Jest):** T5.1, T5.2

```bash
npx jest tests/wuce.2 --ci --testNamePattern="AC5|extractMetadata|metadata.*bar|metadata.*before"
```

**Expected:** Both tests pass; `extractMetadata` returns correct fields; metadata `<div>` precedes prose `<article>` in DOM.

**Manual confirmation (layout-dependent gap):**
1. Navigate to a discovery artefact that contains `**Status:**`, `**Approved by:**`, and `**Created:**` fields
2. Confirm a metadata bar is visible above the prose body showing these three fields
3. Confirm the metadata bar is styled distinctly (e.g. bordered block, different background) — not just inline text

**Pass condition:** Metadata bar visible above prose; all three fields displayed. ✅ / ❌

---

## NFR verification

### Security — XSS prevention

```bash
npx jest tests/wuce.2 --ci --testNamePattern="NFR1|NFR2|script|iframe|XSS"
```

**Expected:** Both sanitisation tests pass.

### Audit — artefact read logged

```bash
npx jest tests/wuce.2 --ci --testNamePattern="NFR3|audit|artefact_read"
```

**Expected:** Logger called with correct fields; no access token in log entry.

---

## Full suite run

```bash
npx jest tests/wuce.2 --ci --coverage
```

**Expected:** 0 failures; `fetchArtefact` adapter and artefact route handler coverage ≥ 80%.

---

## Completion criteria

- [ ] All Jest tests pass with 0 failures
- [ ] Fixture files committed (`contents-api-discovery-md.json`, `contents-api-not-found.json`, `contents-api-rate-limit.json`, `discovery-sample.md`)
- [ ] AC2 manual visual confirmation of table rendering completed
- [ ] AC5 manual visual confirmation of metadata bar position completed
- [ ] NFR1/NFR2 XSS sanitisation tests passing
- [ ] NFR3 audit log test passing
