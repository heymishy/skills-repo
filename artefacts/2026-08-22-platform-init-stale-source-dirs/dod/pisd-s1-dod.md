# Definition of Done: Point platform-init.js at the real skills/ and templates/ source directories

**PR:** https://github.com/heymishy/skills-repo/pull/753 | **Merged:** 2026-08-22
**Story:** `artefacts/2026-08-22-platform-init-stale-source-dirs/stories/pisd-s1-fix-platform-init-source-directories.md`
**Test plan:** `artefacts/2026-08-22-platform-init-stale-source-dirs/test-plans/pisd-s1-test-plan.md`
**DoR artefact:** `artefacts/2026-08-22-platform-init-stale-source-dirs/dor/pisd-s1-dor.md`
**Assessed by:** Copilot
**Date:** 2026-08-22

All evidence below re-verified fresh against merge commit `c6ccf8b0` on `master` (independently confirmed via `gh pr view 753` — state `MERGED`, `mergedAt: 2026-08-22T03:12:13Z` — not taken on the operator's "Merged" statement alone, per this repo's own established convention).

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `scripts/platform-init.js`'s `COPY_DIRS` and `scripts/platform-fetch.js`'s `FETCH_DIRS` now source from `skills/`/`templates/` | `tests/check-pisd-s1-platform-init-source-dirs.js` AC1 unit tests (2/2), re-run fresh on master | None |
| AC2 | ✅ | Fresh `platform-init.js` run against a temp target: 51 skills installed (was 5 pre-fix), `orient`/`benefit-metric`/`discovery` present, `listAvailableSkills()` finds them | `tests/check-pisd-s1-platform-init-source-dirs.js` AC2 unit + integration (2/2) | None |
| AC3 | ✅ | Fresh run: 41 templates installed (was 1 pre-fix), `story.md` byte-identical to the real template | `tests/check-pisd-s1-platform-init-source-dirs.js` AC3 unit + integration (2/2) | None |
| AC4 | ✅ | `tests/check-i1.2-platform-init-fetch.js` — 20/20 passing, re-run fresh on master | Automated test, re-verified post-merge | Required a companion fix to `scripts/platform-fetch.js` (same root cause, not in the original file map) — see Scope Deviations |
| AC5 | ✅ | Investigated and documented in `decisions.md`: the 5 misplaced skills + 1 template were added to `.github/skills/`/`.github/templates/` two days after the repo-root migration (`1b1d0682`) by mistake, not dead leftovers. Relocated via `git mv` to `skills/`/`templates/` | Manual investigation (`git log --follow`, `git grep`), documented decision | None |
| AC6 | ✅ | Full suite fresh on master: 531 files run, 4 failed — `check-pipeline-state-integrity.js`'s 3 known C3 entries plus `check-p3.5-validate-trace.js`/`check-p4-enf-decision.js`/`check-wsm2-collaborative-sessions.js`, all pre-existing and separately tracked (F14/`jatg-s1`, unrelated governance gaps). 0 new failures | `node scripts/run-all-tests.js`, re-run fresh post-merge | Required 2 additional same-root-cause fixes (`repo-bootstrap.js`, `assemble-copilot-instructions.sh`) not in the original file map — see Scope Deviations |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

Three fixes went beyond the implementation plan's original file map (`scripts/platform-init.js` + 6 relocated files + 1 new test file), all logged in `decisions.md` at the time and called out explicitly in the PR description:

1. **`scripts/platform-fetch.js`** — shared the identical stale `.github/skills/`/`.github/templates/` source-path bug as `platform-init.js`. Surfaced when Task 3's relocation broke a previously-passing `i1.2` test (`platform-fetch-copies-latest-skill-files`). Fixed with the same change.
2. **`src/web-ui/modules/repo-bootstrap.js`** — the live in-app "bootstrap via web UI" API path had the same bug a third time, in `frameworkDirs`. Fixed by restructuring to `{src, destPrefix}` pairs so the destination path in the bootstrapped repo stayed correct.
3. **`scripts/assemble-copilot-instructions.sh`** — a fourth instance, found via CI (not locally — `tests/check-rb-s3-harness-agnostic-instructions.js`/`.github/scripts/check-assembly.js` both gate their real assertion behind `process.platform !== 'win32'`, so a local Windows pass gave no real signal for this path). CI's "Lint, typecheck, test, build" check failed after the first push; root-caused and fixed as a second commit on the same PR before merge. First fix attempt was too broad (unconditionally swapping the source path broke `cli/lib/init.js`'s legitimate `--skills-repo-path <bootstrapped-target>` call pattern) — caught via direct `bash` invocation before pushing the correction, which prefers `skills/` and falls back to `.github/skills/`.

All three share one root cause with the planned fix (the `skills/`/`templates/` repo-root migration, commit `1b1d0682`, never propagated to every source-path reference) — not scope creep for its own sake, but necessary for AC4/AC6 to be honestly true.

None of the story's or feature's declared **out-of-scope** items were touched: `skill-discovery.js`'s own default resolution (F15/`csdg-s1`'s separate scope) was not modified; no retroactive consumer-repo notification was performed.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8 (plus 20/20 pre-existing `i1.2` tests, unmodified; full suite confirmed at the pre-existing 4-failure baseline)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: skills COPY_DIR src path | ✅ | ✅ | |
| AC1: templates COPY_DIR src path | ✅ | ✅ | |
| AC2: full skill set copied | ✅ | ✅ | |
| AC2: skills independently discoverable | ✅ | ✅ | |
| AC3: full template set copied | ✅ | ✅ | |
| AC3: story.md byte-identical | ✅ | ✅ | |
| AC5: infra-definition/schema-migration-plan installed | ✅ | ✅ | |
| AC5: staging-data-policy.md installed | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| None declared | N/A | Story's NFR section states "None identified" for Performance/Security/Accessibility/Audit — confirmed still accurate at merge; no new NFR-relevant behaviour shipped |

---

## Metric Signal

No metrics reference this story — short-track bug fix, no feature-level benefit-metric artefact (`metrics: []` on the feature's pipeline-state.json entry). Not applicable.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 6 ACs satisfied. "Deviations" here are additive (more was fixed than originally scoped, not less) and fully documented — not a shortfall. Recorded so `/trace` has an accurate account of what actually shipped versus what the original DoR contract described.

**Follow-up actions:**
- None required to close this story. Two related, separately-tracked findings remain open in `workspace/dod-backlog-findings.md`: F14 (`jatg-s1`, `requireJourneyAccess` tenant-access bug) and F15 (`csdg-s1`, pending the operator's check of the live Fly config for `COPILOT_SKILLS_DIRS`) — both pre-existing, neither blocking this story's own completion.

---

## DoD Observations

1. **Local Windows verification has a structural blind spot for `.sh` scripts gated on `process.platform !== 'win32'`.** Two tests in this repo (`check-rb-s3-harness-agnostic-instructions.js`, `.github/scripts/check-assembly.js`) silently no-op their real assertion on Windows, so a local "all green" run gives no signal for the actual bash-script behaviour they exist to verify — only CI (or a direct non-Node `bash` invocation, as used to catch and fix the second issue in this PR before a third push) proves it. Flagging as an `/improve` candidate: any future story touching `.sh` scripts in this repo should not treat a local Windows `npm test` pass as sufficient evidence for that file — confirm via direct `bash <script>` invocation or CI, explicitly.
2. **This is the fourth known instance of one root cause** (the `skills/`/`templates/` repo-root migration, commit `1b1d0682`, never fully propagated) found and fixed in a single PR: `platform-init.js`, `platform-fetch.js`, `repo-bootstrap.js`, `assemble-copilot-instructions.sh`. Worth a note for `/improve`: a repo-root file/directory migration should be accompanied by a repo-wide `grep` for the old path across `scripts/`, `src/`, and `.sh` files at the time of the migration itself, not discovered piecemeal by later, unrelated stories over the following two months.
3. This story closes **F16** in `workspace/dod-backlog-findings.md` (highest-severity finding from the 2026-08-21/22 test-cleanup pass).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Point platform-init.js at the real skills/ and templates/ source directories" (pisd-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
