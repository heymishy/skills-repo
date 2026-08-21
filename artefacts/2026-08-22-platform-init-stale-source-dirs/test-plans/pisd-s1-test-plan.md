# Test Plan: Point platform-init.js at the real skills/ and templates/ source directories

**Story reference:** `artefacts/2026-08-22-platform-init-stale-source-dirs/stories/pisd-s1-fix-platform-init-source-directories.md`
**Epic reference:** None — short-track bug fix, no parent epic.
**Test plan author:** Copilot
**Date:** 2026-08-22

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `COPY_DIRS` src paths corrected to `skills/`/`templates/` | 2 tests | — | — | — | — | 🟢 |
| AC2 | Target `.github/skills/` gets the full real skill set | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | Target `.github/templates/` gets the full real template set | 2 tests | 1 test | — | — | — | 🟢 |
| AC4 | Existing i1.2 tests pass unmodified | — | 1 test (re-run of existing file) | — | — | — | 🟢 |
| AC5 | Investigate purpose of `.github/skills/`'s current 5-entry subset before cleanup | — | — | — | 1 scenario | Untestable-by-nature | 🔴 |
| AC6 | Full suite has no regressions | — | 1 test | — | 1 scenario (full `npm test` run) | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in a unit/integration test | Handling |
|-----|----|----------|-----------------------------------------------|----------|
| What `infra-definition`/`infra-plan`/`infra-review`/`schema-migration-plan`/`schema-migration-review` (`.github/skills/`'s current contents) are for, and whether the fix must preserve them | AC5 | Untestable-by-nature | This is a research/documentation question about intent, not an observable code behaviour — no assertion can substitute for reading the git history and deciding whether these are legitimate content or dead leftovers | Manual scenario — see AC verification script 🔴. Must be resolved (documented, and either preserved or explicitly and knowingly dropped) before this story's DoD, per the story's own AC5 wording |

---

## Test Data Strategy

**Source:** Synthetic — self-contained, generated in test setup via `fs.mkdtempSync`, matching the existing pattern already used throughout `tests/check-i1.2-platform-init-fetch.js`.
**PCI/sensitivity in scope:** No — this story only touches file-copy source paths in a CLI installer script; no user data, credentials, or regulated fields are involved.
**Availability:** Available now.
**Owner:** Self-contained — tests create and tear down their own temp directories; no external fixtures or shared state required.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Read `scripts/platform-init.js`'s source text | Repo file (already committed) | None | Static-source assertion, not runtime data |
| AC2 | A fresh temp target dir; `PLATFORM_ROOT` pointed at this repo | `fs.mkdtempSync` + real `skills/` (this repo, already committed) | None | Reuses `runInit`/`mktmp` helpers already in `check-i1.2-platform-init-fetch.js` |
| AC3 | Same as AC2, for `templates/` | Same | None | |
| AC4 | Same temp-dir pattern the existing i1.2 tests already use | Existing test file, unmodified | None | Re-running the file is itself the test |
| AC5 | Git history of `.github/skills/`'s 5 entries; any references elsewhere in the repo | `git log`, `grep` | None | Investigation, not automated test data |
| AC6 | Full repo test suite | `node scripts/run-all-tests.js` | None | |

### PCI / sensitivity constraints

None.

### Gaps

None — all test data is self-contained and available now.

---

## Unit Tests

### `platform-init.js sources skills COPY_DIR from repo-root skills/, not .github/skills/`

- **Verifies:** AC1
- **Precondition:** `scripts/platform-init.js` exists and is readable as source text.
- **Action:** Read `scripts/platform-init.js`'s source; locate the `COPY_DIRS` array entry whose `dest` is `path.join(targetDir, '.github', 'skills')`.
- **Expected result:** That entry's `src` is `path.join(sourceRoot, 'skills')` — not `path.join(sourceRoot, '.github', 'skills')`.
- **Edge case:** No.

### `platform-init.js sources templates COPY_DIR from repo-root templates/, not .github/templates/`

- **Verifies:** AC1
- **Precondition:** Same as above.
- **Action:** Locate the `COPY_DIRS` entry whose `dest` is `path.join(targetDir, '.github', 'templates')`.
- **Expected result:** That entry's `src` is `path.join(sourceRoot, 'templates')` — not `path.join(sourceRoot, '.github', 'templates')`.
- **Edge case:** No.

### `runInit against a fresh target copies every skill from this repo's root skills/`

- **Verifies:** AC2
- **Precondition:** Fresh empty temp target dir (via `mktmp()`); `PLATFORM_ROOT` set to this repo's root (via `runInit`'s existing env wiring).
- **Action:** Run `platform-init.js` against the temp target with no pre-existing files (no `--force` needed).
- **Expected result:** `fs.readdirSync(path.join(target, '.github', 'skills'))` returns a set of directory names that is a superset of — at minimum, exactly equal to — `fs.readdirSync(path.join(root, 'skills'))` from this repo. Specifically assert `orient`, `benefit-metric`, and `discovery` (three real, currently-existing skills previously never copied) are present, plus that the total count matches `fs.readdirSync(path.join(root, 'skills')).length` read live (not hardcoded, so the test doesn't rot as skills are added).
- **Edge case:** No.

### `runInit against a fresh target copies every template from this repo's root templates/`

- **Verifies:** AC3
- **Precondition:** Same as above, fresh temp target.
- **Action:** Run `platform-init.js` against the temp target.
- **Expected result:** `fs.readdirSync(path.join(target, '.github', 'templates'))`'s count matches `fs.readdirSync(path.join(root, 'templates')).length` read live. Specifically assert `story.md` and `test-plan.md` (two templates referenced directly by this pipeline's own skills) are present.
- **Edge case:** No.

---

## Integration Tests

### `platform-init-then-fetch installs real skills that are independently loadable by skill-discovery.js`

- **Verifies:** AC2 (seam: `platform-init.js`'s copy output → `src/adapters/skill-discovery.js`'s `listAvailableSkills()` read)
- **Components involved:** `scripts/platform-init.js`, `src/adapters/skill-discovery.js`
- **Precondition:** Fresh temp target dir.
- **Action:** Run `platform-init.js` against the temp target (default `COPILOT_SKILLS_DIRS`, i.e. `.github/skills`, since this simulates a genuine bootstrapped CONSUMER repo — not this repo's own `COPILOT_SKILLS_DIRS=skills` override from F15/`csdg-s1`). Then call `listAvailableSkills(tempTargetDir)`.
- **Expected result:** The returned array includes an entry for `benefit-metric` (and is not empty) — proving the installed skills are reachable by the same discovery mechanism a bootstrapped consumer repo's own server would use, not just present on disk.
- **Edge case:** No.

### `templates copied by platform-init.js are the real, current template set (spot check content)`

- **Verifies:** AC3
- **Components involved:** `scripts/platform-init.js`
- **Precondition:** Fresh temp target dir.
- **Action:** Run `platform-init.js`; read `target/.github/templates/story.md`.
- **Expected result:** File exists and its content matches this repo's own `templates/story.md` byte-for-byte (`fs.readFileSync` equality) — proving a real copy happened, not just a directory listing coincidence.
- **Edge case:** No.

### `existing i1.2 skip/force tests pass without modification`

- **Verifies:** AC4
- **Components involved:** `tests/check-i1.2-platform-init-fetch.js` (unmodified), `scripts/platform-init.js` (fixed)
- **Precondition:** The AC1 fix is applied.
- **Action:** Run `node tests/check-i1.2-platform-init-fetch.js` in full.
- **Expected result:** `platform-init-reports-skipped-files` and `platform-init-force-flag-overwrites-existing` both pass — stdout mentions "skip" for the pre-seeded `orient/SKILL.md`, and `--force` genuinely overwrites it. All other tests in the file continue to pass (20/20).
- **Edge case:** No.

### `full suite has no new failures after the source-path fix`

- **Verifies:** AC6
- **Components involved:** Whole repo — `node scripts/run-all-tests.js`
- **Precondition:** AC1 fix applied.
- **Action:** Run the full suite; capture the list of failed files.
- **Expected result:** The failed-files list is identical to the pre-fix baseline (`check-pipeline-state-integrity.js`'s 3 known C3 entries only, plus whatever AC5 leaves open if unresolved by DoD) — no test that previously passed now fails. In particular, confirm no test elsewhere in the suite depends on `.github/skills/`'s current 5-entry (`infra-*`/`schema-migration-*`) content remaining reachable via the OLD source path — a targeted `grep -rn "infra-definition\|infra-plan\|infra-review\|schema-migration-plan\|schema-migration-review" tests/` before and after confirms no test asserts on these by name.
- **Edge case:** Yes — if AC5's investigation concludes these 5 entries must be preserved in the bootstrap output, this test's baseline must include verifying they still appear in `target/.github/skills/` post-fix (via whatever mechanism AC5 decides — merge, or a second `COPY_DIRS` entry). Not prescribed here; the implementer resolves this per AC5 before treating this test as green.

---

## NFR Tests

None — confirmed with story owner. This story has no NFRs (see story's own NFR section: "None identified" for Performance/Security/Accessibility; Audit "None identified").

---

## Out of Scope for This Test Plan

- Testing `skill-discovery.js`'s own default resolution behaviour for a genuinely-bootstrapped consumer repo beyond the one integration test above (AC2's seam test) — that's F15/`csdg-s1`'s scope, not this story's.
- Testing `scripts/assemble-copilot-instructions.sh` or any other script's own `context.yml` path resolution — unrelated to `platform-init.js`'s `COPY_DIRS`.
- Retroactive testing/notification of any consumer repo that already bootstrapped against the broken source paths since 2026-06-23 — a possible follow-up, not part of this story's own test coverage.
- End-to-end testing of a real `/bootstrap` skill run start-to-finish (journey creation, chat flow, etc.) — this test plan covers `platform-init.js`'s file-copy behaviour specifically, which is the mechanism under this story's own scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Whether `.github/skills/`'s current 5 entries (`infra-*`/`schema-migration-*`) must be preserved in bootstrap output | Requires reading git history and understanding original intent — not determinable from current code/tests alone | AC5's manual investigation scenario (verification script) — must be resolved before DoD, per the story's own AC5 wording. The full-suite regression test (AC6) is written to require this resolution to be reflected in its own expected outcome, so it cannot pass on a naive swap without the implementer having made and recorded a deliberate choice |
