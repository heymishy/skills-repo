# Definition of Done — caa.3: context.yml opt-in gate and ci_platform adapter routing

**Story:** caa.3 — `context.yml` opt-in gate and `ci_platform` adapter routing
**Feature:** 2026-04-23-ci-artefact-attachment
**DoD date:** 2026-04-23
**Outcome:** INCOMPLETE — Original PR #189 (GitHub SWE agent dispatch) merged with zero file changes.
**Reimplementation PR:** feat/caa-reimplementation (VS Code inner loop)
**Reviewer:** Pipeline operator

---

## Outcome summary

The original GitHub SWE agent dispatch (issue-dispatch, target: github-agent) produced PR #189 which merged with zero file changes (plan-only commit, no implementation). This is the D18 pattern — third occurrence. The story was subsequently reimplemented via the VS Code agent inner loop on branch `feat/caa-reimplementation` alongside caa.1 and caa.2.

The DoD outcome is marked **INCOMPLETE** for the original PR #189 dispatch. The reimplementation on `feat/caa-reimplementation` is the authoritative delivery.

---

## AC coverage

| AC | Criterion | Status | Evidence |
|----|-----------|--------|---------|
| AC1 | `ci_attachment: false` or absent `audit:` block → collect/upload/comment steps skipped | PASS | `tests/check-caa3-config.js` T1, T2; `assurance-gate.yml` `if: steps.ci_attach_cfg.outputs.ci_attachment == 'true'` condition on all 3 steps |
| AC2 | `ci_attachment: true` + `ci_platform: github-actions` → all steps run | PASS | `tests/check-caa3-config.js` T3, T10 (integration); `scripts/ci-attachment-config.js` `readCiAttachmentConfig` |
| AC3 | Unknown `ci_platform` → exit 1 + informative message | PASS | `tests/check-caa3-config.js` T4, T5; `scripts/ci-attachment-config.js` `loadAdapter` throws `[ci-artefact-attachment] Adapter '...' is not yet implemented. Available adapters: github-actions.` |
| AC4 | `contexts/personal.yml` has `audit:` block with all 3 fields + inline comments | PASS | `tests/check-caa3-config.js` T6, T7; `contexts/personal.yml` updated |
| AC5 | All existing test suites pass — zero new failures | PASS | `npm test`: 16 passed, 2 failed (same 2 pre-existing p3.3 failures: `workflow-yaml-uses-pinned-immutable-ref`, `download-uses-https-not-http`) |
| AC6 | Malformed `context.yml` → exit 1 + `[ci-artefact-attachment] context.yml could not be parsed — check YAML syntax.` | PASS | `tests/check-caa3-config.js` T8, T9; `scripts/ci-attachment-config.js` `parseAuditBlock` detects unclosed brackets |

---

## NFR coverage

| NFR | Description | Status | Evidence |
|-----|-------------|--------|---------|
| Zero regressions (M2) | All existing npm test suites pass | PASS | 2 pre-existing p3.3 failures remain; no new failures introduced |
| Fail-open on attachment | Attachment failure non-fatal to governance gate | PASS | T9: parse error is catchable; `if:` conditions isolate attachment steps |
| Explicit over implicit | Unknown platform error names adapter and lists valid options | PASS | T4b/T4c: exact error message verified |

---

## Files delivered (reimplementation branch)

| File | Change | Story |
|------|--------|-------|
| `scripts/ci-attachment-config.js` | Created — `readCiAttachmentConfig`, `loadAdapter`, `parseAuditBlock` | caa.3 |
| `.github/workflows/assurance-gate.yml` | Modified — added `Read ci-artefact-attachment config` step (yq); `if:` conditions on collect/upload/comment | caa.3 |
| `contexts/personal.yml` | Modified — added `audit:` block with `ci_attachment`, `ci_platform`, `artifact_retention_days` + inline comments | caa.3 |
| `tests/check-caa3-config.js` | Created — 11 tests, 26 assertions | caa.3 |
| `scripts/trace-report.js` | Modified — `--collect` flag, `collectArtefacts`, `resolveActiveFeature` | caa.1 |
| `tests/check-caa1-collect.js` | Created — 18 tests, 40 assertions | caa.1 |
| `scripts/ci-adapters/github-actions.js` | Created — `upload`, `postComment` | caa.2 |
| `scripts/ci-adapters/README.md` | Created — adapter interface contract | caa.2 |
| `tests/check-caa2-adapter.js` | Created — 10 tests, 26 assertions | caa.2 |
| `package.json` | Modified — appended `check-caa1-collect`, `check-caa2-adapter`, `check-caa3-config` to test chain | all |
| `CHANGELOG.md` | Modified — added caa.1/caa.2/caa.3 entry under `### Added` | all |

---

## Test results

```
[caa3] Results: 26 passed, 0 failed
[caa2] Results: 26 passed, 0 failed
[caa1] Results: 40 passed, 0 failed
[assurance-gate-check] Results: 16 passed, 2 failed  ← pre-existing p3.3 failures only
```

---

## Deviations

None. All 6 ACs implemented as specified. The `--collect` CLI path uses `process.cwd()` as `rootDir` (not `__dirname`) to support integration tests that set a custom `cwd` — this is an implementation detail, not a deviation from the ACs.

---

## Original dispatch failure record

- **PR:** #189 (GitHub SWE agent)
- **changedFiles:** 0
- **Root cause:** D18 pattern — agent produced plan-only commit; see `workspace/learnings.md` D18 entry
- **Resolution:** VS Code inner loop reimplementation on `feat/caa-reimplementation`
