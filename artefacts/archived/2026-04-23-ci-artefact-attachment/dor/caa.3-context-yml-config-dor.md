# Definition of Ready: caa.3 — `context.yml` opt-in gate and `ci_platform` adapter routing

**Story:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.3-context-yml-config.md
**Feature:** 2026-04-23-ci-artefact-attachment
**Date:** 2026-04-23
**Run:** 1

---

## Entry Conditions

| Condition | Status |
|-----------|--------|
| Story artefact | ✅ exists |
| Review report (PASS, 0 HIGH) | ✅ PASS — caa.3-review-1.md, 0 HIGH, 1 MEDIUM resolved |
| Test plan | ✅ exists — 11 tests, 6 ACs |
| AC verification script | ✅ exists — 6 scenarios |

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 6 ACs |
| H3 | Every AC has ≥1 test | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS — MM1-context-yml-config |
| H6 | Complexity rated | ✅ PASS — Complexity 1 |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH |
| H8 | No uncovered ACs | ✅ PASS — live runner gap for AC1 `if:` condition acknowledged with manual mitigation |
| H8-ext | Schema dependency check | ✅ PASS — upstream caa.2 introduces no pipeline-state.json schema fields; schemaDepends not required |
| H9 | Architecture Constraints populated; no Cat-E HIGH | ✅ PASS — ADR-004, ADR-012, zero-breakage cited |
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
| W3 | MEDIUM finding acknowledged | ⚠️ RISK-ACCEPT — F-A1 resolved in story; /decisions entry to be logged |
| W4 | Verification script reviewed | ⚠️ RISK-ACCEPT — solo repo; human review at PR |
| W5 | UNCERTAIN gaps | ✅ None |

---

## Oversight Level

**Medium** — share this DoR artefact with the tech lead before starting the inner coding loop.

---

## Verdict

✅ **PROCEED**

---

## Coding Agent Instructions

### Scope

Add the `context.yml` opt-in gate. This is the final story in the epic. It wraps the steps from caa.1 and caa.2 behind a condition check and adds the `audit:` block to `contexts/personal.yml`. caa.2 must be DoD-complete before this story begins.

### Files you may touch

| File | Action |
|------|--------|
| `.github/workflows/assurance-gate.yml` | Modify — add `if:` condition wrapping collect+upload+comment steps; add step to read `context.yml` config |
| `contexts/personal.yml` | Modify — add `audit:` block with `ci_attachment`, `ci_platform`, `artifact_retention_days` fields and inline comments |
| `tests/check-caa3-config.js` | Create — new test file |
| `package.json` | Add `tests/check-caa3-config.js` to test chain only |

### Files you must NOT touch

`scripts/trace-report.js`, `scripts/ci-adapters/`, `dashboards/`, `src/`, `artefacts/`, `standards/`, `.github/skills/`, `.github/templates/`.

### Acceptance Criteria to implement

**AC1:** When `context.yml` has `audit.ci_attachment: false` (or `audit:` block is absent), the collect, upload, and comment steps do not run. The workflow step is skipped (`if: false` or equivalent) and no staging directory is created.

**AC2:** When `context.yml` has `audit.ci_attachment: true` and `audit.ci_platform: github-actions`, all steps from caa.1 and caa.2 run as specified.

**AC3:** When `audit.ci_platform` is set to a value other than `github-actions` (e.g. `gitlab-ci`), the adapter-loading step exits with code 1 and message: `[ci-artefact-attachment] Adapter '[platform]' is not yet implemented. Available adapters: github-actions.` The governance gate result is unaffected (attachment failure is non-fatal).

**AC4:** `contexts/personal.yml` contains an `audit:` block with all three fields (`ci_attachment`, `ci_platform`, `artifact_retention_days`), each with an inline `#` comment explaining the field. The `ci_platform` comment lists valid values.

**AC5:** After implementing this story, `npm test` passes with zero new failures (all 4 existing suites continue to pass).

**AC6:** When `context.yml` is syntactically invalid YAML, the workflow step that reads it exits with code 1 and message: `[ci-artefact-attachment] context.yml could not be parsed — check YAML syntax.` The governance gate result is unaffected.

### NFR constraints — CRITICAL

- **Zero regressions (M2):** All 4 existing `npm test` suites must pass. Run `npm test` before opening the PR and confirm exit code 0.
- **Fail-open on attachment:** A failure in the attachment steps (collect error, upload error, parse error) must not fail the governance gate. The attachment result is advisory only.
- **Zero new npm deps:** If `context.yml` parsing is needed in Node.js (for the test suite), use `yq` in the workflow YAML step (shell command, not npm) or implement a minimal YAML subset parser using built-ins. Do NOT add `js-yaml` or any other npm package.
- **Explicit over implicit:** `ci_platform` value errors must name the invalid value and list valid options. Silent no-ops are forbidden.

### YAML parsing implementation note

The workflow step that reads `context.yml` should use `yq` (available on GitHub-hosted runners by default, from `mikefarah/yq`) as a shell step — e.g.:
```yaml
- name: Read ci_attachment config
  id: ci-config
  run: |
    CI_ATTACHMENT=$(yq '.audit.ci_attachment // "false"' context.yml)
    echo "ci_attachment=${CI_ATTACHMENT}" >> "$GITHUB_OUTPUT"
```
This approach requires zero npm packages. For the Node.js test file (`check-caa3-config.js`), the config-reader function under test should accept a parsed config object — keeping the YAML parsing at the shell/workflow boundary and the logic testable in pure Node.js.

### Test file

Create `tests/check-caa3-config.js`. Use synthetic temp `context.yml` fixture files. Test count target: 11 (8 unit + 1 integration + 2 NFR). Include regression test confirming `npm test` exit code 0.

### Commit message format

`feat(caa.3): context.yml opt-in gate and ci_platform adapter routing`

### Definition of done for this story

`npm test` passes (all suites including check-caa3-config.js). AC verification script Scenarios 1–6 all PASS. Open a draft PR — do not mark ready for review. Do not merge.
