# Definition of Done: Add an explicit checkout-verification rule to close the recurring wrong-checkout edit gap

**PR:** https://github.com/heymishy/skills-repo/pull/764 | **Merged:** 2026-08-24
**Story:** artefacts/2026-08-24-worktree-checkout-verification/stories/vtc-s1-verify-target-checkout-before-edit.md
**Test plan:** artefacts/2026-08-24-worktree-checkout-verification/test-plans/vtc-s1-test-plan.md
**DoR:** artefacts/2026-08-24-worktree-checkout-verification/dor/vtc-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-24

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `CLAUDE.md`'s "During a session" section contains the new checkout-verification rule | ✅ | `claudeMdHasCheckoutVerificationRule` test, re-run fresh against merged master | Automated content-assertion test | None |
| AC2 — the rule names the concrete trigger and recovery cost, not a generic restatement | ✅ | `ruleNamesConcreteTriggerAndRecoveryCost` test | Automated content-assertion test | None |
| AC3 — the existing "Verify coding-agent dispatch completion independently" rule remains byte-for-byte unchanged | ✅ | `existingDispatchVerificationRuleUnchanged` test | Automated content-assertion test | None |
| AC4 — `workspace/capture-log.md`'s two relevant entries remain present and unmodified | ✅ | `captureLogEntriesUnmodified` test | Automated content-assertion test | None |

**All 4 ACs satisfied.** 5/5 tests re-run fresh against merged master (commit `a24f5e88`), 0 failures.

---

## Scope Deviations

None. The merged diff (`CLAUDE.md`, the new test file, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story. No `check-skill-contracts.js` entry was added — confirmed at DoR time that script is explicitly scoped to `SKILL.md` files only (its own docstring), and this story only touches `CLAUDE.md`.

---

## Test Plan Coverage

**Tests passing:** 5/5, re-run fresh 2026-08-24 against merged master (commit `a24f5e88`) — `tests/check-vtc-s1-worktree-checkout-verification.js`.

**Gaps:** None. This is a `CLAUDE.md` instruction-text change; per the story's own Architecture Constraints, tests assert on the actual instruction text present in the real file, generalising this repo's established `SKILL.md`-content-assertion pattern (`csd-s4`, `dta-s1`, `evcg-s1`, `psms-s1`, `s3fw-s1`) to `CLAUDE.md`.

**Real-world validation beyond the test plan itself:** the gap this story closes was found by direct observation twice in the same session (`rcfc-s1`, 2026-08-24) — an edit meant for `.worktrees/rcfc-s1/...` landed in the main repo checkout instead, both times triggered identically by a tool-result or system-reminder showing a bare path with no `.worktrees/` prefix for a file already open in context from an earlier turn. This story adds the missing verification step to `CLAUDE.md` so the next session catches this before editing, not after.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Instruction-text-only change, no new code surface |
| Security / Accessibility / Data-residency / Availability | ✅ N/A | Instruction-text-only change (per story's own NFR framing) |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field). This story closes item #4 of the 7-item ranked backlog surfaced during the 2026-08-24 capture-log sweep — second of the "3, 4 then 5" sequence explicitly requested by the operator, following `s3fw-s1` (#3) and preceding `egsv-s1` (#5).

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **This PR's own merge required resolving a real merge conflict**, and the conflict itself is a small, self-contained illustration of exactly the kind of state-tracking discipline this repo's pipeline demands. `feature/vtc-s1` was branched from master before `s3fw-s1` (#763) and `egsv-s1` (#765) existed; both of those later merged and independently appended new `pipeline-state.json` feature-array entries near the same array position `vtc-s1`'s own branch had also appended to. Git's line-based 3-way merge interleaved the three feature objects' fields into two conflict hunks rather than cleanly separating them — a false conflict in the same family as the `evcg-s1`↔`psms-s1` collision earlier this session, not a real content collision. Resolved by manually reconstructing all three feature objects as complete, correctly-closed, side-by-side JSON objects (not merging their fields), then verifying byte-for-byte against `origin/master` that zero features were lost (`master features: 199`, `local features: 200` — the +1 being `vtc-s1`'s own not-yet-merged entry) before committing the merge.
2. **The fix was exercised by its own delivery, not just tested in the abstract**: writing this DoD itself required re-confirming the working directory context multiple times across the merge-conflict resolution and this closing checkpoint — the exact discipline this story's `CLAUDE.md` rule now makes explicit for future sessions.
3. Closes item #4 of the 7-item ranked backlog from the 2026-08-24 capture-log sweep ("worktree/wrong-checkout durable fix") — the middle item of the explicit "3, 4 then 5" sequence. All three items (`s3fw-s1`, `vtc-s1`, `egsv-s1`) are now merged and DoD-complete.
