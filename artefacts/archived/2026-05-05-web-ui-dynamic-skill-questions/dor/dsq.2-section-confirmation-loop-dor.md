# Definition of Ready: dsq.2 — Section confirmation loop

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.2-section-confirmation-loop.md
**Feature:** 2026-05-05-web-ui-dynamic-skill-questions
**Date:** 2026-05-05
**Run:** 1

---

## Entry Conditions

| Condition | Status |
|-----------|--------|
| Story artefact | ✅ exists (AC9 added 2026-05-05 for H-ADAPTER compliance) |
| Review report (PASS, 0 HIGH) | ✅ PASS — dsq.2-review-2.md, 0 HIGH, 1 MEDIUM (acknowledged below) |
| Test plan | ✅ exists — 10 tests, 9 ACs |
| AC verification script | ✅ exists |
| Upstream dsq.1.5 signed off | ✅ Yes — dsq.1.5-section-aware-extraction-dor.md |
| Upstream dsq.1 signed off | ✅ Yes — dsq.1-dynamic-next-question-dor.md |

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS — named persona "web UI operator running a structured skill session" |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 9 ACs in GWT format |
| H3 | Every AC has ≥1 test | ✅ PASS — all 9 ACs mapped to tests T3.1–T3.10 |
| H4 | Out-of-scope section populated | ✅ PASS — 3 explicit out-of-scope items |
| H5 | Benefit linkage references named metric | ✅ PASS — P1 and P2 named |
| H6 | Complexity rated | ✅ PASS — Complexity 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH findings (1 HIGH from Run 1 resolved in Run 2) |
| H8 | No uncovered ACs | ✅ PASS — all 9 ACs have tests |
| H8-ext | Schema dependency check | ✅ PASS — schemaDepends: [] (upstream dependencies on dsq.1.5 `session.sections` and dsq.1 `session.dynamicQuestions` are runtime session store fields, not pipeline-state.json) |
| H9 | Architecture Constraints populated; no Cat-E HIGH | ✅ PASS — D37/ADR-009 cited explicitly |
| H-E2E | CSS-layout-dependent ACs | ✅ PASS — none |
| H-NFR | NFR profile exists | ✅ PASS — nfr-profile.md created 2026-05-05 |
| H-NFR2 | Compliance NFRs with regulatory clauses | ✅ PASS — none |
| H-NFR3 | Data classification not blank | ✅ PASS — internal operational data, no PCI/PII |
| H-NFR-profile | NFRs declared → profile exists | ✅ PASS |
| H-ADAPTER | Injectable adapter rule | ✅ PASS — AC9 scopes production wiring of `setSectionDraftExecutorAdapter` in `src/web-ui/server.js`; AC6 covers stub-throw requirement |
| H-GOV | Discovery approval present | ✅ PASS — Hamish King, Platform / Framework Owner, 2026-05-05 |

**Hard blocks: 17/17 PASS**

---

## Warnings

| # | Check | Disposition |
|---|-------|-------------|
| W1 | NFRs populated | ✅ Populated — Performance (15s timeout), Security, Resilience NFRs present |
| W2 | Scope stability | ✅ Stable |
| W3 | MEDIUM finding acknowledged | ⚠️ RISK-ACCEPT — 2-M1: route contract resolved by test plan (T3.3 uses `'confirm'` as the operator answer string; T3.4 uses `'edit:' + text` as the edit answer prefix; no separate HTTP route needed — confirmation is handled via the existing `htmlRecordAnswer` endpoint with answer convention) |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT — solo repo, Medium oversight; human review at PR stage |
| W5 | No UNCERTAIN test gaps | ✅ None |

---

## Oversight Level

**Medium** — share this DoR artefact with the tech lead before starting the inner coding loop. This story depends on dsq.1.5 and dsq.1 being DoD-complete first.

---

## Verdict

✅ **PROCEED** (after dsq.1.5 and dsq.1 are merged)

---

## Coding Agent Instructions

### Scope

Implement section boundary detection and confirmation loop in `src/web-ui/routes/skills.js`. Wire the new `_sectionDraftExecutor` adapter in `src/web-ui/server.js`. Two separate tasks required: (1) route changes and adapter setter, (2) production wiring.

**This story requires dsq.1.5 and dsq.1 to be DoD-complete before implementation begins.**

### Files you may touch

| File | Action |
|------|--------|
| `src/web-ui/routes/skills.js` | Export `setSectionDraftExecutorAdapter(fn)`; add section boundary detection in `htmlRecordAnswer`; add pending-confirmation state handling |
| `src/web-ui/adapters/skills.js` | Export `sectionDraftExecutor` (default stub must throw) and `setSectionDraftExecutor(fn)` |
| `src/web-ui/server.js` | Wire `setSectionDraftExecutorAdapter` to `skillsAdapter.sectionDraftExecutor` — **this is a separate, mandatory task** |

### Files you must NOT touch

Everything else — specifically `src/skill-content-adapter.js`, any dashboard, artefact, or governance file.

### Acceptance Criteria to implement

**AC1:** `htmlRecordAnswer` detects section boundary (answer is last Q in a section per `session.sections`) and calls `_sectionDraftExecutor(heading, qaPairs, instruction, token)`.

**AC2:** Successful draft → session stores pending confirmation state; operator sees draft text and confirm/edit options before advancing to next section.

**AC3:** Answer `'confirm'` → `session.sectionDrafts[sectionIndex]` = draft text; `pendingConfirmation` cleared; session advances to first Q of next section.

**AC4:** Answer `'edit:<text>'` → `session.sectionDrafts[sectionIndex]` = operator-supplied text; `pendingConfirmation` cleared; session advances.

**AC5:** Executor throws or returns null/empty → silent fallback; session advances without confirmation; no error surfaced to operator.

**AC6:** Default `_sectionDraftExecutor` stub throws: `'Adapter not wired: _sectionDraftExecutor. Call setSectionDraftExecutorAdapter() with a real implementation before use.'`

**AC7:** Skill with no H2 section structure → no section confirmation step; session completes normally.

**AC8:** All prior tests (14 wuce.26 + dsq.1 + dsq.1.5) pass after implementation.

**AC9 (mandatory wiring):** `src/web-ui/server.js` calls `setSectionDraftExecutorAdapter` to wire the production adapter. Verified by T3.10 (source text inspection).

### Non-negotiable constraints

- Node.js CommonJS (`require`), no new npm packages.
- `req.session.accessToken` canonical — never `req.session.token`.
- Injectable adapter default stub MUST throw (D37/ADR-009) — must not return null or empty.
- Section boundary detection reads `session.sections` (populated by dsq.1.5's `registerHtmlSession` change).
- Production wiring in `server.js` is a mandatory separate task.
- Read `.github/architecture-guardrails.md` before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

**Oversight level: Medium**
