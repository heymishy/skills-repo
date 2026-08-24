# Definition of Done: Clarify the real skill-invocation mechanism in CLAUDE.md

**PR:** https://github.com/heymishy/skills-repo/pull/766 | **Merged:** 2026-08-24
**Story:** artefacts/2026-08-24-skill-invocation-wording-fix/stories/sivwf-s1-clarify-skill-invocation-mechanism-in-claude-md.md
**Test plan:** artefacts/2026-08-24-skill-invocation-wording-fix/test-plans/sivwf-s1-test-plan.md
**DoR:** artefacts/2026-08-24-skill-invocation-wording-fix/dor/sivwf-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — explicit statement before the Pipeline overview table that skills are not registered Claude Code skills, invoking means reading `skills/[name]/SKILL.md` directly | ✅ | `claudeMdStatesRealInvocationMechanism` test, re-run fresh against merged master | Automated content-assertion test | None |
| AC2 — no existing `/name` notation elsewhere in `CLAUDE.md` renamed or restructured | ✅ | `existingNotationUnchanged` test | Automated content-assertion test | None |
| AC3 — cites the concrete observed failure ("Unknown skill" / `skill="workflow"`) rather than a generic caveat | ✅ | `citesConcreteFailureMode` test | Automated content-assertion test | None |
| AC4 — references the discovery artefact by path for full rationale | ✅ | `referencesDiscoveryArtefact` test | Automated content-assertion test | None |

**All 4 ACs satisfied.** 6/6 tests re-run fresh against merged master (commit `d5fb29d1`), 0 failures.

---

## Scope Deviations

None. The merged diff (`CLAUDE.md`, the new test file, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story. No `.claude/skills/` directory or plugin manifest was created — confirmed by the `noNativeRegistrationArtifactsIntroduced` test — matching the discovery's own decision not to pursue that path. No `check-skill-contracts.js` entry was added — confirmed by the `checkSkillContractsUntouched` test — since that script is scoped to `SKILL.md` files only and this story only touches `CLAUDE.md`.

---

## Test Plan Coverage

**Tests passing:** 6/6, re-run fresh 2026-08-25 against merged master (commit `d5fb29d1`) — `tests/check-sivwf-s1-skill-invocation-wording.js`.

**Gaps:** None. This is a `CLAUDE.md` instruction-text change; per the story's own Architecture Constraints, tests assert on the actual instruction text present in the real file, following this session's established pattern (`csd-s4`, `dta-s1`, `evcg-s1`, `psms-s1`, `s3fw-s1`, `vtc-s1`).

**Real-world validation beyond the test plan itself:** the gap this story closes was found by direct observation, not speculation — a real Skill tool call with `skill="workflow"` failed with "Unknown skill" during this session (2026-08-24, `rcfc-s1` test-plan phase), and the full investigation into whether to fix that structurally (native Claude Code skill registration) or superficially (documentation wording) went through a complete `/discovery` + `/clarify` pass (`artefacts/2026-08-24-skill-tool-invocability-pilot/discovery.md`) before this story's scope was even decided. This is not a speculative fix — it is the direct, deliberate outcome of that investigation.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Instruction-text-only change, no new code surface |
| Security / Accessibility / Data-residency / Availability | ✅ N/A | Instruction-text-only change (per story's own NFR framing) |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field). This story is the superseding fix for item #7 of the 7-item ranked backlog surfaced during the 2026-08-24 capture-log sweep — the last of that original 7-item set to reach merge (alongside `vcfrc-s1`, a follow-up from item #6, still in flight as of this DoD).

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **This PR's own merge required resolving a real merge conflict** on `.github/pipeline-state.json` against `vcfrc-s1` (PR #767, item #6's follow-up), branched from master around the same time and independently appending a new feature-array entry near the same array position. Same false-conflict shape as this session's earlier `evcg-s1`↔`psms-s1` and `s3fw-s1`↔`vtc-s1`↔`egsv-s1` collisions — resolved on `vcfrc-s1`'s side by reconstructing both feature objects as complete, correctly-closed, side-by-side JSON objects and verifying zero features lost against `origin/master` before committing.
2. **The discovery-first path proved its worth here**: without the `/discovery` + `/clarify` investigation, the natural first instinct (build `.claude/skills/` registration) would likely have shipped — the token-cost finding (all registered skills' descriptions injected into context at every session startup, confirmed via direct technical investigation) only surfaced because the operator asked a clarifying question about value/cost during the `/clarify` step, not because it was anticipated in the original discovery draft.
3. Closes item #7 of the 7-item ranked backlog from the 2026-08-24 capture-log sweep ("skills not registered as Claude Code invocable skills") — the superseding fix for the "do documentation-only fix" decision made during discovery.
