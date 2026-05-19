# DoR Contract: wuce.26 — Per-answer model response in skill HTML flow

**Date:** 2026-05-04

---

## Scope contract

### Files to create

| File | Purpose |
|------|---------|
| `src/modules/skill-turn-executor.js` | Real Copilot API call implementation |
| `tests/check-wuce26-per-answer-model-response.js` | Test file — 14 tests (T1–T12, T-NFR1, T-NFR2) |

### Files to modify

| File | Change |
|------|--------|
| `src/web-ui/adapters/skills.js` | Add `_skillTurnExecutor` default stub (throws — D37), `setSkillTurnExecutor(fn)` setter, exported `skillTurnExecutor` callable |
| `src/web-ui/routes/skills.js` | Add `modelResponses: []` + `skillContent` to `_sessionStore`; make `htmlRecordAnswer` async; call executor; update `htmlGetNextQuestion`, `handleGetQuestionHtml`, `htmlGetPreview` |
| `src/web-ui/server.js` | Wire `setSkillTurnExecutor(realExecutor)` in production block |

### Out-of-scope files (do not touch)

- `src/skill-content-adapter.js`
- `artefacts/**` (pipeline inputs — read-only)
- `.github/skills/**`
- Any existing `tests/check-wuce*.js` file

---

## Schema dependency declaration

`schemaDepends: []` — no new `pipeline-state.json` fields introduced by this story.

---

## Interface contracts

### `src/modules/skill-turn-executor.js`

```js
// Signature
module.exports = async function skillTurnExecutor(skillContent, priorQA, currentAnswer, token)
// Returns: Promise<string> — the model's response text
// Throws on network error, timeout, or non-2xx API response
// Never logs the token value
```

### `src/web-ui/adapters/skills.js` additions

```js
let _skillTurnExecutor = function() {
  throw new Error('Adapter not wired: skillTurnExecutor. Call setSkillTurnExecutor() with a real implementation before use.');
};
function setSkillTurnExecutor(fn) { _skillTurnExecutor = fn; }
function skillTurnExecutor(...args) { return _skillTurnExecutor(...args); }
// exported alongside existing adapters
```

### `_sessionStore` entry shape (extended)

```js
{
  skillName: string,
  sessionPath: string,
  skillContent: string,   // ADDED — SKILL.md content, loaded at registerHtmlSession
  questions: [{id, text}],
  answers: string[],
  modelResponses: (string|null)[],  // ADDED — index-aligned with answers[]
  userId: string
}
```

### `priorQA` shape (extended — returned by `htmlGetNextQuestion`)

```js
// Previously: [{ question: string, answer: string }]
// Now: [{ question: string, answer: string, modelResponse: string|null }]
```

---

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `WUCE_TURN_MODEL` | `'claude-sonnet-4-6'` | Model identifier for Copilot chat completions |
| `WUCE_TURN_MODEL_MAX_TOKENS` | `'300'` | Max tokens for turn response |
