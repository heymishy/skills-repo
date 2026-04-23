## Test Plan: GitHub Actions adapter — upload artefact bundle and post summary link

**Story reference:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.2-github-actions-adapter.md
**Epic reference:** artefacts/2026-04-23-ci-artefact-attachment/epics/e1-ci-artefact-attachment.md
**Test plan author:** Copilot / /test-plan skill
**Date:** 2026-04-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Staging dir uploaded as artifact named `governed-artefacts-[slug]-[run-id]` | 1 test | 1 test | — | 1 scenario | External-dependency | 🟡 |
| AC2 | PR comment posted with required phrase, link, and slug | 2 tests | — | — | 1 scenario | External-dependency | 🟡 |
| AC3 | Second adapter is purely additive — no changes to core files | 2 tests | — | — | — | — | 🟢 |
| AC4 | README documents interface contract and ci_platform mapping | 2 tests | — | — | — | — | 🟢 |
| AC5 | Workflow permissions block has no `contents: write` | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest/Node | Handling |
|-----|----|----------|-------------------------------|---------|
| Actual GitHub Actions artifact upload and accessibility | AC1 | External-dependency | Requires live GitHub Actions runner environment; cannot be reproduced in unit/integration test | Adapter unit tests mock the upload call; manual scenario confirms live artifact link appears in CI run |
| Actual PR comment posting to GitHub | AC2 | External-dependency | Requires live GitHub API and authenticated token; cannot mock reliably without a real PR | Adapter unit tests mock `gh` CLI output; manual scenario confirms comment appears on a real PR |

---

## Test Data Strategy

**Source:** Synthetic — unit tests mock the `actions/upload-artifact` call and `gh pr comment` invocation using injected mock functions; adapter interface tested with stub implementations. Workflow YAML tested by file parsing.
**PCI/sensitivity in scope:** No
**Availability:** Available now — mock-based, self-contained
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | stagingDir path, runId string, expected artifact name pattern | Synthetic | None | Mock upload function asserts name matches pattern |
| AC2 | issueRef (e.g. "123"), summaryLink (mock URL), feature slug | Synthetic | None | Mock postComment asserts required strings present in call args |
| AC3 | A second stub adapter file implementing the interface | Synthetic stub file | None | Confirm no changes to trace-report.js or assurance-gate.yml needed |
| AC4 | scripts/ci-adapters/README.md file content | Read from repo | None | String assertions on file content |
| AC5 | .github/workflows/assurance-gate.yml content | Read from repo | None | YAML parse / regex check on permissions block |

### PCI / sensitivity constraints

None.

### Gaps

AC1 and AC2 depend on live GitHub infrastructure for full end-to-end verification. Manual scenarios cover this gap post-merge.

---

## Unit Tests

All tests written to FAIL before implementation. Test file: `tests/check-caa2-adapter.js`.

### githubActionsAdapter.upload — calls upload with correctly formed artifact name

- **Verifies:** AC1
- **Precondition:** `scripts/ci-adapters/github-actions.js` exports an object with `upload(stagingDir, runId)` function; a mock upload function is injected or the underlying action call is stubbed
- **Action:** Call `adapter.upload('.ci-artefact-staging/test-feature', 'run-12345')` with the mock upload wired to capture the artifact name passed
- **Expected result:** The artifact name passed to the underlying upload mechanism is exactly `governed-artefacts-test-feature-run-12345`
- **Edge case:** No

### githubActionsAdapter.postComment — comment body contains required strings

- **Verifies:** AC2
- **Precondition:** `scripts/ci-adapters/github-actions.js` exports `postComment(issueRef, summaryLink)` function; mock `gh` or comment function captures the comment body
- **Action:** Call `adapter.postComment('42', 'https://example.com/artifact/link')` with mock capturing the comment text
- **Expected result:** Comment body contains all three of: `"Governed artefact chain"`, `"https://example.com/artifact/link"`, and the feature slug (or `issueRef` identifier)
- **Edge case:** No

### githubActionsAdapter.postComment — does not throw when summaryLink contains special characters

- **Verifies:** AC2
- **Precondition:** Mock postComment wired as above
- **Action:** Call `adapter.postComment('42', 'https://example.com/run/12345?check_suite_focus=true&artifact=abc')` (URL with query params)
- **Expected result:** Function completes without throwing; link appears verbatim in the comment body
- **Edge case:** Yes — special chars in URL

### adapterInterface — second adapter file requires no changes to trace-report.js or assurance-gate.yml

- **Verifies:** AC3
- **Precondition:** A stub file `scripts/ci-adapters/stub-platform.js` implementing `{ upload(stagingDir, runId) { return { artifactUrl: '' }; }, postComment(issueRef, summaryLink) {} }` is created in the test setup
- **Action:** Load the stub adapter via the same dispatch mechanism used by the main entry point (i.e. `require(`./ci-adapters/${platform}`)`); verify both methods exist and are callable
- **Expected result:** Stub adapter loads and both methods can be called without modifying `trace-report.js`, `assurance-gate.yml`, or any file outside `scripts/ci-adapters/`
- **Edge case:** No

### adapterInterface — interface has upload and postComment methods

- **Verifies:** AC3
- **Precondition:** Load `scripts/ci-adapters/github-actions.js`
- **Action:** Assert `typeof adapter.upload === 'function'` and `typeof adapter.postComment === 'function'`
- **Expected result:** Both methods exist on the exported object
- **Edge case:** No

### ciAdaptersREADME — documents upload and postComment signatures

- **Verifies:** AC4
- **Precondition:** `scripts/ci-adapters/README.md` exists
- **Action:** Read file content; check for key strings
- **Expected result:** File content contains `"upload"`, `"postComment"`, `"stagingDir"`, `"runId"`, and `"ci_platform"` — confirming the interface contract and platform mapping are documented
- **Edge case:** No

### ciAdaptersREADME — documents how to add a new adapter

- **Verifies:** AC4
- **Precondition:** `scripts/ci-adapters/README.md` exists
- **Action:** Read file; check for instructional language
- **Expected result:** File contains a section or sentence describing how to add a new adapter (e.g. words matching `/add.*adapter|new.*adapter|adding.*adapter/i`)
- **Edge case:** No

### assuranceGateWorkflow — permissions block does not include contents:write

- **Verifies:** AC5
- **Precondition:** `.github/workflows/assurance-gate.yml` exists
- **Action:** Read file content; check permissions block
- **Expected result:** File does NOT contain `contents: write` anywhere in the file; it does contain `contents: read` (confirming the restricted scope is set explicitly, not just absent)
- **Edge case:** No — this is a hard security constraint

---

## Integration Tests

### upload + postComment called in sequence for a real staging dir

- **Verifies:** AC1, AC2
- **Components involved:** `scripts/ci-adapters/github-actions.js`, mock CI env (GITHUB_RUN_ID, GITHUB_TOKEN env vars set to test values), mock `gh` CLI call interceptor
- **Precondition:** Temp staging dir `.ci-artefact-staging/test-feature/` with one file; env vars `GITHUB_RUN_ID=test-run-99` and `GITHUB_TOKEN=fake-token` set; `gh` command mocked to capture invocation args
- **Action:** Call `adapter.upload(stagingDir, 'test-run-99')` then `adapter.postComment('pr-42', resultUrl)`
- **Expected result:** Upload mock called with artifact name `governed-artefacts-test-feature-test-run-99`; postComment mock called with comment body containing `"Governed artefact chain"` and `"pr-42"` (or the run URL)

---

## NFR Tests

### Workflow permissions — new steps fit within contents:read, pull-requests:write

- **NFR addressed:** Security / Permissions
- **Measurement method:** Parse `.github/workflows/assurance-gate.yml`; check top-level and job-level `permissions:` blocks; assert `contents` is not set to `write`; assert `pull-requests: write` is present (needed for comment)
- **Pass threshold:** `contents` has no `write` value anywhere in the workflow file; `pull-requests: write` present
- **Tool:** Node.js file read + regex/YAML parse in `tests/check-caa2-adapter.js`

### Upload step adds no npm dependencies

- **NFR addressed:** MM2 zero-dep constraint
- **Measurement method:** Read `package.json` dependencies and devDependencies; confirm no new entries were added by caa.2 implementation
- **Pass threshold:** Zero new npm entries
- **Tool:** JSON.parse check in test

---

## Out of Scope for This Test Plan

- Live GitHub API calls confirming actual artifact accessibility from a browser (requires live runner — covered by manual scenario)
- GitLab CI, Azure DevOps, or other adapter implementations
- Post-merge write-back workflow (explicitly out of scope for caa.2)

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Live artifact URL accessibility (AC1 full E2E) | Requires GitHub Actions runtime | Manual scenario in verification script; AC1 integration test mocks upload call |
| PR comment appearance on real PR (AC2 full E2E) | Requires live GitHub API | Manual scenario in verification script; unit test mocks `gh` call and asserts comment body |
