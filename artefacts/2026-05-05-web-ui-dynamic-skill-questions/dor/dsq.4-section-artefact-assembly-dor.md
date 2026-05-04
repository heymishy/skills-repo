# Definition of Ready: dsq.4 — Section-by-section artefact assembly

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.4-section-artefact-assembly.md
**Feature:** 2026-05-05-web-ui-dynamic-skill-questions
**Date:** 2026-05-05
**Run:** 1

---

## Entry Conditions

| Condition | Status |
|-----------|--------|
| Story artefact | ✅ exists |
| Review report (PASS, 0 HIGH) | ✅ PASS — dsq.4-review-1.md, 0 HIGH, 2 MEDIUM (acknowledged below) |
| Test plan | ✅ exists — 7 tests, 6 ACs |
| AC verification script | ✅ exists |
| Upstream dsq.1 signed off | ✅ Yes — dsq.1-dynamic-next-question-dor.md |

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS — named persona "web UI operator who has completed a skill session and is reviewing the commit preview" |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 6 ACs in GWT format |
| H3 | Every AC has ≥1 test | ✅ PASS — all 6 ACs mapped to tests in check-dsq4 |
| H4 | Out-of-scope section populated | ✅ PASS — 3 explicit out-of-scope items |
| H5 | Benefit linkage references named metric | ✅ PASS — P2 and M3 named |
| H6 | Complexity rated | ✅ PASS — Complexity 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS — all 6 ACs have tests |
| H8-ext | Schema dependency check | ✅ PASS — schemaDepends: [] (upstream dependencies on dsq.1 `session.dynamicQuestions` and dsq.2 `session.sectionDrafts` are runtime session store fields, not pipeline-state.json) |
| H9 | Architecture Constraints populated; no Cat-E HIGH | ✅ PASS — constraints populated, no Cat-E HIGH |
| H-E2E | CSS-layout-dependent ACs | ✅ PASS — none |
| H-NFR | NFR profile exists | ✅ PASS — nfr-profile.md created 2026-05-05 |
| H-NFR2 | Compliance NFRs with regulatory clauses | ✅ PASS — none |
| H-NFR3 | Data classification not blank | ✅ PASS — internal operational data |
| H-NFR-profile | NFRs declared → profile exists | ✅ PASS |
| H-ADAPTER | Injectable adapter rule | ✅ PASS — no new injectable adapters introduced |
| H-GOV | Discovery approval present | ✅ PASS — Hamish King, Platform / Framework Owner, 2026-05-05 |

**Hard blocks: 17/17 PASS**

---

## Warnings

| # | Check | Disposition |
|---|-------|-------------|
| W1 | NFRs populated | ✅ Populated — Correctness and Regression safety NFRs present |
| W2 | Scope stability | ✅ Stable |
| W3 | MEDIUM finding acknowledged | ⚠️ RISK-ACCEPT — 4-M1: "rework instruction in AC6" resolved by test plan (T5.5 asserts `artefactContent` is a string, T5.7 is regression canary — the tests verify system output behaviour, not test file contents); 4-M2: scope boundary resolved by test plan and DoR contract (only `htmlGetPreview` data shape changes; the commit-preview template may need minimal update to render H2 content without Q-label noise, scoped to no-template-change beyond content shape) |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT — solo repo, Medium oversight; human review at PR stage |
| W5 | No UNCERTAIN test gaps | ✅ None |

---

## Oversight Level

**Medium** — share this DoR artefact with the tech lead before starting the inner coding loop. Requires dsq.1 DoD-complete; dsq.2 is a soft dependency (graceful fallback if absent).

---

## Verdict

✅ **PROCEED** (after dsq.1 is merged; dsq.2 DoD-complete desirable but not required)

---

## Coding Agent Instructions

### Scope

Modify `htmlGetPreview` in `src/web-ui/routes/skills.js` to assemble `artefactContent` using section headings from `session.sections`. Use `session.sectionDrafts[i]` when present; fall back to concatenated Q&A pairs otherwise. Change is confined to the assembly logic inside `htmlGetPreview`.

### Files you may touch

| File | Action |
|------|--------|
| `src/web-ui/routes/skills.js` | Modify `htmlGetPreview`: assemble `artefactContent` with H2 section headings and section-scoped content |

### Files you must NOT touch

Everything else — specifically `src/skill-content-adapter.js`, `src/web-ui/adapters/skills.js`, `src/web-ui/server.js`, any dashboard, artefact, or governance file. Do not change the commit route or artefact path derivation.

### Acceptance Criteria to implement

**AC1:** `htmlGetPreview` returns `artefactContent` with one H2 heading per SKILL.md section in document order; no "Q1:" / "A:" prefixes in output.

**AC2:** If `session.sectionDrafts[sectionIndex]` is populated for a section, that section's content in `artefactContent` is the confirmed draft text.

**AC3:** If `session.sectionDrafts[sectionIndex]` is absent or null, that section's content is the concatenation of all answers for questions in that section, each answer on its own line, with no label prefix.

**AC4:** For flat skills (no H2 sections), `htmlGetPreview` assembles a single section using the skill name as the heading, answers concatenated — no regression from prior behaviour.

**AC5:** `artefactContent` is a string; `artefactPath` derivation is unchanged (regression canary T5.5 passes without modification).

**AC6:** All prior tests pass after implementation (regression). Tests that previously asserted `artefactContent` format (e.g. `## Q1:` prefix) must now expect H2-heading format. Update any such assertion in the test suite if required.

### Non-negotiable constraints

- Node.js CommonJS (`require`), no new npm packages.
- Artefact path derivation must not change — only the `content` string assembled inside `htmlGetPreview` changes.
- Section order in `artefactContent` must match `session.sections` order (which matches SKILL.md document order).
- Read `.github/architecture-guardrails.md` before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

**Oversight level: Medium**
