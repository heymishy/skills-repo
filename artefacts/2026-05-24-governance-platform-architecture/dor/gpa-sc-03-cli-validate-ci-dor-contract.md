# DoR Contract: Wire CLI validate to CI assurance gate (SC-03)

**Story:** gpa-sc-03-cli-validate-ci
**DoR artefact:** `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-03-cli-validate-ci-dor.md`
**Date:** 2026-05-25

---

## In Scope — Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/enforcement/governance-package.js` | Modified | Expose H-gate evaluation function(s) — `checkHGates(storyArtefactPath, repoRoot)` or equivalent; no logic duplication from cli-outer-loop.js |
| `src/enforcement/cli-outer-loop.js` | Modified (possibly) | May require light refactoring so governance-package.js can wrap/re-export validate logic; only change what is strictly necessary |
| `bin/skills` | Modified | Add `--story <slug> --ci` flag to the `validate` subcommand; wire to governance-package.js |
| `.github/workflows/assurance-gate.yml` | Modified | Add step to call `node bin/skills validate --story <slug> --ci` for each story in PR feature |
| `tests/check-gpa-sc03-cli-validate-ci.js` | New | Test file — T1–T5 unit tests + IT1–IT2 integration tests; prefix `[gpa-sc03]` |

---

## Out of Scope — MUST NOT Touch

The following files are explicitly excluded from SC-03:

- `scripts/ci-audit-comment.js` — audit comment logic is SC-07's scope; do not modify
- The existing 4 structural file-existence checks in `run-assurance-gate.js` or `assurance-gate.yml` — these must remain intact and run alongside the new H-gate step
- Any file under `artefacts/` — read-only pipeline inputs
- `standards/` — read-only standards documents
- `.github/templates/` — platform infrastructure
- `.github/skills/` — platform infrastructure
- Any merge-blocking logic — H-gate failures are reported but do not fail the workflow job

---

## Schema Dependencies

`schemaDepends: [dorStatus]`

SC-03 reads `pipeline-state.json` field `dorStatus` to implement skip logic (AC4). The `dorStatus` field exists in `.github/pipeline-state.schema.json` (present since Wave 1 — used by SC-01, SC-04, SC-05). No schema changes are required.

---

## Upstream Story Dependency

SC-03 has an upstream story: **SC-01** (`gpa-sc-01-trace-contract`). SC-03 can be dispatched and implemented in parallel with SC-01. The H9 evaluation step in assurance-gate.yml will warn about missing `standards/governance/trace-contract.md` until SC-01 lands — this is expected behaviour and does not block SC-03 from completing.

---

## Test File Contract

**File:** `tests/check-gpa-sc03-cli-validate-ci.js`
**Suite prefix:** `[gpa-sc03]`
**Minimum test count:** 5 unit + 2 integration = 7 tests
**Must be added to `package.json` test script** before the PR is opened.

---

## Scope Violation Indicators

If any of the following are observed, stop and leave a PR comment:

1. H-gate logic is implemented directly in `bin/skills` without being exposed via `governance-package.js` — this violates ADR-013.
2. The 4 existing structural checks in assurance-gate.yml are modified or removed — these are out of scope.
3. H-gate CI failures are wired to fail the workflow job (exit 1 at CI level) — no merge-blocking in this story.
4. `scripts/ci-audit-comment.js` is modified — that is SC-07's scope.
