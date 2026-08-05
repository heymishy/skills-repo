# AC Verification Script: Optionally install the full outer loop during bootstrap

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s5-optional-outer-loop-install.md
**Technical test plan:** artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s5-test-plan.md
**Script version:** 1
**Verified by:** Coding agent (dispatched inner-loop run) | **Date:** 2026-08-06 (revised same day after coordinator-directed design correction — see decisions.md) | **Context:** [x] Pre-code — walked through via `tests/check-rb-s5-optional-outer-loop-install.js` and direct `runInit()` invocations against real temp directories and the real `skills/` tree (not fixtures) before opening the PR.

**Note:** this script was first walked through against a file-filtering implementation (outer-loop skills excluded from disk by default), then re-walked through against the corrected enablement-signal design after coordinator review reverted that approach. The scenario text and results below reflect the corrected, current design only.

---

## Setup

**Before you start:**
1. Have two empty target folders ready.
2. Have access to at least one DoR-approved feature in the SaaS if you're testing Scenario 3.

**Reset between scenarios:** Use a fresh empty folder per scenario.

---

## Scenarios

---

### Scenario 1: The outer-loop flag enables outer-loop skills as active tooling on a fresh repo

**Covers:** AC1

**Steps:**
1. Run: `npx @heymishy/skills-repo@latest init . --with-outer-loop`
2. Check `context.yml` for `outerLoop.enabled`, and check the generated `CLAUDE.md`'s session-start section.

**Expected outcome:**
> `context.yml` contains `outerLoop.enabled: true`. The instruction file's session-start section lists every outer-loop skill as active, in addition to the inner-loop and ancillary skills always presented by default. Every skill file (outer-loop included) is present on disk regardless of the flag, per rb-s2's unconditional AC1.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via `runInit(tmp, { withOuterLoop: true })` against a real temp directory: `context.yml` contains `outerLoop.enabled: true`; `CLAUDE.md`'s Core Platform Layer section says "The following outer loop skills are active at session start" and lists each with its description; all 46 real skill files present under `.github/skills/` regardless.

---

### Scenario 2: Without the flag, outer-loop skills are installed but presented as not-yet-enabled

**Covers:** AC2

**Steps:**
1. Run the SaaS-connected bootstrap command (from the previous story) without adding `--with-outer-loop`.
2. Check `context.yml` and the generated instruction file, and separately confirm every skill file is still present on disk.

**Expected outcome:**
> `context.yml` contains `outerLoop.enabled: false` (or the field absent). The instruction file names outer-loop skills as installed-but-not-enabled, with the exact flag needed to enable them — it does not present them as active. Every skill file, including outer-loop ones, remains present on disk (rb-s2 AC1) — this concerns what's presented as active, not what's installed.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via a mocked SaaS-connected `runInit()` call (no `withOuterLoop`): `context.yml` contains `outerLoop.enabled: false`; `CLAUDE.md` names each outer-loop skill as "(installed, not enabled)" and tells the reader to re-run with `--with-outer-loop`. All 46 real skill files, including all 8 outer-loop-categorised ones, are present under `.github/skills/` regardless.

---

### Scenario 3: With the flag, the SaaS-connected bootstrap gets the same signal and presentation

**Covers:** AC3

**Steps:**
1. Run the SaaS-connected bootstrap command with `--with-outer-loop` added.
2. Compare `context.yml` and the instruction file's presentation against Scenario 1.

**Expected outcome:**
> Same `outerLoop.enabled: true` signal and instruction-file presentation as the fresh-repo path — the flag behaves the same way regardless of which bootstrap path you used.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified by running both entry points with `withOuterLoop: true` and comparing `context.yml`'s `outerLoop.enabled` value and the Core Platform Layer section's "active at session start" presentation — identical on both paths (`freshRepoFlagBehaviour_consistentAcrossBothEntryPoints`). Also confirmed both paths install the identical, complete skill-file set either way.

---

### Scenario 4: Enabling the outer loop later, without starting over

**Covers:** AC4

**Steps:**
1. Bootstrap a folder without the flag (`outerLoop.enabled: false`).
2. Re-run the init command against the same folder, this time adding `--with-outer-loop`.

**Expected outcome:**
> `outerLoop.enabled` flips to `true` in `context.yml` and the instruction file regenerates its session-start section to present outer-loop skills as active. Nothing else changes — no file is added, removed, or otherwise modified.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified by checksumming every file in the target directory before and after the add-on run: every file is byte-identical after, except `context.yml` (the signal flips) and the four instruction files (regenerated to reflect it). No `--force` needed. No new or removed files — every skill file was already present per rb-s2 AC1, so there is nothing to reconcile against rb-s1 AC3's refusal-to-overwrite behaviour; the question does not arise under this design.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | Pass | `outerLoop.enabled: true` + active presentation; all files present regardless |
| Scenario 2 | Pass | `outerLoop.enabled: false` + installed-not-enabled presentation; all files still present |
| Scenario 3 | Pass | Identical signal + presentation to Scenario 1 |
| Scenario 4 | Pass | Add-on mode confirmed lossless via before/after checksum of the entire directory |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| 2 (pre-existing code) | AC2 assumed the SaaS-connected default was already inner-loop-only per discovery MVP scope | Before this story's code changes, BOTH bootstrap paths installed literally every skill (all 46) unconditionally — there was no category filtering, and no enablement signal, anywhere in the merged rb-s1/rb-s2/rb-s3/rb-s4 code | MEDIUM | Resolved via the enablement-signal mechanism (context.yml + instruction-file presentation) rather than file filtering — see decisions.md corrected ARCH entry (2026-08-06). A first implementation pass resolved this via file filtering instead, which was reverted after coordinator review found it improperly narrowed rb-s2's already-shipped AC1 guarantee. |
| 1 & 2 (cross-story) | `scripts/assemble-copilot-instructions.sh`'s own hardcoded `OUTER_LOOP_SKILLS`/`INNER_LOOP_SKILLS` arrays are a second, independent categorisation from rb-s2's registry | Confirmed (e.g. `/workflow` is `ancillary` in the registry but appears in this script's `OUTER_LOOP_SKILLS`) | LOW | Accept — flagged as a follow-up in decisions.md, not fixed in this story either way |
| NFR (performance) | `--with-outer-loop` adds < 3 seconds | Measured ~3.6-3.7 seconds on this Windows/Git-Bash dev environment (larger than the ~3.1-3.3s measured under the reverted first-pass design), driven entirely by `assemble-copilot-instructions.sh`'s per-skill subprocess spawns when presenting outer-loop skills as active (file copying is now identical between both cases and contributes nothing to the delta) | LOW-MEDIUM | Accept — RISK-ACCEPT logged in decisions.md; root cause is a pre-existing rb-s3 script characteristic outside this story's scope, flagged as a follow-up |
