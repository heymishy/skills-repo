# Remove the three recurring merge-conflict hotspots in parallel-wave inner-loop delivery — Implementation Plan

> **For agent execution:** Executed in-session via /tdd discipline per task (no subagents available in this session).

**Goal:** Remove the three structural causes of recurring merge conflicts in parallel-wave delivery: `package.json`'s monolithic test chain, `pipeline-state.json`'s shared feature-level `updatedAt` bump, and `decisions.md`'s unmarked append log.
**Branch:** `feature/pcr-s1`
**Worktree:** `.worktrees/pcr-s1`
**Test command:** `node scripts/run-all-tests.js` (after Task 1) / `npm test`

---

## Pre-implementation finding (code-reading, per DoR contract's open question)

Read `bin/skills`, `src/enforcement/cli-advance.js`, `src/enforcement/cli-gate-advance.js`,
`src/web-ui/adapters/pipeline-state-writer.js`, `src/enforcement/gate-map.js`, and all 7
inner-loop SKILL.md files with a "Parent propagation" clause.

**Finding:** `cli-advance.js`'s `advance()` function does **not** currently bump
`feature.updatedAt` anywhere in code — it only ever writes to the `story` object. The actual
hotspot is a **textual instruction**, not a code path: seven SKILL.md files
(`branch-setup`, `implementation-plan`, `subagent-execution`, `tdd`, `implementation-review`,
`verify-completion`, `branch-complete`) each contain an identical "Parent propagation" clause:
"Always update the feature-level `updatedAt: [now]`" — applied unconditionally on every
per-story write. This is what produces the observed collision (every story in a feature
touches the same JSON line on every inner-loop step).

By contrast, `/discovery`, `/benefit-metric`, and `/definition` (the three genuine
feature-level milestones) correctly write feature-level fields including `updatedAt` — that
behaviour is correct and must be preserved.

**Fix shape (per DoR contract's fallback: "if duplicated across multiple call sites, both must
be fixed, and this should be noted as a PR comment"):** This is exactly that case — the bump is
not centralized in one function, it's a repeated textual instruction. Both are fixed:
1. `cli-advance.js` gains a `feature.<field>` prefix convention: fields with this prefix write
   directly to the feature object and are the **only** thing that bumps `feature.updatedAt`.
   Plain (non-prefixed) fields continue to write only to the story object, as today, and never
   touch `feature.updatedAt`. This makes the distinction machine-testable (U3–U5) where
   previously it existed only as prose.
2. The 7 per-story SKILL.md files' "Parent propagation" clause is corrected to stop
   instructing an unconditional feature-level bump — noted as a PR comment since it's beyond
   the DoR contract's literal file list but required to actually close the real-world hotspot
   (a code fix alone leaves the instruction that caused agents to hand-edit the JSON in place).

## Pre-implementation finding (AC1 baseline — reported as PR comment, not silently absorbed)

Reproduced the "old chain" behaviour two ways before writing any code:
- **As `npm test` actually runs it today** (real `&&` semantics): the chain aborts at position
  16/224, at `tests/check-definition-skill.js` (the documented missing
  `.github/skills/definition/SKILL.md` gap) — so 208 of 224 chained files, plus 65 files that
  were never added to the chain at all (confirmed via `node tests/check-test-registration.js`,
  itself currently failing on master), never execute under real `npm test` today.
- **As the test plan's IT1 intends it to be measured** (a bypass loop that runs every chained
  file regardless of individual exit code, per the verification script's Scenario 1 framing):
  running all 224 chained files this way surfaces **62 real failures**, not the 2 documented
  ones — the other 60 are pre-existing, unrelated to this story (stale `.github/skills/<name>/SKILL.md`
  path references from a since-completed migration to top-level `skills/<name>/SKILL.md`, plus a
  small number of genuine app-behaviour bugs in unrelated features). Of the 65 never-registered
  files, 4 also fail standalone.

**Decision:** AC1's "same pass/fail verdict" is interpreted at the `npm test` **overall exit
code** level (red before, red after — unchanged), not as a literal file-for-file failure-set
match, because the real chain's short-circuit already hides the vast majority of the suite
today and no reading of "same verdict" can honestly claim a matching failure set when most of
the suite has never actually run. The new runner does not silently swallow this — it surfaces
every result. Fixing the 62+4 pre-existing unrelated failures is explicitly out of scope for
pcr-s1 (a merge-conflict-reduction story) and is called out as a PR comment + a `decisions.md`
GAP entry, not fixed here.

---

## File map

```
Create:
  scripts/run-all-tests.js                          — dynamic test-file discovery + sequential runner
  tests/check-pcr-s1-test-runner.js                  — U1, U2, IT1 (adapted), IT2, IT3, N1
  tests/check-pcr-s1-pipeline-state-scope.js         — U3, U4, U5, IT4
  tests/check-pcr-s1-decisions-merge.js              — U6, IT5
  .gitattributes                                     — merge=union for decisions.md

Modify:
  package.json                                       — scripts.test → single run-all-tests.js invocation
  src/enforcement/cli-advance.js                     — feature.<field> prefix scoping; auto story.updatedAt bump
  tests/check-test-registration.js                   — validate against new runner's discovery, not literal chain text
  tests/check-trace-commit.js                        — self-registration check tolerant of new runner
  tests/check-p4-dist-lockfile.js                    — self-registration check tolerant of new runner
  tests/check-artefact-coverage.js                   — self-registration check tolerant of new runner
  tests/check-cdg6-advance-enhancements.js           — self-registration check tolerant of new runner
  tests/check-cdg7-gate-advance.js                   — self-registration check tolerant of new runner
  skills/branch-setup/SKILL.md                       — Parent propagation clause corrected
  skills/implementation-plan/SKILL.md                — Parent propagation clause corrected
  skills/subagent-execution/SKILL.md                 — Parent propagation clause corrected
  skills/tdd/SKILL.md                                — Parent propagation clause corrected
  skills/implementation-review/SKILL.md              — Parent propagation clause corrected
  skills/verify-completion/SKILL.md                  — Parent propagation clause corrected
  skills/branch-complete/SKILL.md                    — Parent propagation clause corrected
```

---

## Task 1 — AC1 + AC2: dynamic test-runner replaces the `&&` chain

**Files:**
- Create: `scripts/run-all-tests.js`
- Create: `tests/check-pcr-s1-test-runner.js`
- Modify: `package.json`, `tests/check-test-registration.js`, `tests/check-trace-commit.js`,
  `tests/check-p4-dist-lockfile.js`, `tests/check-artefact-coverage.js`,
  `tests/check-cdg6-advance-enhancements.js`, `tests/check-cdg7-gate-advance.js`

- [ ] **Step 1: Write failing tests** in `tests/check-pcr-s1-test-runner.js` for
  `discoverTestFiles()` (U1/U2), `getAllTestFiles()` including the grandfather list (verdict
  parity groundwork for IT1), a `package.json` diff test (IT3), and an NFR timing test (N1).
  `IT2` (cmd.exe length limit) is verified manually in `/verify-completion` from a real
  `cmd.exe` shell, per the DoR contract's assumption that it cannot be validly checked from
  bash/PowerShell.

- [ ] **Step 2: Run test — must fail** (module doesn't exist yet)

```bash
node tests/check-pcr-s1-test-runner.js
```

Expected output: `Cannot find module '../scripts/run-all-tests'`

- [ ] **Step 3: Implement `scripts/run-all-tests.js`**

Exports `discoverTestFiles(dir)`, `GRANDFATHER_LIST`, `getAllTestFiles(repoRoot)`, `runAll(repoRoot)`.
Runs as a CLI via `require.main === module`.

- [ ] **Step 4: Reduce `package.json`'s `scripts.test`** to `"node scripts/run-all-tests.js"`.

- [ ] **Step 5: Fix the 6 self-registration checks** that assert their own filename appears
  literally in `pkg.scripts.test` — extend each to also accept
  `pkg.scripts.test.includes('run-all-tests.js')` as proof of coverage (already the pattern
  `check-p4-dist-lockfile.js` used for its own glob fallback). Rewrite
  `check-test-registration.js`'s core loop to check membership in
  `require('../scripts/run-all-tests').getAllTestFiles(root)` instead of literal chain text.

- [ ] **Step 6: Run test — must pass**

```bash
node tests/check-pcr-s1-test-runner.js
```

Expected output: `PASS` (all assertions in the file)

- [ ] **Step 7: Run full suite — no new regressions beyond the documented pre-existing gaps**

```bash
node scripts/run-all-tests.js
```

Expected: overall exit code matches today's (non-zero — pre-existing, documented); no failure
introduced by this story's own new files.

- [ ] **Step 8: Commit**

```bash
git add scripts/run-all-tests.js package.json tests/check-pcr-s1-test-runner.js tests/check-test-registration.js tests/check-trace-commit.js tests/check-p4-dist-lockfile.js tests/check-artefact-coverage.js tests/check-cdg6-advance-enhancements.js tests/check-cdg7-gate-advance.js
git commit -m "feat(pcr-s1): replace package.json test chain with dynamic scripts/run-all-tests.js runner"
```

---

## Task 2 — AC3 + AC4: scope `pipeline-state.json`'s `updatedAt` bump to genuine milestones

**Files:**
- Create: `tests/check-pcr-s1-pipeline-state-scope.js`
- Modify: `src/enforcement/cli-advance.js`, the 7 SKILL.md files listed in the file map

- [ ] **Step 1: Write failing tests** (U3, U4, U5, IT4) in
  `tests/check-pcr-s1-pipeline-state-scope.js`, using the same temp-dir + fixture pattern as
  `tests/check-cdg7-gate-advance.js`. IT4 additionally spins up two real temporary git branches
  (in a system temp dir, not nested in this worktree) and performs a real merge.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pcr-s1-pipeline-state-scope.js
```

Expected: U5 fails (`feature.<field>` prefix not yet supported); IT4 may already pass
incidentally (no code touches `feature.updatedAt` today) — that's fine, it's the negative-space
half of the fix and is retained as a regression guard.

- [ ] **Step 3: Modify `advance()`** in `cli-advance.js` to:
  - Split incoming fields into feature-scoped (`feature.` prefix) and story-scoped (everything
    else).
  - Apply feature-scoped fields directly to the feature object and bump `feature.updatedAt` —
    the only path that does so.
  - Apply story-scoped fields to the story object exactly as today, and additionally always
    set `story.updatedAt` to the current time (removes the need for every SKILL.md to pass it
    explicitly).
  - Skip find-or-create-story entirely when a call has no story-scoped fields (pure
    feature-level milestone calls must not create a phantom story entry).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pcr-s1-pipeline-state-scope.js
```

Expected output: `PASS`

- [ ] **Step 5: Correct the 7 SKILL.md files'** "Parent propagation" clause — replace the
  unconditional feature-level bump instruction with guidance to only bump `feature.updatedAt`
  via `feature.<field>=...` for genuine feature-level milestones, never for routine per-story
  writes.

- [ ] **Step 6: Run full suite**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 7: Commit**

```bash
git add src/enforcement/cli-advance.js tests/check-pcr-s1-pipeline-state-scope.js skills/branch-setup/SKILL.md skills/implementation-plan/SKILL.md skills/subagent-execution/SKILL.md skills/tdd/SKILL.md skills/implementation-review/SKILL.md skills/verify-completion/SKILL.md skills/branch-complete/SKILL.md
git commit -m "fix(pcr-s1): scope pipeline-state.json's feature-level updatedAt bump to genuine milestones only"
```

---

## Task 3 — AC5: `decisions.md` union merge

**Files:**
- Create: `.gitattributes`, `tests/check-pcr-s1-decisions-merge.js`

- [ ] **Step 1: Write failing test** (U6, IT5) in `tests/check-pcr-s1-decisions-merge.js`. IT5
  builds a real temporary git repo under the OS temp dir (never nested inside this worktree),
  seeds a `decisions.md` fixture + `.gitattributes`, creates two divergent branches each
  appending one entry, merges both ways, and asserts zero conflict markers and both entries
  present.

- [ ] **Step 2: Run test — must fail** (no `.gitattributes` yet)

```bash
node tests/check-pcr-s1-decisions-merge.js
```

- [ ] **Step 3: Create `.gitattributes`** with `artefacts/**/decisions.md merge=union`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pcr-s1-decisions-merge.js
```

- [ ] **Step 5: Run full suite**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add .gitattributes tests/check-pcr-s1-decisions-merge.js
git commit -m "feat(pcr-s1): add merge=union git attribute for decisions.md to eliminate append-log conflicts"
```

---

<!-- Self-review: exact file paths ✓ / complete code shown at implementation time ✓ /
     failing test before implementation ✓ / expected output shown ✓ / imperative commit
     messages ✓ / no scope beyond the 5 ACs (the 6 self-registration-check edits and 7
     SKILL.md edits are required consequences of AC1/AC3, not new scope — called out above
     and will be flagged as a PR comment per the "ambiguity not covered" instruction). -->
