# Definition of Done: Wire the real CLI into skills/feature-playback/SKILL.md's own documented steps

**PR:** https://github.com/heymishy/skills-repo/pull/1007 | **Merged:** 2026-10-19T06:15:45Z
**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s4-wire-cli-into-feature-playback-skill.md
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s4-test-plan.md
**DoR artefact:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s4-dor.md
**Assessed by:** Claude Sonnet 5 (session)
**Date:** 2026-10-19

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification strength | Deviation |
|----|-----------|----------|------------------------|-----------|
| AC1 — `SKILL.md`'s own Step 2/3 describe the real CLI accurately | ✅ | Unit test reads the real `skills/feature-playback/SKILL.md` file and asserts it names `authenticateStagingSession`/`buildCaptureList`, and the stale "video is a separate story" line is gone | `integration-real-code` (real file read, no mocking) | None |
| AC2 — "What this skill does NOT do" is accurately scoped | ✅ | Unit test reads the same real file's own section, asserts it names production capture and bulk retrofitting as still manual, and the video-embedding gap explicitly | `integration-real-code` | None |
| AC3 — `decisions.md` closes the 5 original RISK-ACCEPT entries | ✅ | Unit test reads the real `feature-playback-demo`'s own `decisions.md`, asserts the new entry names all 5 slugs, references `rpca-s1`-`rpca-s3`, and the 5 original entries remain present unedited | `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

None of the 3 ACs describe browser-observable UI behaviour — documentation-content assertions only; the UI-evidence gate does not apply.

---

## Scope Deviations

None. The merged PR's 2 task commits + 2 state-bookkeeping commits all map to the locked touch points (`skills/feature-playback/SKILL.md`, `feature-playback-demo`'s own `decisions.md`, one new test file). The 5 original RISK-ACCEPT entries were confirmed unedited, consistent with the story's own constraint.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3
**Tests passing in CI:** 3 / 3; full regression suite 766/766 at merge

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (unit): SKILL.md Step 2/3 accuracy | ✅ | ✅ | |
| AC2 (unit): "What this skill does NOT do" scoping | ✅ | ✅ | |
| AC3 (unit): decisions.md closure | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ (N/A) | Documentation-only change |
| Security | ✅ (N/A) | Documentation-only change |
| Accessibility | ✅ (N/A) | No new UI surface |
| Audit | ✅ | This story's whole purpose is strengthening the audit trail (AC3) |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Real capture coverage on new DoD-complete features | ✅ (0%, confirmed) | Not yet | This story doesn't move M1 directly — it closes the documentation/audit-trail gap, per its own benefit linkage. |
| M2 — Manual capture time per feature | N/A | N/A | Not contributing — story's own benefit linkage doesn't claim this metric. |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. (Named honestly, not a blocker) `SKILL.md`'s own newly-documented Step 3 orchestration has not yet been run end-to-end against a real DoD-complete feature via `/feature-playback` itself — `decisions.md`'s own SUPERSEDE entry names this as its revisit trigger. Not required for this story's own ACs; a natural follow-up once a new feature reaches DoD and needs a real playback package.
2. (Named honestly, not a blocker) No function exists yet to auto-embed a captured video into `walkthrough.md` — stated as a known gap in `SKILL.md` itself, not silently glossed over.

---

## DoD Observations

1. **The most consequential finding of this story happened at DoR, not DoD** — tracing the actual code before writing anything found the CLI entrypoint and `/feature-playback`'s own existing walkthrough/screenshot functions were disconnected mechanisms. Correcting the DoR contract before implementation (rather than discovering it mid-build or, worse, shipping prose that sounded right but wasn't) is the pattern this whole epic's own history argues for: the original 5 `fpd-*` RISK-ACCEPT entries existed precisely because nobody had checked whether the described mechanism and the real code matched. `/improve` candidate already logged in `rpca-s4`'s own DoR: trace actual code paths before writing documentation-accuracy ACs, not just reading the target file's current prose.
2. Two honest, named follow-up gaps (above) — neither blocks this story's own completion, both are visible in the shipped artefacts rather than discovered later by surprise.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for rpca-s4 (Wire the real CLI into feature-playback SKILL.md).
Check:
1. Does every AC row have a concrete evidence reference?
2. Is the real orchestration (not prose polish) framing accurate and well-supported?
3. Are the two named follow-up gaps genuinely non-blocking, or should either have been a hard requirement?
4. Does the metric signal row correctly state this story doesn't move M1/M2 directly?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
