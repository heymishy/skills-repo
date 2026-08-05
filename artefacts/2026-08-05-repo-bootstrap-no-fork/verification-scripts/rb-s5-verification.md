# AC Verification Script: Optionally install the full outer loop during bootstrap

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s5-optional-outer-loop-install.md
**Technical test plan:** artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s5-test-plan.md
**Script version:** 1
**Verified by:** Coding agent (dispatched inner-loop run) | **Date:** 2026-08-06 | **Context:** [x] Pre-code — walked through via `tests/check-rb-s5-optional-outer-loop-install.js` and direct `runInit()` invocations against real temp directories and the real `skills/` tree (not fixtures) before opening the PR.

---

## Setup

**Before you start:**
1. Have two empty target folders ready.
2. Have access to at least one DoR-approved feature in the SaaS if you're testing Scenario 3.

**Reset between scenarios:** Use a fresh empty folder per scenario.

---

## Scenarios

---

### Scenario 1: The outer-loop flag adds outer-loop skills on a fresh repo

**Covers:** AC1

**Steps:**
1. Run: `npx @heymishy/skills-repo@latest init . --with-outer-loop`
2. Open `.github/skills/` and check the registry file from the earlier story.

**Expected outcome:**
> Every skill labeled "outer-loop" in the registry is present in the folder, in addition to the inner-loop and ancillary skills you'd get by default.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via `runInit(tmp, { withOuterLoop: true })` against a real temp directory: all 46 real skills present under `.github/skills/`, including all 8 outer-loop-categorised ones (discovery, benefit-metric, design, definition, review, test-plan, definition-of-ready, decisions). NB: the *default* behaviour changed as part of this story — see decisions.md ARCH entry (2026-08-06) — a plain init without the flag no longer installs outer-loop skills at all (previously it always installed everything unconditionally).

---

### Scenario 2: Without the flag, only inner-loop skills come along on a SaaS-connected bootstrap

**Covers:** AC2

**Steps:**
1. Run the SaaS-connected bootstrap command (from the previous story) without adding `--with-outer-loop`.
2. Check which skills are present.

**Expected outcome:**
> No outer-loop skills (discovery, benefit-metric, definition, etc.) are present — only inner-loop and ancillary ones.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via a mocked SaaS-connected `runInit()` call (no `withOuterLoop`): none of the 8 outer-loop skills are present under `.github/skills/`; all inner-loop and ancillary skills are. Also confirmed the generated `CLAUDE.md`'s "Progressive Skill Disclosure" section no longer falsely lists an uninstalled outer-loop skill as available (a real bug found and fixed during this story — see decisions.md).

---

### Scenario 3: With the flag, the SaaS-connected bootstrap gets outer-loop skills too

**Covers:** AC3

**Steps:**
1. Run the SaaS-connected bootstrap command with `--with-outer-loop` added.
2. Check which skills are present, and compare against Scenario 1.

**Expected outcome:**
> Outer-loop skills are present, and the set matches exactly what Scenario 1 produced on the fresh-repo path — the flag behaves the same way regardless of which bootstrap path you used.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified by running both entry points with `withOuterLoop: true` and diffing the resulting `.github/skills/` directory listings — byte-identical skill name sets (`freshRepoFlagBehaviour_consistentAcrossBothEntryPoints`).

---

### Scenario 4: Adding the outer loop later, without starting over

**Covers:** AC4

**Steps:**
1. Bootstrap a folder without the flag (inner-loop only).
2. Re-run the init command against the same folder, this time adding `--with-outer-loop`.

**Expected outcome:**
> Outer-loop skills get added on top. Nothing that was already there gets deleted, overwritten, or duplicated — you don't have to start over from scratch.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified by checksumming every file in the target directory before and after the add-on run: every pre-existing file is byte-identical after; only the new outer-loop skill directories appear. No `--force` needed. This reconciles cleanly with rb-s1 AC3's refusal-to-overwrite behaviour with zero special-case code — see decisions.md ARCH entry for the mechanism.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | Pass | Full set incl. outer-loop reachable via the flag on the fresh path |
| Scenario 2 | Pass | Default now genuinely excludes outer-loop (was not true before this story — see Findings) |
| Scenario 3 | Pass | Identical outer-loop set as Scenario 1 |
| Scenario 4 | Pass | Add-on mode confirmed lossless via before/after checksum |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| 2 (pre-existing code) | AC2 assumed the SaaS-connected default was already inner-loop-only per discovery MVP scope | Before this story's code changes, BOTH bootstrap paths installed literally every skill (all 46) unconditionally — there was no category filtering anywhere in the merged rb-s1/rb-s2/rb-s3/rb-s4 code | MEDIUM | Fix implementation — narrowed the default on both paths; see decisions.md ARCH entry (2026-08-06) |
| 1 & 2 (cross-story) | Assembled CLAUDE.md should only describe skills that actually exist | `scripts/assemble-copilot-instructions.sh`'s own separate hardcoded `OUTER_LOOP_SKILLS` array unconditionally described 8 skills as "available at session start" even when their `SKILL.md` did not exist (default, no flag), rendering the literal text "(skill file not found)" into a freshly-bootstrapped repo's own CLAUDE.md | HIGH | Fix implementation — script now skips a skill entry when its file is missing, matching the pattern already used elsewhere in the same script |
| NFR (performance) | `--with-outer-loop` adds < 3 seconds | Measured ~3.1-3.3 seconds on this Windows/Git-Bash dev environment, driven by `assemble-copilot-instructions.sh`'s per-skill subprocess spawns (not the file copy itself, which is ~90-100ms) | LOW-MEDIUM | Accept — RISK-ACCEPT logged in decisions.md; root cause is a pre-existing rb-s3 script characteristic outside this story's scope, flagged as a follow-up |
