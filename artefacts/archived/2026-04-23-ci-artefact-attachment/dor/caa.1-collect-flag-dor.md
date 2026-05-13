# Definition of Ready: caa.1 — Add `--collect` flag to `trace-report.js`

**Story:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.1-collect-flag.md
**Feature:** 2026-04-23-ci-artefact-attachment
**Date:** 2026-04-23
**Run:** 1

---

## Entry Conditions

| Condition | Status |
|-----------|--------|
| Story artefact | ✅ exists |
| Review report (PASS, 0 HIGH) | ✅ PASS — caa.1-review-1.md, 0 HIGH, 1 MEDIUM resolved |
| Test plan | ✅ exists — 18 tests, 6 ACs |
| AC verification script | ✅ exists — 6 scenarios |

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 6 ACs |
| H3 | Every AC has ≥1 test | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS — MM2-zero-dep, M2-zero-breakage |
| H6 | Complexity rated | ✅ PASS — Complexity 1 |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH |
| H8 | No uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS — upstream: None; schema check not required |
| H9 | Architecture Constraints populated; no Cat-E HIGH | ✅ PASS — ADR-003 cited |
| H-E2E | CSS-layout-dependent ACs | ✅ PASS — none |
| H-NFR | NFR profile exists | ✅ PASS |
| H-NFR2 | Compliance NFRs with regulatory clauses | ✅ PASS — none |
| H-NFR3 | Data classification not blank | ✅ PASS |
| H-NFR-profile | NFRs declared → profile exists | ✅ PASS |

**Hard blocks: 15/15 PASS**

---

## Warnings

| # | Check | Disposition |
|---|-------|-------------|
| W1 | NFRs populated | ✅ Populated |
| W2 | Scope stability | ✅ Stable |
| W3 | MEDIUM finding acknowledged | ⚠️ RISK-ACCEPT — F-A1 resolved in story artefact; /decisions entry to be logged before inner loop |
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

Implement the `--collect` flag for `scripts/trace-report.js`. This is a purely additive change to an existing CLI script. No other scripts, dashboards, or governance files are in scope.

### Files you may touch

| File | Action |
|------|--------|
| `scripts/trace-report.js` | Add `--collect` flag handling |
| `tests/check-caa1-collect.js` | Create — new test file |
| `package.json` | Add `tests/check-caa1-collect.js` to the `test` script chain only — zero new `dependencies` or `devDependencies` |

### Files you must NOT touch

Everything else. Specifically: `.github/workflows/`, `dashboards/`, `src/`, `artefacts/`, `standards/`, `.github/skills/`, `.github/templates/`.

### Acceptance Criteria to implement

**AC1:** `node scripts/trace-report.js --collect --feature=[slug]` creates `.ci-artefact-staging/[slug]/` with one sequentially-prefixed file per artefact (e.g. `01-discovery.md`, `02-benefit-metric.md`).

**AC2:** `manifest.json` written to the staging dir with `featureSlug`, `collectedAt` (ISO 8601), `fileCount` (integer), and `files` array (each entry: `filename`, `sourcePath`).

**AC3:** When `--feature` is omitted and exactly one non-archived feature exists in `pipeline-state.json`, it auto-resolves.

**AC4:** When no feature resolves, exit code 1 and stderr: `[trace-report --collect] No feature resolved. Pass --feature=<slug> or ensure exactly one active feature in pipeline-state.json.`

**AC5:** On second run, the staging dir is cleared and rebuilt from scratch (no stale files).

**AC6:** `--collect` path requires zero npm packages — only Node.js built-ins (`fs`, `path`, `crypto`, `os`). Verified by running with no `node_modules`.

### NFR constraints

- Performance: complete in ≤2 seconds for ≤30 files.
- Security: staging dir must NEVER include `pipeline-state.json`, `context.yml`, or any file outside `artefacts/[slug]/`.
- Zero new `package.json` deps.

### Test file

Create `tests/check-caa1-collect.js`. Follow the existing test file conventions in `tests/` (plain Node.js assertions, `process.exit(1)` on failure, `console.log('PASS')` per passing case, summary at end). Test count target: 18 (12 unit + 3 integration + 3 NFR).

### TDD order

Work AC by AC, test first:
1. Write failing test for AC1 unit case → implement → pass
2. Write failing test for AC2 unit case → implement → pass
3. Continue through AC3–AC6
4. Write integration tests last (spawn CLI, assert filesystem state)
5. NFR tests alongside relevant ACs

### Commit message format

`feat(caa.1): add --collect flag to trace-report.js`

### Definition of done for this story

`npm test` passes (all suites including check-caa1-collect.js). AC verification script Scenarios 1–6 all PASS. Open a draft PR — do not mark ready for review. Do not merge.

### Dependency note

caa.2 depends on the staging directory produced by this story. Implement and verify caa.1 fully before caa.2 begins.
