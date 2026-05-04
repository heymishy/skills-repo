# Definition of Ready: dsq.1.5 — Section-aware question extraction

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.1.5-section-aware-extraction.md
**Feature:** 2026-05-05-web-ui-dynamic-skill-questions
**Date:** 2026-05-05
**Run:** 1

---

## Entry Conditions

| Condition | Status |
|-----------|--------|
| Story artefact | ✅ exists |
| Review report (PASS, 0 HIGH) | ✅ PASS — dsq.1.5-review-1.md, 0 HIGH, 0 MEDIUM |
| Test plan | ✅ exists — 7 tests, 5 ACs |
| AC verification script | ✅ exists |

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS — named persona "developer delivering the section confirmation loop (dsq.2)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 5 ACs in GWT format |
| H3 | Every AC has ≥1 test | ✅ PASS — AC1→T2.1, AC2→T2.2, AC3→T2.3, AC4→T2.4, AC5→T2.5 |
| H4 | Out-of-scope section populated | ✅ PASS — 3 explicit out-of-scope items |
| H5 | Benefit linkage references named metric | ✅ PASS — P1 (skill session completion rate) via enabler |
| H6 | Complexity rated | ✅ PASS — Complexity 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS — all 5 ACs have tests |
| H8-ext | Schema dependency check | ✅ PASS — schemaDepends: [] (upstream wuce.26 dependency is runtime session store, not pipeline-state.json fields) |
| H9 | Architecture Constraints populated; no Cat-E HIGH | ✅ PASS — constraints populated, 0 Cat-E HIGH |
| H-E2E | CSS-layout-dependent ACs | ✅ PASS — none |
| H-NFR | NFR profile exists | ✅ PASS — nfr-profile.md created 2026-05-05 |
| H-NFR2 | Compliance NFRs with regulatory clauses | ✅ PASS — none |
| H-NFR3 | Data classification not blank | ✅ PASS — internal operational data, no PCI/PII |
| H-NFR-profile | NFRs declared → profile exists | ✅ PASS |
| H-ADAPTER | Injectable adapter rule | ✅ PASS — no injectable adapters introduced by this story |
| H-GOV | Discovery approval present | ✅ PASS — Hamish King, Platform / Framework Owner, 2026-05-05 |

**Hard blocks: 17/17 PASS**

---

## Warnings

| # | Check | Disposition |
|---|-------|-------------|
| W1 | NFRs populated | ✅ Populated — Performance and Correctness NFRs present |
| W2 | Scope stability | ✅ Stable |
| W3 | MEDIUM finding acknowledged | ✅ PASS — 0 MEDIUM findings in dsq.1.5 review |
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

Implement `extractSections(content)` in `src/skill-content-adapter.js` and wire it into `registerHtmlSession` in `src/web-ui/routes/skills.js`. This is a purely additive change — `extractQuestions` must not be modified.

### Files you may touch

| File | Action |
|------|--------|
| `src/skill-content-adapter.js` | Add and export `extractSections(content)` |
| `src/web-ui/routes/skills.js` | Call `extractSections` in `registerHtmlSession`; store result as `session.sections` in `_sessionStore` |

### Files you must NOT touch

Everything else. Specifically: `src/web-ui/server.js`, `src/web-ui/adapters/skills.js`, any dashboard, artefact, or governance file. Do not modify `extractQuestions`.

### Acceptance Criteria to implement

**AC1:** `extractSections(content)` returns `Array<{ heading: string, questions: Array<{id, text}> }>` in document order when called with SKILL.md content containing H2 headings. Each section's `questions` contains only the questions under that H2 heading.

**AC2:** When called with SKILL.md content having no H2 headings, `extractSections` returns `[{ heading: '', questions: [/* all questions */] }]`.

**AC3:** The union of all `section.questions` across all sections equals the result of `extractQuestions(content)` for the same input (same texts, same count, same order).

**AC4:** `registerHtmlSession` populates `session.sections` with `extractSections(session.skillContent)` alongside the existing `session.questions` flat array.

**AC5:** All 14 existing wuce.26 baseline tests pass after implementation — `extractQuestions` and all existing session fields are unchanged.

### Non-negotiable constraints

- Node.js CommonJS (`require`), no new npm packages.
- `extractSections` must be synchronous — no I/O, completes in < 10 ms for any normal SKILL.md.
- `extractQuestions` must remain byte-for-byte identical in its output contract.
- Read `.github/architecture-guardrails.md` before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

**Oversight level: Medium**
