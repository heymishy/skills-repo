## Test Plan: Production Docker image includes artefacts/ and .github/pipeline-state.json, so local-disk-based artefact features actually work

**Story reference:** artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/stories/daga-s1-include-artefacts-and-github-in-docker-image.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | No bare `artefacts/` or `.github/` exclusion line remains | 1 | — | — | — | — | 🟢 |
| AC2 | `.github/scripts/` exclusion still present | 1 | — | — | — | — | 🟢 |
| AC3 (regression) | Every other pre-existing exclusion unchanged | 1 | — | — | — | — | 🟢 |
| AC4 | Writer throws when `.git/` absent, even if `pipeline-state.json` is present | 1 | — | — | — | — | 🟢 |
| AC5 (regression) | Writer succeeds when `.git/` present — `owle.6`'s own T3/T4/T5/T8 (fixtures updated) still pass | 1 | — | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** No CSS-layout-dependent language — this story is a build-config text-content check, not application UI. An actual `docker build` + container-content verification would be the fullest possible integration test, but is not available in this environment (no guarantee Docker is installed/available in the test runner) — the text-content assertions below are the correct, available level of automated verification; the verification script's own manual scenario covers confirming the real, deployed behaviour post-merge. N/A.

---

## Coverage gaps

None for the config-file-content check itself. The one gap that exists structurally (an automated test cannot actually build the Docker image and inspect its real contents in this environment) is covered by the verification script's own manual, post-deploy scenario — not left silently unaddressed.

---

## Test Data Strategy

**Source:** Real — reads this repo's own actual `.dockerignore` file directly, not a synthetic fixture (the file's real content is exactly what's being verified).
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | The real `.dockerignore` file | Repo file, read directly | None | |
| AC2 | Same | Repo file, read directly | None | |
| AC3 | Same | Repo file, read directly | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### .dockerignore contains no bare artefacts/ or .github/ exclusion line
- **Verifies:** AC1
- **Precondition:** None — reads the real `.dockerignore` file.
- **Action:** Read `.dockerignore`'s own text content; split into lines.
- **Expected result:** No line, after trimming whitespace, is exactly `artefacts/` or exactly `.github/` (a bare, whole-directory exclusion with no further path segment).
- **Edge case:** No

### .dockerignore still excludes .github/scripts/
- **Verifies:** AC2
- **Precondition:** None.
- **Action:** Read `.dockerignore`'s own text content.
- **Expected result:** Contains a line matching `.github/scripts/` (trimmed).
- **Edge case:** No

### .dockerignore's other pre-existing exclusions are unchanged (regression guard)
- **Verifies:** AC3
- **Precondition:** None.
- **Action:** Read `.dockerignore`'s own text content.
- **Expected result:** Contains each of: `node_modules/`, `.env`, `.env.*`, `!.env.example`, `tests/*`, `!tests/e2e/`, `.git/`, `.worktrees/`, `.claude/`, `scripts/`, `docs/`, `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `dashboards/`, `coverage/`, `*.log`, `.vscode/`.
- **Edge case:** No

### pipelineStateWriterFactory throws when .git/ is absent, even with pipeline-state.json present
- **Verifies:** AC4
- **Precondition:** A temp repo with a real `.github/pipeline-state.json` but no `.git/` directory — the exact shape production will have once Fix 1 lands.
- **Action:** Call `pipelineStateWriterFactory(root)('any-feature', null, { stage: 'discovery' })`.
- **Expected result:** Throws — refusing to write, matching today's exact safe-failure behaviour (previously triggered by the file's own absence, now by `.git/`'s own absence).
- **Edge case:** Yes — this is the exact regression this story's own Fix 2 prevents.

### pipelineStateWriterFactory succeeds when .git/ is present (regression guard)
- **Verifies:** AC5
- **Precondition:** A temp repo with both `.github/pipeline-state.json` and a `.git/` directory.
- **Action:** Call the writer with a valid update; separately, re-run `tests/check-owle6-pipeline-state-auto-write.js` with its own T3/T4/T5/T8 fixtures updated to also create a `.git/` directory.
- **Expected result:** The direct call succeeds; all of `owle.6`'s own pre-existing tests still pass, unmodified in intent (only their own fixture setup gains a `.git/` directory, matching what "a real checkout" is now correctly defined to require).
- **Edge case:** No

---

## Out of Scope for This Test Plan

- An actual `docker build` and container-filesystem inspection — not available in this test environment; the manual verification script's own post-deploy scenario is the intended way to confirm the real, built image's own contents.
- Any test of `aada-s1`'s or `fapg-s1`'s own application logic — already fully covered by their own existing, passing test files; this story doesn't change that code.
- Any test of `pipelineStateWriter`'s own field-level logic, schema validation, or atomic-write mechanics — unchanged, already covered by `owle.6`'s own pre-existing T1/T2/T6/T7.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No automated `docker build` verification | Docker not guaranteed available in this test environment | Verification script's own manual post-deploy scenario (confirm `aada-s1`/`fapg-s1` actually work live once promoted) |
