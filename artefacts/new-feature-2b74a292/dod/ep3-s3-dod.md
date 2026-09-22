# Definition of Done: Re-Sign-Off After Regression (Approval Record with Prior Context)

**PR:** https://github.com/heymishy/skills-repo/pull/917 | **Merged:** 2026-09-22 (merge commit `509367fd`)
**Story:** artefacts/new-feature-2b74a292/stories/ep3-s3.md
**Test plan:** artefacts/new-feature-2b74a292/test-plans/ep3-s3-test-plan.md
**DoR artefact:** artefacts/new-feature-2b74a292/dor/ep3-s3-dor.md
**Assessed by:** Claude
**Date:** 2026-09-22

---

## AC Coverage

- **AC1:** A new approval record is created linked to the original approval (`reApprovalOf`)
- **AC2:** The feature advances past the stage again — same transition as a first-time approval
- **AC3:** A new decisions.md entry describes the re-approval, distinct from (not overwriting) the regression entry

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/check-ep3-s3-reapproval.js` (12/12) — a real regress→revise→re-approve cycle producing a distinctly-titled entry (`"<stage> re-approved by <user>"`) whose context text explicitly references the prior regression | integration-real-code | AC1's literal `reApprovalOf` foreign key is impossible (no `feature_approvals` table exists anywhere in this codebase). The real, decisions.md-native equivalent: a backward scan of the append-only log itself for the most recent mention of this stage, distinguishing a regression entry from a prior approval entry. Both the spec-compliance reviewer (hand-traced against 3 scenarios including a tricky double-regression cycle) and the final cross-task reviewer (independently re-read the real AC1 benefit text against the actual entries produced) confirmed this genuinely satisfies AC1's real intent, not just a token substitute. |
| AC2 | ✅ | `tests/check-ep3-s3-reapproval.js`'s own AC2-substance assertion, plus independent code reading of `handlePostGateConfirm`/`completeStage`/`regressToStage` (no query, no branching on approval/regression history anywhere) | integration-real-code | **Zero new code.** The existing, unmodified `gate-confirm` mechanism (`ep2-s3`/pre-existing) already advances a regressed-then-revised stage through the exact same code path as a first-time completion — confirmed independently twice this session (at `/branch-setup` and again by the final cross-task reviewer), not merely assumed. |
| AC3 | ✅ | Same test — asserts the original approval entry and the regression entry are both byte-exact untouched after the re-approval write, and that the re-approval entry is content-distinct (different title verb, explicit regression reference), not just positionally distinct | integration-real-code | None. Trivially true by construction (append-only) for the "not overwriting" half; the "describing the re-approval and what changed" half required the real code change this story delivered. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. The one recorded deviation (AC1's field-name/mechanism substitution) is a substance-preserving correction against real, already-shipped architecture (the same class of deviation as every other story in this epic) — not a gap.

---

## Scope Deviations

None. Confirmed against the story's Out of Scope list: no differential approver-role requirement for re-approval (role resolution is identical for both paths — unchanged code), no approval-workflow branching based on prior regression beyond the audit-trail wording itself (no new gate, no new validation step, no conditional logic in `gate-confirm`).

---

## Test Plan Coverage

**Tests from plan implemented:** 1 dedicated test file (`check-ep3-s3-reapproval.js`), consolidating the test plan's own 11-test breakdown (3 unit + 3 integration + 2 E2E + 3 NFR) into 2 real end-to-end scenarios (a first-approval control case, and a full real regress→re-approve cycle) — appropriate given this story's real gap was narrow (audit-trail wording only) and AC2 required no dedicated test at all (verified by code reading, matching this session's established scoping discipline for stories with independently-confirmed zero-new-code claims).
**Tests passing:** 12/12, re-run fresh against merged master in this session. Full `npm test` on merged master (commit `509367fd`): **695 files run, 1 failed** (`tests/check-p3.5-validate-trace.js` — the same pre-existing, unrelated Windows-local `python3` shim permission issue noted in `ep3-s1-dod.md` and `ep3-s2-dod.md`, reconfirmed here for the fourth time this session).

| Test file | AC(s) covered | Passing | Notes |
|-----------|---------------|---------|-------|
| `check-ep3-s3-reapproval.js` | AC1, AC2 (substance), AC3 | ✅ 12/12 | Scenario A: first-approval control case (no false-positive re-approval marking). Scenario B: real regress→re-approve cycle via the actual `handlePostJourneyRegress`/`handlePostJourneyApprove` handlers, not hand-seeded mocks |

**Gaps (tests not implemented):** The double-regression-cycle scenario (approve→regress→re-approve→regress again→approve a third time) is verified correct by two independent hand-traces (spec-compliance reviewer, code-quality reviewer) but has no dedicated automated test — both reviewers independently assessed this as non-blocking for a Complexity-1/Low-oversight story, since the loop's break-on-first-match logic means it exercises the identical code path as the already-tested single cycle, not new logic. Recorded here rather than silently omitted.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Re-approval is treated identically to a first approval in terms of state advance | ✅ | Verified by direct code reading (no branching in `handlePostGateConfirm`) — `integration-real-code`. This NFR is really a restatement of AC2; no separate evidence needed beyond AC2's own. |
| Prior approval and re-approval are linked in audit trail | ✅ | `check-ep3-s3-reapproval.js`'s title-pattern and context-text assertions — `integration-real-code` |

---

## Metric Signal

This feature's benefit-metric artefact (`artefacts/new-feature-2b74a292/benefit-metric.md`) uses directional success indicators rather than a structured Tier 1 `metrics[]` array — no `metrics` entry exists in `pipeline-state.json` for this feature to update.

| Indicator | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Reversibility with audit trail ("...have both the regression and the re-approval recorded in the audit trail") | ✅ (baseline: 0 — no regression or re-approval linkage existed before this epic) | Not yet measured | This story closes the epic's own stated loop ("regress → revise → re-approve → move forward") — all three constituent stories (`ep3-s1` regression, `ep3-s2` regression audit entry, `ep3-s3` re-approval audit entry) are now shipped and verified working together. No real beta-team full-cycle usage has occurred yet to observe the target. Signal: `not-yet-measured`. Evidence note: the full regress→revise→re-approve mechanism is now completely shipped and verified end-to-end (all 3 stories); awaiting first real beta-team use of the complete cycle. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 3 ACs satisfied with `integration-real-code` evidence throughout (no rendered UI exists for this story — `decisions.md` is a file artefact, never displayed in this app's own UI, so no live-browser-check gate applies). One recorded deviation (AC1's `reApprovalOf` field-name substitution), substance-preserving and independently re-confirmed correct by 3 separate reviewer passes (spec-compliance, code-quality, final cross-task). Zero scope violations. One documented, non-blocking test gap (the double-regression-cycle scenario), verified correct by code reading rather than automated test, explicitly recorded rather than silently omitted.

**This closes the `reversibility-audit-trail` epic.** All 3 stories (`ep3-s1`, `ep3-s2`, `ep3-s3`) are now merged and DoD-complete.

**Follow-up actions:**
1. None blocking.
2. Optional, low-priority: add the double-regression-cycle test scenario noted in Test Plan Coverage above, if a future `/improve` pass wants full automated coverage of that edge case rather than relying on the two independent hand-traces already on record.
3. `/improve` candidate (carried forward from `ep3-s1-dod.md` and `ep3-s2-dod.md`): this epic's own DoR-vs-real-architecture gap recurred in all 3 of its stories (7th, 8th, 9th occurrences feature-wide). A `/definition`-time cross-story dependency check — verifying a new story's assumed architecture against what sibling stories in the SAME epic already shipped, not just against the DoR's own imagined system — would likely have caught most of this earlier.

---

## DoD Observations

1. **This is the epic's cleanest example of proportionate scoping**: Complexity-1/Low-oversight rating, and the delivered scope matched that rating exactly — one real, narrow gap (audit-trail wording), zero new files, zero new data structures, ~30 lines of additive-only code. No task was over-built relative to the story's real (as opposed to DoR-assumed) complexity.
2. **Every review round in this story added independently-verified value, not rubber-stamping**: the spec-compliance reviewer didn't just confirm the string literals matched — it hand-traced a tricky 3-cycle edge case and verified the append-only-write precondition the whole approach depends on. The code-quality reviewer formed its own opinion on whether that same edge case needed a test, rather than deferring to the spec reviewer's own assessment. The final cross-task reviewer independently re-read `handlePostGateConfirm` itself rather than trusting the `decisions.md` investigation's own claim, and independently re-read the story's actual benefit text against the actual shipped entries rather than accepting the design's own stated rationale. This is a strong empirical case that this feature's two-stage-review-plus-final-review discipline produces real, non-redundant scrutiny at every stage, not diminishing-returns process overhead — worth citing directly in a future `/improve` pass as a positive data point.
3. **The epic as a whole (`ep3-s1`/`ep3-s2`/`ep3-s3`) is a strong worked example of the same underlying lesson repeating with decreasing severity**: `ep3-s1` needed a corrected DoR AND caught a real functional bug live; `ep3-s2` needed a corrected DoR and delivered zero new code (fully subsumed by `ep3-s1`); `ep3-s3` needed a corrected DoR and delivered a narrow, well-scoped real gap. Each story's own upfront architecture investigation got more efficient as the pattern became familiar within this session — worth noting as a real, observed learning-curve effect within a single delivery session, not just across sessions.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep3-s3 (Re-Sign-Off After Regression).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
