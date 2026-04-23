# Definition of Done: caa.2 — GitHub Actions adapter: upload artefact bundle and post summary link

**PR:** https://github.com/heymishy/skills-repo/pull/188 | **Merged:** 2026-04-23
**Story:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.2-github-actions-adapter.md
**Test plan:** artefacts/2026-04-23-ci-artefact-attachment/test-plans/caa.2-github-actions-adapter-test-plan.md
**DoR artefact:** artefacts/2026-04-23-ci-artefact-attachment/dor/caa.2-github-actions-adapter-dor.md
**Assessed by:** Copilot / /definition-of-done skill
**Date:** 2026-04-23

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ❌ | `scripts/ci-adapters/github-actions.js` does not exist; no upload step in `assurance-gate.yml` | Code inspection: `Test-Path scripts/ci-adapters/github-actions.js` returns False | PR #188 contained only an "Initial plan" commit with zero file changes |
| AC2 | ❌ | No PR comment step implemented; adapter file absent | Code inspection | Same as AC1 |
| AC3 | ❌ | `scripts/ci-adapters/` directory does not exist; no interface contract established | Code inspection: `Test-Path scripts/ci-adapters` returns False | Same as AC1 |
| AC4 | ❌ | `scripts/ci-adapters/README.md` does not exist | Code inspection: `Test-Path scripts/ci-adapters/README.md` returns False | Same as AC1 |
| AC5 | ❌ | `assurance-gate.yml` permissions block not modified; cannot verify `contents: write` absence | Code inspection | Same as AC1 |

---

## Scope Deviations

PR #188 merged with zero file changes. The GitHub Copilot coding agent committed only an "Initial plan" step and the branch was merged before any implementation commits were added. The full story scope — `scripts/ci-adapters/github-actions.js`, `scripts/ci-adapters/README.md`, upload step in `assurance-gate.yml`, PR comment step — was not delivered.

---

## Test Plan Coverage

**Tests from plan implemented:** 0 / 10
**Tests passing in CI:** 0 / 0 implemented

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1a: adapter-file-exists | ❌ | N/A | Test file `tests/check-caa2-adapter.js` does not exist |
| T1b: adapter-exports-upload | ❌ | N/A | |
| T1c: adapter-exports-postComment | ❌ | N/A | |
| T2a: upload-returns-artifactUrl | ❌ | N/A | |
| T2b: artifact-name-format | ❌ | N/A | |
| T3a: comment-contains-governed-artefact-chain | ❌ | N/A | |
| T3b: comment-contains-slug | ❌ | N/A | |
| T4a: readme-documents-interface | ❌ | N/A | |
| T4b: readme-documents-add-adapter | ❌ | N/A | |
| T5a: no-contents-write-permission | ❌ | N/A | |

**Gaps (tests not implemented):** All 10 tests unimplemented. Risk: HIGH — caa.3 depends on these adapter steps being present.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: workflow uses `${{ github.token }}` only | ❌ | Not implemented |
| Permissions: no `contents: write` in new steps | ❌ | Not implemented |
| Idempotency: second run updates or posts comment | ❌ | Not implemented |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1-evidence-reach: reviewer can reach artefacts in ≤2 clicks | ❌ | On re-delivery | Upload adapter not created |
| M2-zero-breakage: no existing tests broken | ✅ | Now | Existing `npm test` suites unaffected (story delivered no code) |
| M3-adapter-extensibility: second adapter is purely additive | ❌ | On re-delivery | Interface contract not established |

---

## Outcome

**INCOMPLETE**

**Follow-up actions (original — now resolved):**
1. Re-open or create a new implementation issue for caa.2 — coding agent must implement `scripts/ci-adapters/github-actions.js` (upload + postComment), `scripts/ci-adapters/README.md`, and the corresponding steps in `assurance-gate.yml` as specified by all 5 ACs.
2. Ensure test file `tests/check-caa2-adapter.js` is produced before or alongside implementation (per DoR TDD requirement).
3. caa.1 must be re-delivered first (staging directory contract is a hard dependency for caa.2).

---

## Re-delivery — PR #190 (2026-04-23)

**All ACs delivered.** Full implementation landed in PR #190. `scripts/ci-adapters/github-actions.js` (upload + postComment), `scripts/ci-adapters/README.md`, workflow collect/upload/comment steps, `tests/check-caa2-adapter.js`: 26/26 assertions passing. `dodStatus` set to `complete` in `pipeline-state.json`.

---

## Smoke-test finding — PR #191 (2026-04-23)

**Finding:** After the first live CI run, the PR comment contained only a bundle download link. The user required each individual artefact to appear as a named hyperlink in the comment (artefact filename as link text, GitHub blob URL as target).

**Fix applied in `.github/workflows/assurance-gate.yml`:** The `Post governed artefact chain comment` step now reads `.ci-artefact-staging/[slug]/manifest.json` and generates a `### Artefacts` section with one Markdown hyperlink per file. Link format: `[basename](https://github.com/owner/repo/blob/{sha}/artefacts/slug/relative-path)`. The bundle download link is retained as a secondary element.

**`postComment` in `scripts/ci-adapters/github-actions.js` unchanged:** The comment is posted inline by `actions/github-script` (not via the adapter function) so no adapter code change is needed. Existing `check-caa2-adapter.js` tests continue to pass.

---

## DoD Observations

1. **Empty PR pattern — same root cause as caa.1:** PR #188 was an identical empty "Initial plan" merge. See caa.1 DoD observation 1 for the /improve recommendation.

2. **Dependency sequencing:** caa.2 cannot be meaningfully re-delivered until caa.1's staging directory contract is verified passing. The /definition-of-ready DoR already captures this dependency — re-dispatch should enforce it.
