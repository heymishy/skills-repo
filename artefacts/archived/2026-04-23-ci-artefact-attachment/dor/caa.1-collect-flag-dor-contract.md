# DoR Contract: caa.1 — Add `--collect` flag to `trace-report.js`

**Story:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.1-collect-flag.md
**Approved by:** [tech lead — to be confirmed]
**Date:** 2026-04-23

---

## What will be built

A `--collect` flag added to `scripts/trace-report.js` that:
1. Reads the `--feature=[slug]` argument or auto-resolves from `pipeline-state.json` (exactly one non-archived feature).
2. Walks `artefacts/[slug]/` recursively, collecting every `.md` file.
3. Copies each file to `.ci-artefact-staging/[slug]/` with a two-digit sequence prefix (`01-`, `02-`, …).
4. Writes `manifest.json` alongside with `featureSlug`, `collectedAt`, `fileCount`, `files[]`.
5. Clears the staging dir before each run (idempotent).
6. Exits code 1 with a specific stderr message when no feature resolves.

Uses only Node.js built-ins (`fs`, `path`, `crypto`, `os`). Zero new npm packages.

---

## What will NOT be built

- Upload to any CI platform — that is caa.2.
- Artefact content validation or diff between runs.
- Collection from multiple features simultaneously.
- Any changes to `.github/workflows/`, `dashboards/`, `src/`, or `standards/`.

---

## AC verification approach

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — seq-numbered files in staging dir | Unit: function call + fs.readdirSync assert; Integration: CLI spawn + dir listing | unit + integration |
| AC2 — manifest.json with 4 required fields | Unit: JSON.parse assert on manifest; Integration: end-to-end spawn | unit + integration |
| AC3 — auto-resolve single active feature | Unit: feature-resolver with synthetic pipeline-state.json | unit |
| AC4 — exit 1 + stderr on no feature | Unit: resolver returns null → exit 1; Integration: spawn captures stderr | unit + integration |
| AC5 — idempotent clear-and-rebuild | Unit: pre-create stale file, run collect, assert stale file absent | unit + integration |
| AC6 — zero npm deps | Unit: require() scan on collect code path in trace-report.js | unit |

---

## Assumptions

- `pipeline-state.json` is at the repo root (unchanged from current).
- "Active feature" = `stage !== "archived"`.
- Recursion into sub-directories of `artefacts/[slug]/` is required (stories/, test-plans/, dor/, etc.).
- Files outside `artefacts/[slug]/` (including `pipeline-state.json` and `context.yml`) are never collected.

---

## Estimated touch points

| Category | Items |
|----------|-------|
| Files modified | `scripts/trace-report.js` |
| Files created | `tests/check-caa1-collect.js` |
| Files updated (minor) | `package.json` (test chain only) |
| Files NOT touched | Everything else |

---

## schemaDepends

Not applicable — caa.1 introduces no new fields to `pipeline-state.json`.
