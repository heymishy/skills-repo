# Definition of Done: /branch-complete skips the redundant full-suite rerun when a fresh result exists

**PR:** https://github.com/heymishy/skills-repo/pull/1053 | **Merged:** 2026-11-04
**Story:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s2-branch-complete-freshness-guard.md
**Test plan:** artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s2-test-plan.md
**DoR artefact:** artefacts/2026-11-04-inner-loop-cycle-efficiency/dor/ilce-s2-dor.md
**Assessed by:** Claude (Sonnet 5)
**Date:** 2026-11-06

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `isFresh returns true when no commit since the verify-completion record and fullSuite is true` (unit); real end-to-end reproduction on master, 2026-11-06, with the real `getLastCodeCommitTimestamp()` (post-`bcfx-s1`) — see note below | unit → **live-verified** (upgraded 2026-11-06) | **Initially marked ⚠️ on 2026-11-06** — see DoD Observations. Resolved by `bcfx-s1` before this DoD was finalized. |
| AC2 | ✅ | `isFresh returns false when a commit happened after the verify-completion record` | unit | None |
| AC3 | ✅ | `isFresh returns false when the record covered only a partial/targeted run (fullSuite=false)` | unit | None |
| AC4 | ✅ | `decideSkipOrRun returns skipped:true when fresh` / `decideSkipOrRun returns skipped:false when not fresh`; `branch-complete SKILL.md Step 1 references the freshness-check module` | unit + integration-real-code | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None in `ilce-s2`'s own merged diff (PR #1053). See DoD Observations for the cross-story follow-up this DoD run itself triggered.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 9 / 9 (fresh run on master, `node tests/check-ilce-s2-branch-complete-freshness.js` — the file grew from `ilce-s2`'s original to include `ilce-s1`'s cross-story `getMostRecentRecord` fix and a NaN-guard test added during `ilce-s2`'s own code-quality review)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| isFresh returns true when no commit since the verify-completion record and fullSuite is true | ✅ | ✅ | |
| isFresh returns false when a commit happened after the verify-completion record | ✅ | ✅ | |
| isFresh returns false when the record covered only a partial/targeted run (fullSuite=false) | ✅ | ✅ | |
| isFresh returns false when no verify-completion record is provided | ✅ | ✅ | |
| isFresh returns true when the commit timestamp exactly equals the record timestamp (boundary) | ✅ | ✅ | |
| isFresh returns false without throwing when a timestamp is malformed (NaN guard) | ✅ | ✅ | |
| decideSkipOrRun returns skipped:true when fresh | ✅ | ✅ | |
| decideSkipOrRun returns skipped:false when not fresh | ✅ | ✅ | |
| branch-complete SKILL.md Step 1 references the freshness-check module | ✅ | ✅ | |

**Gaps (tests not implemented):** None at the unit level. The real-world-sequencing gap below was never covered at any level until `bcfx-s1`.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: skip path well under 1 second | ✅ | `NFR-freshness-skip-speed` guardrail, status `met` |
| Security | N/A | None identified |

---

## Metric Signal

**[Metric 2] (Metric 2 — Redundant full-suite reruns in `/branch-complete`, `pipeline-state.json`'s `m2`)**
Measurement-ready: **not yet**
Signal: not-yet-measured
Evidence note: As of `ilce-s2`'s own merge, this metric's real-world skip rate was structurally stuck at 0% (same as baseline) due to the bug described below — `bcfx-s1` fixed the underlying mechanism on 2026-11-06, but no story has yet run through the corrected `/branch-complete` in the normal inner-loop flow to produce a first real observation.
Date measured: null

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None — the blocking gap identified during this DoD run was resolved by `bcfx-s1` (merged, PR #1056) before this DoD was finalized.

---

## DoD Observations

1. **A real, structural bug was found while assessing this story's AC1 against live operation, not against its own unit tests.** `isFresh`'s comparison logic was always correct in isolation, but `skills/branch-complete/SKILL.md` never specified how `lastCommitTimestamp` should be computed — every orchestrating session (confirmed directly this session, for `ilce-s3` and `ilce-s4`) computed it via a raw `git log -1`, which always picked up `/verify-completion`'s own mandatory closing bookkeeping commit (which always postdates its own timing record, since the commit happens as a later step within the same skill run). This meant the skip path AC1 describes could never fire in real sequential operation — every single live invocation this session returned `{skipped: false}`, regardless of whether anything had actually changed. The bug passed `ilce-s2`'s own 9 unit tests, two independent spec-compliance review rounds, and a full final cross-task review, because all of that verification used synthetic timestamps rather than the real git-commit-sequencing pattern that only surfaces in live usage.
2. **This DoD run's own finding directly exercised DoD's "verification strength" tagging rule as designed**: AC1's real claim (branch-complete actually skips in practice) was backed only by `unit`-level evidence for a claim about real-world sequencing behavior — exactly the mismatch the DoD template's own verification-strength section exists to catch. Per that rule, this AC should have been marked `⚠️` rather than silently `✅` at the time this gap was found; it is marked `✅` here only because the gap was fixed (via short-track story `bcfx-s1`, PR #1056) before this DoD was finalized, and the fix itself has now been empirically re-verified live on master (see AC1's evidence row).
3. `/improve` candidate: a "freshness"/"skip" mechanism keyed to git-commit timestamps needs to be verified against the real commit-sequencing pattern of its own calling skills, not just synthetic timestamps, at `/test-plan` or `/definition-of-ready` time — not deferred to a `/definition-of-done` discovery months later. This is the same class of gap ADR-030 already documents for `pipeline-state.json`'s own self-reported fields (trust the mechanism's literal unit tests, not its real operational behavior) — worth a standards note.
4. See `bcfx-s1`'s own DoD (`artefacts/2026-11-06-bcfx-s1/dod/bcfx-s1-dod.md`) for the fix's own full delivery record, including a second, more severe bug (a `null`-timestamp epoch-zero flaw) that was introduced and caught within that fix's own review loop.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "/branch-complete skips the redundant full-suite rerun when a fresh result exists".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Specifically: is it appropriate that AC1 is marked ✅ given it was initially found to be unsatisfied in real operation, and only became ✅ after a separate follow-up story (bcfx-s1) shipped? Or should this DoD have stayed open/INCOMPLETE until bcfx-s1's own merge, rather than being written retroactively as COMPLETE in the same session?
Report findings as HIGH / MEDIUM / LOW.
```
