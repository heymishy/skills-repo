# Definition of Done: Classify the 5 journey-related E2E seed endpoints as redundant or legitimate

**PR:** https://github.com/heymishy/skills-repo/pull/1045 | **Merged:** 2026-10-30
**Story:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s4-journey-seed-endpoint-classification.md
**Test plan:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s4-journey-seed-endpoint-classification-test-plan.md
**DoR artefact:** artefacts/2026-10-30-test-fixture-hardening-continuation/dor/tfhc-s4-dor.md
**Assessed by:** Copilot
**Date:** 2026-10-31

**Note on timing:** this DoD was run after `tfhc-s7`/`tfhc-s8`'s own DoDs, not immediately after `tfhc-s4`'s own merge — it was missed when the session moved directly from the post-merge CI investigation into `tfhc-s7`/`tfhc-s8`'s inner loop. Caught and corrected before scoping any further work, per this session's own "no silent gaps" discipline.

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `node tests/check-tfhc-s4-journey-seed-classification.js` → 9/9 passed, re-run fresh on merged master; all 5 endpoints carry an explicit verdict, independently re-spot-checked against `src/web-ui/server.js`'s real line numbers (2598, 2663 — unchanged) | integration-real-code | None |
| AC2 | ✅ N/A | Zero endpoints marked redundant — correctly trivially satisfied, confirmed by the self-check's own AC2 test | integration-real-code | None |
| AC3 | ✅ | Classification artefact's closing statement ("No endpoint was found redundant... no further action required") re-confirmed present, fresh | integration-real-code | None |
| AC4 | ✅ | `benefit-metric.md` Metric 4's own "Measurement method" row references the real artefact path, re-confirmed present, fresh | integration-real-code | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

No deviations found on re-verification.

---

## Scope Deviations

None. The 8 non-journey-related `/test/seed-*` endpoints were confirmed untouched; no endpoint was consolidated or modified — this remained a read-only investigation throughout, confirmed by `git diff` against the epic's own `src/` boundary (zero production code changes).

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (AC1 has 2 cases; AC2/AC3/AC4 have 1 each)
**Tests passing in CI:** 5 / 5

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Classification artefact names all 5 endpoints with an explicit verdict | ✅ | ✅ | |
| If any endpoint marked redundant, a correctly-sized fast-follow is named | ✅ | ✅ N/A | Trivially satisfied — 0 endpoints found redundant |
| If no endpoint redundant, artefact explicitly closes the question | ✅ | ✅ | |
| Classification artefact saved at the path `benefit-metric.md` Metric 4 references | ✅ | ✅ | |

**Gaps (tests not implemented):** None — the test plan's own "Test Gaps and Risks" section names one honest, explicit gap: the classification's *substantive correctness* (whether the human judgment of "redundant" vs. "legitimate" is actually right) cannot be automated — that gap is handled by independent spot-checking against the real handler code, done at `/review`, `/verify-completion`, and again now at this DoD.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | One-time investigation, not a runtime concern |
| Security | ✅ N/A | None identified — read-only investigation |
| Accessibility | ✅ N/A | No UI |
| Audit | ✅ N/A | Not applicable |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Journey-seed-endpoint classification completeness (m4) | ✅ | 2026-10-31 (now) | Baseline 0/5 classified; target 5/5 with a named verdict — now met |

**Measurement-ready gate:** Yes — measurement is possible now.

**Signal:** on-track
**Evidence:** All 5 journey-related `/test/seed-*` endpoints classified with an explicit "Legitimately different" verdict, each grounded in direct reads of the real handler code (`src/web-ui/server.js`) and real E2E spec callers — re-confirmed fresh on merged master via the self-check (9/9 pass) and a direct spot-check of 2 of the 5 endpoints' cited line numbers. Zero endpoints found redundant; the artefact's closing statement explicitly states this and closes the question per AC3. This exactly meets the minimum validation signal ("all 5 classified with a concrete verdict").
**Date measured:** 2026-10-31

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required by this story itself. The investigation's own feedback-loop condition ("if the classification reveals a genuinely large hidden problem... log an `/improve` candidate") did not trigger — the classification confirmed the narrowed "5 journey-related endpoints" framing was accurate, closing the question rather than surfacing a new one.

---

## DoD Observations

1. **This DoD itself is the observation worth recording.** `tfhc-s4` merged on 2026-10-30, but its own `/definition-of-done` was not run until 2026-10-31, after `tfhc-s7` and `tfhc-s8` had already reached DoD — a genuine sequencing gap in this session's own execution, not a defect in `tfhc-s4`'s implementation. It was caught because the epic-completion check (recomputing `epic.status` after `tfhc-s8`'s own DoD write) surfaced that `tfhc-s4` was still at `stage: "branch-complete"` with no `dodStatus` set, rather than silently assuming the epic was fully done. `/improve` candidate: this is the same general class of risk CLAUDE.md's short-track DoD gap already documents ("no short-track story in this repo's history had ever reached DoD... an undocumented gap rather than an intentional exemption") — worth considering whether a lightweight, automatic "list stories merged but not yet DoD-complete" check at the start of any `/definition-of-done` invocation would catch this class of gap earlier, rather than relying on the epic-completion recompute to surface it incidentally.
2. All substantive verification work for this story (the classification's own correctness, independently spot-checked against real code by multiple reviewers across `/review`, `/subagent-execution`, and `/verify-completion`) was already done rigorously at the time — this gap was purely about the DoD *bookkeeping step* not running, not about the underlying work being unverified.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Classify the 5 journey-related E2E seed endpoints as redundant or legitimate.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
