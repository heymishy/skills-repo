## Story: Batch skill-metadata extraction to close the `--with-outer-loop` performance NFR gap

**Epic reference:** None — short-track root-cause fix (closes `rb-s5`'s own NFR gap, which `scr-s1` partially investigated but left the dominant cost unprofiled)
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track

## Background

`rb-s5` (2026-08-05) shipped `--with-outer-loop` with a documented NFR gap: total overhead measured ~3722-3776ms against a 3000ms budget, ~24% over. `scr-s1` (2026-08-07) investigated further, found and fixed a real but small contributor (a redundant `get_skill_triggers` call, ~150ms), root-caused that "the dominant cost lies elsewhere in `runInit()`'s `--with-outer-loop` path," and explicitly left it unprofiled as out of that story's own DoR-contracted scope. Both stories re-affirmed the RISK-ACCEPT rather than closing it.

Direct profiling (2026-09-12, isolated single-process measurement, no concurrent load) found the actual dominant cost: `scripts/assemble-copilot-instructions.sh` alone takes ~4.9 seconds — not git-bash startup (~50ms), not the drift-check step (~78ms). Root cause: the script's `get_skill_description`/`get_skill_triggers` helpers each spawn a subprocess (`awk`, plus `sed`/`tr` for reformatting) **once per outer-loop skill, across two separate loops** — roughly 60-70 subprocess spawns total for 8 outer-loop skills. On Windows/Git-Bash, each subprocess spawn carries meaningfully higher overhead than on native Linux (MSYS2's process-creation emulation layer), and at this volume it dominates the script's entire runtime.

## User Story

As **an operator or CI job running `npx skills-repo-init --with-outer-loop`**,
I want the bootstrap command to complete within its documented performance budget,
So that the two short-track stories that already investigated this gap (`rb-s5`, `scr-s1`) can finally close it, instead of re-affirming the same RISK-ACCEPT a third time.

## Benefit Linkage

**Metric moved:** Closes `rb-s5`'s NFR: `--with-outer-loop` overhead under 3000ms — previously ~24% over budget on two independent measurement passes, now targeted well under budget based on isolated profiling (batching the subprocess-heavy extraction step measured ~92ms vs. ~2750ms for the equivalent per-skill workload — roughly a 30x reduction in that specific step).
**How:** Replaces ~60-70 per-skill subprocess spawns (`awk`/`sed`/`tr`, invoked once per outer-loop skill across two loops in `assemble()`) with a single batched `awk` invocation processing all outer-loop skill files in one pass, plus pure-bash string reformatting for the two simple downstream transforms (leading-space strip, trigger-list comma-join) that previously each spawned their own `sed`/`tr` subprocess. The underlying YAML-frontmatter parsing logic (the awk regex patterns matching `description:`/`triggers:` fields) is unchanged — verified byte-for-byte identical against all 8 real outer-loop skill files, including their edge-case multi-line/malformed trigger blocks, before implementation.

## Architecture Constraints

- Per this repo's own Platform Change Policy, `scripts/assemble-copilot-instructions.sh` changes must be merged via PR, not committed directly to master.
- The single batched `awk` program must be embedded inline in the script (not a new `.awk` file) — this script is copied to consumer repos via bootstrap file-copy (`platform-init.js`'s `COPY_DIRS`), and adding a new file would require a corresponding distribution-list update, unnecessary complexity for this fix.
- Preserve `get_skill_description`/`get_skill_triggers`'s exact underlying awk regex logic unchanged — only change the invocation strategy (batched vs. per-skill) and remove them as separate functions once no longer called, replacing call sites with lookups into arrays populated by the one batched call.
- Verify byte-for-byte parity between old and new output before implementation is considered correct — not just "the tests still pass," but an explicit before/after diff against all 8 real outer-loop skill files (done during story preparation, must be re-confirmed against the actual implementation).
- `tests/check-scr-s1-skill-categorization-reconciliation.js` currently asserts `get_skill_triggers` is called exactly once per skill in the enabled branch (its own regression guard against the bug it fixed). This assertion is now obsolete by design — the fix removes per-skill `get_skill_triggers` calls entirely in favour of the batched extraction. Update this test to assert the new invariant (batched extraction used, zero per-skill `get_skill_triggers`/`get_skill_description` calls remain in the enabled branch) rather than deleting its regression coverage.

## Dependencies

- **Upstream:** `rb-s5` (merged, DoD-complete, named the original NFR gap), `scr-s1` (merged, DoD-complete, root-caused part of it and left the rest for a future story — this one).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the real `discovery`, `benefit-metric`, `definition`, `review`, `test-plan`, `definition-of-ready`, `workflow`, and `decisions` SKILL.md files, When the new batched extraction runs, Then the resulting raw description and trigger VALUES (before the final display-formatting step) for every one of the 8 files are byte-for-byte identical to the current per-skill `get_skill_description`/`get_skill_triggers` output — including the malformed/multi-line trigger blocks already present in `benefit-metric` and `decisions`. **Found during implementation:** the OLD script's own downstream trigger-formatting pipeline (`tr '\n' ',' | sed 's/, *$//' | sed 's/^    - //g' | sed 's/    - /, /g'`) has a genuine, pre-existing bug — the final `sed` substitution's pattern doesn't include the comma `tr` already inserted before it, so every trigger separator in the assembled output renders as a double comma (`,, `) instead of a single one (`, `). This bug has been live since `scr-s1` (2026-08-07) and is even baked into `tests/fixtures/assembled-copilot-instructions.md`, unnoticed because no test asserts the exact final punctuation. This story's pure-bash reimplementation of that formatting step is written correctly and does NOT reproduce the bug — the final assembled `Triggers:` line's comma-spacing is a genuine, incidental correctness improvement, not a regression. Recorded here explicitly rather than silently absorbed into an "identical" claim that would no longer be literally true.

**AC2:** Given a fresh temp directory, When `node cli/lib/init.js`'s `runInit(dir, {withOuterLoop: true})` runs in complete isolation (no concurrent processes), Then the total wall-clock time is measurably and substantially lower than the pre-fix baseline (~3700-5700ms measured across this gap's own prior investigations) — re-measured fresh as part of this story's own verification, not assumed from the isolated micro-benchmark alone.

**AC3:** Given the existing `tests/check-rb-s3-harness-agnostic-instructions.js` and `tests/check-rb-s5-optional-outer-loop-install.js` suites, When re-run against the fixed script, Then both pass unmodified — proving the assembled instruction file's actual content is unaffected by this internal implementation change.

**AC4:** Given `tests/check-scr-s1-skill-categorization-reconciliation.js`'s existing assertion that `get_skill_triggers` is called exactly once per skill (its own regression guard from `scr-s1`), When this story's fix removes per-skill calls entirely, Then this test is updated to assert the new invariant (batched extraction, zero remaining per-skill calls in the enabled branch) rather than left asserting an obsolete implementation detail.

## Out of Scope

- Any change to the actual assembled instruction-file content or format — this is a pure internal-implementation performance fix, not a content change.
- `check-instructions-drift.js`'s own ~78ms cost — already fast, not part of this gap.
- Any change to git-bash/subprocess-spawn behaviour itself (e.g., switching away from bash for this script) — the fix works within the existing bash-based architecture.
- Re-measuring or closing any other NFR gap not related to this specific `assemble-copilot-instructions.sh` cost.

## NFRs

- **Performance:** This story's entire purpose — see Benefit Linkage above.
- **Security:** No new input path; the batched awk program processes the same trusted, repo-local SKILL.md files the per-skill version already processed.
- **Accessibility:** N/A.
- **Audit:** N/A.

## Complexity Rating

**Rating:** 2 — the underlying diagnostic work and byte-parity verification is done and documented in this story itself; the remaining implementation risk is applying the already-prototyped, already-verified approach to the real script and its real test suite.
**Scope stability:** Stable — the fix's shape (batch the awk calls, reformat in pure bash) is fully specified and pre-verified in this story's own Background section.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
