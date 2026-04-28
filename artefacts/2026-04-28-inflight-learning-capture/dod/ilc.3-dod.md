# Definition of Done: Update `/checkpoint` to bridge `capture-log.md` entries to `workspace/learnings.md`

**PR:** https://github.com/heymishy/skills-repo/pull/203 | **Merged:** 2026-04-28
**Story:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.3.md
**Test plan:** artefacts/2026-04-28-inflight-learning-capture/test-plans/ilc.3-test-plan.md
**DoR artefact:** artefacts/2026-04-28-inflight-learning-capture/dor/ilc.3-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `checkpoint-bridge-instruction-present`, `checkpoint-bridge-reports-count` — bridge instruction present; count-reporting language confirmed | automated test (check-ilc3-checkpoint-bridge.js) | None |
| AC2 | ✅ | `checkpoint-presents-signal-type`, `checkpoint-presents-signal-text` — bridge instruction references both `signal-type` and `signal-text` fields for operator review | automated test | None |
| AC3 | ✅ | `checkpoint-promotion-target-learnings-md`, `checkpoint-promotion-preserves-date-session-phase` — bridge instruction names `workspace/learnings.md` as promotion target; requires `date` and `session-phase` in promoted entries | automated test | None |
| AC4 | ✅ | `checkpoint-no-new-captures-message`, `checkpoint-boundary-uses-last-updated` — bridge specifies "No new captures to promote" message for zero-entry case; session boundary uses `lastUpdated` from `workspace/state.json` | automated test | None |
| AC5 | ✅ | `checkpoint-skip-non-blocking`, `checkpoint-skip-path-present` — bridge instruction states skipping is non-blocking and proceeds to state-write without modification | automated test | None |

**Deviations:** None.

---

## Scope Deviations

None. The implementation modifies only the `/checkpoint` convention block in `copilot-instructions.md`. No changes to state-write flow, no deletion of `capture-log.md` entries, no promotion target other than `workspace/learnings.md`.

---

## Test Plan Coverage

**Tests from plan implemented:** 13 / 13 total
**Tests passing in CI:** 13 / 13 implemented

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| checkpoint-bridge-instruction-present | ✅ | ✅ | AC1 |
| checkpoint-bridge-reports-count | ✅ | ✅ | AC1 |
| checkpoint-no-new-captures-message | ✅ | ✅ | AC4 |
| checkpoint-presents-signal-type | ✅ | ✅ | AC2 |
| checkpoint-presents-signal-text | ✅ | ✅ | AC2 |
| checkpoint-promotion-target-learnings-md | ✅ | ✅ | AC3 |
| checkpoint-promotion-preserves-date-session-phase | ✅ | ✅ | AC3 |
| checkpoint-non-blocking-no-capture-log | ✅ | ✅ | AC4, NFR non-blocking |
| checkpoint-boundary-uses-last-updated | ✅ | ✅ | AC4 |
| checkpoint-skip-non-blocking | ✅ | ✅ | AC5 |
| checkpoint-skip-path-present | ✅ | ✅ | AC5 |
| checkpoint-bridge-word-count-nfr | ✅ | ✅ | NFR (≤80 words; actual: 76) |
| checkpoint-bridge-in-checkpoint-section | ✅ | ✅ | Location check |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Non-blocking — if `workspace/capture-log.md` does not exist, `/checkpoint` completes normally | ✅ | `checkpoint-non-blocking-no-capture-log` passes; bridge instruction specifies skip message "capture-log.md not found — skipping capture review" |
| Idempotent — running `/checkpoint` twice without new captures must not produce duplicate promotions | ✅ | Session boundary mechanism uses `lastUpdated` from `workspace/state.json`; entries before last checkpoint timestamp are considered already reviewed; `checkpoint-boundary-uses-last-updated` passes |
| Instruction conciseness — bridge addition ≤80 words | ✅ | `checkpoint-bridge-word-count-nfr` passes; actual word count: 76 |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Signal loss rate (≤1 loss event across 3 consecutive sessions) | ✅ (5 loss events in April 2026 run) | After first 3 post-delivery sessions | Bridge is now active — new captures are surfaced at every `/checkpoint` before they can be lost to compaction |
| MM2 — `learnings.md` growth rate after delivery | ✅ (49 commits in April 2026) | Measurable now, growth rate tracked per session | Bridge directly enables operator to promote entries to `workspace/learnings.md` at each checkpoint |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. All 3 ilc stories are now DoD-complete. Monitor M1 over next 3 sessions; track MM2 growth rate going forward.

---

## DoD Observations

1. During TDD, the test `extractBridgeSection()` initially returned 1885 words (entire rest of file) because `workspace/capture-log.md` uses `\r\n` (Windows CRLF) — `text.indexOf('\n\n', start)` never matched. Fix applied: `fs.readFileSync(INSTRUCTIONS, 'utf8').replace(/\r\n/g, '\n')` normalisation added to all test readers. This is D22-class learning: any test reading `copilot-instructions.md` on Windows must normalise CRLF before string boundary searches. Candidate for `/improve` → standards note.
2. This is the third instruction-text story in the ilc epic. The CRLF normalisation pattern is now established in all 3 test suites. Future instruction-text test suites in this repo should copy this pattern.
