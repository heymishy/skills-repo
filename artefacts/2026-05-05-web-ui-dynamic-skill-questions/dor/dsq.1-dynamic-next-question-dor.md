# Definition of Ready: dsq.1 — Dynamic next-question generation

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.1-dynamic-next-question.md
**Feature:** 2026-05-05-web-ui-dynamic-skill-questions
**Date:** 2026-05-05
**Run:** 1

---

## Entry Conditions

| Condition | Status |
|-----------|--------|
| Story artefact | ✅ exists |
| Review report (PASS, 0 HIGH) | ✅ PASS — dsq.1-review-1.md, 0 HIGH, 2 MEDIUM (acknowledged below) |
| Test plan | ✅ exists — 9 tests, 7 ACs |
| AC verification script | ✅ exists |

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS — named persona "web UI operator running a skill session" |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 7 ACs in GWT format |
| H3 | Every AC has ≥1 test | ✅ PASS — all 7 ACs mapped to tests T1.1–T1.8 |
| H4 | Out-of-scope section populated | ✅ PASS — 4 explicit out-of-scope items |
| H5 | Benefit linkage references named metric | ✅ PASS — M1 (operator session completion evidence), M2 (Copilot-API session coverage), M3, P1 |
| H6 | Complexity rated | ✅ PASS — Complexity 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS — all 7 ACs have tests |
| H8-ext | Schema dependency check | ✅ PASS — schemaDepends: [] (upstream wuce.26 is runtime session store, not pipeline-state.json) |
| H9 | Architecture Constraints populated; no Cat-E HIGH | ✅ PASS — D37/ADR-009 cited, no Cat-E HIGH |
| H-E2E | CSS-layout-dependent ACs | ✅ PASS — none |
| H-NFR | NFR profile exists | ✅ PASS — nfr-profile.md created 2026-05-05 |
| H-NFR2 | Compliance NFRs with regulatory clauses | ✅ PASS — none |
| H-NFR3 | Data classification not blank | ✅ PASS — internal operational data, no PCI/PII |
| H-NFR-profile | NFRs declared → profile exists | ✅ PASS |
| H-ADAPTER | Injectable adapter rule | ✅ PASS — AC5 explicitly scopes production wiring of `setNextQuestionExecutorAdapter` in `src/web-ui/server.js` |
| H-GOV | Discovery approval present | ✅ PASS — Hamish King, Platform / Framework Owner, 2026-05-05 |

**Hard blocks: 17/17 PASS**

---

## Warnings

| # | Check | Disposition |
|---|-------|-------------|
| W1 | NFRs populated | ✅ Populated — Performance (10s timeout) and Security NFRs present |
| W2 | Scope stability | ✅ Stable |
| W3 | MEDIUM finding acknowledged | ⚠️ RISK-ACCEPT — 1-M1: spy pattern explicitly used in test plan (T1.1/T1.2 wire `setNextQuestionExecutorAdapter` spy before testing observable call); 1-M2: AC5 names `src/web-ui/server.js` directly (hedge removed in AC text) |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT — solo repo, Medium oversight; human review at PR stage |
| W5 | No UNCERTAIN test gaps | ✅ None |

---

## Oversight Level

**Medium** — share this DoR artefact with the tech lead before starting the inner coding loop.

---

## Verdict

✅ **PROCEED**

---

## Coding Agent Instructions

### Scope

Implement the dynamic next-question adapter in `src/web-ui/routes/skills.js` and its production wiring in `src/web-ui/server.js`. Two separate tasks: (1) the route handler changes and adapter setter, (2) the production wiring in `server.js`.

### Files you may touch

| File | Action |
|------|--------|
| `src/web-ui/routes/skills.js` | Export `setNextQuestionExecutorAdapter(fn)`; modify `htmlGetNextQuestion` to serve `session.dynamicQuestions[idx]` when populated; modify `htmlRecordAnswer` to call `_nextQuestionExecutor` and store result in `session.dynamicQuestions` |
| `src/web-ui/adapters/skills.js` | Export `nextQuestionExecutor` (default stub must throw) and `setNextQuestionExecutor(fn)` |
| `src/web-ui/server.js` | Wire `setNextQuestionExecutorAdapter` to `skillsAdapter.nextQuestionExecutor` — **this is a separate, mandatory task** |

### Files you must NOT touch

Everything else — specifically `src/skill-content-adapter.js`, any dashboard, artefact, or governance file.

### Acceptance Criteria to implement

**AC1:** After `htmlRecordAnswer`, a second model call is made to `_nextQuestionExecutor` with: the current question text, the operator answer, and any previous Q&A pairs. Verified via spy on `setNextQuestionExecutorAdapter`.

**AC2:** The response from `_nextQuestionExecutor` is stored as `session.dynamicQuestions[nextIndex]` in `_sessionStore`.

**AC3:** When `htmlGetNextQuestion` is called for an index that has a dynamic question, it returns the dynamic text. When `_nextQuestionExecutor` returns null/empty or throws, the static SKILL.md question is served (fallback). Exception is caught silently — no propagation to HTTP response.

**AC4:** When `_nextQuestionExecutor` returns a non-empty string, `htmlGetNextQuestion` returns that string (not the static question) for the given index.

**AC5:** `setNextQuestionExecutorAdapter(fn)` is exported from routes. Verified by T1.7. Production wiring in `server.js` wires this to `skillsAdapter.nextQuestionExecutor`. A test confirms `setSectionDraftExecutorAdapter` is present in `server.js` source.

**AC6:** The default `_nextQuestionExecutor` stub (before wiring) throws: `'Adapter not wired: _nextQuestionExecutor. Call setNextQuestionExecutorAdapter() with a real implementation before use.'`

**AC7:** All 14 existing wuce.26 tests pass after implementation.

### Non-negotiable constraints

- Node.js CommonJS (`require`), no new npm packages.
- `req.session.accessToken` canonical — never `req.session.token`.
- Injectable adapter default stub MUST throw (D37/ADR-009) — must not return null or empty.
- Production wiring task in `server.js` is mandatory and must be implemented as a separate step from the handler task.
- Read `.github/architecture-guardrails.md` before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

**Oversight level: Medium**
