# NFR Profile: 2026-04-23-ci-artefact-attachment (WS0.6)

**Feature:** CI-Native Artefact Attachment
**Generated at:** /definition exit
**Date:** 2026-04-23

---

## Performance

| NFR | Threshold | Story | Rationale |
|-----|-----------|-------|-----------|
| `--collect` run time | ≤ 2 seconds for ≤30 artefact files on a standard CI runner | caa.1 | Keep CI gate latency minimal; this step gates the PR gate |
| Workflow total overhead | ≤ 30 seconds added to `assurance-gate.yml` total run time | caa.2 | Upload of a small directory bundle should be negligible |

## Security

| NFR | Requirement | Story |
|-----|-------------|-------|
| Collected file scope | Only files under `artefacts/[slug]/` collected; `pipeline-state.json`, `context.yml`, secrets, and any file outside the target tree must not appear in the staging directory | caa.1 |
| Workflow token | PR comment step must use `${{ github.token }}` only; no PAT or stored secret | caa.2 |
| Permissions grant | `assurance-gate.yml` must not acquire `contents: write` as a result of this feature; maximum permissions: `contents: read, pull-requests: write` | caa.2 |

## Dependency constraint (MM2)

| NFR | Requirement | Story |
|-----|-------------|-------|
| Zero new npm dependencies | `--collect` implementation must use only Node.js built-ins (`fs`, `path`, `crypto`, `os`); `package.json` `dependencies` and `devDependencies` must not gain new entries | caa.1 |

## Reliability / Fail behaviour

| NFR | Requirement | Story |
|-----|-------------|-------|
| Non-fatal attachment failure | A failure in the collect, upload, or comment step must not fail the overall governance gate check; attachment result is advisory | caa.3 |
| Explicit error on unrecognised adapter | Unrecognised `ci_platform` value must exit with code 1 and a message naming the value and listing valid adapters; silent no-ops forbidden | caa.3 |
| Idempotent collect | Re-running `--collect` on the same feature clears and rebuilds the staging directory; no stale file accumulation | caa.1 |

## Backwards compatibility / Zero-breakage (M2)

| NFR | Requirement | Story |
|-----|-------------|-------|
| Opt-in default | When `audit.ci_attachment` is absent or `false`, all new steps are skipped; existing behaviour of `assurance-gate.yml` is unchanged | caa.3 |
| Existing test suite | All 4 existing `npm test` suites pass with zero regressions after each story | caa.1, caa.2, caa.3 |

## Accessibility / Observability

| NFR | Requirement | Story |
|-----|-------------|-------|
| Human-readable manifest | `manifest.json` produced by `--collect` is pretty-printed JSON; machine-readable but directly inspectable by a human in a CI artifact viewer | caa.1 |
| Informative PR comment | Comment must include feature slug, run ID, and direct artifact link; no raw UUIDs or opaque identifiers without labels | caa.2 |
