# AC Verification Script: dsq.2 — Section confirmation loop

**Story:** dsq.2 — Section confirmation loop for web UI skill sessions

---

## Automated check

```
node tests/check-dsq2-section-confirmation-loop.js
```

Expected before implementation: 0 passed, 9 failed.
Expected after implementation: 9 passed, 0 failed.

Full regression:
```
npm test
```

---

## Manual AC verification steps

### AC1 — `_sectionDraftExecutor` called at end of section

Start a skill session in the browser and answer all questions in the first section. After the last answer, the server must call `_sectionDraftExecutor`. Verify by checking server logs or wiring a logging adapter in development.

---

### AC2 — Draft → confirmation UI

After the last answer for a section, the UI must show:
- The draft text returned by `_sectionDraftExecutor`
- A "Confirm" button
- An "Edit" option

Verify by navigating through a multi-section skill session in the browser.

---

### AC3 — "Confirm" stores draft and advances

After confirming, observe:
- `session.sectionDrafts[0]` is set to the draft text
- The next question presented is from section 1

```
node -e "
const routes = require('./src/web-ui/routes/skills');
// Set up and run through the confirm flow programmatically
"
```

---

### AC4 — "Edit" stores operator text and advances

After editing, observe:
- `session.sectionDrafts[0]` is set to the operator-provided text (not the model draft)
- The next question is from section 1

---

### AC5 — API failure → silent fallback

Temporarily wire `_sectionDraftExecutor` to throw and complete a section. The UI should NOT show an error. The session should advance to the next section question.

---

### AC6 — Default stub throws

```
node -e "
const routes = require('./src/web-ui/routes/skills');
// Before calling setSectionDraftExecutorAdapter, attempt to trigger section-end
// and verify the exact error message appears in server logs
"
```

**Pass condition:** Error log contains `'Adapter not wired: _sectionDraftExecutor. Call setSectionDraftExecutorAdapter() with a real implementation before use.'`

---

### AC7 — No-section skill has no confirmation step

Run a skill with no H2 sections through a complete session. No confirmation screen should appear. Session flows directly from last answer to commit-preview (or /complete after dsq.3).

---

### AC8 — No regressions

```
node tests/check-wuce26-per-answer-model-response.js
node tests/check-dsq1-dynamic-next-question.js
node tests/check-dsq1-5-section-aware-extraction.js
```

**Pass condition:** All pass.
