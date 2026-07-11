## Test Plan: Remove the three recurring merge-conflict hotspots in parallel-wave inner-loop delivery

**Story reference:** artefacts/2026-07-11-pipeline-conflict-reduction/stories/pcr-s1-reduce-merge-conflict-hotspots.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (autonomous, short-track — operator confirmed proceeding without per-question interaction)
**Date:** 2026-07-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Replace `package.json`'s `&&`-chain with `scripts/run-all-tests.js` runner; verdict parity | 2 tests | 2 tests | — | — | — | 🟢 |
| AC2 | Adding a new test file requires zero `package.json` edits | — | 1 test | — | — | — | 🟢 |
| AC3 | `pipeline-state.json` story-level writes leave the parent feature's `updatedAt` untouched; genuine feature-level writes still bump it | 3 tests | — | — | — | — | 🟢 |
| AC4 | Two concurrent same-feature story writes merge with zero conflict | — | 1 test | — | — | — | 🟢 |
| AC5 | `decisions.md` union merge auto-resolves two independent appended entries | 1 test | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. Every AC is a mechanical/tooling behaviour testable via unit tests (mocked fs/child_process) or integration tests (real temporary git repos and real file operations) — no browser, CSS-layout, or external-service dependency is involved anywhere in this story.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — all test data (fixture `tests/check-*.js` files, fixture `pipeline-state.json` objects, temporary git repositories/branches/commits) is generated programmatically inside each test's setup and torn down afterward.
**Owner:** Self-contained — tests generate their own data in setup/teardown.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A small set of fixture `tests/check-*.js` files (some passing, some failing) in a temp directory | Synthetic, generated in test setup | None | Used to verify discovery + pass/fail aggregation logic without depending on the real repo's 200+ test files |
| AC2 | A single new dummy `tests/check-*.js` file added to a temp checkout | Synthetic | None | Proves zero `package.json` diff results |
| AC3 | A fixture `pipeline-state.json` object with one feature containing 2+ stories | Synthetic, inline JSON fixture | None | Covers both story-level and feature-level write paths |
| AC4 | Two temporary git branches from a shared base commit, each advancing a different story's fields | Synthetic, created via `child_process` git commands in test setup | None | Torn down after each test |
| AC5 | A temporary git repository with a `decisions.md` fixture and two divergent branches each appending one entry | Synthetic, created via `child_process` git commands in test setup | None | Torn down after each test |

### PCI / sensitivity constraints

None.

### Gaps

None — all test data is available now and self-contained.

---

## Unit Tests

### U1 — discoverTestFiles() returns all check-*.js files in deterministic sorted order

- **Verifies:** AC1
- **Precondition:** A temp `tests/` directory containing fixture files `check-b.js`, `check-a.js`, `check-c.js` (created out of alphabetical order) plus one non-matching file `helpers.js`.
- **Action:** Call `scripts/run-all-tests.js`'s exported `discoverTestFiles(dir)` function against the temp directory.
- **Expected result:** Returns exactly `['check-a.js', 'check-b.js', 'check-c.js']` (sorted, `helpers.js` excluded) as absolute or repo-relative paths.
- **Edge case:** No — covered by U2 (empty directory).

### U2 — discoverTestFiles() returns an empty array for a directory with no matching files

- **Verifies:** AC1
- **Precondition:** A temp `tests/` directory containing only `helpers.js` and a subdirectory.
- **Action:** Call `discoverTestFiles(dir)`.
- **Expected result:** Returns `[]` — does not throw, does not recurse into the subdirectory unless the real repo's existing chain also recurses (confirm against current chain's actual file list before deciding recursion behaviour).
- **Edge case:** Yes — the zero-match case.

### U3 — advance() on a story field does not modify the parent feature's updatedAt

- **Verifies:** AC3
- **Precondition:** Fixture `pipeline-state.json` object: one feature (`updatedAt: "T0"`) containing one epic containing one story (`slug: "s1"`, `updatedAt: "T0"`).
- **Action:** Call `bin/skills advance <feature> s1 stage=implementation-plan` against the fixture.
- **Expected result:** The story object's `stage` is updated and its own `updatedAt` changes; the parent feature object's `updatedAt` remains exactly `"T0"`.
- **Edge case:** No.

### U4 — gate-advance() on a story field does not modify the parent feature's updatedAt

- **Verifies:** AC3
- **Precondition:** Same fixture as U3, with a valid gate artefact for the story's next gated stage.
- **Action:** Call `bin/skills gate-advance <feature> s1 dor-signed-off <artefact-path>`.
- **Expected result:** The story's `dorStatus`/`stage` fields update; the parent feature's `updatedAt` remains `"T0"`.
- **Edge case:** No.

### U5 — a genuine feature-level milestone write still bumps the feature's updatedAt

- **Verifies:** AC3 (the negative-space check — proves the fix is a scoping change, not a blanket removal)
- **Precondition:** Same fixture as U3.
- **Action:** Call whichever `bin/skills` command path represents a feature-level milestone (e.g. advancing the feature's own `stage` field directly, such as `discovery-approved` or `benefit-metric-active`).
- **Expected result:** The feature object's `updatedAt` changes to the new write time. This confirms feature-level `updatedAt` bumping is preserved for genuine milestones — the fix only removes the redundant per-story bump.
- **Edge case:** Yes — this is the boundary case distinguishing "story-level" from "feature-level" writes.

### U6 — .gitattributes declares merge=union for decisions.md

- **Verifies:** AC5
- **Precondition:** Repo checkout after this story's fix has landed.
- **Action:** Read `.gitattributes` and check for a line matching `artefacts/**/decisions.md merge=union` (or an equivalent pattern covering `decisions.md` files under `artefacts/`).
- **Expected result:** The line is present, exactly as declared — a cheap, fast config-presence check that doesn't require spinning up a git repo (that's what IT5 is for).
- **Edge case:** No.

---

## Integration Tests

### IT1 — run-all-tests.js produces the same pass/fail verdict as the current chain

- **Verifies:** AC1
- **Components involved:** `scripts/run-all-tests.js`, the real `tests/` directory, `child_process`.
- **Precondition:** Repo in its current state (with whatever pre-existing baseline gaps already exist and are documented in `decisions.md`, e.g. `check-definition-skill.js`'s known failure).
- **Action:** Run `node scripts/run-all-tests.js` and separately run today's full `&&`-chain command-by-command (bypassing the `cmd.exe` length limit, e.g. via a bash/PowerShell loop), capturing the set of failing files from each.
- **Expected result:** Both mechanisms report an identical set of failing files (the same pre-existing baseline gaps, nothing more, nothing less) — proving the new runner is behaviourally equivalent, not silently skipping or double-running anything.

### IT2 — run-all-tests.js runs to completion without hitting the Windows cmd.exe command-line length limit

- **Verifies:** AC1 (the side-effect resolution of the pre-existing baseline gap)
- **Components involved:** `npm test` → `scripts/run-all-tests.js`, invoked via `cmd.exe` (not bash) to reproduce the originally-reported failure mode.
- **Precondition:** Windows environment, `cmd.exe` as the shell `npm` invokes.
- **Action:** Run `npm test` from a fresh `cmd.exe` shell.
- **Expected result:** Completes (produces pass/fail output) with no "The command line is too long" error — the single-invocation `scripts.test` string is short regardless of how many test files exist.

### IT3 — adding a new test file requires zero edits to package.json

- **Verifies:** AC2
- **Components involved:** `package.json`, `tests/`, git.
- **Precondition:** Clean checkout after AC1's fix has landed.
- **Action:** Add one new dummy file `tests/check-zzz-dummy.js` (a trivial test that always passes) to the `tests/` directory. Run `git diff -- package.json`.
- **Expected result:** `git diff -- package.json` produces no output (empty diff) — confirming the structural guarantee that makes AC2's zero-conflict property true: there is nothing left in `package.json` for two such branches to collide on, because neither needs to touch it.

### IT4 — two concurrent same-feature story pipeline-state writes merge with zero conflict

- **Verifies:** AC4
- **Components involved:** `.github/pipeline-state.json`, `bin/skills advance`, git.
- **Precondition:** A temporary git repository seeded with a fixture `pipeline-state.json` (one feature, two stories `s1`/`s2`) committed to a base branch.
- **Action:** From the base commit, create branch A and run `bin/skills advance <feature> s1 stage=X` + commit; from the same base commit, create branch B and run `bin/skills advance <feature> s2 stage=Y` + commit. Merge branch A into master, then merge master into branch B (`git merge origin/master`).
- **Expected result:** The second merge exits 0 with zero conflict markers in `.github/pipeline-state.json`, and the resulting file contains both `s1`'s and `s2`'s advanced fields correctly, with the parent feature's `updatedAt` unchanged by either branch.

### IT5 — decisions.md union merge auto-resolves two independent appended entries

- **Verifies:** AC5
- **Components involved:** `.gitattributes`, `decisions.md`, git's `merge=union` strategy.
- **Precondition:** A temporary git repository with `.gitattributes` containing `artefacts/**/decisions.md merge=union`, and a base `decisions.md` fixture containing N existing entries, committed to a base branch.
- **Action:** From the base commit, create branch A and append one new, independent decision entry to `decisions.md` + commit; from the same base commit, create branch B and append a different independent entry + commit. Merge branch A into master, then merge master into branch B.
- **Expected result:** The second merge exits 0 with zero conflict markers, and the resulting `decisions.md` contains N+2 entries — both A's and B's — in some order, with neither entry lost or duplicated.

---

## NFR Tests

### N1 — run-all-tests.js does not meaningfully regress total npm test wall-clock time

- **NFR addressed:** Performance
- **Measurement method:** Capture wall-clock time of `node scripts/run-all-tests.js` running the full real `tests/` suite; compare against a wall-clock baseline of today's chain (captured once, before the fix, via the same command-by-command bypass used in IT1) recorded as a fixed constant in the test.
- **Pass threshold:** New runner's wall-clock time is no more than 110% of the recorded baseline (accounts for normal run-to-run variance; the runner does no new per-file work beyond what today's chain already does — spawning/running each file once).
- **Tool:** Node's `process.hrtime()` or `Date.now()`, measured directly in the test script — no external load-testing tool needed for a local sequential test-runner comparison.

---

## Out of Scope for This Test Plan

- Splitting `pipeline-state.json` into per-feature/per-story files — out of scope per the story's own Out of Scope section; no tests written for a mechanism that isn't being built.
- Any test of `decisions.md`'s content schema, template, or the `/decisions` skill's authoring behaviour — only the git merge strategy is under test.
- Retroactive re-testing of any already-merged `bri-*` PR's historical conflicts — this test plan only proves the mechanism going forward.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| `merge=union`'s behaviour when two branches' appended entries are adjacent in a way that creates a duplicate `---` separator or minor formatting artefact (rather than a hard conflict) is not separately tested beyond IT5's happy path | `merge=union`'s line-level union semantics are a well-established git built-in feature, not new logic this story is writing — testing git's own internals is out of scope; IT5 already proves the specific shape of conflict this repo's `decisions.md` entries produce (disjoint text blocks) resolves cleanly | If a future PR surfaces a union-merge formatting artefact (e.g. a stray blank line), it is a decisions.md authoring/formatting fix, not a regression in this story's git-attributes change — track separately if it occurs |
