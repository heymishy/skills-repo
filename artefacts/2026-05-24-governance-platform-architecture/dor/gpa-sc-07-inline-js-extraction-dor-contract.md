# DoR Contract: Extract inline workflow JS to tested modules (SC-07)

**Story:** gpa-sc-07-inline-js-extraction
**DoR artefact:** `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-07-inline-js-extraction-dor.md`
**Date:** 2026-05-25

---

## In Scope — Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `scripts/ci-audit-comment.js` | Modified | Add `sourceIntegrity(sourcePath, manifestHash)` as a named export; no logic changes |
| `.github/workflows/assurance-gate.yml` | Modified | Remove inline `function sourceIntegrity(` definition; replace inline call with `ciAuditComment.sourceIntegrity(sourcePath, manifestHash)` |
| `tests/check-gpa-sc07-inline-js-extraction.js` | New | Test file — T1–T8 unit tests + IT1 integration test; prefix `[gpa-sc07]` |

---

## Out of Scope — MUST NOT Touch

The following files are explicitly excluded from SC-07. Changes to these files are a scope violation:

- `src/enforcement/governance-package.js` — no changes
- `src/enforcement/cli-outer-loop.js` — no changes
- `bin/skills` — no changes
- Any file under `artefacts/` — read-only pipeline inputs
- `standards/` — read-only standards documents
- `.github/templates/` — platform infrastructure
- `.github/skills/` — platform infrastructure

---

## Schema Dependencies

`schemaDepends: []`

SC-07 has no upstream story dependencies and does not read from or write to `pipeline-state.json` at runtime. No pipeline-state.json schema fields are required by this story.

---

## Test File Contract

**File:** `tests/check-gpa-sc07-inline-js-extraction.js`
**Suite prefix:** `[gpa-sc07]`
**Minimum test count:** 8 unit + 1 integration = 9 tests
**Must be added to `package.json` test script** before the PR is opened.

---

## Scope Violation Indicators

If, during implementation, any of the following are observed, stop and leave a PR comment:

1. Changes required to `src/enforcement/governance-package.js` or `cli-outer-loop.js` — these are out of scope.
2. `sourceIntegrity` requires modifications (logic changes) to make tests pass — the function body must be copied verbatim; if logic changes are needed, describe the blocker.
3. New npm package dependencies are introduced — zero new external dependencies permitted.
