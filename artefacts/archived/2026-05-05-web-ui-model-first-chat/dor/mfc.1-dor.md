# Definition of Ready: mfc.1 — Model-first chat session architecture

**Story:** artefacts/2026-05-05-web-ui-model-first-chat/stories/mfc.1-model-first-chat-session.md
**Feature:** 2026-05-05-web-ui-model-first-chat
**Date:** 2026-05-05
**Run:** 1

---

## Entry Conditions

| Condition | Status |
|-----------|--------|
| Story artefact | ✅ exists — mfc.1-model-first-chat-session.md |
| Discovery approved | ✅ Approved — Hamish King, 2026-05-05 |
| Benefit-metric active | ✅ Active — M1/M2/M3 defined |
| Review report (PASS, 0 HIGH) | ✅ PASS — 0 HIGH, architectural change is well-bounded |
| Test plan | ✅ exists — 24 tests, 10 ACs |
| AC verification script | ✅ exists — mfc.1-verification.md |

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS — "pipeline operator using the web UI" |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 10 ACs in GWT format |
| H3 | Every AC has ≥1 test | ✅ PASS — T1–T9 cover AC1–AC9; AC10 has manual smoke test |
| H4 | Out-of-scope section populated | ✅ PASS — 7 explicit out-of-scope items |
| H5 | Benefit linkage references named metric | ✅ PASS — M1 (template conformance rate), M2 (adaptation), M3 (test health) |
| H6 | Complexity rated | ✅ PASS — Complexity 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS — all 10 ACs have tests (AC10 manual, RISK-ACCEPT noted) |
| H8-ext | Schema dependency check | ✅ PASS — schemaDepends: [] |
| H9 | Architecture Constraints populated; no Cat-E HIGH | ✅ PASS — D37/ADR-009, no new npm deps, no Express, canonical token field |
| H-E2E | CSS-layout-dependent ACs | ✅ PASS — AC2 chat HTML verified by unit test (string match), no layout ACs |
| H-NFR | NFR profile stated in story | ✅ PASS — Security, Resilience, Performance NFRs present |
| H-NFR2 | Compliance NFRs | ✅ PASS — none |
| H-NFR3 | Data classification | ✅ PASS — internal operational data, no PCI/PII |
| H-ADAPTER | Injectable adapter rule (D37) | ✅ PASS — _skillTurnExecutor default stub throws; setSkillTurnExecutorAdapter wired in server.js; setNextQuestionExecutorAdapter/setSectionDraftExecutorAdapter retained as no-ops (AC9) |
| H-GOV | Discovery approval present | ✅ PASS — Hamish King, Platform / Framework Owner, 2026-05-05 |

**Hard blocks: 16/16 PASS**

---

## Warnings

| # | Check | Disposition |
|---|-------|-------------|
| W1 | NFRs populated | ✅ Security (token never logged/echoed), Resilience (executor throw → empty bubble), Performance (WUCE_TURN_TIMEOUT_MS) |
| W2 | Scope stability | ✅ Stable |
| W3 | MEDIUM findings acknowledged | ⚠️ RISK-ACCEPT — AC10 (npm test run) is manual-only; this is acceptable because the automated unit tests (T1–T9) cover all code paths independently of a live server |
| W4 | Verification script reviewed | ⚠️ RISK-ACCEPT — solo repo, Medium oversight; human review at PR stage |
| W5 | No UNCERTAIN test gaps | ✅ None |

---

## Oversight Level

**Medium** — primary author is also reviewer; review at PR stage by reading test output and smoke-testing the chat page manually before merge.

---

## Verdict

✅ **PROCEED**

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: mfc.1 — Replace scrape-first skill sessions with model-first chat architecture
Story artefact: artefacts/2026-05-05-web-ui-model-first-chat/stories/mfc.1-model-first-chat-session.md
Test plan: artefacts/2026-05-05-web-ui-model-first-chat/test-plans/mfc.1-test-plan.md
Contract: artefacts/2026-05-05-web-ui-model-first-chat/dor/mfc.1-dor-contract.md

Goal:
Make all tests in check-mfc1-model-first-chat-session.js pass, and rewrite the 7 existing
test files so they test model-first behaviour. All of npm test must pass with 0 failures.

Constraints:
- Node.js CommonJS (require), no new npm packages, no Express
- req.session.accessToken canonical — never req.session.token
- D37/ADR-009: _skillTurnExecutor default stub throws; setSkillTurnExecutorAdapter exported and wired
- setNextQuestionExecutorAdapter/setSectionDraftExecutorAdapter retained as no-ops (AC9)
- skill-turn-executor.js signature: (systemPrompt, history, currentInput, token) — breaking change, update all callers atomically
- buildSystemPrompt loads: .github/copilot-instructions.md, .github/skills/[name]/SKILL.md, product/ context files
- System prompt must include web UI protocol instruction with ---ARTEFACT-START--- / ---ARTEFACT-END--- and ---SLUG--- markers
- session.systemPrompt must NOT appear in any HTTP response body
- Artefact path format: artefacts/[slug]/[skillName].md where slug comes from model's ---SLUG--- line
- Do NOT modify: src/skill-content-adapter.js, any JSON API handlers, any dashboard files, any artefact files
- Read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter ambiguity not covered by the ACs: add a PR comment describing it, do not improvise

Files you MAY touch (from contract):
- src/modules/skill-turn-executor.js
- src/web-ui/routes/skills.js
- src/web-ui/server.js
- tests/check-mfc1-model-first-chat-session.js (CREATE)
- tests/check-wuce23-skill-launcher-landing.js (REWRITE)
- tests/check-wuce24-guided-question-form.js (REWRITE)
- tests/check-wuce26-per-answer-model-response.js (REWRITE)
- tests/check-dsq1-dynamic-next-question.js (REWRITE)
- tests/check-dsq2-section-confirmation-loop.js (REWRITE)
- tests/check-dsq3-post-session-clarify-gate.js (REWRITE)
- tests/check-dsq4-section-artefact-assembly.js (REWRITE)

Oversight level: Medium
```
