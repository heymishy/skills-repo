# AC Verification Script: dsq.1.5 — Section-aware question extraction

**Story:** dsq.1.5 — Section-aware question extraction for web UI skill sessions

---

## Automated check

```
node tests/check-dsq1-5-section-aware-extraction.js
```

Expected before implementation: 0 passed, 7 failed.
Expected after implementation: 7 passed, 0 failed.

Full regression:
```
npm test
```

---

## Manual AC verification steps

### AC1 — `extractSections` returns `Array<{heading, questions[]}>`

```
node -e "
const { extractSections } = require('./src/skill-content-adapter');
const content = '## Section One\n\n> **What is your background?**\n\n## Section Two\n\n> **What are your goals?**\n';
const sections = extractSections(content);
console.log(JSON.stringify(sections, null, 2));
"
```

**Pass condition:** Prints an array with two objects, `heading: 'Section One'` and `heading: 'Section Two'`, each with one question.

---

### AC2 — No H2 headings → single section with empty heading

```
node -e "
const { extractSections } = require('./src/skill-content-adapter');
const content = '> **What is your background?**\n> **What are your goals?**\n';
const sections = extractSections(content);
console.log(sections.length, sections[0].heading);
"
```

**Pass condition:** Prints `1 ` (one section with empty heading).

---

### AC3 — Section union equals extractQuestions

```
node -e "
const { extractSections, extractQuestions } = require('./src/skill-content-adapter');
const content = '## A\n\n> **What is your background?**\n\n## B\n\n> **What are your goals?**\n';
const flat = extractQuestions(content);
const sections = extractSections(content);
const union = sections.flatMap(s => s.questions);
console.log('flat:', flat.length, 'union:', union.length, 'match:', flat.length === union.length);
"
```

**Pass condition:** Prints `flat: 2 union: 2 match: true`.

---

### AC4 — `session.sections` populated after `registerHtmlSession`

Start the server and create a session, then inspect server logs or run directly:

```
node -e "
const routes = require('./src/web-ui/routes/skills');
routes.registerHtmlSession('test-sec', '/tmp/test', 'discovery');
const sess = routes._getHtmlSession('test-sec');
console.log('sections:', Array.isArray(sess.sections), 'questions:', Array.isArray(sess.questions));
"
```

**Pass condition:** Prints `sections: true questions: true`.

---

### AC5 — No wuce.26 regressions

```
node tests/check-wuce26-per-answer-model-response.js
```

**Pass condition:** 14 passed, 0 failed.
