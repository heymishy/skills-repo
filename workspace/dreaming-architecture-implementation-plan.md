# Dreaming Architecture — Implementation Plan

**Date:** 2026-05-11
**Status:** Ready for Session 1

---

## Governing constraint (read before any code change)

All CI-platform-specific behaviour must be isolated to a `scripts/ci-adapter.js` module that reads `audit.ci_platform` from `context.yml` and routes to a platform-specific adapter. The core scripts (`run-assurance-gate.js`, `index.js`) must not contain platform-specific code beyond reading neutral env vars with platform-specific fallbacks. The workflow YAML files are adapters — they are allowed to be platform-specific, but the logic they invoke must not be.

---

## Session 1 scope — Items 1, 2, 3, 8, 9 (bundle into one commit)

These five items all touch `run-assurance-gate.js`. Bundle them into a single commit to minimise rebase friction.

### Item 1 — Fix trace schema: add `surfaceType`, `storySlug`, `createdAt`

**File:** `.github/scripts/run-assurance-gate.js`

**What changes:** `runGate()` signature gains three new context fields; `completedEntry` includes them; CLI entry reads two new env vars.

**Before (`runGate()` destructuring):**
```js
function runGate(ctx) {
  const {
    trigger      = 'manual',
    prRef        = '',
    commitSha    = '',
    tracesDir    = DEFAULT_TRACES_DIR,
    root         = DEFAULT_ROOT,
    checksRunner = null,
    runId        = buildRunId(trigger),
    regulated         = false,
    standardsInjected = undefined,
    watermarkResult   = undefined,
    stalenessFlag     = undefined,
    sessionIdentity   = undefined,
  } = ctx || {};
```

**After:**
```js
function runGate(ctx) {
  const {
    trigger      = 'manual',
    prRef        = '',
    commitSha    = '',
    tracesDir    = DEFAULT_TRACES_DIR,
    root         = DEFAULT_ROOT,
    checksRunner = null,
    runId        = buildRunId(trigger),
    regulated         = false,
    standardsInjected = undefined,
    watermarkResult   = undefined,
    stalenessFlag     = undefined,
    sessionIdentity   = undefined,
    surfaceType  = 'assurance-gate',
    storySlug    = null,
  } = ctx || {};
```

**Before (`completedEntry` construction):**
```js
  const completedEntry = {
    status:      'completed',
    trigger,
    prRef,
    commitSha,
    startedAt,
    completedAt,
    verdict,
    failurePattern,
    traceHash,
    checks,
  };
```

**After:**
```js
  const completedEntry = {
    status:      'completed',
    trigger,
    prRef,
    commitSha,
    startedAt,
    completedAt,
    createdAt:   completedAt,
    surfaceType,
    storySlug,
    verdict,
    failurePattern,
    traceHash,
    checks,
  };
```

**Before (`runGate` return):**
```js
  return { verdict, traceHash, runId, tracePath };
```

**After:**
```js
  return { verdict, traceHash, runId, tracePath, checks, failurePattern };
```

---

### Item 2 — Write `gate-verdict.json` from CLI

**File:** `.github/scripts/run-assurance-gate.js` CLI entry

Add after the GITHUB_OUTPUT write. This is the platform-agnostic notification event that `scripts/ci-adapter.js` reads to post the verdict to the CI platform's PR/build status surface.

```js
  const verdictFilePath = path.join(DEFAULT_ROOT, 'workspace', 'gate-verdict.json');
  try {
    fs.writeFileSync(verdictFilePath, JSON.stringify({
      verdict:        result.verdict,
      traceHash:      result.traceHash,
      commitSha:      commitSha.slice(0, 8),
      prRef:          prRef,
      timestamp:      new Date().toISOString(),
      checks:         result.checks  || [],
      failurePattern: result.failurePattern || null,
    }, null, 2) + '\n', 'utf8');
  } catch (e) {
    process.stderr.write('[assurance-gate] Warning: could not write gate-verdict.json: ' + e.message + '\n');
  }
```

---

### Item 3 — Add `REMEDIATION_HINTS` map and write `gate-remediation.json`

**File:** `.github/scripts/run-assurance-gate.js`

Add near the top of the file, after constants block:

```js
const REMEDIATION_HINTS = {
  'workspace-state-valid': {
    hint: 'workspace/state.json is missing or contains invalid JSON.',
    remediation: 'Run /checkpoint to write a valid state file, then push.',
  },
  'pipeline-state-valid': {
    hint: '.github/pipeline-state.json is missing or contains invalid JSON.',
    remediation: 'Validate with: python -c "import json; json.load(open(\'.github/pipeline-state.json\'))"',
  },
  'artefacts-dir-exists': {
    hint: 'artefacts/ directory not found.',
    remediation: 'Run: mkdir artefacts && git add artefacts/.gitkeep && git commit',
  },
  'governance-gates-exists': {
    hint: '.github/governance-gates.yml is missing.',
    remediation: 'Restore: git checkout origin/master -- .github/governance-gates.yml',
  },
  't3m1-fields-valid': {
    hint: 'A T3M1 mandatory field is null or absent in a regulated story trace.',
    remediation: 'Pass all four T3M1 fields (standardsInjected, watermarkResult, stalenessFlag, sessionIdentity) to runGate().',
  },
};
```

Add to `runGate()` after verdict is derived:

```js
  const remediationHints = [];
  if (verdict === 'fail') {
    checks.forEach(function (c) {
      if (!c.passed && REMEDIATION_HINTS[c.name]) {
        remediationHints.push({
          check:       c.name,
          hint:        REMEDIATION_HINTS[c.name].hint,
          remediation: REMEDIATION_HINTS[c.name].remediation,
        });
      }
    });
  }
```

Update `runGate()` return:

```js
  return { verdict, traceHash, runId, tracePath, checks, failurePattern, remediationHints };
```

Add `remediationHints` to `completedEntry`:

```js
    remediationHints: remediationHints.length ? remediationHints : undefined,
```

Add to CLI entry, alongside `gate-verdict.json` write:

```js
  if (result.verdict === 'fail' && result.remediationHints && result.remediationHints.length) {
    const remFile = path.join(DEFAULT_ROOT, 'workspace', 'gate-remediation.json');
    try {
      fs.writeFileSync(remFile, JSON.stringify({ remediationHints: result.remediationHints }, null, 2) + '\n', 'utf8');
    } catch (e) { /* non-fatal */ }
  }
```

---

### Item 8 — Add `iterationCount` to `completedEntry`

**File:** `.github/scripts/run-assurance-gate.js`

One field addition to `completedEntry`:

```js
    iterationCount: ctx.iterationCount || 1,
```

Also add to `runGate()` destructuring:

```js
    iterationCount = 1,
```

---

### Item 9 — Add Bitbucket env var fallbacks to CLI entry

**File:** `.github/scripts/run-assurance-gate.js` CLI entry

```js
  const prRef     = process.env.PR_REF     ||
                    process.env.GITHUB_REF ||
                    (process.env.BITBUCKET_PR_ID
                      ? 'refs/pull/' + process.env.BITBUCKET_PR_ID + '/merge'
                      : '');
  const commitSha = process.env.COMMIT_SHA ||
                    process.env.GITHUB_SHA ||
                    process.env.BITBUCKET_COMMIT || '';
```

---

## Session 1 scope — `scripts/ci-adapter.js` (new file, required by governing constraint)

This file is the CI-platform isolation layer mandated by the governing constraint above. The assurance-gate workflow (and any future Bitbucket/Jenkins adapter) calls this module to post the verdict rather than containing that logic inline.

**File:** `scripts/ci-adapter.js`

```js
'use strict';
/**
 * ci-adapter.js
 *
 * Platform-agnostic CI verdict delivery adapter.
 * Reads audit.ci_platform from .github/context.yml and routes to
 * the appropriate platform adapter.
 *
 * Core scripts (run-assurance-gate.js, index.js) call this module.
 * Workflow YAML files are thin wrappers that invoke this module via CLI.
 *
 * Supported platforms: github-actions (default), bitbucket, none
 *
 * Zero external dependencies.
 */

var fs   = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');

/**
 * readCiPlatform() -> string
 * Reads audit.ci_platform from .github/context.yml.
 * Returns 'github-actions' if the key is absent or the file is unreadable.
 */
function readCiPlatform(contextYmlPath) {
  var ymlPath = contextYmlPath || path.join(ROOT, '.github', 'context.yml');
  try {
    var raw = fs.readFileSync(ymlPath, 'utf8');
    var m   = raw.match(/^[ \t]*ci_platform:\s*(.+)$/m);
    return m ? m[1].trim() : 'github-actions';
  } catch (e) {
    return 'github-actions';
  }
}

/**
 * readGateVerdict(verdictFilePath) -> object | null
 * Reads workspace/gate-verdict.json produced by run-assurance-gate.js.
 */
function readGateVerdict(verdictFilePath) {
  var p = verdictFilePath || path.join(ROOT, 'workspace', 'gate-verdict.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

/**
 * readGateRemediation(remediationFilePath) -> object | null
 * Reads workspace/gate-remediation.json produced by run-assurance-gate.js on fail.
 */
function readGateRemediation(remediationFilePath) {
  var p = remediationFilePath || path.join(ROOT, 'workspace', 'gate-remediation.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

/**
 * buildCommentBody(verdict, remediation) -> string
 * Builds the PR/build comment body from the structured verdict and remediation files.
 * Platform-agnostic — the caller decides how to post it.
 */
function buildCommentBody(verdict, remediation) {
  var icon = verdict && verdict.verdict === 'pass' ? '\u2705' : '\u274c';
  var lines = [
    '## Assurance Gate ' + icon,
    '',
    '**Verdict:** ' + (verdict ? verdict.verdict : 'unknown'),
    '**Trace hash:** `' + (verdict ? verdict.traceHash : 'unknown') + '`',
    '**Commit:** `' + (verdict ? verdict.commitSha : 'unknown') + '`',
  ];
  if (remediation && remediation.remediationHints && remediation.remediationHints.length) {
    lines.push('');
    lines.push('**Remediation:**');
    remediation.remediationHints.forEach(function (h) {
      lines.push('- **`' + h.check + '`**: ' + h.hint + ' ' + h.remediation);
    });
  }
  return lines.join('\n');
}

module.exports = {
  readCiPlatform:    readCiPlatform,
  readGateVerdict:   readGateVerdict,
  readGateRemediation: readGateRemediation,
  buildCommentBody:  buildCommentBody,
};
```

**Usage from workflow YAML (GitHub Actions):** The workflow step calls `node scripts/ci-adapter.js --post-comment --pr $PR_NUMBER` — the adapter script reads `gate-verdict.json` and uses the GitHub API (via env vars `GITHUB_TOKEN`, `GITHUB_REPOSITORY`, `PR_NUMBER`) to post the comment. The `actions/github-script@v7` inline JS is replaced by a call to this module. Implement the `--post-comment` CLI entry in Session 2 when `assurance-gate.yml` is updated (Item 4).

**Usage from Bitbucket:** The pipeline step calls the same `node scripts/ci-adapter.js --post-comment` — `readCiPlatform()` returns `'bitbucket'`, the adapter posts a build status to the Bitbucket REST API using `BITBUCKET_ACCESS_TOKEN`, `BITBUCKET_WORKSPACE`, `BITBUCKET_REPO_SLUG`, `BITBUCKET_COMMIT`. Session 2 scope.

---

## Session 2 scope (do not implement in Session 1)

- Item 4: Update `assurance-gate.yml` — pass `SURFACE_TYPE`/`STORY_SLUG`, replace `Post verdict to PR` step with `node scripts/ci-adapter.js --post-comment`
- Item 5: Platform-agnostic trace commit (`scripts/commit-pending-traces.js` + `.pending-commit` marker + `trace-commit.yml` rewrite)
- Item 6: Scheduled dreaming workflow (`.github/workflows/improvement-agent-schedule.yml` + `index.js` guard + `lastDreamRun` write)
- Item 7: `/improve` → improvement-agent bridge (SKILL.md completion step schema + `isProposalDuplicate()` in `failure-detector.js`)
- Item 10: `/improve` non-interactive mode (`improve/SKILL.md` preamble + `context.yml` key)
- Item 12: `appendTraceEntry()` `.pending-commit` marker write

## Session 3 scope

- Item 11: `improvement-agent` SKILL.md non-interactive surface note (documentation-only, no tests required)
- Bitbucket pipeline stanza (`.bitbucket-pipelines.yml` additions)

---

## Three unknowns to confirm before Session 2

1. **`challenger.js` `acceptProposal()` signature** — confirm which argument or field resolves the target SKILL.md path before implementing Item 7.
2. **`check-workspace-state.js` strictness** — confirm whether adding `lastDreamRun` to `workspace/state.json` breaks the schema validation test before implementing Item 6.
3. **`failure-detector.writeProposalFile()` deduplication** — confirm whether the function already has a collision guard before adding `isProposalDuplicate()` in Item 7.
