# Test Plan: Fix run-model-sweep.js's stale SKILLS_DIR path (rms-s1)

**Story:** artefacts/2026-09-15-run-model-sweep-skills-dir-fix/stories/rms-s1-fix-stale-skills-dir-path.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural (new) | New `tests/check-rms-s1-skills-dir-path.js` — spawns `node scripts/run-model-sweep.js --list-skills` as a child process against the real repo tree; asserts exit code 0 and stdout contains `discovery`, `test-plan`, `definition-of-ready`, `review`. |
| T2 | AC2 | Behavioural (new) | Same file — requires `run-model-sweep.js`'s exported `discoverSkills()` (module is script-shaped but exports internals for test access per this repo's convention — falls back to a targeted `require` + call if not already exported, adding a minimal `module.exports` for testability if absent) with no filter; asserts each returned entry has a real, existing `evalPath`, and `corpusDir` is either `null` or an existing directory. |
| T3 | AC3 | Behavioural (new) | Same file — runs `node scripts/run-model-sweep.js --experiment EXP-TEST-rms-s1 --skills definition-of-ready --dry-run`; asserts exit code 0, no network call attempted (dry-run), and output references the real corpus case count for `definition-of-ready` (non-zero). |
| T4 | — | Regression | Full existing test suite re-run unchanged — this fix touches one constant in a file with zero prior test coverage, so no existing test targets it; regression here means confirming nothing else references the old broken behaviour. |

## Regression coverage

No existing tests reference `run-model-sweep.js` (confirmed via search — zero hits under `tests/`). T4 is a full-suite sanity pass, not a targeted regression set.

## Out of Scope (per story)

- Running the actual haiku-vs-sonnet experiment on `test-plan`/`definition-of-ready`/`review`.
- Auditing the other 9 files that reference `.github/skills` for the same drift (confirmed those are legitimate consumer-repo install-target references, not this bug — see `platform-init.js`'s own `pisd-s1` comment).
