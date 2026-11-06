# Definition of Done: /workflow reconciles merged-but-no-DoD stories against live GitHub, not just pipeline-state.json

**PR:** https://github.com/heymishy/skills-repo/pull/1055 | **Merged:** 2026-11-06
**Story:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s4-dod-handoff-reconciliation.md
**Test plan:** artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s4-test-plan.md
**DoR artefact:** artefacts/2026-11-04-inner-loop-cycle-efficiency/dor/ilce-s4-dor.md
**Assessed by:** Claude (Sonnet 5)
**Date:** 2026-11-06

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `crossReferenceStories matches a story prUrl against a real merged PR` (unit); **live-verified** — ran `runReconciliationCheck` against this repo's real `pipeline-state.json` on master, 2026-11-06, with no mocking of the `gh` call | unit → live-verified | None |
| AC2 | ✅ | `findReconciliationGaps flags a gap when live-merged story has a non-merged prStatus`; **live-verified and spot-checked**: the live run found `inc5` (prUrl → PR #389) flagged as a `live-reconciliation` gap; confirmed via `gh pr view 389` that PR #389 is genuinely `MERGED` (2026-06-17) while `pipeline-state.json` still reads `prStatus: "draft"` — a real, not hypothetical, instance of the exact ADR-030 corruption pattern | unit → live-verified, spot-checked against real GitHub state | None |
| AC3 | ✅ | `workflow SKILL.md wires the reconciliation check in before the status table` (position-based content test) | unit | None |
| AC4 | ✅ | `runReconciliationCheck does not throw when gh call throws` / `falls back to pipeline-state-only gaps` | unit | None |
| AC5 | ✅ | `runReconciliationCheck finds every real merged-but-no-DoD story in this repo's own pipeline-state.json` (dynamically computed, not hardcoded); **live-verified — exceeded the original scope**: see DoD Observations | unit → live-verified | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

---

## Scope Deviations

None in the merged diff. Per the DoR's explicit constraints: no new scheduled CI job was built (confirmed — no `.github/workflows/` changes in this PR), and this story did not retroactively resolve any part of the existing backlog (confirmed — `git diff` on `pipeline-state.json` for this PR only touches `ilce-s4`'s own bookkeeping fields, no other story's `prStatus`/`dodStatus`).

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 18 / 18 (fresh run, `node tests/check-ilce-s4-dod-handoff-reconciliation.js`)

All 18 tests pass — see `ilce-s4`'s own `/verify-completion` record for the full per-test breakdown; not repeated here for brevity since nothing has changed since that gate.

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: `gh pr list` call doesn't meaningfully slow `/workflow` | ✅ | `runReconciliationCheck with a mocked gh call completes in well under a second` test; the real live run against this repo's actual history (819 stories, hundreds of PRs) also completed in well under a second |
| Security: uses operator's own `gh` auth | ✅ | Confirmed — no new credentials introduced, `defaultExecGhPrList` shells out using the ambient `gh` CLI session |

---

## Metric Signal

**[Metric 3] (Metric 3 — New occurrences of the merged-but-no-DoD gap, `pipeline-state.json`'s `m3`)**
Measurement-ready: **yes**
Signal: **off-track** (for the pre-existing backlog specifically — see note)
Evidence: Live run on 2026-11-06 found 10 `pipeline-state-only` gaps (the kind Metric 3's original baseline measured) and, more significantly, 20 additional `live-reconciliation` gaps — stories where `pipeline-state.json`'s own `prStatus` has silently diverged from a real, confirmed GitHub merge (the ADR-030 corruption pattern), spot-checked and confirmed real via `gh pr view`. Metric 3's target ("0 new occurrences among stories merged after this feature ships") is specifically about *new* occurrences going forward, not this pre-existing backlog — the mechanism correctly found the backlog, which is the detection working as designed, not the metric itself being off-track for new work. No story has yet merged *after* this mechanism existed to test the forward-looking "0 new occurrences" claim; that is the actual not-yet-measured piece.
Date measured: 2026-11-06

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. **(Operator action, not this story's scope)** The live reconciliation run found a confirmed 20 additional stories with a stale/corrupted `prStatus` beyond the originally-known 22 merged-but-no-DoD stories — a materially larger backlog than anticipated, discovered directly by this story's own mechanism working as designed. This story's explicit DoR scope excludes resolving this backlog; flagging here per DoD's own "flags what needs follow-up for humans to action" rule. A dedicated cleanup pass (reconciling `prStatus` for all 20 `live-reconciliation` stories, then assessing DoD status for the full resulting set) is recommended as a near-term priority, given the scale.

---

## DoD Observations

1. **This DoD run itself is the first live exercise of `ilce-s4`'s own mechanism**, and it worked correctly and found real, confirmed, previously-unknown corruption (not a test artifact) — `inc5`/PR #389 spot-checked directly against GitHub. This is strong evidence the story does exactly what it was built to do.
2. **The backlog this mechanism found is substantially larger than the "22" figure the story's own AC5 was written against.** The original 22 (frozen 2026-11-04) was computed via the simpler, pre-existing `prStatus === 'merged' && dodStatus !== 'complete'` check — the "pipeline-state-only" detection path. The new "live-reconciliation" path (ADR-030's own corruption detection, never built or run before this story) found 20 *additional* stories where `prStatus` itself was wrong, not just `dodStatus` — a materially larger and more severe finding than the backlog this story was originally scoped against. This is not a defect in the story; it is the mechanism successfully detecting a class of problem that was, by definition, invisible to every prior check (including the original 22-story audit itself, which could only ever see what `pipeline-state.json` self-reported).
3. `/improve` candidate: given the scale of the live-reconciliation findings, this repo's own pipeline-state.json may benefit from a one-time full reconciliation sweep (not scoped to this story) before relying on Metric 3's "0 new occurrences" framing going forward — the metric's baseline context has shifted materially as a direct result of this story's own delivery.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "/workflow reconciles merged-but-no-DoD stories against live GitHub, not just pipeline-state.json".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Given the live run found a 20-story backlog beyond what was originally scoped, should this DoD remain COMPLETE, or should the newly-discovered backlog size itself be treated as a blocking finding pending a human decision on priority?
Report findings as HIGH / MEDIUM / LOW.
```
