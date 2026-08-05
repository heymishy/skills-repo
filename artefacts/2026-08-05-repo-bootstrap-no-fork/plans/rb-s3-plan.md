# Generate harness-agnostic instruction files from one source — Implementation Plan

> **For agent execution:** Single-session TDD (task by task), no subagents used for this dispatch.

**Goal:** Extend `scripts/assemble-copilot-instructions.sh` so it can, on request, emit `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, and `.github/copilot-instructions.md` as byte-identical copies of one assembled source, and add a drift-check validator (`scripts/check-instructions-drift.js`) that verifies all four still match and names the specific file if one has been hand-edited.
**Branch:** `feature/rb-s3-harness-agnostic-instructions`
**Worktree:** current session worktree (already isolated by the harness — no nested `git worktree add` performed, matching rb-s2's precedent)
**Test command:** `node tests/check-rb-s3-harness-agnostic-instructions.js` (new); regression: `node tests/check-rb-s1-cli-init.js` and `node tests/check-rb-s2-full-skill-set-and-registry.js`

---

## Pre-implementation finding (read before Task 1)

The rb-s3 story's Architecture Constraints assume `scripts/assemble-copilot-instructions.sh` is already the mechanism that produces the single instruction file a bootstrapped repo gets from `rb-s1`. That assumption does not hold: `cli/lib/init.js`'s `runInit()` never calls `assemble-copilot-instructions.sh`. The single seeded instruction file (`.github/copilot-instructions.md`) that `rb-s1` produces is written directly by `scripts/platform-init.js` as a short, hardcoded placeholder (see `platform-init.js` lines ~95-117) — a completely separate code path from the richer, skill-description-driven content `assemble-copilot-instructions.sh`'s `assemble()` function builds.

**Correction (post-coordinator review):** an earlier revision of this plan scoped the story to the assembly script and drift-check validator only, reasoning from the test plan's integration test framing ("Run the assembly extension against that directory" as a separate step) and the DoR contract's touch-point list, which names only `scripts/assemble-copilot-instructions.sh` and the drift-check validator, not `cli/lib/init.js`. The coordinator reviewed this and determined that AC1's literal wording — "Given a bootstrapped repo... **when the init command runs the extended assembly step**..." — requires the `init` command itself to run the assembly step, and that the DoR contract's narrower touch-point list was an authoring omission in the contract, not a scope boundary that overrides the AC. The feature's own premise (one `npx init` producing a fully working harness-agnostic bootstrap) supports this: a bootstrap plus a second, undiscoverable manual step does not satisfy "one init command." This plan is corrected accordingly: `cli/lib/init.js`'s `runInit()` now calls a new `assembleHarnessInstructions()` step (added in the same additive style as rb-s2's `installFullSkillSetAndRegistry()`), run after the full skill set is installed, followed immediately by the drift-check validator against the target — so a freshly bootstrapped repo always has all four harness files in place and confirmed in sync, with no separate manual step required.

**Known consequence:** none for existing tests — `assembleHarnessInstructions()` only runs (by default) when at least one of the four harness files is missing, so `rb-s1`'s and `rb-s2`'s existing idempotency/mtime-stability assertions on a *second* `runInit()` call are unaffected (all four files already exist by then, so the step is a no-op skip, same as every other seeded file).

---

## File map

```
Modify:
  scripts/assemble-copilot-instructions.sh   — add --all-harnesses flag (additive; default behaviour unchanged)

Create:
  scripts/check-instructions-drift.js        — drift-check validator (scripts/, not .github/scripts/, so
                                                platform-init.js's existing COPY_DIRS distributes it to
                                                every bootstrapped target repo for free)
  tests/check-rb-s3-harness-agnostic-instructions.js — this story's test suite
```

---

## Task 1: Extend the assembly script with `--all-harnesses`

**Files:**
- Modify: `scripts/assemble-copilot-instructions.sh`
- Test: `tests/check-rb-s3-harness-agnostic-instructions.js` (unit section, AC1/AC4)

- [ ] **Step 1: Write the failing tests** — `assemblyGeneratesAllFourTargetFiles_fromOneSource`, `assemblyPreservesExistingBehaviourForGithubVcsType`, `sourceChangeTriggersRegenerationOfAllFour` (see test plan). Each invokes the script via `spawnSync('bash', [...])` — the "Node wrapper for testability" the test plan calls for is this spawnSync helper living in the test file itself, mirroring the existing pattern in `.github/scripts/check-assembly.js`'s `runAssemblyInTmpDir`. No new production JS module is introduced for this — the DoR contract's touch-point list names only the shell script and the drift-check validator, so the wrapper is test-only code, not a second assembly mechanism.

- [ ] **Step 2: Run test — must fail** (flag not recognised / files not created)

- [ ] **Step 3: Add `--all-harnesses` to the script.** Content generation logic (`assemble()`) is untouched. New flag captures `assemble()`'s output to a temp file once, then `cp`s that temp file to `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.github/copilot-instructions.md` (relative to cwd), guaranteeing byte-for-byte identical copies (avoids `$(...)` command-substitution trailing-newline stripping). The existing default (no flag) path — including its `context.yml`-driven single-`$OUTPUT` resolution — is left completely unchanged, wrapped in an `if/else` rather than rewritten.

- [ ] **Step 4: Run test — must pass**

- [ ] **Step 5: Regression check** — `node tests/check-rb-s1-cli-init.js`, `node tests/check-rb-s2-full-skill-set-and-registry.js` (neither touches this script; expect unchanged 10/10 + 10/10)

- [ ] **Step 6: Commit**

---

## Task 2: Drift-check validator

**Files:**
- Create: `scripts/check-instructions-drift.js`
- Test: `tests/check-rb-s3-harness-agnostic-instructions.js` (AC2 section)

- [ ] **Step 1: Write the failing tests** — `driftCheckPasses_whenAllFourFilesMatchSource`, `driftCheckFails_whenOneFileHandEdited_namesWhichOne`

- [ ] **Step 2: Run test — must fail** (`Cannot find module`)

- [ ] **Step 3: Write the validator.** Exports `checkDrift(dir)` for in-process testing, plus a CLI entry point (`require.main === module`) matching the `.github/scripts/check-*.js` pre-commit validator pattern the DoR names, so it can also run standalone: `node scripts/check-instructions-drift.js [--dir <path>]`. Uses the first of the four canonical files that exists as the reference; byte-compares (`Buffer.equals`) the rest against it; reports each divergent file by name, not a generic "drift detected."

- [ ] **Step 4: Run test — must pass**

- [ ] **Step 5: Commit**

---

## Task 3: Integration test against a real rb-s1/rb-s2 bootstrap, plus NFR test

**Files:**
- Test: `tests/check-rb-s3-harness-agnostic-instructions.js` (integration + NFR sections)

- [ ] **Step 1: Write the failing test** — `rbS3BuildsOnRbS1AndRbS2Output`: `runInit()` a temp target dir (real rb-s1/rb-s2 bootstrap), then run the extended assembly script with `--skills-repo-path` pointed at that *target* dir (so `SKILLS_DIR` resolves to the target's own `.github/skills`, populated with the real 46-skill set rb-s2 installs — not a fixture), `--all-harnesses`. Assert all four files exist, are byte-identical, and reference real skill content (e.g. contain `/discovery`).
- [ ] **Step 2: Write `assemblyAndDriftCheckOverheadUnder2Seconds`** — wall-clock both steps combined.
- [ ] **Step 3: Run — must pass**
- [ ] **Step 4: Commit**

---

## Task 4: Verification pass and PR

- [ ] Run `node tests/check-rb-s3-harness-agnostic-instructions.js` — 0 failures
- [ ] Run `node tests/check-rb-s1-cli-init.js` and `node tests/check-rb-s2-full-skill-set-and-registry.js` — 0 regressions
- [ ] Walk `artefacts/2026-08-05-repo-bootstrap-no-fork/verification-scripts/rb-s3-verification.md` Scenarios 1, 2, 4 against a real temp-dir run (Scenario 3 is manual-only per DoR/test plan — documented in the PR, not automated)
- [ ] Open draft PR via `gh pr create --draft`; document the pre-implementation finding (assembly-not-wired-into-init) explicitly in the PR body per ADR-008
