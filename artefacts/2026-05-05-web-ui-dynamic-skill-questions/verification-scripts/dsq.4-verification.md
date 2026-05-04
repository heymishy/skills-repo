# AC Verification Script: dsq.4 — Section-by-section artefact assembly

**Story:** dsq.4 — Section-by-section artefact assembly using skill template structure

---

## Automated check

```
node tests/check-dsq4-section-artefact-assembly.js
```

Expected before implementation: 0 passed, 7 failed.
Expected after implementation: 7 passed, 0 failed.

Full regression:
```
npm test
```

---

## Manual AC verification steps

### AC1 — Section headings in artefactContent, no Q/A prefixes

```
node -e "
const routes = require('./src/web-ui/routes/skills');
routes.registerHtmlSession('t1', '/tmp/t1', 'discovery');
const sess = routes._getHtmlSession('t1');
const q1 = { id: 'q1', text: 'What is your background?' };
const q2 = { id: 'q2', text: 'What are your constraints?' };
sess.sections = [{ heading: 'Background', questions: [q1] }, { heading: 'Constraints', questions: [q2] }];
sess.questions = [q1, q2];
sess.answers = ['I have a product background.', 'Budget and time.'];
const preview = routes.htmlGetPreview('discovery', 't1');
console.log(preview.artefactContent);
"
```

**Pass condition:** Output contains `## Background` and `## Constraints` but does NOT contain `Q1:` or `A:`.

---

### AC2 — Section draft used when available

```
node -e "
const routes = require('./src/web-ui/routes/skills');
routes.registerHtmlSession('t2', '/tmp/t2', 'discovery');
const sess = routes._getHtmlSession('t2');
const q1 = { id: 'q1', text: 'Background question?' };
sess.sections = [{ heading: 'Background', questions: [q1] }];
sess.questions = [q1];
sess.answers = ['Raw answer'];
sess.sectionDrafts = ['Confirmed draft for Background.'];
const preview = routes.htmlGetPreview('discovery', 't2');
console.log(preview.artefactContent.includes('Confirmed draft for Background.'));
console.log(preview.artefactContent.includes('Raw answer'));
"
```

**Pass condition:** First line `true`, second line `false`.

---

### AC3 — Answers concatenated when no draft

```
node -e "
const routes = require('./src/web-ui/routes/skills');
routes.registerHtmlSession('t3', '/tmp/t3', 'discovery');
const sess = routes._getHtmlSession('t3');
const q1 = { id: 'q1', text: 'Background question?' };
sess.sections = [{ heading: 'Background', questions: [q1] }];
sess.questions = [q1];
sess.answers = ['My raw answer for Background.'];
const preview = routes.htmlGetPreview('discovery', 't3');
console.log(preview.artefactContent.includes('My raw answer for Background.'));
console.log(preview.artefactContent.includes('Q1:'));
"
```

**Pass condition:** First line `true`, second line `false`.

---

### AC4 — Flat skill uses skill name as heading

```
node -e "
const routes = require('./src/web-ui/routes/skills');
routes.registerHtmlSession('t4', '/tmp/t4', 'discovery');
const sess = routes._getHtmlSession('t4');
const q1 = { id: 'q1', text: 'Flat question?' };
sess.sections = [{ heading: '', questions: [q1] }];
sess.questions = [q1];
sess.answers = ['Flat answer.'];
const preview = routes.htmlGetPreview('discovery', 't4');
console.log(preview.artefactContent);
"
```

**Pass condition:** Output contains `## discovery` (skill name as H2 heading) and `Flat answer.`, without `Q1:`.

---

### AC5 — Commit-preview renders section-structured content

Navigate to `/skills/discovery/sessions/:id/commit-preview` after completing a multi-section session. Inspect the rendered HTML — the artefact preview section must show H2 headings matching SKILL.md sections.

---

### AC6 — Section order preserved

```
node -e "
const routes = require('./src/web-ui/routes/skills');
routes.registerHtmlSession('t5', '/tmp/t5', 'discovery');
const sess = routes._getHtmlSession('t5');
const q = { id: 'q1', text: 'Q?' };
sess.sections = [{ heading: 'Alpha', questions: [q] }, { heading: 'Beta', questions: [q] }, { heading: 'Gamma', questions: [q] }];
sess.questions = [q];
sess.answers = ['a'];
const c = routes.htmlGetPreview('discovery', 't5').artefactContent;
console.log(c.indexOf('## Alpha') < c.indexOf('## Beta') && c.indexOf('## Beta') < c.indexOf('## Gamma'));
"
```

**Pass condition:** Prints `true`.

---

### Full regression

```
npm test
```

**Pass condition:** All tests pass.
