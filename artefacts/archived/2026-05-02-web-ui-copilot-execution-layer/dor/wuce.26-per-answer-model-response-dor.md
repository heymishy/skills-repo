# Definition of Ready: wuce.26 — Per-answer model response in skill HTML flow

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.26-per-answer-model-response.md
**Test plan:** artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.26-per-answer-model-response-test-plan.md
**Verification script:** artefacts/2026-05-02-web-ui-copilot-execution-layer/verification-scripts/wuce.26-per-answer-model-response-verification.md
**Date:** 2026-05-04
**Run by:** GitHub Copilot

---

## Contract Proposal — Per-answer model response in skill HTML flow

**What will be built:**
A new module `src/modules/skill-turn-executor.js` that calls `POST https://api.githubcopilot.com/chat/completions` using Node's built-in `https` module. The existing `htmlRecordAnswer` function in `src/web-ui/routes/skills.js` is made async and calls the turn executor after recording the answer, storing the result in a new `session.modelResponses[]` array on the `_sessionStore` entry. The `handleGetQuestionHtml` function is updated to render the model response from the previous turn above the prior-Q&A transcript. A new injectable adapter `_skillTurnExecutor` is added to `src/web-ui/adapters/skills.js` with a default stub that throws (D37). The production wiring is added to `src/web-ui/server.js`. The `htmlGetPreview` function is updated to include model responses in the artefact content.

**What will NOT be built:**
- Streaming responses (SSE/chunked) — full response awaited before redirect
- Loading spinners or typing indicators on the submit page
- Persistent storage of model responses (database/file) — in-memory only
- Modifications to the `skill-executor` CLI batch path
- Token cost tracking or reporting
- Per-skill `max_tokens` configuration — fixed at 300 or env var

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: executor called, response appended to modelResponses | Unit test T1, T2 — inject stub executor, assert modelResponses populated | unit |
| AC2: adapter throw → answer recorded, modelResponses[i]=null, redirect proceeds | Unit test T3, T4 — inject throwing stub, assert graceful degradation | unit |
| AC3: question N>1 renders model response above prior Q&A | Unit test T5, T6 — assert HTML contains model response block | unit |
| AC4: question 1 — no model-response block rendered | Unit test T7 — assert no model-response section in output | unit |
| AC5: default stub throws 'Adapter not wired: skillTurnExecutor' | Unit test T8 — import adapters.js without wiring, assert throw | unit |
| AC6: production executor sends correct request to Copilot API | Integration test T9, T10 — stub https module, assert request headers/body/URL | integration |
| AC7: htmlGetPreview includes model responses in artefact content | Unit test T11, T12 — assert content contains model response strings | unit |

**Assumptions:**
- `req.session.accessToken` is the canonical token field (existing convention, enforced by coding standard)
- The Copilot chat completions API is accessible at `api.githubcopilot.com/chat/completions` using the existing GitHub OAuth token
- `session.skillContent` is populated at session creation — the story assumes `registerHtmlSession` is updated to load and store the SKILL.md content for the active skill
- No new npm dependencies are introduced — `https` is built-in Node

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. No mismatches between the contract and story ACs.

---

## Hard Blocks

| # | Check | Result |
|---|-------|--------|
| H1 | User story As / Want / So with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS — 7 ACs |
| H3 | Every AC has at least one test | ✅ PASS — all 7 ACs have tests (T1–T12) |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS — P3 Skill session completion rate |
| H6 | Complexity rated | ✅ PASS — Complexity 2 |
| H7 | No unresolved HIGH findings | ✅ PASS — short-track, no review findings |
| H8 | Test plan has no uncovered ACs | ✅ PASS — 7/7 ACs covered |
| H8-ext | Cross-story schema dependency check | ✅ PASS — upstream dependencies are wuce.23/24/25 (merged); no new pipeline-state.json fields introduced; schemaDepends not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS — ADR-009 (injectable adapters), ADR-018 (Playwright exclusion) both respected; constraints fully described |
| H-E2E | No CSS-layout-dependent ACs | ✅ PASS — no layout-dependent ACs; server-side rendering tested at unit level |
| H-NFR | NFR profile exists at artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md | ✅ PASS |
| H-NFR2 | No compliance NFR with regulatory clause | ✅ PASS — security NFRs are internal; no regulatory clauses |
| H-NFR3 | Data classification not blank in NFR profile | ✅ PASS — feature NFR profile has data classification |
| H-NFR-profile | Story declares NFRs; NFR profile exists at feature level | ✅ PASS |
| H-GOV | Discovery Approved By — Hamish King (Chief Product Guru) + Jenni Ralph (Chief Product Guru) — 2026-05-02 | ✅ PASS |
| H-ADAPTER | `setSkillTurnExecutor` introduced; (a) AC5+AC6 scope production wiring; (b) stub throws; (c) wiring is a separate task in implementation plan | ✅ PASS — all three conditions in story ACs and architecture constraints |

**Hard blocks: 17/17 PASS**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | ✅ — Security + Performance + Resilience NFRs present |
| W2 | Scope stability declared | ✅ — Stable |
| W3 | MEDIUM review findings | ✅ — N/A (short-track) |
| W4 | Verification script reviewed by domain expert | ⚠️ — Acknowledged: script is clear and human-readable; operator review recommended before smoke test |
| W5 | No UNCERTAIN items in test plan gap table | ✅ — Both gaps are External service type with clear handling |

**W4 acknowledged** — verification script should be reviewed by the operator (Hamish) before the post-merge smoke test. No blocking action required.

---

## Oversight Level

**High** — parent epic wuce-e6-skill-launcher-html-form.md declares `Oversight: High`.

🔴 **High oversight** — named sign-off required before the coding agent begins implementation.

Sign-off by: **Hamish King — 2026-05-04**

---

## Definition of Ready: PROCEED ✅

**Hard blocks:** 17/17 passed
**Warnings:** 1 acknowledged (W4 — operator script review before smoke test)
**Oversight:** High — signed off by Hamish King 2026-05-04

---

## Coding Agent Instructions

### Context

You are implementing **wuce.26: Per-answer model response in skill HTML flow** for the `2026-05-02-web-ui-copilot-execution-layer` feature.

Read these files before writing any code:
- `artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.26-per-answer-model-response.md`
- `artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.26-per-answer-model-response-test-plan.md`
- `artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.26-per-answer-model-response-dor-contract.md`

### Test baseline

Run `npm test` before making any changes. All 52 existing tests must pass. Your work is complete when `npm test` passes with all existing tests still passing PLUS all 14 new tests in `tests/check-wuce26-per-answer-model-response.js` passing.

### Files to create

- `src/modules/skill-turn-executor.js` — new module; real Copilot API call implementation
- `tests/check-wuce26-per-answer-model-response.js` — new test file; write failing tests first

### Files to modify

- `src/web-ui/adapters/skills.js` — add `_skillTurnExecutor` default stub (must throw, per D37) and `setSkillTurnExecutor(fn)` setter; export `skillTurnExecutor` as the callable adapter
- `src/web-ui/routes/skills.js` — (1) add `modelResponses: []` to `_sessionStore` entries in `registerHtmlSession`; (2) add `skillContent` field populated from the skill's SKILL.md at registration; (3) make `htmlRecordAnswer` async — await `_skillTurnExecutor` call and append result (or null on throw) to `session.modelResponses`; (4) update `htmlGetNextQuestion` to include `modelResponse` field in `priorQA` entries; (5) update `handleGetQuestionHtml` to render model response block above prior Q&A when `modelResponse` is non-null; (6) update `htmlGetPreview` to include model responses in artefact content
- `src/web-ui/server.js` — wire `setSkillTurnExecutor` with the real executor in the production block (`NODE_ENV !== 'test' || WIRE_SKILL_ADAPTERS === 'true'`); import the real executor from `../modules/skill-turn-executor`

### Files NOT to touch

- `src/skill-content-adapter.js` — do not modify
- Any file under `artefacts/` — do not modify
- `.github/skills/` — do not modify
- Existing test files — do not modify

### Implementation notes

- `req.session.accessToken` is the canonical token field — do NOT use `req.session.token`
- The default stub MUST throw, not return null (D37 rule): `throw new Error('Adapter not wired: skillTurnExecutor. Call setSkillTurnExecutor() with a real implementation before use.')`
- `skill-turn-executor.js` uses Node's built-in `https` module only — no new npm dependencies
- System prompt = SKILL.md content. Message array: `[{ role: 'system', content: skillContent }, ...priorQA.flatMap(qa => [{role:'user', content: qa.question + '\n\nAnswer: ' + qa.answer}, {role:'assistant', content: qa.modelResponse || ''}]), { role: 'user', content: currentAnswer }]`
- `max_tokens: parseInt(process.env.WUCE_TURN_MODEL_MAX_TOKENS || '300', 10)`
- Model: `process.env.WUCE_TURN_MODEL || 'claude-sonnet-4-6'`
- Request timeout: 30000ms; on timeout, reject with an Error so AC2 graceful path applies
- Model response content MUST be HTML-escaped before rendering in `handleGetQuestionHtml`
- Access token MUST NOT appear in any log output or error message

### TDD order

1. Write all 14 failing tests in `tests/check-wuce26-per-answer-model-response.js` (T1–T12, T-NFR1, T-NFR2)
2. Run `node tests/check-wuce26-per-answer-model-response.js` — confirm all 14 fail
3. Implement in this order: adapters (T8) → routes (T1–T7, T11–T12) → executor module (T9, T10, T-NFR1, T-NFR2) → server wiring (AC5/AC6)
4. After each task, run the test file to see tests go green
5. Run full `npm test` before opening PR

### Wiring task (separate from handler task — H-ADAPTER requirement)

**Task A — Handler + adapter:** Add `_skillTurnExecutor` to `adapters/skills.js`, update `routes/skills.js` (modelResponses, async htmlRecordAnswer, render block, preview). Tests T1–T8, T11, T12.

**Task B — Executor module:** Create `src/modules/skill-turn-executor.js`. Tests T9, T10, T-NFR1, T-NFR2.

**Task C — Production wiring (separate):** Wire `setSkillTurnExecutor(realExecutor)` in `server.js`. Verify AC6 path end-to-end (manually or with `WIRE_SKILL_ADAPTERS=true`).

Open as draft PR. Never mark ready for review.
