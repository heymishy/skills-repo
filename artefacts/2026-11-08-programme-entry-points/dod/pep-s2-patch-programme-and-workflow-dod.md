# Definition of Done: Patch /programme and /workflow for the gaps story 1 (and the discovery-correction) found

**PR:** https://github.com/heymishy/skills-repo/pull/1065 | **Merged:** 2026-11-10 (merge commit 30bdbd4ab)
**Story:** artefacts/2026-11-08-programme-entry-points/stories/pep-s2-patch-programme-and-workflow.md
**Test plan:** artefacts/2026-11-08-programme-entry-points/test-plans/pep-s2-patch-programme-and-workflow-test-plan.md
**DoR artefact:** artefacts/2026-11-08-programme-entry-points/dor/pep-s2-patch-programme-and-workflow-dor.md
**Assessed by:** Claude (against merged code on master at d0a3ad048, which contains merge commit 30bdbd4ab)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = against synthetic or mocked inputs; `integration-real-code` = exercises or reads the real merged file or script but not a live running behaviour; `live-verified` = confirmed against a real running instance (here, a real agent session actually following the patched skill); `production-observed` = observed in real use.

All four wording ACs (AC1, AC4, AC5, AC6) are about text in SKILL.md files or `decisions.md`, so reading the real merged text is direct evidence for them. AC2 and AC3 are phrased as "when Step 0 is run against...", which is a claim about how the skill behaves when an agent follows it. The only executable evidence for those two is a JavaScript mirror of the scoring table written by this story, not the skill text itself.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | AC1 (Acceptance Criterion 1: add a new epic-count signal of 4 or more epics within a single feature to Step 0's scoring table). Merged `skills/programme/SKILL.md` Step 0 scoring table now contains the row "Epic count within a single feature, ≥4 epics (pep-s2, 2026-11-09, pinned against two real cases: skills-platform-phase4's 5 epics qualifies, team-identity-roles' 1 epic does not...)". The 1-team branch no longer stops at "use the standard pipeline"; it now reads "If the answer is 1 team, do not stop here, continue to Q2. A single-team effort can still qualify via the epic-count signal below". Tests T1-scoring-table-has-epic-count-row, T1-no-stale-placeholder-language, T1-epic-count-threshold-matches-pep-s3 and T2-boundary-epic-count-4-passes pass. Strength: integration-real-code (real merged SKILL.md text read directly; the keyword test alone would not have proven the 1-team early-exit was removed, so that was read separately). | Automated test check-pep-s2-patch-programme-and-workflow plus direct read of merged skills/programme/SKILL.md | None against the AC as written. See DoD Observation 1 (Step 0 asks no question that elicits the epic count). |
| AC2 | ⚠️ | AC2 (Acceptance Criterion 2: Step 0 run against phase4's real profile of 5 epics and 1 team flips from fail to pass via the epic-count signal). Tests T3-phase4-epic-count-is-5, T3-phase4-flips-to-pass and T3-phase4-pass-is-via-epic-count-specifically pass: `src/pep-s2-patch-programme-and-workflow/step0-scorer.js` run on the real archived phase4 directory counts 5 epics and returns verdict pass with firingSignals equal to epicCountAtLeastFour only. Strength: integration-real-code, but of the JavaScript mirror and the real fixture directory, not of the skill. The skill's own Step 0 is a conversational Q1-Q4 flow, and nobody has run it against phase4 since the patch. | Automated test check-pep-s2-patch-programme-and-workflow (T3 group) | The claim is about the patched skill's behaviour when run. The mirror is hand-written to match the scoring table and nothing enforces that it stays in step with the SKILL.md text, so it proves the arithmetic of the intended rule, not that an agent following the skill would reach pass. Marked ⚠️ rather than ✅ per this skill's verification-strength rule. Follow-up 1 names the check needed. |
| AC3 | ⚠️ | AC3 (Acceptance Criterion 3: Step 0 run against team-identity-roles with 1 epic still recommends the standard pipeline, with no false positive). Tests T4-tir-epic-count-is-1 and T4-tir-stays-fail pass: the mirror run on the real `artefacts/2026-07-09-team-identity-roles` directory counts 1 epic and returns fail. Strength: integration-real-code, but of the mirror and fixture, not of the skill. The profile's other signals are caller-supplied defaults (all false), not derived from the real feature, so only the epic count is genuinely measured. | Automated test check-pep-s2-patch-programme-and-workflow (T4 group) | Same evidence-class gap as AC2. In addition the other four signals for this case are asserted by the test author, not derived from data. Follow-up 1 covers both ACs. |
| AC4 | ✅ | AC4 (Acceptance Criterion 4: /workflow's inline pre-check at its "If 5 - Programme track" branch is rewritten to defer to /programme's Step 0). Merged `skills/workflow/SKILL.md` lines 164-170 now read "Don't re-qualify here - run /programme's own Step 0 qualification now... Re-asking the same questions here would create two independently-computed answers to the same question (MC-CONSIST-02)". The inline team-count, hard-dependency, phase-gate and consumer-migration question list and the inline "if the answer to all of these is one team / no / no / no" verdict are gone; the branch goes straight on to checking for an existing programme artefact and routing into /programme. Tests T5-defers-to-programme-step0, T5-no-duplicated-cross-team-question, T5-no-duplicated-phase-gate-question and T5-no-inline-verdict-computation pass. Strength: integration-real-code (real merged text, quoted). | Automated test check-pep-s2-patch-programme-and-workflow plus direct read of merged skills/workflow/SKILL.md | None against the AC. The test plan's third AC4 test (route in via /workflow option 5 and confirm the verdict equals calling Step 0 directly) was not implemented; see Test Plan Coverage. |
| AC5 | ✅ | AC5 (Acceptance Criterion 5: at least one cross-reference to /programme added to /orient under a transformative, multi-team or multi-phase framing). Merged `skills/orient/SKILL.md` line 167 now reads "If this is large-scale (multiple teams, multiple phases, or a transformative/migration-scale initiative) consider /programme instead of /discovery directly. /programme's own Step 0 will confirm whether the coordination overhead is actually justified before you commit to it." Before the patch /orient had zero /programme mentions. Tests T6-orient-mentions-programme and T6-orient-programme-mention-is-scale-framed pass. Strength: integration-real-code (real merged text, quoted). | Automated test check-pep-s2-patch-programme-and-workflow plus direct read of merged skills/orient/SKILL.md | None. The reference sits in the /discovery route recommendation block only; the AC asks for at least one. See DoD Observation 3 for a cosmetic encoding note on that line. |
| AC6 | ✅ | AC6 (Acceptance Criterion 6: any extra gap named in pep-s1's write-up is patched with a trace to it, or logged as a RISK-ACCEPT or new-discovery referral, never silently absorbed or dropped). `reference/pep-s1-dry-run-findings.md` lines 35, 53 and 57 name exactly one additional gap: Step 3's workstream and team representation cannot express a single-operator, multi-epic programme. Merged `decisions.md` carries a "2026-11-10 RISK-ACCEPT implementation (pep-s2, AC6)" entry that traces to that finding, rejects folding a fix into this story, and gives a revisit trigger. The PR diff touched no `templates/programme.md` and no Step 3 text, so the gap was neither absorbed nor dropped. Strength: integration-real-code (real merged artefacts read directly; no automated test, which the test plan itself classes as untestable by nature). | Direct read of merged decisions.md, pep-s1 findings and the PR file list | None. The referral has no follow-up story yet; see Follow-up 2. |

**Verification strength summary:** AC1, AC4, AC5, AC6 `integration-real-code` (adequate for text-wording claims, since the real merged text was read and quoted); AC2 and AC3 `integration-real-code` of a mirror module only, hence ⚠️; 0 `unit` as the final tag; 0 `live-verified`; 0 `production-observed`.

---

## Scope Deviations

No violation of the story's own Out of Scope section was found. Both exclusions hold: no patch to /programme or /workflow beyond the epic-count signal, the 1-team early-exit removal and the /workflow de-duplication (every one traces to the story's two discovery-time corrections), and no redesign of either skill. The AC6 finding was explicitly not patched.

One touch-point deviation is recorded because it differs from the DoR contract. `gh pr diff 1065 --name-only` lists seven files:

- `skills/programme/SKILL.md`, `skills/workflow/SKILL.md`, `skills/orient/SKILL.md` (the three the contract names).
- `artefacts/2026-11-08-programme-entry-points/decisions.md` and `.github/pipeline-state.json` (bookkeeping; expected).
- `tests/check-pep-s2-patch-programme-and-workflow.js` (the story's test file; expected).
- `src/pep-s2-patch-programme-and-workflow/step0-scorer.js` (NOT named in the contract's "Estimated touch points", which lists only the three SKILL.md files and "Services: none").

The new `src/` module is a hand-written executable mirror of the patched scoring table. It does not change any shipped behaviour, but it is the sole evidence for AC2 and AC3, and a mirror of prose is exactly the kind of artefact that can drift from the prose it mirrors. It also imports `EPIC_COUNT_THRESHOLD` from `scripts/detect-programme-candidates.js` (pep-s3), which is a deliberate coupling noted in the module's own header.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 of 10 planned test cases have a direct counterpart; 17 assertions are implemented in total.
**Tests passing:** 17 / 17. Re-run locally on merged master (d0a3ad048): `node tests/check-pep-s2-patch-programme-and-workflow.js` printed `[check-pep-s2-patch-programme-and-workflow] 17 check(s) OK`. CI results on PR #1065 were not re-examined for this DoD.

| Planned test | Implemented | Passing | Notes |
|--------------|-------------|---------|-------|
| Unit: scoring table has the new epic-count row (AC1) | ✅ | ✅ | T1 group (3 assertions) |
| Unit: epic-count alone flips a failing verdict, boundary at 4 (AC1) | ✅ | ✅ | T2 group, includes the below-boundary case of 3 |
| Unit: /workflow section contains no duplicated Q1-Q4 questions and routes to Step 0 (AC4) | ✅ | ✅ | T5 group |
| Unit: /workflow no longer computes the verdict inline (AC4) | ✅ | ✅ | T5-no-inline-verdict-computation |
| Unit: /orient has a /programme cross-reference under scale framing (AC5) | ✅ | ✅ | T6 group |
| Integration: patched Step 0 against phase4 flips fail to pass (AC2) | ✅ | ✅ | T3 group, against the mirror, not the skill |
| Integration: patched Step 0 against team-identity-roles stays fail (AC3) | ✅ | ✅ | T4 group, against the mirror, not the skill |
| Integration: /workflow deferred routing yields the same verdict as Step 0 called directly (AC4) | ❌ | n/a | Not implemented. Two assertions only check that the text mentions Step 0; nothing compares verdicts. |
| Manual: /orient reading scenario (AC5) | Not evidenced | n/a | No record of the manual scenario being run |
| Manual: AC6 trace scenario | Done by this DoD | n/a | Performed as a direct read in the AC6 row above |

**Gaps (tests not implemented):** the AC4 "same verdict either way" integration test. Risk: AC4's claim that the duplication was removed is covered by text assertions, but "no two independently computed answers" is only true by inspection, not by test. Acceptable for a prose change, recorded here as a test gap without a RISK-ACCEPT.

**Coverage-gap audit:** the test plan has no `CSS-layout-dependent` gaps. Its recorded gap is AC6's scope depending on pep-s1, now resolved by the RISK-ACCEPT entry in `decisions.md`.

---

## NFR Status

Feature-level NFR profile `nfr-profile.md` exists (Status: Active, last updated 2026-11-09). Its status is not changed to Verified by this DoD because pep-s1 and pep-s3 are not assessed here and one NFR row below is partially evidenced.

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| Governed-file change control: patches to `skills/programme/SKILL.md` and `skills/workflow/SKILL.md` go via branch and PR, never direct push | ✅ | `gh pr view 1065` shows state MERGED, merged 2026-11-10T23:57:50Z, title "feat(pep-s2): patch /programme and /workflow for the gaps story 1 found"; all three skill edits arrived via that PR. |
| No new credential surface | ✅ | PR file list contains no config, secret or dependency file; the new `src/` module requires only two in-repo modules. |
| Performance: no SLO defined | ✅ (n/a) | Profile states baseline measurement only; story states not applicable. |
| Audit: PR plus `decisions.md` entries form the trail | ✅ | PR #1065 exists; `decisions.md` gained the AC6 RISK-ACCEPT entry in the same PR. |

---

## Metric Signal

`.github/pipeline-state.json` for this feature lists four metrics (m1, m2, m3-meta, m4-meta). None lists `pep-s2` in `contributingStories`: m1 and m2 have an empty `contributingStories` array, m3-meta lists only `pep-s1`, and m4-meta lists only `pep-s3`. Step 6 as written therefore has no metric to record for this story, and the signal could not be asked of the operator.

The story's own Benefit Linkage nevertheless names two metrics, and states that this story is "the only place either Tier 1 metric's target can actually be reached". Recording both as not-yet-measured with a real evidence note, without changing the state file:

> **Qualification-gate fix validated against a real case (m1)**
> Signal: not-yet-measured
> Evidence note: The patched Step 0 text exists on master and a mirror module scores phase4 as pass and team-identity-roles as fail, but the metric's target ("gate passes phase4 case, still rejects a normal multi-story feature") is about the gate's behaviour when actually run. No real run of /programme Step 0 against either case has happened since the patch (see AC2 and AC3).
> Date measured: null

> **Routing visibility for a genuine big-bet candidate (m2)**
> Signal: not-yet-measured
> Evidence note: The target is at least 1 routing path surfacing /programme under the right signals. The text for such a path now exists in /orient (line 167) and /workflow ("If 5" branch). Whether a real operator in a real session is actually routed to /programme by it has not been observed.
> Date measured: null

The metrics' `signal` fields in `pipeline-state.json` were not edited by this task. Follow-up 3 covers adding `pep-s2` to `contributingStories`.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

ACs satisfied: 4/6 fully (AC1, AC4, AC5, AC6); AC2 and AC3 marked ⚠️ on evidence class, not because anything failed. Nothing is ❌. Deviations: 2 recorded (the unplanned `src/` module touch-point, and the unimplemented AC4 integration test).

**Follow-up actions:**
1. Run `/programme`'s Step 0 for real in an agent session against phase4's profile (expected: pass via the epic-count signal) and against team-identity-roles' (expected: standard pipeline), and record what the agent actually did. This closes AC2 and AC3 and gives m1 a real measurement. Owner: operator.
2. Raise a small follow-up story or discovery for the RISK-ACCEPT referral in `decisions.md` (Step 3 and `templates/programme.md` cannot express a single-operator, multi-epic programme). Owner: operator, at the revisit trigger stated in that entry.
3. Add `pep-s2` to `contributingStories` on metrics m1 and m2 in this feature's `pipeline-state.json`, via `node bin/skills advance`, since the story and its own Benefit Linkage say it is the contributor. Owner: operator.
4. Decide whether to add a Step 0 question that elicits the epic count (DoD Observation 1) and whether to add a drift check between `step0-scorer.js` and the SKILL.md table (Observation 2). Both are `/improve` candidates.

---

## DoD Observations

1. **Step 0 asks no question that gathers the epic count.** The merged Step 0 still has only Q1 (teams), Q2 (cross-team dependencies), Q3 (phase gates) and Q4 (consumer migration). The epic-count signal appears only as a row in the scoring table, and the new 1-team text says "continue through Q2-Q4 and the scoring table". An agent following the skill literally has no prompt telling it to ask or count epics. Separately, the patched `/workflow` text says Step 0 "asks the team-count, cross-team-dependency, phase-gate, and consumer-migration questions (plus an epic-count signal)", which slightly overstates what Step 0 asks. This is not an AC deviation (AC1 only requires a signal in the scoring table) but it is the main reason AC2 and AC3 need a real run. Tag: `/improve` candidate.
2. **The mirror module can drift from the skill text.** `step0-scorer.js` hard-codes the six signals; the test checks the SKILL.md row with a regular expression but never compares the two. If someone edits the table, the mirror and its AC2 and AC3 tests keep passing. Tag: `/improve` candidate.
3. **Pre-existing mojibake on the line the patch added to `/orient`.** The new line 167 contains the byte sequence for a mis-decoded em dash (displayed as "ÔÇö") where an em dash was intended. The same corruption already existed in 47 other lines of that file before this PR (the merged file has 48), so the patch followed an existing defect rather than introducing a new class of one. Cosmetic only; the wording and the `/programme` reference are intact.
4. **The "If none of these apply" text in Step 0 was left unchanged.** It still reads "This looks like a single-team feature with multiple epics - the standard pipeline is the right fit". With the new signal, a single-team feature with 4 or more epics now qualifies, so that sentence is only accurate for fewer than 4 epics. Not an AC deviation.
5. **Verification limits of this DoD.** Not verified: CI results on PR #1065, any live or real-agent run of the patched skills, the manual /orient reading scenario, and the contents of the DoR sign-off beyond its contract's touch-point list.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Patch /programme and /workflow for the gaps story 1 (and the discovery-correction) found".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
