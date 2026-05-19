# Definition of Ready: dsq.3 — Post-session /clarify gate

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.3-post-session-clarify-gate.md
**Feature:** 2026-05-05-web-ui-dynamic-skill-questions
**Date:** 2026-05-05
**Run:** 1

---

## Entry Conditions

| Condition | Status |
|-----------|--------|
| Story artefact | ✅ exists |
| Review report (PASS, 0 HIGH) | ✅ PASS — dsq.3-review-1.md, 0 HIGH, 1 MEDIUM (acknowledged below) |
| Test plan | ✅ exists — 7 tests, 6 ACs |
| AC verification script | ✅ exists |
| Upstream dsq.1 signed off | ✅ Yes — dsq.1-dynamic-next-question-dor.md |

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS — named persona "web UI operator who has just completed all questions in a skill session" |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 6 ACs in GWT format |
| H3 | Every AC has ≥1 test | ✅ PASS — all 6 ACs mapped to tests in check-dsq3 |
| H4 | Out-of-scope section populated | ✅ PASS — 3 explicit out-of-scope items |
| H5 | Benefit linkage references named metric | ✅ PASS — P1 (session completion rate) |
| H6 | Complexity rated | ✅ PASS — Complexity 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS — all 6 ACs have tests |
| H8-ext | Schema dependency check | ✅ PASS — schemaDepends: [] (upstream dependency on dsq.1 `session.done` is runtime session store field, not pipeline-state.json) |
| H9 | Architecture Constraints populated; no Cat-E HIGH | ✅ PASS — constraints populated and no Cat-E HIGH findings |
| H-E2E | CSS-layout-dependent ACs | ✅ PASS — none (server-rendered static HTML) |
| H-NFR | NFR profile exists | ✅ PASS — nfr-profile.md created 2026-05-05 |
| H-NFR2 | Compliance NFRs with regulatory clauses | ✅ PASS — none |
| H-NFR3 | Data classification not blank | ✅ PASS — internal operational data; no session content in complete page HTML |
| H-NFR-profile | NFRs declared → profile exists | ✅ PASS |
| H-ADAPTER | Injectable adapter rule | ✅ PASS — no new injectable adapters introduced |
| H-GOV | Discovery approval present | ✅ PASS — Hamish King, Platform / Framework Owner, 2026-05-05 |

**Hard blocks: 17/17 PASS**

---

## Warnings

| # | Check | Disposition |
|---|-------|-------------|
| W1 | NFRs populated | ✅ Populated — Accessibility and Security NFRs present |
| W2 | Scope stability | ✅ Stable |
| W3 | MEDIUM finding acknowledged | ⚠️ RISK-ACCEPT — 3-M1: "rework instruction in AC6" resolved by test plan (test verifies `nextUrl` ends in `/complete` for the final answer — an observable system behaviour — rather than asserting test file contents) |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT — solo repo, Medium oversight; human review at PR stage |
| W5 | No UNCERTAIN test gaps | ✅ None |

---

## Oversight Level

**Medium** — share this DoR artefact with the tech lead before starting the inner coding loop. This story requires dsq.1 to be DoD-complete first.

---

## Verdict

✅ **PROCEED** (after dsq.1 is merged)

---

## Coding Agent Instructions

### Scope

Implement the `/complete` route and page, and update `htmlRecordAnswer` to point the final-answer `nextUrl` to `/complete` instead of `/commit-preview`. This story does NOT change the commit flow.

### Files you may touch

| File | Action |
|------|--------|
| `src/web-ui/routes/skills.js` | Export `htmlGetCompletePage(skillName, sessionId)`; modify `htmlRecordAnswer` final-answer `nextUrl` to end with `/complete` |
| `src/web-ui/server.js` | Register GET route for `/skills/:name/sessions/:id/complete` → calls `htmlGetCompletePage` |

### Files you must NOT touch

Everything else — specifically `src/skill-content-adapter.js`, `src/web-ui/adapters/skills.js`, any dashboard, artefact, or governance file. Do not change the commit-preview or commit-flow routes.

### Acceptance Criteria to implement

**AC1:** When `htmlRecordAnswer` sets `done = true` (final answer), the returned `nextUrl` ends with `/complete` — not `/commit-preview`.

**AC2:** `htmlGetCompletePage(skillName, sessionId)` returns HTML containing: (a) "Draft complete" heading, (b) skill name and question count, (c) a prominent "Commit artefact" link to the commit-preview URL, (d) a secondary "Run /clarify first" link to `/skills/clarify`.

**AC3:** The "Commit artefact" link navigates to the existing commit-preview URL; the commit flow is unchanged.

**AC4:** The "Run /clarify first" link navigates to `/skills/clarify` (skill launcher). The current session is not destroyed.

**AC5:** The "Run /clarify first" option is visually secondary to "Commit artefact" — commit is the primary call to action.

**AC6:** After implementation, when `htmlRecordAnswer` is called for the final answer, `nextUrl` ends in `/complete` (regression — no test returns `/commit-preview` for the final answer).

### Non-negotiable constraints

- Node.js CommonJS (`require`), no new npm packages.
- `req.session.accessToken` canonical — never `req.session.token`.
- No model call on the complete page — static HTML only.
- Session content (token, answers) must not appear in the complete page HTML.
- "Commit artefact" and "Run /clarify first" must be `<a>` or `<button>` elements — keyboard-navigable (accessibility NFR).
- The new `/complete` route must not conflict with the existing `/commit-preview` route.
- Read `.github/architecture-guardrails.md` before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

**Oversight level: Medium**
