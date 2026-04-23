# CI Adapters — interface documentation

The `scripts/ci-adapters/` directory contains platform-specific adapters for the
`ci-artefact-attachment` feature. Each adapter must implement two functions and
export them as a Node.js module.

---

## Interface contract

Every adapter file **must** export the following two functions:

### `upload(stagingDir, runId)`

Upload the staging directory as a named CI artifact.

| Parameter    | Type   | Description                                                         |
|--------------|--------|---------------------------------------------------------------------|
| `stagingDir` | string | Absolute path to `.ci-artefact-staging/[slug]/`                    |
| `runId`      | string | Platform run identifier (e.g. `GITHUB_RUN_ID`, `CI_PIPELINE_ID`)  |

**Returns:** `{ artifactName: string }` — the constructed artifact name used for upload.

Artifact name format: `governed-artefacts-[slug]-[runId]`

---

### `postComment(issueRef, summaryLink)`

Post a PR/MR comment containing the governed artefact chain summary.

| Parameter     | Type   | Description                                           |
|---------------|--------|-------------------------------------------------------|
| `issueRef`    | string | PR or issue number as a string (e.g. `"42"`)         |
| `summaryLink` | string | URL to the artifact download page or summary          |

**Returns:** `void`

The comment body **must** contain:
- The phrase `"Governed artefact chain"`
- The `summaryLink` URL verbatim
- The `issueRef` identifier

---

## `ci_platform` mapping

The `ci_platform` field in `context.yml` under the `audit:` block determines
which adapter file is loaded.

| `ci_platform` value | Adapter file                         |
|---------------------|--------------------------------------|
| `github-actions`    | `scripts/ci-adapters/github-actions.js` |

Adapters are loaded dynamically: `require(\`./ci-adapters/${ci_platform}\`)`.

---

## How to add a new adapter

Adding a new adapter for a different CI platform requires **only** creating a
new file in this directory — no changes to `scripts/trace-report.js` or
`.github/workflows/assurance-gate.yml` are needed (AC3).

Steps:

1. Create `scripts/ci-adapters/<platform-name>.js`
2. Implement and export `upload(stagingDir, runId)` and `postComment(issueRef, summaryLink)`
3. Add the new `ci_platform` value to the mapping table in this README
4. Update `contexts/personal.yml` — add the new value to the `ci_platform` comment
5. Add a test in `tests/check-caa2-adapter.js` to confirm the interface is satisfied

No other files need to change.

---

## Example stub adapter

```js
'use strict';

function upload(stagingDir, runId) {
  const path = require('path');
  const slug = path.basename(stagingDir);
  const artifactName = `governed-artefacts-${slug}-${runId}`;
  // Platform-specific upload logic here
  return { artifactName };
}

function postComment(issueRef, summaryLink) {
  // Platform-specific comment posting here
}

module.exports = { upload, postComment };
```
