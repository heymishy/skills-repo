## Test Plan: `context.yml` opt-in gate and `ci_platform` adapter routing

**Story reference:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.3-context-yml-config.md
**Epic reference:** artefacts/2026-04-23-ci-artefact-attachment/epics/e1-ci-artefact-attachment.md
**Test plan author:** Copilot / /test-plan skill
**Date:** 2026-04-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Steps skipped when ci_attachment false or absent | 2 tests | — | — | — | — | 🟢 |
| AC2 | Full pipeline runs when ci_attachment true + github-actions | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Unknown ci_platform exits 1 with informative message | 2 tests | — | — | — | — | 🟢 |
| AC4 | personal.yml has audit block with all 3 fields and inline comments | 2 tests | — | — | — | — | 🟢 |
| AC5 | npm test: all 4 suites pass — zero new failures | — | — | — | — | Regression | 🟢 |
| AC6 | Malformed context.yml exits 1 with specific message | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable | Handling |
|-----|----|----------|-------------------|---------|
| Live GitHub Actions workflow step `if:` condition evaluation | AC1 | Workflow-runtime | Requires live GitHub Actions runner; cannot be evaluated locally | Node test confirms the config-reading function returns the correct skip/run decision; manual verification covers the workflow `if:` behaviour |

---

## Test Data Strategy

**Source:** Synthetic — tests write temporary `context.yml` fixture files to a temp directory; the config-reader function is called with that temp directory as root. No real repo or workflow run required.
**PCI/sensitivity in scope:** No
**Availability:** Available now — self-contained setup/teardown
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | context.yml with `audit.ci_attachment: false`; context.yml without audit block at all | Synthetic temp file | None | Two sub-cases |
| AC2 | context.yml with `audit.ci_attachment: true` and `audit.ci_platform: github-actions` | Synthetic temp file | None | |
| AC3 | context.yml with `audit.ci_attachment: true` and `audit.ci_platform: gitlab-ci` | Synthetic temp file | None | Any unimplemented platform |
| AC4 | contexts/personal.yml in the repo | Read from repo | None | String assertions |
| AC5 | Existing test suite | npm test | None | Zero new failures |
| AC6 | A file containing syntactically invalid YAML (e.g. `audit:\n  broken: [unclosed`) | Synthetic temp file | None | |

### PCI / sensitivity constraints

None.

### Gaps

AC5 is a regression test executed by running `npm test` — it is not a new test case but a confirmation that existing tests still pass.

---

## Unit Tests

All tests written to FAIL before implementation. Test file: `tests/check-caa3-config.js`.

### readCiAttachmentConfig — returns { skip: true } when ci_attachment is false

- **Verifies:** AC1
- **Precondition:** Temp `context.yml` containing: `audit:\n  ci_attachment: false\n  ci_platform: github-actions`
- **Action:** Call the config-reader function (or equivalent logic extracted from the workflow step script) with the temp dir as root
- **Expected result:** Function returns an object with `skip: true` (or equivalent signal that no attachment steps should run)
- **Edge case:** No

### readCiAttachmentConfig — returns { skip: true } when audit block is absent

- **Verifies:** AC1
- **Precondition:** Temp `context.yml` containing only `tools:\n  ci_platform: github\n` (no `audit:` block)
- **Action:** Call the config-reader function with the temp dir
- **Expected result:** Function returns `{ skip: true }` — absence of the `audit` block is treated identically to `ci_attachment: false`
- **Edge case:** Yes — missing block defaults to off (zero-breakage guarantee)

### readCiAttachmentConfig — returns { skip: false, platform: 'github-actions' } when enabled

- **Verifies:** AC2
- **Precondition:** Temp `context.yml` containing `audit:\n  ci_attachment: true\n  ci_platform: github-actions`
- **Action:** Call the config-reader function with the temp dir
- **Expected result:** Function returns `{ skip: false, platform: 'github-actions' }` or equivalent
- **Edge case:** No

### adapterRouter — throws with informative message for unimplemented platform

- **Verifies:** AC3
- **Precondition:** Config reader returns `{ skip: false, platform: 'gitlab-ci' }`
- **Action:** Call the adapter router / loader function with `platform = 'gitlab-ci'`
- **Expected result:** Function throws (or returns an error) with a message exactly matching: `[ci-artefact-attachment] Adapter 'gitlab-ci' is not yet implemented. Available adapters: github-actions.`
- **Edge case:** No

### adapterRouter — exit code 1 when platform is unimplemented

- **Verifies:** AC3
- **Precondition:** Spawn `node scripts/trace-report.js --upload --platform=gitlab-ci` (or the relevant entry-point) with a synthetic staging dir present
- **Action:** Capture exit code and stderr
- **Expected result:** Exit code 1; stderr contains `"Adapter 'gitlab-ci' is not yet implemented"` and `"Available adapters: github-actions"`
- **Edge case:** No

### personalYml — contains audit block with ci_attachment field and inline comment

- **Verifies:** AC4
- **Precondition:** `contexts/personal.yml` exists in the repo
- **Action:** Read file content; check for `ci_attachment` field and accompanying comment
- **Expected result:** File contains `ci_attachment` with a `#` inline comment on the same or adjacent line explaining its purpose (e.g. matching `/#.*opt.in|#.*default.*false|#.*artefact attachment/i`)
- **Edge case:** No

### personalYml — contains ci_platform and artifact_retention_days with inline comments

- **Verifies:** AC4
- **Precondition:** `contexts/personal.yml` exists
- **Action:** Read file content; check for `ci_platform` and `artifact_retention_days` fields
- **Expected result:** Both fields present under an `audit:` key; each accompanied by a `#` inline comment; `ci_platform` comment lists at least `github-actions` as a valid value
- **Edge case:** No

### readCiAttachmentConfig — throws parse error on malformed context.yml

- **Verifies:** AC6
- **Precondition:** Temp file at `context.yml` path containing invalid YAML: `audit:\n  ci_attachment: [unclosed bracket`
- **Action:** Call the config-reader function with the temp dir; catch any thrown error
- **Expected result:** Function throws (or spawned process exits code 1) with message containing `[ci-artefact-attachment] context.yml could not be parsed — check YAML syntax.`
- **Edge case:** No

### readCiAttachmentConfig — malformed YAML error does not propagate as unhandled exception crashing the process

- **Verifies:** AC6, NFR (non-fatal)
- **Precondition:** Same malformed context.yml fixture as above; process or caller wraps config-reading in a try/catch
- **Action:** Confirm the parse error is caught and only the attachment step fails; the governance-gate portion of the process completes normally
- **Expected result:** No unhandled exception; attachment step reports error cleanly; process continues
- **Edge case:** Yes — error isolation boundary

---

## Integration Tests

### end-to-end config-gate: ci_attachment true + github-actions runs collect

- **Verifies:** AC2
- **Components involved:** config reader, adapter router, `scripts/ci-adapters/github-actions.js` (mocked upload), `scripts/trace-report.js`
- **Precondition:** Temp repo dir with `context.yml` enabling the feature (`ci_attachment: true`, `ci_platform: github-actions`); minimal `pipeline-state.json` with one active feature; `artefacts/` with 2 `.md` files; mock upload function injected
- **Action:** Run the entry-point script end-to-end in the temp dir; capture result
- **Expected result:** Exit code 0; staging dir created; mock upload called once with correctly formed artifact name; mock postComment called once

---

## NFR Tests

### All 4 existing npm test suites pass — zero new failures

- **NFR addressed:** Zero regressions (M2), AC5
- **Measurement method:** Run `npm test` at the repo root after the caa.3 implementation is applied; capture exit code and output
- **Pass threshold:** Exit code 0; no `FAIL` lines in the output other than pre-existing failures already present on master before this story
- **Tool:** `npm test` in `tests/check-caa3-config.js` test file invokes this via `child_process.spawnSync`; or alternatively verified by running manually

### Attachment failure is non-fatal — governance gate still reports a result

- **NFR addressed:** Fail-open on attachment (NFR)
- **Measurement method:** With a malformed `context.yml`, run the full attachment-gated workflow entry point; confirm that even though the attachment step errors, the overall process exits with the governance gate's own exit code (0 if checks pass) not with a non-zero from the attachment error
- **Pass threshold:** Governance gate exit code unaffected by attachment step failure
- **Tool:** Spawn test in `tests/check-caa3-config.js` with error-inducing context.yml and confirm exit code

---

## Out of Scope for This Test Plan

- Implementing or testing GitLab CI, Azure DevOps, Jenkins, or CircleCI adapters
- Context.yml field validation against `pipeline-state.schema.json` (context.yml is not in the pipeline schema)
- User documentation beyond `contexts/personal.yml` inline comments

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Live `if:` condition evaluation in GitHub Actions workflow YAML | Requires live runner | Config-reader unit tests confirm the skip/run decision logic is correct; manual scenario confirms the workflow `if:` behaviour post-merge |
