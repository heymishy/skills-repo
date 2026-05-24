# DoR Contract: Add `skills init` command for atomic feature initialisation (SC-05)

**Story:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-05-skills-init.md`
**DoR artefact:** `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-05-skills-init-dor.md`
**Date approved:** 2026-05-25

---

## Scope

### In scope
- `src/enforcement/cli-init.js` — new module, exports `init(slug, description, repoRoot)` returning `{exitCode, stdout, stderr}`
- `bin/skills` — add `init` dispatch branch + update usage output
- `tests/check-gpa-sc05-skills-init.js` — new test file (created RED first, then GREEN)

### Out of scope (MUST NOT touch)
- `src/enforcement/cli-advance.js` — reference pattern only, do not modify
- `src/enforcement/governance-package.js`
- `.github/scripts/run-assurance-gate.js`
- `.github/scripts/assurance-gate.yml`
- `src/web-ui/routes/journey.js`
- Any existing test file
- Any story artefact, test plan, or DoR artefact file
- `artefacts/<slug>/` directory creation — CLI writes to pipeline-state.json only

---

## schemaDepends

None — SC-05 has no upstream story dependencies. Schema dependency check not required.

---

## AC coverage contract

| AC | Required test(s) | Test file | Covered |
|----|-----------------|-----------|---------|
| AC1 — valid slug creates correct stub with all required fields, atomic write | T1, T2, T3, T4, T5, IT1 | tests/check-gpa-sc05-skills-init.js | ✅ |
| AC2 — duplicate slug exits non-zero; state unchanged | T6, T7, IT2 | tests/check-gpa-sc05-skills-init.js | ✅ |
| AC3 — 6 invalid slug patterns exit non-zero | T8-T13 | tests/check-gpa-sc05-skills-init.js | ✅ |
| AC4 — integrity check passes immediately after init | T14 | tests/check-gpa-sc05-skills-init.js | ✅ |
| AC5 — `node bin/skills` lists init subcommand | IT3 | tests/check-gpa-sc05-skills-init.js | ✅ |

---

## NFR contract

| NFR | Enforcement | Verification |
|-----|-------------|-------------|
| Atomicity: no .tmp file left after success or failure | NFR-T1 | Verification script Step 3 and Step 13 |
| No external npm dependencies | Implementation constraint | `cat package.json` — no new entries |
| Input validation before any file operation | NFR-T3 (path traversal), T8-T13 (slug validation) | Verification script Steps 7-8 |
| Path traversal guard: slug cannot escape repoRoot | NFR-T3 | Verification script Step 12 |
| Exit codes: 0 success, non-zero failure | T2 (exit 0), T6/T8-T13 (non-zero) | All integration tests |

---

## Implementation notes for coding agent

- Module pattern: follow `src/enforcement/cli-advance.js` exactly — pure function, no side effects beyond state file write, no `process.exit()`
- Slug validation pattern: `/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/` — minimum 3 chars (first + 1-78 middle + last), alphanumeric start and end, hyphens allowed in middle only
- Title-case derivation: `slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())`
- Test isolation: tests MUST use a temp copy at `path.join(repoRoot, 'pipeline-state.test-<timestamp>.json')` — not the real state file — to avoid polluting test runs. The path must be inside repoRoot to satisfy the traversal guard.
- updatedAt format: `new Date().toISOString().slice(0, 10)` (YYYY-MM-DD)
