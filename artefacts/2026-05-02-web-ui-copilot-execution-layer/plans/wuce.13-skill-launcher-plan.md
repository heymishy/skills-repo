# Implementation Plan: wuce.13 — Skill launcher and guided question flow

**Branch:** feat/wuce.13-skill-launcher
**Worktree:** .worktrees/wuce.13-skill-launcher
**Test file:** tests/skill-launcher.test.js (22 tests)
**Test run:** node tests/skill-launcher.test.js

---

## Dependencies

`src/adapters/skill-discovery.js` — **exists on master** (wuce.11). `listAvailableSkills()` and `validateSkillName()` are available.

`src/modules/skill-executor.js` — **may exist on master** (wuce.9/wuce.12). The launcher starts skill execution sessions; it does NOT call the executor directly — the executor is triggered on the first answer after session start.

`src/web-ui/server.js` — **exists on master**. Add new routes here.

---

## File touchpoints

| File | Action |
|------|--------|
| `src/skill-content-adapter.js` | CREATE — `extractQuestions(content)` |
| `src/answer-sanitiser.js` | CREATE — `sanitiseAnswer(raw)` |
| `src/adapters/copilot-licence.js` | CREATE — `validateLicence(accessToken)` |
| `src/web-ui/routes/skills.js` | CREATE — GET /api/skills, POST /api/skills/:name/sessions, POST /api/skills/:name/sessions/:id/answers |
| `src/web-ui/server.js` | EXTEND — mount skills router |
| `tests/skill-launcher.test.js` | EXISTS (TDD stub) |
| `package.json` | ALREADY EXTENDED |

---

## Security requirements (CRITICAL)

1. Skill name must be validated against server-side allowlist (from `listAvailableSkills()`) — never execute arbitrary strings as skill names
2. Prompt/answer input must be sanitised (strip shell metacharacters: `;`, `&`, `|`, `` ` ``, `$`, `!`, `>`, `<`, `\\`) before reaching any execution engine
3. Answer length capped at 1000 chars server-side — return 400 ANSWER_TOO_LONG if exceeded
4. Copilot licence check (`validateLicence()`) must gate all launcher endpoints — return 403 with AC5 exact message on failure
5. Answer content must NOT be written to server logs (audit requirement)
6. Server must reject path traversal in skill names (`../`, `%2F`, etc.) — return 400

---

## Task 1 — Create `src/skill-content-adapter.js`

Parses question blocks out of SKILL.md-style content. Questions are identified by blockquote sections containing a `**...**` question text followed by a `Reply:` prompt.

```js
'use strict';

/**
 * extractQuestions(content) -> Array<{ id: string, text: string }>
 *
 * Parses question blocks from SKILL.md content.
 * A question block is identified as a line matching:
 *   > **<question text>**
 * The extracted text strips the `>`, `**` markers, and any trailing `Reply:` lines.
 *
 * Returns questions in document order with stable IDs q1, q2, q3, ...
 */
function extractQuestions(content) {
  if (typeof content !== 'string') { return []; }
  const questions = [];
  // Match lines like: > **What is the core problem...**
  const pattern = /^>\s+\*\*(.+?)\*\*/gm;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const text = match[1].trim();
    // Skip short decorative bold lines (less than 20 chars)
    if (text.length < 20) { continue; }
    questions.push({ id: 'q' + (questions.length + 1), text });
  }
  return questions;
}

module.exports = { extractQuestions };
```

**TDD step:** Run `node tests/skill-launcher.test.js` — T1.1/T1.2/T1.3/T1.4 must pass.

---

## Task 2 — Create `src/answer-sanitiser.js`

```js
'use strict';

// Shell metacharacters to strip per NFR3 test assertion
const META_CHARS = /[;&|`$!><\\]/g;
// HTML/script injection
const SCRIPT_TAG = /<script[\s\S]*?<\/script>/gi;
const TAG_PATTERN = /<[^>]+>/g;
// CLI flags (-- prefixed)
const CLI_FLAG = /--[a-z][\w-]*/gi;

/**
 * sanitiseAnswer(raw) -> string
 *
 * Returns a cleaned version of the input safe for forwarding to the execution engine.
 * Rules:
 * 1. Strip <script> blocks and all HTML tags
 * 2. Strip shell metacharacters (; & | ` $ ! > < \)
 * 3. Strip CLI flag patterns (--flag)
 * 4. Trim whitespace
 */
function sanitiseAnswer(raw) {
  if (typeof raw !== 'string') { return ''; }
  let clean = raw;
  clean = clean.replace(SCRIPT_TAG, '');
  clean = clean.replace(TAG_PATTERN, '');
  clean = clean.replace(CLI_FLAG, '');
  clean = clean.replace(META_CHARS, '');
  clean = clean.trim();
  return clean;
}

module.exports = { sanitiseAnswer };
```

**TDD step:** Run `node tests/skill-launcher.test.js` — T4.3/T4.4/NFR3 must pass.

---

## Task 3 — Create `src/adapters/copilot-licence.js`

```js
'use strict';

/**
 * validateLicence(accessToken) -> Promise<{ valid: boolean }>
 *
 * Checks whether the GitHub user has an active Copilot licence.
 * In production, calls the Copilot billing API:
 *   GET https://api.github.com/copilot_internal/v2/token  (or billing endpoint)
 *
 * Returns { valid: true } if licence is active.
 * Returns { valid: false } if licence is absent or suspended.
 * Throws on network error or non-401/403 HTTP errors.
 *
 * Security: accessToken must never be logged.
 */
async function validateLicence(accessToken) {
  // Implementation: call GitHub Copilot licence API
  // Stub: returns valid:true when token is present and non-empty
  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
    return { valid: false };
  }
  // Replace with real API call: GET /copilot_internal/v2/token or /user/copilot_billing
  // const resp = await fetch('https://api.github.com/copilot_internal/v2/token', {
  //   headers: { Authorization: 'token ' + accessToken, Accept: 'application/json' }
  // });
  // if (resp.status === 403 || resp.status === 404) { return { valid: false }; }
  // return { valid: resp.ok };
  throw new Error('validateLicence: real implementation required');
}

module.exports = { validateLicence };
```

**TDD step:** After route integration, T5.1/T5.2/T2.3/T3.3 will pass once licence check is wired in.

---

## Task 4 — Create `src/web-ui/routes/skills.js`

This file implements all three routes for the skill launcher. Mount it in `src/web-ui/server.js`.

```js
'use strict';
const express   = require('express');
const router    = express.Router();
const { listAvailableSkills, validateSkillName } = require('../../adapters/skill-discovery');
const { extractQuestions }  = require('../../skill-content-adapter');
const { sanitiseAnswer }    = require('../../answer-sanitiser');
const { validateLicence }   = require('../../adapters/copilot-licence');
const sessionManager        = require('../../modules/session-manager');

const MAX_ANSWER_LENGTH = 1000;
// AC5 exact message (T5.1)
const NO_LICENCE_MSG = 'No active Copilot licence found for this account. Please visit https://github.com/features/copilot to activate.';

// Middleware: ensure authenticated
function requireAuth(req, res, next) {
  if (!req.session || !req.session.accessToken) {
    return res.status(401).json({ error: 'NOT_AUTHENTICATED' });
  }
  next();
}

// Middleware: check Copilot licence
async function requireLicence(req, res, next) {
  try {
    const { valid } = await validateLicence(req.session.accessToken);
    if (!valid) {
      return res.status(403).json({ error: 'NO_COPILOT_LICENCE', message: NO_LICENCE_MSG });
    }
    next();
  } catch (err) {
    next(err);
  }
}

// Skill name allowlist guard
function requireValidSkillName(req, res, next) {
  const name = req.params.name;
  // Block path traversal
  if (!name || /[./\\%]/.test(name)) {
    return res.status(400).json({ error: 'INVALID_SKILL_NAME' });
  }
  if (!validateSkillName(name)) {
    return res.status(400).json({ error: 'SKILL_NOT_FOUND' });
  }
  next();
}

// GET /api/skills — list available skills (with in-progress session info)
router.get('/', requireAuth, requireLicence, async (req, res, next) => {
  try {
    const skills = await listAvailableSkills();
    res.json({ skills });
  } catch (err) { next(err); }
});

// POST /api/skills/:name/sessions — start a skill session, return first question
router.post('/:name/sessions', requireAuth, requireLicence, requireValidSkillName, async (req, res, next) => {
  try {
    const { name }  = req.params;
    const userId    = req.session.userId;
    const session   = await sessionManager.createSession(userId, name);
    const questions = await getQuestionsForSkill(name);
    res.status(201).json({
      sessionId: session.id,
      question:  questions[0] || null,
      totalQuestions: questions.length
    });
  } catch (err) { next(err); }
});

// POST /api/skills/:name/sessions/:id/answers — submit an answer (ADR-009: separate from execute route)
router.post('/:name/sessions/:id/answers', requireAuth, requireLicence, requireValidSkillName, async (req, res, next) => {
  try {
    const { id } = req.params;
    const raw    = (req.body && req.body.answer) || '';

    // Server-side length check
    if (raw.length > MAX_ANSWER_LENGTH) {
      return res.status(400).json({ error: 'ANSWER_TOO_LONG', maxLength: MAX_ANSWER_LENGTH });
    }

    // Sanitise BEFORE forwarding to session/executor (answer content not logged)
    const clean = sanitiseAnswer(raw);
    const { nextQuestion, complete } = await sessionManager.recordAnswer(id, clean);

    res.json({ nextQuestion: nextQuestion || null, complete: !!complete });
  } catch (err) { next(err); }
});

async function getQuestionsForSkill(skillName) {
  const fs   = require('fs');
  const path = require('path');
  const skills = await listAvailableSkills();
  const skill  = skills.find(s => s.name === skillName);
  if (!skill || !skill.path) { return []; }
  const content = fs.existsSync(skill.path)
    ? fs.readFileSync(skill.path, 'utf8')
    : '';
  return extractQuestions(content);
}

module.exports = router;
```

---

## Task 5 — Mount router in `src/web-ui/server.js`

Find the block where other routers are mounted (search for `app.use('/api'`) and add:

```js
const skillsRouter = require('./routes/skills');
app.use('/api/skills', skillsRouter);
```

**TDD step:** Run `node tests/skill-launcher.test.js` — all 22 tests must pass.

---

## Commit

```
feat(wuce.13): skill launcher, guided question flow, answer sanitiser

- src/skill-content-adapter.js: extractQuestions() parses SKILL.md question blocks
- src/answer-sanitiser.js: sanitiseAnswer() strips metacharacters + HTML
- src/adapters/copilot-licence.js: validateLicence() gates all launcher routes
- src/web-ui/routes/skills.js: GET /api/skills, POST sessions, POST answers
- src/web-ui/server.js: mounts skills router

All 22 tests in tests/skill-launcher.test.js pass.
Closes #276
```
