# Definition of Ready Checklist

## Definition of Ready: Add the missing session_turns durable write to the non-streaming turn handler

**Story reference:** artefacts/2026-09-12-nonstream-turn-persist-gap/stories/ntpg-s1-add-session-turns-write-to-nonstream-handler.md
**Test plan reference:** artefacts/2026-09-12-nonstream-turn-persist-gap/test-plans/ntpg-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-12

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "pipeline operator relying on the resume/view-completed-stage feature" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 5/5 (AC1 has 2 tests) |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Restores `dsh-s1`'s own AC1 guarantee |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — reuses the exact `writeSessionTurns` call already proven correct by `dsh-s1`'s own tests, same non-fatal `.catch()` convention |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Backend persistence logic, not CSS-layout-dependent |
| H-NFR | NFR profile or explicit "None" field | ✅ | Matches `dsh-s1`'s own NFRs exactly (performance, security) |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No feature-level NFR profile — short-track |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter — reuses the existing `session-turns-pg.js` adapter `dsh-s1` already built and D37-compliant, just adds a second real call site to it |
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
| W4 | Verification script reviewed by a domain expert | ✅ N/A | No manual verification script required — fully covered by automated tests, including a real end-to-end AC4 check | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Standards injection

**Domain tags:** `[web-ui, data]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add the missing session_turns durable write to the non-streaming turn handler — artefacts/2026-09-12-nonstream-turn-persist-gap/stories/ntpg-s1-add-session-turns-write-to-nonstream-handler.md
Test plan: artefacts/2026-09-12-nonstream-turn-persist-gap/test-plans/ntpg-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- The ENTIRE change is scoped to htmlSubmitTurn in src/web-ui/routes/skills.js. Do NOT touch handlePostTurnStreamHtml's own already-correct write.
- Reuse writeSessionTurns from src/web-ui/adapters/session-turns-pg.js exactly as handlePostTurnStreamHtml already does -- same non-fatal .catch(), same DATABASE_URL guard, same turns-array-plus-completing-turn shape.
- Re-run tests/check-dsh-s1-persist-session-turns.js and every other test file that exercises htmlSubmitTurn/handlePostTurnHtml unmodified -- all must still pass, confirming zero regression.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — small, well-scoped fix reusing an already-tested adapter; operator explicitly requested this investigation and fix be pursued)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-12

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
