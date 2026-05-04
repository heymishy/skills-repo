# AC Verification Script: dsq.3 — Post-session /clarify gate

**Story:** dsq.3 — Post-session /clarify gate for web UI skill sessions

---

## Automated check

```
node tests/check-dsq3-post-session-clarify-gate.js
```

Expected before implementation: 0 passed, 7 failed.
Expected after implementation: 7 passed, 0 failed.

Full regression:
```
npm test
```

---

## Manual AC verification steps

### AC1 — Final answer nextUrl → `/complete`

```
node -e "
const routes = require('./src/web-ui/routes/skills');
routes.setSkillTurnExecutorAdapter(async () => 'insight');
routes.setNextQuestionExecutorAdapter(async () => 'next Q');
routes.registerHtmlSession('t1', '/tmp/t1', 'discovery');
const sess = routes._getHtmlSession('t1');
// Force single-question session for easy testing
sess.questions = [{ id: 'q1', text: 'What is your background? This is a long question text.' }];
routes.htmlRecordAnswer('discovery', 't1', 'My answer').then(r => console.log(r.nextUrl));
"
```

**Pass condition:** Prints a URL containing `/complete`, not `commit-preview`.

---

### AC2 — Complete page has all required elements

```
node -e "
const routes = require('./src/web-ui/routes/skills');
routes.registerHtmlSession('t2', '/tmp/t2', 'discovery');
const html = routes.htmlGetCompletePage('discovery', 't2');
console.log(html.includes('Draft complete'));
console.log(html.includes('discovery'));
console.log(html.includes('Commit artefact'));
console.log(html.includes('Run /clarify first'));
"
```

**Pass condition:** All four `true`.

---

### AC3 — Commit button links to commit-preview

Manual: Navigate to `/skills/discovery/sessions/:id/complete` after completing a session.
Inspect: "Commit artefact" button href includes `commit-preview`.

---

### AC4 — Clarify link → `/skills/clarify`

Manual: Inspect the complete page HTML — "Run /clarify first" href is `/skills/clarify`.
After clicking, verify the clarify skill launcher loads and the original session is still accessible.

---

### AC5 — Visual hierarchy: commit primary, clarify secondary

Manual: On the complete page, "Commit artefact" must appear above and/or be styled as the primary CTA. "Run /clarify first" must appear below or styled as secondary.

---

### AC6 — No regressions

```
node tests/check-wuce26-per-answer-model-response.js
node tests/check-dsq1-dynamic-next-question.js
node tests/check-dsq1-5-section-aware-extraction.js
node tests/check-dsq2-section-confirmation-loop.js
```

**Pass condition:** All pass.

---

## NFR verification

**Security check — no session data in complete page:**

```
node -e "
const routes = require('./src/web-ui/routes/skills');
routes.registerHtmlSession('sec', '/tmp/sec', 'discovery');
const sess = routes._getHtmlSession('sec');
sess.answers = ['My sensitive answer'];
sess.skillContent = 'SKILL.md content (large)';
const html = routes.htmlGetCompletePage('discovery', 'sec');
console.log('answers leaked:', html.includes('My sensitive answer'));
console.log('skillContent leaked:', html.includes('SKILL.md content'));
"
```

**Pass condition:** Both `false`.
