# Stub the real git-commit adapter in the 13 remaining skill-turn test files — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/tfhc-s8`
**Worktree:** `.worktrees/tfhc-s8`
**Test command:** `npm test` (full suite) / individual files as named per task

---

## File map

```
Create:
  scripts/check-skill-turn-git-commit-stubbing.js  — repo-wide auditor: flags any tests/*.js file that calls handlePostTurnStreamHtml with an ARTEFACT-END-bearing fixture but never calls setSkillTurnGitCommitAdapter (AC2)

Modify (13 files, split across Tasks 2-3):
  tests/check-dcuf-s1-github-commit-real-completion-point.js
  tests/check-alrf-s8-journey-slug-priority.js
  tests/check-mfc1-model-first-chat-session.js
  tests/check-res-s3-suggest-revision-materiality.js
  tests/check-defs-revs-s1-wiring-into-turn-completion.js
  tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js
  tests/check-wsap-s3-multi-story-commit-and-no-review-rerun.js
  tests/check-wsap-s1-story-scoped-artefact-paths.js
  tests/check-rsc-s1-review-split-coverage.js
  tests/check-res-s2-overwrite-artefact-in-place-on-revision.js
  tests/check-ral-s1-audit-log-journey-id-and-timestamp.js
  tests/check-dsh-s1-persist-session-turns.js
  tests/check-csgc-s1-story-extraction-and-gate-confirm.js

Modify:
  workspace/learnings.md  — record closure of the junk-commit-contamination bug's root cause (AC4)
```

---

## Task 1: Write the structural auditor script (AC2, RED first)

**Files:**
- Create: `scripts/check-skill-turn-git-commit-stubbing.js`

**Model routing:** fast/cheap (mechanical, deterministic scan)

- [ ] **Step 1: Write the script**

```javascript
'use strict';

// tfhc-s8: scans every tests/*.js file that calls handlePostTurnStreamHtml
// with an ARTEFACT-END-bearing fixture response, and flags any that doesn't
// also call setSkillTurnGitCommitAdapter -- the real risk mechanism found by
// tfhc-s6's spike (stis-s1's D37 adapter, gated by `done && _artefactText`
// in handlePostTurnStreamHtml). A file that calls the handler but never
// drives a turn reaching that gated branch (no ARTEFACT-END in its own
// fixtures) carries no real risk and must NOT be flagged -- this is the
// distinction that separates the 13 real-risk files from the other 28
// files tfhc-s6's spike already cleared (12 already-stubbed + 15 non-risk
// but still calling the handler + 1 removed from the original 14-file
// estimate at tfhc-s8's own /review -- see check-isc-s1-ideate-success-
// lens-cycling.js, which never calls the handler in executable code at all).
//
// Note: this is a PRESENCE check (does the file call
// setSkillTurnGitCommitAdapter anywhere), not a POSITION check (is it
// called before every relevant test). Position correctness for each of
// the 13 files fixed by this story is verified manually/by review during
// Tasks 2-3 -- this script's job is the repo-wide audit, not per-call-site
// ordering.

const fs = require('fs');
const path = require('path');

const TESTS_DIR = path.resolve(__dirname, '..', 'tests');

function scanForUnstubbedFiles() {
  const files = fs.readdirSync(TESTS_DIR).filter(function(f) {
    return f.endsWith('.js') && f.indexOf('check-') === 0;
  });
  const unstubbed = [];
  files.forEach(function(file) {
    const fullPath = path.join(TESTS_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const callsHandler = content.indexOf('handlePostTurnStreamHtml') !== -1;
    if (!callsHandler) return;
    const hasArtefactEnd = content.indexOf('ARTEFACT-END') !== -1;
    if (!hasArtefactEnd) return;
    const stubsAdapter = content.indexOf('setSkillTurnGitCommitAdapter') !== -1;
    if (!stubsAdapter) {
      unstubbed.push(file);
    }
  });
  return unstubbed;
}

module.exports = { scanForUnstubbedFiles: scanForUnstubbedFiles };

if (require.main === module) {
  const unstubbed = scanForUnstubbedFiles();
  if (unstubbed.length === 0) {
    console.log('check-skill-turn-git-commit-stubbing PASS: 0 unstubbed files found');
    process.exit(0);
  }
  console.error('check-skill-turn-git-commit-stubbing FAIL: ' + unstubbed.length + ' file(s) call handlePostTurnStreamHtml with an artefact-completing fixture but never stub setSkillTurnGitCommitAdapter:');
  unstubbed.forEach(function(f) { console.error('  - tests/' + f); });
  process.exit(1);
}
```

- [ ] **Step 2: Run — must fail, naming exactly the 13 files**

```bash
node scripts/check-skill-turn-git-commit-stubbing.js
```

Expected output: exits 1, lists exactly these 13 files (order may vary — `fs.readdirSync` is not guaranteed alphabetical on every platform, that's fine):
```
check-skill-turn-git-commit-stubbing FAIL: 13 file(s) call handlePostTurnStreamHtml with an artefact-completing fixture but never stub setSkillTurnGitCommitAdapter:
  - tests/check-alrf-s8-journey-slug-priority.js
  - tests/check-mfc1-model-first-chat-session.js
  - tests/check-res-s3-suggest-revision-materiality.js
  - tests/check-defs-revs-s1-wiring-into-turn-completion.js
  - tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js
  - tests/check-wsap-s3-multi-story-commit-and-no-review-rerun.js
  - tests/check-wsap-s1-story-scoped-artefact-paths.js
  - tests/check-rsc-s1-review-split-coverage.js
  - tests/check-res-s2-overwrite-artefact-in-place-on-revision.js
  - tests/check-ral-s1-audit-log-journey-id-and-timestamp.js
  - tests/check-dsh-s1-persist-session-turns.js
  - tests/check-dcuf-s1-github-commit-real-completion-point.js
  - tests/check-csgc-s1-story-extraction-and-gate-confirm.js
```

**If the count is not exactly 13** (more or fewer), STOP and report this as a BLOCKED/NEEDS_CONTEXT condition rather than proceeding — it means either the file list has drifted since `/review` confirmed it, or the detection logic itself has a bug. Do not silently adjust the expected list to match an unexpected result.

- [ ] **Step 3: Commit**

```bash
git add scripts/check-skill-turn-git-commit-stubbing.js
git commit -m "test(tfhc-s8): add structural auditor for skill-turn git-commit adapter stubbing -- RED, 13 files flagged" -- scripts/check-skill-turn-git-commit-stubbing.js
```

---

## Task 2: Stub the first 7 files, using a fully worked example (AC1, AC3)

**Files:**
- Modify: `tests/check-dcuf-s1-github-commit-real-completion-point.js`, `tests/check-alrf-s8-journey-slug-priority.js`, `tests/check-mfc1-model-first-chat-session.js`, `tests/check-res-s3-suggest-revision-materiality.js`, `tests/check-defs-revs-s1-wiring-into-turn-completion.js`, `tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js`, `tests/check-wsap-s3-multi-story-commit-and-no-review-rerun.js`

**Model routing:** balanced (requires reading each file to find the exact right insertion points — mechanical once the pattern is understood, but genuinely file-specific)

### The pattern (fully worked on `check-dcuf-s1-github-commit-real-completion-point.js`)

This file calls `const routes = freshRequire(ROUTES_PATH);` at 4 separate points (lines 98, 142, 183, 224 as of this plan's writing — confirm against the file's current content, since line numbers may have shifted), each inside its own test block, each followed later in the same block by `await routes.handlePostTurnStreamHtml(...)` against a fixture containing `---ARTEFACT-END---`. Because `freshRequire` clears the require cache and re-executes the module fresh each time, any adapter stub set in an earlier block does NOT carry over — **every one of the 4 blocks needs its own stub call.**

- [ ] **Step 1: Confirm the baseline**

```bash
node tests/check-dcuf-s1-github-commit-real-completion-point.js
```

Record the current pass count (expected, per the existing test plan: all its own ACs pass today).

- [ ] **Step 2: Insert the stub — exact pattern**

Immediately after **every** occurrence of `const routes = freshRequire(ROUTES_PATH);` in this file, insert one line:

```javascript
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnGitCommitAdapter(function() {});
```

(Keep the existing indentation of the surrounding block — shown here at 4 spaces to match this file's own style; match whatever the actual file uses.) Apply this at all 4 occurrences in this file. This is a no-op stub — it does not need to assert anything, it only needs to prevent the real `execSync('git commit ...')` from firing, exactly matching the existing 12-file precedent's own no-op style (e.g. `tests/check-stis-s1-guard-skill-turn-git-commit.js`'s simplest stub cases).

- [ ] **Step 3: Run — confirm identical pass count, no behavioural change**

```bash
node tests/check-dcuf-s1-github-commit-real-completion-point.js
```

Expected output: identical pass/fail counts to Step 1's baseline — only the adapter stubbing was added, nothing about the test's own assertions changed.

- [ ] **Step 4: Apply the identical pattern to the other 6 files in this task**

For each of `check-alrf-s8-journey-slug-priority.js`, `check-mfc1-model-first-chat-session.js`, `check-res-s3-suggest-revision-materiality.js`, `check-defs-revs-s1-wiring-into-turn-completion.js`, `check-wsd-s4-pipeline-state-owner-repo-resolution.js`, `check-wsap-s3-multi-story-commit-and-no-review-rerun.js`:

1. Read the file. Find every place it obtains the `routes` module object (via `freshRequire(ROUTES_PATH)`, `freshRequire(SKILLS_ROUTES_PATH)`, a plain `require(...)` of `routes/skills.js`, or whatever that specific file's own convention is — these files are not perfectly uniform; confirm each one's own pattern by reading it, do not assume it matches `check-dcuf-s1`'s exact variable names) **that is later used in a call to `handlePostTurnStreamHtml` against a fixture containing `---ARTEFACT-END---`.**
2. Immediately after each such point, insert `<routesVariableName>.setSkillTurnGitCommitAdapter(function() {});` using that file's own actual variable name (not literally `routes` if the file calls it something else).
3. **Position matters, not just presence** — the stub must be set BEFORE the `handlePostTurnStreamHtml` call it's protecting, in the same scope/closure, after whatever fresh-require reset happened most recently. If a file has multiple independent test blocks each with their own fresh-require, each needs its own stub call (same reasoning as `check-dcuf-s1` above) — do not assume one stub call anywhere in the file is sufficient.
4. Run the file directly before and after your edit; confirm identical pass/fail counts both times.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: 816 files run (no new file added yet — Task 1's script lives in `scripts/`, not `tests/`), same pre-existing `[C3]` flag only, no new failures. This is a large run — wait for it in the foreground.

- [ ] **Step 6: Commit**

```bash
git add tests/check-dcuf-s1-github-commit-real-completion-point.js tests/check-alrf-s8-journey-slug-priority.js tests/check-mfc1-model-first-chat-session.js tests/check-res-s3-suggest-revision-materiality.js tests/check-defs-revs-s1-wiring-into-turn-completion.js tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js tests/check-wsap-s3-multi-story-commit-and-no-review-rerun.js
git commit -m "fix(tfhc-s8): stub setSkillTurnGitCommitAdapter in 7 of 13 remaining skill-turn test files" -- tests/check-dcuf-s1-github-commit-real-completion-point.js tests/check-alrf-s8-journey-slug-priority.js tests/check-mfc1-model-first-chat-session.js tests/check-res-s3-suggest-revision-materiality.js tests/check-defs-revs-s1-wiring-into-turn-completion.js tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js tests/check-wsap-s3-multi-story-commit-and-no-review-rerun.js
```

- [ ] **Step 7: Confirm the auditor's count dropped**

```bash
node scripts/check-skill-turn-git-commit-stubbing.js
```

Expected output: exits 1, now lists exactly the 6 remaining files (the ones in Task 3 below) — confirms this task's 7 files are no longer flagged.

---

## Task 3: Stub the remaining 6 files (AC1, AC2, AC3 — GREEN)

**Files:**
- Modify: `tests/check-wsap-s1-story-scoped-artefact-paths.js`, `tests/check-rsc-s1-review-split-coverage.js`, `tests/check-res-s2-overwrite-artefact-in-place-on-revision.js`, `tests/check-ral-s1-audit-log-journey-id-and-timestamp.js`, `tests/check-dsh-s1-persist-session-turns.js`, `tests/check-csgc-s1-story-extraction-and-gate-confirm.js`

**Model routing:** balanced (same reasoning as Task 2)

- [ ] **Step 1: Apply the identical pattern from Task 2 to all 6 remaining files**

Same method as Task 2 Step 4: for each file, read it, find every point where it obtains the routes module object that is later used in a `handlePostTurnStreamHtml` call against an `---ARTEFACT-END---`-bearing fixture, insert `<var>.setSkillTurnGitCommitAdapter(function() {});` immediately after each such point (every independent fresh-require site needs its own stub call), confirming position (before the protected call), not just presence anywhere in the file.

Run each file directly before and after your edit; confirm identical pass/fail counts both times for each of the 6.

- [ ] **Step 2: Run the auditor — must now be GREEN**

```bash
node scripts/check-skill-turn-git-commit-stubbing.js
```

Expected output: `check-skill-turn-git-commit-stubbing PASS: 0 unstubbed files found`, exit 0.

- [ ] **Step 3: Run full suite — no regressions, and confirm identical per-file outcomes for all 13**

```bash
npm test
```

Expected output: same file count as the Task 2 baseline, same pre-existing `[C3]` flag only, no new failures. Additionally, for each of the 13 files modified across Tasks 2-3, confirm (from the full-suite log or by re-running each individually) its own pass/fail count is byte-for-byte identical to what it was before this story touched it — only the adapter stubbing was added, nothing about any test's own logic changed.

- [ ] **Step 4: Commit**

```bash
git add tests/check-wsap-s1-story-scoped-artefact-paths.js tests/check-rsc-s1-review-split-coverage.js tests/check-res-s2-overwrite-artefact-in-place-on-revision.js tests/check-ral-s1-audit-log-journey-id-and-timestamp.js tests/check-dsh-s1-persist-session-turns.js tests/check-csgc-s1-story-extraction-and-gate-confirm.js
git commit -m "fix(tfhc-s8): stub setSkillTurnGitCommitAdapter in the remaining 6 of 13 files -- 0 of 41 unstubbed" -- tests/check-wsap-s1-story-scoped-artefact-paths.js tests/check-rsc-s1-review-split-coverage.js tests/check-res-s2-overwrite-artefact-in-place-on-revision.js tests/check-ral-s1-audit-log-journey-id-and-timestamp.js tests/check-dsh-s1-persist-session-turns.js tests/check-csgc-s1-story-extraction-and-gate-confirm.js
```

---

## Task 4: Update workspace/learnings.md to record closure (AC4)

**Files:**
- Modify: `workspace/learnings.md`

**Model routing:** fast/cheap

- [ ] **Step 1: Find the existing junk-commit-contamination entry**

```bash
grep -n "junk" workspace/learnings.md
```

Read the surrounding entry in full.

- [ ] **Step 2: Append a closure note to that entry (do not delete or rewrite the original entry — append)**

Add a short paragraph immediately after the existing entry's own text, in the same style as the rest of the file, stating: this bug's root cause (14 originally-estimated files, corrected to 13 real at-risk files via `tfhc-s6`'s spike and `tfhc-s8`'s own `/review`) is now closed by `tfhc-s8` — all 13 files stub `setSkillTurnGitCommitAdapter`, confirmed by `scripts/check-skill-turn-git-commit-stubbing.js` passing repo-wide (0 of 41 calling files unstubbed).

- [ ] **Step 3: Run full suite — no regressions (markdown-only change, should be a no-op for tests)**

```bash
npm test
```

Expected output: identical to Task 3 Step 3's result.

- [ ] **Step 4: Commit**

```bash
git add workspace/learnings.md
git commit -m "docs(tfhc-s8): record closure of the junk-commit-contamination bug's root cause in learnings.md" -- workspace/learnings.md
```

---

## Notes for the executing agent

- This is a mechanical fix repeated across 13 pre-existing files — the risk is NOT in understanding what to do, it's in missing a file-specific detail (a different variable name, a second or third independent fresh-require site within the same file that also needs its own stub). Read each file before editing it; do not pattern-match from a distance.
- Do not change any existing test's own assertions or logic — only add the one-line stub call, at every point it's needed within a file.
- Open a draft PR when all tasks are done and `npm test` shows no new failures — do not mark ready for review.
- If an ambiguity arises (e.g. a file's structure doesn't match the described pattern at all), add a PR comment describing it and do not mark ready for review — do not guess.
