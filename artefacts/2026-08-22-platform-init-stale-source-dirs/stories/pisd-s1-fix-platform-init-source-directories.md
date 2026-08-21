## Story: Point platform-init.js at the real skills/ and templates/ source directories

**Epic reference:** None — short-track bug fix (bounded, well-diagnosed; no discovery/benefit-metric required per CLAUDE.md's short-track definition).
**Discovery reference:** N/A — short-track.
**Benefit-metric reference:** N/A — short-track.
**Domain:** [platform-tooling]

## User Story

As an **operator running `/bootstrap` (or `scripts/platform-init.js` directly) to onboard a new consumer repo**,
I want to **receive the full, current skill and template set (49 skills, 40 templates)**,
So that **the newly-bootstrapped repo actually has a working governed delivery pipeline, instead of 5 unrelated infra/schema-migration skills and 1 template**.

## Benefit Linkage

**Metric moved:** Bootstrap correctness / new-consumer-repo onboarding success rate.
**How:** Every consumer repo bootstrapped from this platform since the `skills/`+`templates/` repo-root migration (commit `1b1d0682`) has received an almost-empty install instead of the real pipeline — fixing the source paths directly restores the platform's core distribution mechanism.

## Architecture Constraints

`scripts/platform-init.js`'s `COPY_DIRS` array — this story corrects the `src` paths only; `dest` paths (`.github/skills`, `.github/templates` in the TARGET repo) are correct and unchanged, since that's still the documented consumer-repo install location. Checked against `.github/architecture-guardrails.md` — no conflicting guardrail found.

## Dependencies

- **Upstream:** None.
- **Downstream:** None currently blocked, but this is the highest-priority open finding in `workspace/dod-backlog-findings.md` given its blast radius (every future `/bootstrap` run, not a single feature).

## Acceptance Criteria

**AC1:** Given `scripts/platform-init.js`'s current `COPY_DIRS` (`{ src: sourceRoot/.github/skills, dest: targetDir/.github/skills }`, `{ src: sourceRoot/.github/templates, dest: targetDir/.github/templates }`), When corrected, Then `src` for skills becomes `sourceRoot/skills` and `src` for templates becomes `sourceRoot/templates` — `dest` paths stay `.github/skills` / `.github/templates` in the target repo (unchanged, still the documented consumer-repo install location).

**AC2:** Given a fresh empty target directory, When `node scripts/platform-init.js <target>` runs with `PLATFORM_ROOT` pointing at this repo, Then the target's `.github/skills/` contains all skills currently in this repo's root `skills/` (49 at time of writing, including `orient`, `benefit-metric`, `discovery`, etc.) — not the 5-entry `infra-*`/`schema-migration-*` subset.

**AC3:** Given the same run, When checked, Then the target's `.github/templates/` contains all templates currently in this repo's root `templates/` (40 at time of writing) — not the 1-entry subset.

**AC4:** Given `tests/check-i1.2-platform-init-fetch.js`'s existing `platform-init-reports-skipped-files` and `platform-init-force-flag-overwrites-existing` tests (both currently failing because `orient` was never even attempted for copy — see Diagnostic reference below), When run after the fix, Then both pass without modification to the tests themselves — the tests were already correctly written against real skill names, only the source path was wrong.

**AC5:** Given this repo's own `.github/skills/` (`infra-definition`, `infra-plan`, `infra-review`, `schema-migration-plan`, `schema-migration-review`) and `.github/templates/` (1 entry), When this fix ships, Then investigate and document what these 5+1 files are for — before this story's DoD, determine whether they are (a) genuinely dead leftovers from before the `skills/`/`templates/` migration that should be deleted, (b) an intentional separate mechanism unrelated to `/bootstrap` that must be preserved, or (c) something this repo's own `.github/skills/`-reading consumers (`skill-discovery.js`'s default, per F15/`csdg-s1`) still depend on. Do not delete them as part of AC1-AC4's fix without first confirming (a) — this AC exists specifically to prevent an assumption-driven deletion.

**AC6:** Given the full test suite (`npm test` / `node scripts/run-all-tests.js`), When run after the fix, Then no other test that currently passes regresses — in particular, any test relying on `.github/skills/`'s current partial contents (if any exist beyond i1.2) must be checked.

## Out of Scope

- Resolving F15/`csdg-s1` (whether `COPILOT_SKILLS_DIRS` needs setting in production for `handlePostSession`) — related but separate; that story's own AC1 investigation stands on its own.
- Any change to `skill-discovery.js`'s own default (`.github/skills/`) for the general consumer-repo runtime case — that default is correct for OTHER repos post-bootstrap; this story only fixes platform-init.js's SOURCE (this repo's own root `skills/`/`templates/`), not the general resolution default.
- A full audit of `scripts/assemble-copilot-instructions.sh` or other scripts referencing `.github/context.yml`/path resolution beyond `platform-init.js`'s own `COPY_DIRS` — those already correctly prefer `.github/context.yml` (see F15's diagnostic notes) and are not part of this specific bug.
- Retroactively re-bootstrapping or notifying any consumer repos that may have already run `/bootstrap` against the broken source paths since commit `1b1d0682` — a possible follow-up once this fix ships, not blocking this story's own DoD.

## NFRs

- **Performance:** None identified — this only changes which directory is read, not how much work is done relative to its actual (correct) size.
- **Security:** None identified — no new attack surface; source paths are build-time constants, not user input.
- **Accessibility:** N/A — CLI tooling only.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1 — Well understood, clear path. Root cause fully diagnosed (two literal path constants), the existing test file (`check-i1.2-platform-init-fetch.js`) already has correct assertions that will pass once the source paths are fixed (AC4), and AC5 is a bounded investigation, not open-ended design work.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic

## Diagnostic reference

Found while resolving `tests/check-i1.2-platform-init-fetch.js`'s two pre-existing failures (`platform-init-reports-skipped-files`, `platform-init-force-flag-overwrites-existing`), both fixtures pre-seeding `.github/skills/orient/SKILL.md` in a temp target and expecting `scripts/platform-init.js` to detect (skip, or overwrite with `--force`) the existing file.

Root cause: `scripts/platform-init.js`'s `COPY_DIRS`:

```javascript
const COPY_DIRS = [
  { src: path.join(sourceRoot, '.github', 'skills'), dest: path.join(targetDir, '.github', 'skills') },
  { src: path.join(sourceRoot, '.github', 'templates'), dest: path.join(targetDir, '.github', 'templates') },
  { src: path.join(sourceRoot, 'scripts'), dest: path.join(targetDir, 'scripts') }
];
```

`sourceRoot` defaults to this repo's own root (`path.join(__dirname, '..')`, or `PLATFORM_ROOT` when set — the tests set it explicitly to `root`). This repo's skills and templates moved to root `skills/`/`templates/` in commit `1b1d0682` ("chore: migrate skills/templates to repo root + fix artefact-paths hook") — `.github/skills/`/`.github/templates/` were left behind as the CONSUMER-repo install *destination* only, not a source. But `platform-init.js`'s `src` paths were never updated to match, so it still reads from `sourceRoot/.github/skills` (5 entries: `infra-definition`, `infra-plan`, `infra-review`, `schema-migration-plan`, `schema-migration-review`) and `sourceRoot/.github/templates` (1 entry), instead of the real, current, full `sourceRoot/skills` (49 entries) and `sourceRoot/templates` (40 entries).

Confirmed via direct reproduction — a temp target seeded with `.github/skills/orient/SKILL.md` is completely untouched by a real `platform-init.js` run (`orient` is never in the copy list at all, since it doesn't exist under `sourceRoot/.github/skills`):

```
$ node scripts/platform-init.js <tmpdir>   # PLATFORM_ROOT = this repo
# stdout: no mention of "orient" or "skip" at all
# <tmpdir>/.github/skills/orient/SKILL.md content: unchanged ("existing")
```

`ls .github/skills/` → 5 entries. `ls skills/` → 49 entries. `ls .github/templates/` → 1 entry. `ls templates/` → 40 entries.

This is the same class of repo-root-migration path drift already found and fixed in three test files this session (`check-i3.1-discovery-attribution.js` / `check-i3.2-benefit-metric-attribution.js` / `check-i3.3-dor-h-gov.js`, and separately F15/`csdg-s1`'s `skill-discovery.js` finding) — but this is the first instance found in the actual PRODUCTION installer script itself, not a test fixture, making it the highest-severity finding of this pass: every consumer repo bootstrapped from this platform since 2026-06-23 (commit `1b1d0682`'s date) would have received this near-empty install.
