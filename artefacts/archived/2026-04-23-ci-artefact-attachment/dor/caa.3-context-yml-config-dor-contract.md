# DoR Contract: caa.3 — `context.yml` opt-in gate and `ci_platform` adapter routing

**Story:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.3-context-yml-config.md
**Approved by:** [tech lead — to be confirmed]
**Date:** 2026-04-23

---

## What will be built

1. `assurance-gate.yml` gains a config-read step (shell, using `yq`) that reads `audit.ci_attachment` and `audit.ci_platform` from `context.yml` and sets them as step outputs.
2. The collect, upload, and comment steps from caa.1 and caa.2 are wrapped in an `if:` condition checking `steps.ci-config.outputs.ci_attachment == 'true'`.
3. An adapter-routing check validates `ci_platform` against known adapter names; exits code 1 with the exact prescribed message for unknown values.
4. `contexts/personal.yml` gains an `audit:` block with `ci_attachment: false`, `ci_platform: github-actions`, `artifact_retention_days: 7`, each with an inline comment.

---

## What will NOT be built

- Multi-platform adapter implementations.
- Schema changes to `pipeline-state.json`.
- Any changes to `scripts/trace-report.js` or `scripts/ci-adapters/`.
- Any changes to `dashboards/`, `src/`, `artefacts/`, or `standards/`.

---

## AC verification approach

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — ci_attachment: false skips steps | Unit: step-condition evaluator with synthetic outputs; Integration: local dry-run assert no staging dir | unit + integration |
| AC2 — ci_attachment: true + github-actions runs all steps | Unit: assert collect → upload → comment call sequence | unit |
| AC3 — unknown ci_platform exits 1 + message | Unit: inject unknown value, assert exit code and message | unit |
| AC4 — personal.yml audit block | Unit: read file, assert 3 fields + inline comments present | unit |
| AC5 — npm test all-pass | Integration: spawn `npm test`, assert exit code 0 | integration |
| AC6 — malformed context.yml exits 1 + message | Unit: inject invalid YAML fixture, assert error message | unit |

---

## Assumptions

- `yq` (mikefarah/yq v4+) is available on GitHub-hosted runners without installation.
- The step outputs pattern (`>> "$GITHUB_OUTPUT"`) is the current GitHub Actions convention (it is).
- `contexts/personal.yml` is the canonical local config file — no other contexts are in scope.

---

## Estimated touch points

| Category | Items |
|----------|-------|
| Files modified | `.github/workflows/assurance-gate.yml`, `contexts/personal.yml`, `package.json` (test chain only) |
| Files created | `tests/check-caa3-config.js` |
| Files NOT touched | `scripts/trace-report.js`, `scripts/ci-adapters/`, all others |

---

## schemaDepends

Not applicable — caa.3 introduces no new fields to `pipeline-state.json`.

---

## Implementation constraint (CRITICAL)

YAML parsing in the workflow must use `yq` shell commands or `grep`/`awk` — NOT `js-yaml` or any other npm package. Adding an npm package to parse `context.yml` would violate MM2 (zero-dep constraint). The config-reader function in Node.js tests must be designed to receive a pre-parsed config object, keeping YAML parsing at the shell boundary.
