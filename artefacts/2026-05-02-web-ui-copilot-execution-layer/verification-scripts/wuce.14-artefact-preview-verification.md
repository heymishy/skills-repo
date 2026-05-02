# Verification Script: wuce.14 — Incremental artefact preview

**Story:** wuce.14-artefact-preview
**AC count:** 5
**Test suite:** `tests/check-wuce14-artefact-preview.js`

---

## Pre-conditions

- Web UI backend running; active skill session in progress (wuce.13 flow)
- `tests/fixtures/cli/copilot-cli-success.jsonl` present (shared from wuce.9)
- Test session has at least one completed answer with a partial artefact event

---

## AC1 — Preview panel shows partial artefact alongside form

**Automated:** GET `/api/skills/:name/sessions/:id/state` returns `{ partialArtefact: { content, complete } }`; DOM state test verifies `[data-role="artefact-preview"]` element is present with content after first answer

**Human smoke test:**
1. Start a `/discovery` session and submit the first answer
2. Verify: a preview panel appears alongside the question form (not below it, not on a separate page)
3. Verify: the panel contains partial artefact prose (not raw markdown or JSONL)
4. Verify: the panel updates visibly after submitting the second answer

---

## AC2 — Preview updates without full page reload

**Automated:** After submitting an answer, polling the state endpoint returns updated `partialArtefact.content`; DOM test verifies `aria-live="polite"` on preview panel

**Human smoke test:**
1. Submit an answer and watch the preview panel
2. Verify: the page URL does not change and the page does not fully reload (browser tab title does not flash)
3. Verify: the preview panel content updates within ~1 second of the answer being submitted

---

## AC3 — Markdown tables and code blocks rendered as HTML

**Automated:** `sanitiseArtefactContent` returns content that, when inserted into a DOM, produces `<table>` elements and `<code>` / `<pre>` elements — not raw ` | ` or triple-backtick syntax

**Human smoke test:**
1. Trigger a skill session that produces artefact content containing a markdown table (| col1 | col2 |)
2. Verify: the table appears as a rendered HTML table in the preview panel — not raw `| col1 | col2 |` text
3. Verify: any code blocks appear with monospace font — not raw backtick text

**Negative check:** If the artefact contains raw markdown and the panel shows it un-rendered, this AC fails

---

## AC4 — Backend sanitises content before returning to browser

**Automated:** T3.1/T3.2: `<script>` and `<iframe>` tags stripped by `sanitiseArtefactContent`; T3.4: raw JSONL format never present in API response body

**Static check:**
```bash
grep -rn 'innerHTML\s*=' src/routes/ src/controllers/
# Must return zero results — no raw innerHTML assignment in route or controller files
# innerHTML assignments only permitted inside sanitise-then-render utility functions
```

**Human smoke test:**
1. Inspect the `/state` endpoint response in browser DevTools (Network tab)
2. Verify: response body contains plain text artefact content, not JSONL event format
3. Verify: no `{"type":"skill_start"` or similar JSONL event tokens appear in the response

---

## AC5 — Commit button active after final artefact event

**Automated:** T4.1: button has `disabled` attribute when `complete: false`; T4.2: button does NOT have `disabled` attribute when `complete: true`; T4.3: button has `aria-disabled="true"` when inactive

**Human smoke test:**
1. Observe the "Commit artefact to repository" button while answering questions
2. Verify: the button is visually disabled (greyed out, not clickable) while questions remain
3. Complete all questions
4. Verify: the button becomes active (clickable, normal colour) after the final artefact is generated
5. Verify: the button is keyboard-accessible (Tab + Enter activates it)

---

## Run commands

```bash
npx jest tests/check-wuce14-artefact-preview.js --verbose
npm test
```

---

## Gap table

| AC | Coverage type | Gap / risk |
|----|--------------|-----------|
| AC1 | Automated (API shape + DOM state) + human smoke | Low |
| AC2 | Automated (`aria-live` DOM attribute) + human smoke | Low — polling latency tested as NFR1; visual update timing is human-confirmed only |
| AC3 | Automated (sanitiser unit) + human smoke | Medium — actual HTML rendering of tables verified by human only (jsdom does not render CSS) |
| AC4 | Automated (sanitiser unit + JSONL absence) + static grep | Low |
| AC5 | Automated (DOM state: `disabled` attribute) + human smoke | Low |
