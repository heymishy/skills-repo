# Definition of Done: Weave agent self-recording instruction into `copilot-instructions.md` and key SKILL.md files

**PR:** https://github.com/heymishy/skills-repo/pull/201 | **Merged:** 2026-04-28
**Story:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.2.md
**Test plan:** artefacts/2026-04-28-inflight-learning-capture/test-plans/ilc.2-test-plan.md
**DoR artefact:** artefacts/2026-04-28-inflight-learning-capture/dor/ilc.2-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `self-recording-instruction-present`, `self-recording-imperative-wording` — `copilot-instructions.md` contains the agent self-recording rule with imperative language ("Write to `workspace/capture-log.md`") and `agent-auto` source label | automated test (check-ilc2-agent-selfrecord.js) | None |
| AC2 | ✅ | `skill-checkpoint-has-capture-reminder` through `skill-implementation-review-has-capture-reminder` — all 8 named SKILL.md files contain a capture reminder referencing `workspace/capture-log.md` | automated test (8 per-skill tests) | None |
| AC3 | ✅ | `agent-auto-entry-schema-complete` — synthetic agent-auto entry validates all 5 required fields (date, session-phase, signal-type, signal-text, source=agent-auto) present | automated test | None |
| AC4 | ✅ (automated portion) | `self-recording-captures-non-trivial-only` — instruction includes "non-trivial" qualifier; does not mandate capture for every step | automated test | Untestable portion (agent does not fabricate in routine sessions) is covered by manual scenario — pre-existing low-risk advisory from /review (finding 1-L1) |
| AC5 | ✅ | `skill-checkpoint-has-capture-reminder` through `skill-implementation-review-has-capture-reminder` — all 8 SKILL.md files (/checkpoint, /definition, /review, /test-plan, /definition-of-ready, /tdd, /systematic-debugging, /implementation-review) confirmed | automated test (8 tests) | None |

**Deviations:** None. The AC4 untestable portion (verifying the agent does not fabricate entries in routine sessions) was accepted as a low-risk advisory at /review and is covered by a manual verification scenario. This is a known limitation of instruction-text testing, not a delivery gap.

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 16 / 15 planned (1 additional imperative-wording test added during implementation)
**Tests passing in CI:** 16 / 16 implemented

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| self-recording-instruction-present | ✅ | ✅ | |
| self-recording-instruction-word-count | ✅ | ✅ | NFR (≤60 words) |
| self-recording-captures-non-trivial-only | ✅ | ✅ | AC4 automated portion |
| self-recording-imperative-wording | ✅ | ✅ | Added during implementation — strengthens AC1 evidence |
| self-recording-no-new-npm-dependencies | ✅ | ✅ | NFR |
| skill-checkpoint-has-capture-reminder | ✅ | ✅ | AC2, AC5 |
| skill-definition-has-capture-reminder | ✅ | ✅ | AC2, AC5 |
| skill-review-has-capture-reminder | ✅ | ✅ | AC2, AC5 |
| skill-test-plan-has-capture-reminder | ✅ | ✅ | AC2, AC5 |
| skill-definition-of-ready-has-capture-reminder | ✅ | ✅ | AC2, AC5 |
| skill-tdd-has-capture-reminder | ✅ | ✅ | AC2, AC5 |
| skill-systematic-debugging-has-capture-reminder | ✅ | ✅ | AC2, AC5 |
| skill-implementation-review-has-capture-reminder | ✅ | ✅ | AC2, AC5 |
| skill-capture-reminder-references-signal-types | ✅ | ✅ | AC2 quality check |
| agent-auto-entry-schema-complete | ✅ | ✅ | AC3 |
| skill-reminder-word-count | ✅ | ✅ | NFR (≤30 words per callout) |

**Gaps:** None. One unplanned test (`self-recording-imperative-wording`) was added to strengthen AC1 coverage — this is additive, not a gap.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Instruction hygiene — self-recording rule ≤60 words; SKILL.md callouts ≤30 words each | ✅ | `self-recording-instruction-word-count` passes (≤60 words); `skill-reminder-word-count` passes (all 8 callouts ≤30 words) |
| No new npm dependencies | ✅ | `self-recording-no-new-npm-dependencies` passes; 0 new production dependencies; implementation is instruction text only |
| Wording precision — instruction uses imperative language | ✅ | `self-recording-imperative-wording` passes; instruction uses "Write to `workspace/capture-log.md`" — not "consider" or "may" |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — In-session agent capture rate (≥80% sessions with ≥1 agent-auto entry) | ✅ (0% — no prior mechanism) | After first post-delivery session | Agent self-recording instruction is now active in `copilot-instructions.md` and all 8 SKILL.md files |
| MM1 — Agent vs operator capture ratio (≥80% agent-auto across 10 sessions) | ✅ (N/A — no prior captures) | After first 10 post-delivery sessions | Mechanism active; cumulative ratio measurable at each `/checkpoint` |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. Monitor M2 from next session; track MM1 after 10 sessions.

---

## DoD Observations

1. `pipeline-state.json` recorded `totalTests: 15` at PR open; actual implemented count is 16 (one imperative-wording test added during TDD). Corrected to 16 in this DoD pipeline-state update.
2. `acVerified` in pipeline-state was 0 at PR open time (not updated before PR was pushed). Corrected to 5 in this DoD run.
3. `prStatus` was absent from ilc.2 story entry in pipeline-state. Added as `"merged"` in this DoD run.
