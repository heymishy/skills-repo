# Definition of Ready — dviz.3-governance-check

**Feature:** `2026-04-18-dashboard-v2`
**Story:** `dviz.3` — Dashboard governance check
**Date:** 2026-04-18
**Status:** Proceed ✅

---

## Contract Proposal

**What the coding agent will build:** A new governance check script `tests/check-dashboard-viz.js` that uses `readdirSync` to dynamically enumerate `.js` files under `dashboards/` and runs `node --check` against each one. Emits a descriptive error message per failing file. Adds `node tests/check-dashboard-viz.js` to the `npm test` chain in `package.json`.

**Files touched:**
- NEW: `tests/check-dashboard-viz.js`
- MODIFY: `package.json` (add to test chain)

**Out of scope per contract:** dviz.1, dviz.2, `pipeline-viz.html` (covered by existing `check-viz-syntax.js`).

**Schema dependencies:** None.

**Contract review:** ✅ All ACs mappable to the proposed implementation.

---

## Hard blocks

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As/Want/So format with named persona | ✅ PASS — "platform maintainer" persona |
| H2 | At least 3 ACs in Given/When/Then format | ✅ PASS — 5 ACs, GWT format |
| H3 | Every AC has at least one test in test plan | ✅ PASS — AC1→T1+T2, AC2→T3, AC3→T4, AC4→T5+T6, AC5→T7 |
| H4 | Out-of-scope section populated | ✅ PASS — 3 explicit OOS items |
| H5 | Benefit linkage references a named metric | ✅ PASS — MM1 (CI governance coverage of dashboards/) |
| H6 | Complexity rated | ✅ PASS — Complexity 1 |
| H7 | No unresolved HIGH review findings | ✅ PASS — review conducted inline; no HIGH findings |
| H8 | No uncovered ACs in test plan | ✅ PASS — all 5 ACs covered by T1–T7 |
| H8-ext | Cross-story schema dependency check | ✅ PASS — no schema dependencies for this story |
| H9 | Architecture constraints populated; no Category E HIGH | ✅ PASS — constraints in story technical notes |
| H-E2E | CSS-layout-dependent ACs without E2E tooling | ✅ PASS — no CSS-layout-dependent ACs |
| H-NFR | NFR profile exists at artefacts/2026-04-18-dashboard-v2/nfr-profile.md | ✅ PASS |
| H-NFR2 | Compliance NFRs with regulatory clause have human sign-off | ✅ PASS — no compliance NFRs |
| H-NFR3 | Data classification field in NFR profile not blank | ✅ PASS — "Internal / non-sensitive" |

**Hard blocks result: 14/14 PASS**

---

## Warnings

| # | Check | Result |
|---|-------|--------|
| W1 | NFRs populated or explicitly "None - confirmed" | ✅ NFR profile exists |
| W2 | Scope stability declared | ✅ Stable — node --check pattern is identical to existing check-viz-syntax.js |
| W3 | MEDIUM review findings acknowledged | ✅ No MEDIUM findings |
| W4 | Verification script requires domain expert review | ✅ No domain-expert dependency |
| W5 | No UNCERTAIN items in test plan gap table | ✅ All T1–T7 are mechanical checks |

---

## Oversight level

**Low** — adds a governance check; no production surface affected; non-regulated repo.

---

## Coding Agent Instructions

**Story:** dviz.3 — Dashboard governance check
**Feature slug:** `2026-04-18-dashboard-v2`

### Objective
Create `tests/check-dashboard-viz.js` — a governance script that syntax-checks all `.js` files under `dashboards/` using `node --check`, and add it to the npm test chain.

### Scope contract
**Files to create:**
- `tests/check-dashboard-viz.js`

**Files to modify:**
- `package.json` — add `node tests/check-dashboard-viz.js` to the test chain

**Do NOT touch:** `tests/check-viz-syntax.js` (covers `pipeline-viz.html`; separate; do not rename or remove), `dashboards/*.js`, any other test or source file.

### Implementation pattern
Model after `tests/check-viz-syntax.js` but:
- Target directory: `dashboards/`
- Use `fs.readdirSync('dashboards').filter(f => f.endsWith('.js'))` — dynamic enumeration (AC2)
- For each file, run `child_process.execSync('node --check dashboards/' + file)` — wrap in try/catch (AC3)
- On failure: emit `[check-dashboard-viz] FAIL: dashboards/<file> — <error message>` and `process.exit(1)` after all checks (AC5)
- On success: emit `[check-dashboard-viz] PASS: all <n> files are valid JavaScript`
- Do NOT hardcode file names (AC2 would fail)

### TDD order
1. Write `tests/check-dashboard-viz.js` — confirm T1 fails (file not found), then T2 (syntax check), T3 (dynamic scan), T4 (node --check), T5+T6 (package.json chain), T7 (error emission)
2. Implement the script — all T1–T7 pass
3. Add to package.json — confirm `npm test` passes

### Verification command
```
npm test
```
Expected: all existing suites + new `[check-dashboard-viz]` output, 0 failures. T6 (integration across all current dashboards/*.js files) should report PASS for all 4–5 existing files.
