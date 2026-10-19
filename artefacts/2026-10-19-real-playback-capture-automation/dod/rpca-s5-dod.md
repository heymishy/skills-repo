# Definition of Done: Playback capture triggers automatically when a feature reaches Definition of Done

**PR:** https://github.com/heymishy/skills-repo/pull/1008 | **Merged:** 2026-10-19T07:47:13Z
**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s5-automatic-capture-trigger-at-definition-of-done.md
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s5-test-plan.md
**DoR artefact:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s5-dor.md
**Assessed by:** Claude Sonnet 5 (session)
**Date:** 2026-10-19

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification strength | Deviation |
|----|-----------|----------|------------------------|-----------|
| AC1 — `checkDodGate` returns ok when every story is complete, regardless of `feature.dodStatus` | ✅ | Unit tests (real function, fixture state): no field set, and a stale disagreeing field | `integration-real-code` | None |
| AC2 — `checkDodGate` throws naming the specific incomplete story | ✅ | Unit test (real function, fixture state) | `integration-real-code` | None |
| AC3 — `/definition-of-done`'s own Feature-completion trace check auto-triggers `/feature-playback`'s own Steps 1-3 | ✅ | Unit test reads the real `skills/definition-of-done/SKILL.md` content | `integration-real-code` (real file read) | None |
| AC4 — a capture failure doesn't downgrade the DoD verdict; records a named follow-up action | ✅ | Unit test reads the same real file's own non-blocking-failure language | `integration-real-code` | None |
| AC5 — the existing manual `/feature-playback` invocation path is unchanged | ✅ | Unit test reads the real `skills/feature-playback/SKILL.md`, confirms unchanged | `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

None of the 5 ACs describe browser-observable UI behaviour — pure function logic + documentation-content assertions; the UI-evidence gate does not apply.

---

## Scope Deviations

None against the story's own ACs. One backward-compat addition beyond the ACs, found and handled during implementation (not a scope violation — see DoD Observations): `checkDodGate` falls back to checking `feature.dodStatus` directly when a feature has zero stories in either shape, to avoid regressing the pre-existing `fpd-s1` test.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 (test plan specified 5, implementation added one extra regression case for the stale-`feature.dodStatus` scenario under AC1)
**Tests passing in CI:** 6 / 6; full regression suite 767/767 at merge

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (unit): ok when every story complete, no field set | ✅ | ✅ | |
| AC1 (unit): ok even with a stale disagreeing field | ✅ | ✅ | |
| AC2 (unit): throws naming the specific story | ✅ | ✅ | |
| AC3 (unit): SKILL.md auto-trigger language | ✅ | ✅ | |
| AC4 (unit): SKILL.md non-blocking-failure language | ✅ | ✅ | |
| AC5 (unit): feature-playback SKILL.md unchanged | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (fires once per feature, not per story) | ✅ | Trigger point is the existing "every story across every epic" check, which only evaluates true once |
| Security | ✅ (N/A) | No new NFR beyond `rpca-s1`'s own established posture |
| Accessibility | ✅ (N/A) | No new UI surface |
| Audit | ✅ | The non-blocking-failure path's own named `pendingActions` entry is itself an audit improvement |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Real capture coverage on new DoD-complete features | ✅ (0%, confirmed) | Not yet | This is the story that actually makes M1 climb without operator memory — but the first real signal only comes the next time a NEW feature reaches full DoD and the automatic trigger fires for real, not from this story's own merge alone. |
| M2 — Manual capture time per feature | ⚠️ Not yet fully measured | Not yet | Same reasoning — this removes the CLI-invocation step from the operator's own time, but needs a real next feature to measure against. |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None — this is the last story in the `real-playback-capture-cli` epic. The first real end-to-end signal (M1/M2) will come from the next feature that reaches full DoD and triggers this mechanism for real; worth checking back on once that happens.

---

## DoD Observations

1. **A real backward-compatibility risk was found and fixed during implementation, not left for CI to catch.** The pre-existing `fpd-s1` test (`tests/check-fpd-s1-walkthrough-document-and-screenshots.js`) exercises `checkDodGate` against a minimal fixture (`{ slug: ..., dodStatus: 'in-progress' }`, no `stories`/`epics` array at all). The first version of this story's own fix would have silently started treating that fixture as "done" (an empty story list has no incomplete story to find), breaking that test's own real assertion. Running the full regression suite before committing caught this; the fix adds an explicit fallback to `feature.dodStatus` only when a feature has zero stories in either shape — preserving the old behaviour for that minimal case while fixing the real one (a feature with real story records).
2. This closes the epic's own full arc: `rpca-s1`-`rpca-s4` built and documented the real mechanism; `rpca-s5` removes the last manually-issued step. The actual M1/M2 signal still needs a real next feature to pass through DoD and prove the automatic trigger fires correctly end to end — recorded here as the natural next checkpoint, not a gap in this story.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for rpca-s5 (automatic capture trigger at Definition of Done).
Check:
1. Does every AC row have a concrete evidence reference?
2. Is the backward-compat fallback (zero-story fixture) described accurately as a found-and-handled risk, not glossed over?
3. Does the metric signal row correctly state the real M1/M2 signal is still pending the next real feature?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
