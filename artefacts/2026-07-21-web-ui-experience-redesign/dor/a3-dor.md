## Definition of Ready: Compute health per-feature, distinct from test coverage

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a3-per-feature-health-signal.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a3-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-21

---

**CONTRACT REVIEW:** ✅ Passed with an explicit caveat — AC2a has no concrete test approach yet, honestly stated in the contract itself rather than papered over. This is not a mismatch (the contract accurately reflects the story's own acknowledged gap), so contract review passes, but see the H8 note below.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | |
| H2 | ≥3 ACs Given/When/Then | ✅ | 5 (AC1, AC2, AC2a, AC3, AC4) |
| H3 | Every AC has at least one test | ⚠️→✅ | AC2a has no concrete test yet — explicitly acknowledged as a gap in the test plan's Coverage gaps table, satisfying H3's "or gaps explicitly acknowledged" clause |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage references named metric | ✅ | |
| H6 | Complexity rated | ✅ | Rating 3 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 2 PASS (Run 1's 2 HIGH findings fixed) |
| H8 | No uncovered ACs (or gaps acknowledged) | ✅ | AC2a's gap is explicitly named, reasoned, and has a resolution path (concretize once investigation done) |
| H9 | Architecture Constraints populated | ✅ | Fixed for clarity in Run 2 (garbled text removed) |
| H-E2E | N/A | ✅ | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | N/A | ✅ | |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-GOV | Approved By populated | ✅ | |
| H-ADAPTER | N/A | ✅ | Extends an existing computation, introduces no new adapter |

**All hard blocks pass — with H3/H8's caveat noted explicitly, not silently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Declared as **Unstable** — the investigation may reveal the real computation is more complex than expected | Operator aware; this is the story's own stated risk, not new |
| W3 | MEDIUM findings acknowledged | ✅ | Run 2's 1 MEDIUM (AC2a placeholder needing concretization) is the direct subject of this DoR's H3/H8 notes above — treated as a named pre-check, not silently dropped | Logged here, in the DoR artefact itself |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed; also has a manual gap (🔴) matching AC2a | Operator to review before assigning |
| W5 | No uncertain gap items | ⚠️ | AC2a is an explicit, acknowledged UNCERTAIN item | Accepted — this is the single most honestly-flagged uncertainty in the whole feature, not a hidden one |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Compute health per-feature, distinct from test coverage — artefacts/2026-07-21-web-ui-experience-redesign/stories/a3-per-feature-health-signal.md
Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a3-test-plan.md

Goal:
Your FIRST task is the investigation named in the story's Architecture
Constraints: trace exactly what input computeHealthCounts reads from
pipeline-state.json today. Document your findings in a PR comment before
writing any implementation code. Once the real per-feature health signal
source is determined, concretize AC2a with a real test asserting the
correct rule -- do not leave AC2a as the placeholder inequality-only
assertion from the current test plan. Only after AC2a is concretized and
passing should this story be considered complete.

Constraints:
- This is a backend-only story -- no UI rendering (that's a separate story, A4).
- The change must be additive: existing aggregate health_counts consumers
  (e.g. the "Feature health" gauge) must continue to work unchanged (AC3).
- Any new JSONB parsing must use the defensive _parseJsonbField pattern
  already established in this repo (products.js), not a naive JSON.parse.
- Open a draft PR when tests pass -- do not mark ready for review.
- If the investigation reveals the real computation is substantially more
  complex than this story's Complexity Rating (3) anticipates, stop and
  add a PR comment describing what you found -- do not silently expand
  scope or skip AC2a's concretization.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only. Given the Unstable scope stability, the operator should check in once the investigation completes, before the coding agent proceeds to implement AC2a.
**Signed off by:** Hamish King (Founder/Operator) — awareness confirmed, with the above check-in expectation noted
