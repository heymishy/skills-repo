## Test Plan: Stub the real git-commit adapter in the 13 remaining skill-turn test files

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s8-skill-turn-git-commit-adapter-stubbing.md
**Epic reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/epics/fixture-divergence-closure.md
**Test plan author:** Copilot
**Date:** 2026-10-31

**Test runner (confirmed from `package.json`):** `npm test` → `node scripts/run-all-tests.js`. Run the new structural check individually via `node scripts/check-skill-turn-git-commit-stubbing.js`, and any of the 13 named files directly, e.g. `node tests/check-dcuf-s1-github-commit-real-completion-point.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | All 13 named files stub setSkillTurnGitCommitAdapter before any artefact-completing turn | — | 1 | — | — | — | 🟢 |
| AC2 | New structural check exits non-zero for unstubbed files, 0 after AC1 | 2 | — | — | — | — | 🟢 |
| AC3 | Full suite shows no new failures and no behavioural change to the 13 files' own assertions | — | 1 | — | — | — | 🟢 |
| AC4 | workspace/learnings.md updated to record closure | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are mechanically verifiable: AC1/AC3 are confirmed by running the 13 named files directly before and after, AC2 by the new structural check's own exit code, AC4 by reading the updated learnings entry.

---

## Test Data Strategy

**Source:** Fixtures (existing real files) — the subject matter is the 13 real test files named in the story, and the real `_skillTurnGitCommit` adapter call site in `src/web-ui/routes/skills.js`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — all 13 files already exist in the repo.
**Owner:** Self-contained — this story modifies the 13 files directly.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | The 13 named files' own current content, plus the existing 12-file stubbing pattern (e.g. `tests/check-dic1-story-cards.js`) as the template to mirror | Fixtures (existing real files) | None | |
| AC2 | The 13 files (should now show 0 unstubbed) plus the 12 already-safe files and the 15 non-risk files (should show no change) | Fixtures (existing real files) | None | New check must not produce false positives on the 15 non-risk files, which call `handlePostTurnStreamHtml` but never reach the gated branch |
| AC3 | Full suite run, before and after | Fixtures (the suite itself) | None | |
| AC4 | `workspace/learnings.md`'s own existing junk-commit-contamination entry | Fixtures (existing real file) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### New structural check flags a file that calls handlePostTurnStreamHtml with an artefact-completing fixture but no adapter stub

- **Verifies:** AC2
- **Precondition:** `scripts/check-skill-turn-git-commit-stubbing.js` does not exist yet.
- **Action:** Once written, run it against a synthetic fixture test file that calls `handlePostTurnStreamHtml` with an `---ARTEFACT-END---`-bearing response and has no `setSkillTurnGitCommitAdapter` call.
- **Expected result:** Exits non-zero, names the fixture file.
- **Edge case:** Yes — must not flag a file that calls the handler but never drives a turn reaching the gated branch (no `ARTEFACT-END` in its own fixture responses) — this is exactly the distinction that separates the 13 real-risk files from the other 15 `tfhc-s6` already cleared.

### New structural check passes a file that already stubs the adapter

- **Verifies:** AC2
- **Precondition:** Check script exists.
- **Action:** Run it against one of the 12 already-safe files (e.g. `tests/check-dic1-story-cards.js`).
- **Expected result:** Exits 0, no findings for that file.
- **Edge case:** No.

### workspace/learnings.md reflects the closure with a cross-reference to this story

- **Verifies:** AC4
- **Precondition:** The existing junk-commit-contamination entry in `workspace/learnings.md` does not yet reference this story.
- **Action:** Read the entry after this story's AC1-AC2 are complete.
- **Expected result:** The entry's text states the root cause (the 13 files) is closed, with a reference to `tfhc-s8`.
- **Edge case:** No.

---

## Integration Tests

### All 13 named files stub the adapter before any artefact-completing turn, matching the existing pattern

- **Verifies:** AC1
- **Components involved:** The 13 named files ↔ `setSkillTurnGitCommitAdapter` (`src/web-ui/routes/skills.js`)
- **Precondition:** Baseline: 0 of the 13 currently call `setSkillTurnGitCommitAdapter` (confirmed by `tfhc-s6`'s spike and re-verified at `tfhc-s8`'s own `/review`).
- **Action:** After modification, grep each of the 13 files for a `setSkillTurnGitCommitAdapter` call appearing before its first test that drives a turn with an `---ARTEFACT-END---`-bearing fixture response.
- **Expected result:** All 13 files have the stub call positioned correctly (before, not after, the first artefact-completing test).

### Full suite shows no new failures and no behavioural change to the 13 files' own assertions

- **Verifies:** AC3
- **Components involved:** Full test suite (`node scripts/run-all-tests.js`)
- **Precondition:** Baseline full-suite run recorded before this story's changes (814 files, the known pre-existing `[C3]` pipeline-state-integrity flag only).
- **Action:** Re-run the full suite after AC1-AC2 are complete. Separately, diff each of the 13 files' own test output (pass/fail per named test) before and after.
- **Expected result:** Same known pre-existing flag only, no new or different failure; every one of the 13 files' own individual test outcomes is byte-for-byte identical to its pre-change baseline — only the adapter stubbing is added, nothing about the test's own logic changes.

---

## NFR Tests

None — confirmed with story owner. The story's NFRs section states "Not applicable" for Performance/Accessibility/Audit (no runtime behavioural change) and "None identified" for Security (closes a risk, does not introduce one).

---

## Out of Scope for This Test Plan

- Testing `scripts/run-all-tests.js` parallelization itself — a separate, later story, not yet written.
- The 12 already-stubbed files — no change, not retested here beyond confirming the new structural check still passes them.
- The 15 non-risk files that call the handler but never reach the gated branch — confirmed by `tfhc-s6`'s spike to carry no risk; the new structural check's own edge-case test (above) is the only place they're referenced.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Whether the 13-file count itself is now fully accurate (vs. the originally-named 14) cannot be re-litigated by an automated test alone | Confirming a file's own code-level behaviour (does it call the real handler at all) is a source-reading judgment call, same class of check that caught the original miscount at `/review` | Already independently verified for all 13 (not just spot-checked) during this story's own `/review` finding 1-M1 resolution — re-confirm once more at `/definition-of-done` as a final gate, same discipline as every other story in this epic |
