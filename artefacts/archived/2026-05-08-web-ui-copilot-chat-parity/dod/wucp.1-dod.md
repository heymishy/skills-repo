# Definition of Done: Pipeline context auto-loader

**PR:** https://github.com/heymishy/skills-repo/pull/345 | **Merged:** 2026-05-08
**Story:** artefacts/archived/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.1-*.md
**Test plan:** artefacts/archived/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.1-test-plan.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (context.yml labelled in prompt) | ❌ | T1.3/T1.4 fail: "context.yml label must appear in prompt" | Automated test, re-run fresh 2026-08-17 | **Pre-existing, already documented — see below** |
| AC4 (learnings.md truncated at 50 lines) | ❌ | T1.10 fails: "line 51 must NOT appear in prompt (truncated at 50)" | Automated test, re-run fresh 2026-08-17 | **Pre-existing, already documented — see below** |
| Remaining ACs (workspace/state.json inclusion, artefact listing conditional on activeFeatureSlug, merge-gate doc existence) | ✅ | 16/20 assertions pass | Automated test, re-run fresh 2026-08-17 | None |

---

## Root cause / current state

`check-wucp1-context-autoloader.js` is already listed in `tests/known-baseline-failures.json` — this is a pre-existing, previously-accepted gap, not a new finding from this pass. Re-run fresh: **16/20 passing** (4 failures: T1.3, T1.4, T1.10, T1.17-integration). Note this differs from the `19/19` count previously recorded in `pipeline-state.json` — the test file itself appears to have grown (more assertions added, possibly by a later story extending context-autoloader coverage) since that count was last written; the current, accurate count is 20 total, 16 passing.

---

## Scope Deviations

**Real functional gaps, but already known and accepted:** `context.yml` is not being labelled/included in the auto-loaded prompt context (AC1), and `learnings.md` truncation at line 50 does not appear to be enforced (AC4). Both are documented in `tests/known-baseline-failures.json`. No new follow-up story created by this pass, consistent with how this session has handled other pre-existing, already-tracked baseline failures (`mfc1`, `wsm.2`).

---

## Test Plan Coverage

**Tests passing in CI:** 16/20, re-run fresh 2026-08-17 (previously recorded as 19/19 — count has since diverged, corrected here).
**Gaps:** AC1 (context.yml) and AC4 (learnings.md truncation) — both pre-existing, tracked in `known-baseline-failures.json`.

---

## NFR Status

No new NFR concerns identified in this pass.

---

## Metric Signal

No formal benefit-metric artefact traced in this pass beyond `wucp.0`'s own MM1 (tool-marker emission, unrelated to this story's own context-loading scope).

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- [Owner: Hamish King] If `context.yml` visibility and `learnings.md` truncation matter for current work, these are real, reproducible gaps worth a fresh look — not urgent, already accepted as known baseline issues for an unknown duration.

---

## DoD Observations

1. **`pipeline-state.json`'s recorded `19/19` was stale** — the real, current test file has grown to 20 assertions with 4 now failing. This is worth flagging as a general pattern: recorded test counts in `pipeline-state.json` can drift from the actual test file's own evolution over time if not re-synced, independent of whether the story's own code has changed.
