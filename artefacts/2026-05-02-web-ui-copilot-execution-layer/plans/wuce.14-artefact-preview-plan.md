# Implementation Plan: wuce.14 — Artefact preview while skill executes

**Branch:** feat/wuce.14-artefact-preview
**Worktree:** .worktrees/wuce.14-artefact-preview
**Test file:** tests/artefact-preview.test.js (18 tests — requires jsdom)
**Test run:** node tests/artefact-preview.test.js

---

## Dependencies

`src/utils/markdown-renderer.js` — **exists on master** (wuce.2). Reuse for rendering artefact content to HTML. Do NOT create a parallel renderer (DRY/ADR-012).

`tests/fixtures/cli/copilot-cli-success.jsonl` — **must exist on master** (wuce.9). T2.1 and T2.2 read directly from this fixture.

`jsdom` — must be a dev dependency. Check `package.json`; if absent, add with `npm install --save-dev jsdom`.

wuce.13 routes for `/api/skills/:name/sessions/:id/state` extend the session model — wuce.14 adds a new state polling endpoint, wuce.13 adds session creation. Both branches may touch `src/web-ui/routes/skills.js`. If wuce.13 has already merged, extend that file; if not, create the route in a separate file (`src/web-ui/routes/skill-state.js`) and mount it.

---

## File touchpoints

| File | Action |
|------|--------|
| `src/artefact-extractor.js` | CREATE — `extractArtefactFromEvents(events)` |
| `src/artefact-sanitiser.js` | CREATE — `sanitiseArtefactContent(raw)` |
| `src/preview-renderer.js` | CREATE — `renderPreviewPanel(doc, state)` |
| `src/web-ui/routes/skills.js` | EXTEND (add state polling route) — or CREATE `src/web-ui/routes/skill-state.js` if wuce.13 not yet merged |
| `src/web-ui/server.js` | EXTEND if new router file needed |
| `tests/artefact-preview.test.js` | EXISTS (TDD stub) |
| `package.json` | ALREADY EXTENDED |

---

## Security requirements (CRITICAL)

1. Artefact content must be HTML-sanitised before browser DOM insertion — strip `<script>`, `<iframe>`, `onclick`, `onerror`, and all event handlers
2. Raw CLI JSONL must never appear in session state responses
3. Preview endpoint must enforce user-session binding (403 for cross-user access)
4. v1 uses polling only — NO WebSocket, NO SSE (AC2 constraint)

---

## Task 1 — Create `src/artefact-extractor.js`

```js
'use strict';

/**
 * extractArtefactFromEvents(events) -> { content: string|null, complete: boolean }
 *
 * Reads an array of CLI output event objects and extracts the artefact.
 * - Events of type 'artefact' contribute content
 * - The LAST artefact event wins (streaming: partial updates)
 * - Phase 'complete' on any artefact event → complete:true
 * - No artefact events → { content: null, complete: false }
 */
function extractArtefactFromEvents(events) {
  if (!Array.isArray(events)) { return { content: null, complete: false }; }

  let content  = null;
  let complete = false;

  for (const event of events) {
    if (event && event.type === 'artefact') {
      content  = event.content != null ? event.content : content;
      if (event.phase === 'complete') { complete = true; }
    }
  }

  return { content, complete };
}

module.exports = { extractArtefactFromEvents };
```

**TDD step:** Run `node tests/artefact-preview.test.js` — T2.1/T2.2/T2.3/T2.4 must pass.

---

## Task 2 — Create `src/artefact-sanitiser.js`

Uses the existing markdown renderer from wuce.2 for safe HTML rendering. Strips dangerous elements.

```js
'use strict';

// Dangerous HTML patterns to strip before DOM insertion
const SCRIPT_BLOCK = /<script[\s\S]*?<\/script>/gi;
const IFRAME_BLOCK = /<iframe[\s\S]*?(?:<\/iframe>|>)/gi;
const EVENT_ATTRS  = /\s(on\w+)="[^"]*"/gi;
const DANGEROUS_TAGS = /<(embed|object|form|input|button|link|meta)[^>]*>/gi;

/**
 * sanitiseArtefactContent(raw) -> string
 *
 * Strips dangerous HTML from artefact content before browser rendering.
 * Clean markdown is returned intact — no over-sanitisation.
 *
 * This is defence-in-depth on top of CSP headers.
 */
function sanitiseArtefactContent(raw) {
  if (typeof raw !== 'string') { return ''; }
  let clean = raw;
  clean = clean.replace(SCRIPT_BLOCK, '');
  clean = clean.replace(IFRAME_BLOCK, '');
  clean = clean.replace(EVENT_ATTRS, '');
  clean = clean.replace(DANGEROUS_TAGS, '');
  return clean;
}

module.exports = { sanitiseArtefactContent };
```

**TDD step:** Run `node tests/artefact-preview.test.js` — T3.1/T3.2/T3.3 must pass.

---

## Task 3 — Create `src/preview-renderer.js`

```js
'use strict';

/**
 * renderPreviewPanel(doc, state) -> void
 *
 * Renders the artefact preview panel into the given DOM document.
 * Creates or updates the #root element with:
 *   - [data-role="artefact-preview"] with aria-live="polite"
 *   - An h2/h3 heading
 *   - Rendered artefact content (sanitised markdown → HTML)
 *   - [data-action="commit-artefact"] button: disabled when complete:false
 *
 * @param {Document} doc   — jsdom or browser Document
 * @param {object}   state — { content: string|null, complete: boolean }
 */
function renderPreviewPanel(doc, state) {
  const root = doc.querySelector('#root') || doc.body;
  const content  = (state && state.content)  || '';
  const complete = !!(state && state.complete);

  root.innerHTML = [
    '<section data-role="artefact-preview" aria-live="polite">',
    '  <h2>Artefact Preview</h2>',
    '  <div data-role="preview-content">' + escapeHtml(content) + '</div>',
    '  <button data-action="commit-artefact"' + (complete ? '' : ' disabled') + '>',
    '    Commit artefact',
    '  </button>',
    '</section>'
  ].join('\n');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { renderPreviewPanel };
```

**TDD step:** Run `node tests/artefact-preview.test.js` — T4.1/T4.2/T4.3/NFR2/NFR3 must pass.

---

## Task 4 — Add state polling route `GET /api/skills/:name/sessions/:id/state`

If `src/web-ui/routes/skills.js` exists (wuce.13 merged), add to it. Otherwise create `src/web-ui/routes/skill-state.js`.

```js
// GET /api/skills/:name/sessions/:id/state — polling endpoint (v1: no WebSocket/SSE per AC2)
router.get('/:name/sessions/:id/state', requireAuth, requireValidSkillName, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId  = req.session.userId;

    // Cross-user guard
    const session = await sessionManager.getSession(id);
    if (!session) {
      return res.status(404).json({ error: 'SESSION_NOT_FOUND' });
    }
    if (session.userId !== userId) {
      return res.status(403).json({ error: 'SESSION_FORBIDDEN' });
    }

    // Build state response — never include raw JSONL
    const { extractArtefactFromEvents } = require('../../artefact-extractor');
    const { sanitiseArtefactContent }   = require('../../artefact-sanitiser');

    const events   = session.events || [];
    const artefact = extractArtefactFromEvents(events);
    const safeContent = artefact.content ? sanitiseArtefactContent(artefact.content) : null;

    res.json({
      status:          session.status || 'in-progress',
      currentQuestion: session.currentQuestion || null,
      partialArtefact: safeContent,
      complete:        artefact.complete
    });
  } catch (err) { next(err); }
});
```

**TDD step:** Run `node tests/artefact-preview.test.js` — T1.1/T1.2/T1.3/T1.4 must pass.

---

## Task 5 — Install jsdom if not present

```bash
npm install --save-dev jsdom
```

Then: `node tests/artefact-preview.test.js` — all 18 tests must pass.

---

## Commit

```
feat(wuce.14): artefact preview panel with polling and sanitisation

- src/artefact-extractor.js: extractArtefactFromEvents() reads CLI JSONL events
- src/artefact-sanitiser.js: sanitiseArtefactContent() strips XSS vectors
- src/preview-renderer.js: renderPreviewPanel() with aria-live + commit button
- GET /api/skills/:name/sessions/:id/state: polling endpoint (v1, no SSE/WS per AC2)

All 18 tests in tests/artefact-preview.test.js pass.
Closes #277
```
