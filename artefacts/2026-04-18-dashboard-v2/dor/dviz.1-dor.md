# Definition of Ready — dviz.1-pipeline-adapter

**Feature:** `2026-04-18-dashboard-v2`
**Story:** `dviz.1` — Pipeline data adapter
**Date:** 2026-04-18
**Status:** Proceed ✅

---

## Contract Proposal

**What the coding agent will build:** A new file `dashboards/pipeline-adapter.js` that reads `pipeline-state.json` (via `fetch` when served, or `window.__PIPELINE_STATE__` injection for local file protocol) and exposes `window.CYCLES` and `window.EPICS` in the shape expected by `dashboards/index.html`. Modifies `dashboards/index.html` to load the adapter via `<script src="pipeline-adapter.js">` and removes the hardcoded `CYCLES`/`EPICS`/`STORIES` mock inline arrays (replacing them with reads from `window.CYCLES`, `window.EPICS`). Adds a test file `tests/check-dviz1-adapter.js` with T1–T10 from the test plan.

**Files touched:**
- NEW: `dashboards/pipeline-adapter.js`
- MODIFY: `dashboards/index.html` (add script tag, remove inline mock arrays)
- NEW: `tests/check-dviz1-adapter.js`
- MODIFY: `package.json` (add test to chain)

**Out of scope per contract:** `tests/check-dviz2-pages-workflow.js`, `tests/check-dviz3-dashboard-governance.js`, `pages.yml`, `pipeline-viz.html`, `extra-data.js`, secondary views data wiring.

**Schema dependencies:** None — no new fields added to `pipeline-state.json`.

**Contract review:** ✅ All ACs mappable to the proposed implementation.

---

## Hard blocks

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As/Want/So format with named persona | ✅ PASS — "developer or tech lead" persona |
| H2 | At least 3 ACs in Given/When/Then format | ✅ PASS — 5 ACs, GWT format |
| H3 | Every AC has at least one test in test plan | ✅ PASS — AC1→T5, AC2→T5+T6, AC3→T7+T8, AC4→T9, AC5→T10 |
| H4 | Out-of-scope section populated | ✅ PASS — 4 explicit OOS items |
| H5 | Benefit linkage references a named metric | ✅ PASS — M1 (dashboard data fidelity) in benefit-metric.md |
| H6 | Complexity rated | ✅ PASS — Complexity 2 |
| H7 | No unresolved HIGH review findings | ✅ PASS — review conducted inline; no HIGH findings |
| H8 | No uncovered ACs in test plan | ✅ PASS — all 5 ACs covered by T1–T10 |
| H8-ext | Cross-story schema dependency check | ✅ PASS — Dependencies: None. Schema check not required. |
| H9 | Architecture constraints populated; no Category E HIGH | ✅ PASS — constraints in story technical notes; no Category E issues |
| H-E2E | CSS-layout-dependent ACs without E2E tooling | ✅ PASS — no CSS-layout-dependent ACs; visual rendering is manual verification only |
| H-NFR | NFR profile exists at artefacts/2026-04-18-dashboard-v2/nfr-profile.md | ✅ PASS — created alongside this DoR |
| H-NFR2 | Compliance NFRs with regulatory clause have human sign-off | ✅ PASS — no compliance NFRs (regulated: false) |
| H-NFR3 | Data classification field in NFR profile not blank | ✅ PASS — "Internal / non-sensitive" |

**Hard blocks result: 14/14 PASS**

---

## Warnings

| # | Check | Result |
|---|-------|--------|
| W1 | NFRs populated or explicitly "None - confirmed" | ✅ Covered — NFR profile exists |
| W2 | Scope stability declared | ✅ Stable — wiring approach is clear; one assumption (fetch vs bundled JS) acknowledged |
| W3 | MEDIUM review findings acknowledged | ✅ No MEDIUM findings to acknowledge |
| W4 | Verification script reviewed by domain expert | ⚠️ MVS-1 and MVS-2 are manual steps requiring a browser — acknowledged |
| W5 | No UNCERTAIN items in test plan gap table | ✅ T6 (integration) has conditional skip noted and documented |

**W4 acknowledged:** The manual verification steps (browser render check) cannot be automated without E2E tooling. Accepted per discovery Constraint 3 (no build step, no bundler). Operator confirms visual render manually after merge.

---

## Oversight level

**Low** — standard tooling change, non-regulated repo, single operator.

---

## Coding Agent Instructions

**Story:** dviz.1 — Pipeline data adapter
**Feature slug:** `2026-04-18-dashboard-v2`

### Objective
Create `dashboards/pipeline-adapter.js` and wire `dashboards/index.html` to load real pipeline state from `.github/pipeline-state.json` instead of the hardcoded mock data.

### Scope contract
**Files to create:**
- `dashboards/pipeline-adapter.js`
- `tests/check-dviz1-adapter.js`

**Files to modify:**
- `dashboards/index.html` — add `<script src="pipeline-adapter.js">` before the `<script type="text/babel">` block; remove inline `CYCLES`, `EPICS` mock constant declarations; replace usage with `window.CYCLES`, `window.EPICS`
- `package.json` — add `node tests/check-dviz1-adapter.js` to the test chain

**Do NOT touch:** `pipeline-viz.html`, `extra-data.js`, `artefact-content.js`, `md-renderer.js`, `dashboards/pipeline.html`, `.github/pipeline-state.json` schema, any files outside `dashboards/` and `tests/`.

### Implementation constraints
- No build step: `pipeline-adapter.js` must be plain ES2015 JavaScript loadable via a `<script>` tag.
- CDN pin hashes in `index.html` must not change.
- Use `fetch('.github/pipeline-state.json')` when `window.location.protocol !== 'file:'`; fall back to `window.__PIPELINE_STATE__` or the mock data otherwise.
- Expose `window.CYCLES` and `window.EPICS` before the Babel script executes.
- The mock fallback (AC4) — not a blank page or uncaught error — must remain in place.

### Stage → phase-key mapping
```
discovery → discovery (1), benefit-metric → benefit (2), definition → definition (3),
review → review (4), test-plan → testplan (5), definition-of-ready → dor (6),
issue-dispatch → dispatch (7), subagent-execution → inner (8),
ci-assurance → assurance (9), definition-of-done → dod (10),
trace → trace (11), improve → improve (12)
```

### Health + dodStatus → story state
```
dodStatus "complete" → "done"
health "red" → "blocked"
stage in [review, test-plan, definition-of-ready] → "review"
health "green", active stage → "current"
otherwise → "queued"
```

### TDD order
1. Write `tests/check-dviz1-adapter.js` — all T1–T10 failing
2. Create `dashboards/pipeline-adapter.js` — T1, T2, T5, T6, T7, T8, T9, T10 pass
3. Modify `dashboards/index.html` — T3, T4 pass
4. Add to package.json — confirm `npm test` passes

### Security requirement (MC-SEC-02)
`pipeline-adapter.js` must not contain credentials, API keys, tokens, or personal identifiers.

### Verification command
```
npm test
```
Expected: all existing suites + new `[dviz1-pipeline-adapter]` suite, 0 failures.
