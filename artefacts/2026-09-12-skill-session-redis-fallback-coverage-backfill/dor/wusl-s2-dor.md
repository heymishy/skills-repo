# Definition of Ready Checklist

## Definition of Ready: Dedicated Redis-fallback tests for the 5 remaining wusl-s1 call sites

**Story reference:** artefacts/2026-09-12-skill-session-redis-fallback-coverage-backfill/stories/wusl-s2-dedicated-tests-for-remaining-handlers.md
**Test plan reference:** artefacts/2026-09-12-skill-session-redis-fallback-coverage-backfill/test-plans/wusl-s2-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-12

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "a developer maintaining src/web-ui/routes/skills.js" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs (a 5th target, `htmlRecordAnswer`, was confirmed dead code during preparation and dropped — see story's Out of Scope) |
| H3 | Every AC has at least one test in the test plan | ✅ | 4/4 |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Restores `wusl-s1`'s own original test-plan ambition, references its own named Follow-up Action #1 |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — reuses the exact test harness/stub pattern already established in `check-wusl-s1-session-redis-fallback.js` and `check-mfc1-model-first-chat-session.js` |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Backend-only, test-only story |
| H-NFR | NFR profile or explicit "None" field | ✅ | All explicitly "N/A — test-only change" |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No feature-level NFR profile — short-track |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter — reuses `setSkillSessionRedisAdapter`/`setSkillTurnExecutorAdapter`/`setSkillTurnExecutorStreamAdapter`, all already built and D37-compliant |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track, no review | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Test-only story, fully self-verifying (tests either pass or fail) | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Standards injection

**Domain tags:** `[web-ui, data]`
**Matched standards files:** none additional beyond `wusl-s1`'s own already-matched set

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Dedicated Redis-fallback tests for the 5 remaining wusl-s1 call sites — artefacts/2026-09-12-skill-session-redis-fallback-coverage-backfill/stories/wusl-s2-dedicated-tests-for-remaining-handlers.md
Test plan: artefacts/2026-09-12-skill-session-redis-fallback-coverage-backfill/test-plans/wusl-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Test-only story -- do NOT modify src/web-ui/routes/skills.js.
- Reuse makeStubRedisAdapter/setSkillSessionRedisAdapter from tests/check-wusl-s1-session-redis-fallback.js's own pattern exactly.
- Stub setSkillTurnExecutorAdapter/setSkillTurnExecutorStreamAdapter for handlers that call the executor -- do not let a real/crashing executor run.
- Re-run tests/check-wusl-s1-session-redis-fallback.js unmodified -- all 7 tests must still pass.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — test-only story adding coverage using an already-proven pattern, operator explicitly requested this backlog item be worked)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-12

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
