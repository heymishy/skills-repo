# Test Plan: wuce.14 — Incremental artefact preview as skill session progresses

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.14-artefact-preview.md
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Epic:** wuce-e4 (Phase 2 guided UI)
**Framework:** Jest + Node.js (backend + DOM-state); DOM tests use jsdom
**Test data strategy:** Static fixtures committed to `tests/fixtures/`
**Written:** 2026-05-02
**Status:** Failing (TDD — no implementation exists)

---

## Summary

| Category | Count |
|----------|-------|
| Unit | 12 |
| Integration | 3 |
| NFR | 3 |
| **Total** | **18** |

---

## Named shared fixtures

| Fixture | Defined in | Used here for |
|---------|-----------|---------------|
| `tests/fixtures/cli/copilot-cli-success.jsonl` | wuce.9 test plan | T2.1–T2.2: extract `artefact` event with `phase: "complete"` and `content` field |

---

## AC mapping

| AC | Summary | Test group |
|----|---------|-----------|
| AC1 | Preview panel shows partial artefact alongside form after each answer submission | T1, T3 |
| AC2 | Preview panel updates without full page reload (polling session state endpoint) | T1 |
| AC3 | Markdown tables + code blocks rendered as HTML, not raw markdown | T3 |
| AC4 | Backend sanitises artefact content before returning to browser | T2 |
| AC5 | "Commit artefact to repository" button active after final artefact event | T4 |

---

## Test groups

### T1 — Session state polling endpoint (GET /api/skills/:name/sessions/:id/state)

Module under test: route handler returning extracted artefact state

**T1.1** — returns well-shaped response with `status`, `currentQuestion`, and `partialArtefact`
```javascript
// Mock executor returns copilot-cli-success.jsonl events up to `progress` event
const res = await request(app)
  .get(`/api/skills/discovery/sessions/${sessionId}/state`)
  .set('Cookie', validSessionCookie);
expect(res.status).toBe(200);
expect(res.body).toMatchObject({
  status: expect.stringMatching(/^(active|complete)$/),
  currentQuestion: expect.objectContaining({ id: expect.any(String) }),
  partialArtefact: expect.objectContaining({
    content: expect.any(String),
    complete: expect.any(Boolean)
  })
});
```
Expected: FAIL

**T1.2** — returns 404 for unknown session ID
```javascript
const res = await request(app)
  .get('/api/skills/discovery/sessions/nonexistent-id/state')
  .set('Cookie', validSessionCookie);
expect(res.status).toBe(404);
```
Expected: FAIL

**T1.3** — returns 403 when session belongs to a different authenticated user
```javascript
// session created by userA; request made with userB cookie
const res = await request(app)
  .get(`/api/skills/discovery/sessions/${userASessionId}/state`)
  .set('Cookie', userBCookie);
expect(res.status).toBe(403);
```
Expected: FAIL

---

### T2 — Artefact extraction from JSONL output

Module under test: `extractArtefactFromEvents(events: ParsedEvent[]): { content: string | null, complete: boolean }`

**T2.1** — extracts `content` field from `artefact` event in the success fixture
```javascript
const { extractArtefactFromEvents } = require('../src/artefact-extractor');
const events = fs.readFileSync('tests/fixtures/cli/copilot-cli-success.jsonl', 'utf8')
  .split('\n').filter(Boolean).map(JSON.parse);
const result = extractArtefactFromEvents(events);
expect(result.content).toContain('AI-Driven Pipeline Automation');
expect(result.content).toContain('Problem statement');
```
Expected: FAIL

**T2.2** — `phase: "complete"` event marks artefact as `complete: true`
```javascript
const result = extractArtefactFromEvents(events); // uses success fixture with skill_complete
expect(result.complete).toBe(true);
```
Expected: FAIL

**T2.3** — no `artefact` events in event array → `partialArtefact: null`
```javascript
const events = [
  { type: 'skill_start', skillName: 'discovery' },
  { type: 'question', skillName: 'discovery', id: 'q1', text: 'What problem?' }
];
const result = extractArtefactFromEvents(events);
expect(result.content).toBeNull();
expect(result.complete).toBe(false);
```
Expected: FAIL

**T2.4** — multiple `artefact` events → last one wins (incremental update model)
```javascript
const events = [
  { type: 'artefact', skillName: 'discovery', phase: 'partial', content: 'First draft' },
  { type: 'artefact', skillName: 'discovery', phase: 'partial', content: 'Second draft' },
  { type: 'artefact', skillName: 'discovery', phase: 'complete', content: 'Final artefact' }
];
const result = extractArtefactFromEvents(events);
expect(result.content).toBe('Final artefact');
expect(result.complete).toBe(true);
```
Expected: FAIL

---

### T3 — Sanitisation before returning artefact content to browser

Module under test: `sanitiseArtefactContent(raw: string): string`

**T3.1** — script injection in artefact content is stripped
```javascript
const { sanitiseArtefactContent } = require('../src/artefact-sanitiser');
const dirty = '## Discovery\n\n<script>alert("xss")</script>\n\nLegitimate content.';
const clean = sanitiseArtefactContent(dirty);
expect(clean).not.toContain('<script>');
expect(clean).toContain('Legitimate content.');
```
Expected: FAIL

**T3.2** — iframe injection stripped
```javascript
const dirty = '## Section\n\n<iframe src="https://evil.example"></iframe>';
const clean = sanitiseArtefactContent(dirty);
expect(clean).not.toContain('<iframe');
```
Expected: FAIL

**T3.3** — clean markdown content returned intact (no over-sanitisation)
```javascript
const clean_md = '## Discovery: AI Pipeline\n\n**Problem:** Manual effort.\n\n- Item 1\n- Item 2';
const result = sanitiseArtefactContent(clean_md);
expect(result).toContain('Discovery: AI Pipeline');
expect(result).toContain('Problem:');
expect(result).toContain('Item 1');
```
Expected: FAIL

**T3.4** — raw CLI JSONL format is never present in session state response
```javascript
const res = await request(app)
  .get(`/api/skills/discovery/sessions/${sessionId}/state`)
  .set('Cookie', validSessionCookie);
const body = JSON.stringify(res.body);
expect(body).not.toContain('"type":"skill_start"');
expect(body).not.toContain('"type":"question"');
// JSONL events must not leak through the extraction layer
```
Expected: FAIL

---

### T4 — "Commit artefact to repository" button activation (DOM state)

Tests use jsdom document state. The session state API response drives the DOM render.

**T4.1** — button has `disabled` attribute when `complete: false`
```javascript
const { renderPreviewPanel } = require('../src/preview-renderer');
const doc = new JSDOM('<div id="root"></div>').window.document;
renderPreviewPanel(doc, { content: 'Partial content...', complete: false });
const btn = doc.querySelector('[data-action="commit-artefact"]');
expect(btn).not.toBeNull();
expect(btn.disabled).toBe(true);
```
Expected: FAIL

**T4.2** — button does NOT have `disabled` attribute when `complete: true`
```javascript
renderPreviewPanel(doc, { content: 'Final artefact content', complete: true });
const btn = doc.querySelector('[data-action="commit-artefact"]');
expect(btn.disabled).toBe(false);
```
Expected: FAIL

**T4.3** — preview panel has `aria-live="polite"` attribute
```javascript
renderPreviewPanel(doc, { content: 'Some content', complete: false });
const panel = doc.querySelector('[data-role="artefact-preview"]');
expect(panel).not.toBeNull();
expect(panel.getAttribute('aria-live')).toBe('polite');
```
Expected: FAIL

---

### NFR tests

**NFR1** — session state endpoint responds within 500ms for a session with completed events
```javascript
const start = Date.now();
const res = await request(app)
  .get(`/api/skills/discovery/sessions/${sessionId}/state`)
  .set('Cookie', validSessionCookie);
expect(Date.now() - start).toBeLessThan(500);
expect(res.status).toBe(200);
```
Expected: FAIL

**NFR2** — `aria-live` is a DOM attribute (not a CSS class or data attribute)
```javascript
renderPreviewPanel(doc, { content: 'Content', complete: false });
const panel = doc.querySelector('[data-role="artefact-preview"]');
// getAttribute returns the actual attribute — not checking classList
expect(panel.hasAttribute('aria-live')).toBe(true);
expect(panel.getAttribute('aria-live')).toBe('polite');
```
Expected: FAIL — confirms attribute is set on the element, not simulated via class

**NFR3** — preview panel heading is a heading element (not a div or span)
```javascript
renderPreviewPanel(doc, { content: 'Content', complete: false });
const heading = doc.querySelector('[data-role="artefact-preview"] h2, [data-role="artefact-preview"] h3');
expect(heading).not.toBeNull();
```
Expected: FAIL

---

## Integration tests

**INT1** — answer submission → poll state → preview panel content updated (full round-trip)
- Submit answer to `/api/skills/discovery/sessions/:id/answers`
- Poll `/api/skills/discovery/sessions/:id/state`
- Verify `partialArtefact.content` is non-null and sanitised
- Mock: executor returns events from `copilot-cli-success.jsonl`

**INT2** — complete artefact event → `complete: true` in state → commit button enabled
- Simulate all events from `copilot-cli-success.jsonl` delivered to session
- Poll state endpoint → verify `complete: true`
- Render preview panel → verify commit button is enabled

**INT3** — sanitisation pipeline integration: artefact content with injection attempt → clean content in state response
- Inject `<script>alert(1)</script>` into a mocked artefact event content field
- Verify GET /state response body does not contain the script tag

---

## Test data

| Fixture | Path | Used by |
|---------|------|---------|
| CLI success JSONL | `tests/fixtures/cli/copilot-cli-success.jsonl` | T2.1, T2.2, INT1, INT2 (shared from wuce.9) |

---

## Out-of-scope tests

- Markdown rendering into HTML elements (AC3) — the test verifies the response shape; actual DOM rendering of markdown tables is the responsibility of the existing `md-renderer.js` (already tested); these tests verify the server returns the correct content type and the renderer is called
- WebSocket or SSE streaming — explicitly deferred (story out-of-scope)
- Session write-back — wuce.15
