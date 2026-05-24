# DoR Contract: Add path traversal guard to manifest sourcePath reads (SC-06)

**Story:** gpa-sc-06-source-path-guard
**DoR artefact:** `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-06-source-path-guard-dor.md`
**Date:** 2026-05-25

---

## CRITICAL UPSTREAM DEPENDENCY

SC-06 MUST NOT be dispatched until SC-07 (`gpa-sc-07-inline-js-extraction`) is confirmed merged on master. `sourceIntegrity` does not exist as an exported function until SC-07 is merged.

---

## In Scope — Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `scripts/ci-audit-comment.js` | Modified | Add `path.resolve().startsWith(repoRoot + path.sep)` guard to `sourceIntegrity` function only; return `{ traversal: true, sanitisedPath: '[REDACTED]' }` on traversal; no other changes in this file |
| `tests/check-gpa-sc06-source-path-guard.js` | New | Test file — T1–T5 + 6 adversarial vectors; prefix `[gpa-sc06]` |

---

## Out of Scope — MUST NOT Touch

The following files are explicitly excluded from SC-06:

- `.github/workflows/assurance-gate.yml` — no workflow changes
- Any function in `scripts/ci-audit-comment.js` other than `sourceIntegrity` — bounded to one function
- `manifest.json` schema or any JSON schema files — no schema changes
- GitHub API calls, auth configuration, or comment posting logic — untouched
- Any file under `artefacts/` — read-only pipeline inputs
- `standards/` — read-only standards documents
- `.github/templates/` — platform infrastructure
- `.github/skills/` — platform infrastructure

---

## Schema Dependencies

`schemaDepends: []`

SC-06 has a code-level upstream dependency on SC-07 (the `sourceIntegrity` export must exist). This is a module export dependency, not a `pipeline-state.json` schema field dependency. No new schema fields are read or written by SC-06.

---

## Test File Contract

**File:** `tests/check-gpa-sc06-source-path-guard.js`
**Suite prefix:** `[gpa-sc06]`
**Minimum test count:** 5 tests (6 adversarial vectors as separate assertions within T1 and T2 is acceptable; min 5 named test cases)
**Must be added to `package.json` test script** before the PR is opened.

---

## Valid-Path Return Shape (read before writing T3)

`sourceIntegrity` in `scripts/ci-audit-comment.js` has an existing return shape for valid (in-repo) paths. **The agent must read the function body to confirm the current return shape before writing T3 (valid path regression test).** Do not assume a specific return value — the actual return shape is the source of truth. The contract only mandates the traversal-guard return shape:
- Traversal path: `{ traversal: true, sanitisedPath: '[REDACTED]' }` — mandatory, verbatim.
- Valid path: whatever the existing function currently returns — confirm by reading the code.

---

## Guard Implementation Pattern (mandatory — from copilot-instructions.md)

```js
const repoRoot = path.resolve(__dirname, '..');  // adjust as needed
const resolvedPath = path.resolve(sourcePath);
if (!resolvedPath.startsWith(repoRoot + path.sep)) {
  return { traversal: true, sanitisedPath: '[REDACTED]' };
}
```

Do not use string matching (`includes('../')`), regex, or any other traversal detection pattern. The `path.resolve().startsWith()` pattern is mandatory.

---

## Scope Violation Indicators

If any of the following are observed, stop and leave a PR comment:

1. SC-07 is not yet merged and `sourceIntegrity` is not an export — stop; post PR comment; wait for SC-07.
2. Any function other than `sourceIntegrity` in `scripts/ci-audit-comment.js` is modified.
3. The guard uses string matching or regex instead of `path.resolve().startsWith(repoRoot + path.sep)`.
4. The raw `sourcePath` value is logged or included in the function's return value when the guard fires.
5. `readFileSync` is called before the guard check — order must be: guard first, read second.
