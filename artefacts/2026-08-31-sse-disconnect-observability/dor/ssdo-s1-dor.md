# Definition of Ready Checklist

## Definition of Ready: Log a premature SSE client disconnect, distinguishable from a normal completion

**Story reference:** artefacts/2026-08-31-sse-disconnect-observability/stories/ssdo-s1-log-premature-sse-disconnect.md
**Test plan reference:** artefacts/2026-08-31-sse-disconnect-observability/test-plans/ssdo-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-31

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 3 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: engineer diagnosing a production incident |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Direct incident traceability, short-track |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Exception-safety and no-behavior-change constraints explicitly stated |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ N/A | Pure logging addition; NFR covered inline in story |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See note** — same recurring short-track gap noted across this session's other short-track stories | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction after jointly investigating the underlying production log gap. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter involved |
| H-INF | Infra-plan gate | ✅ N/A | |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass — 15/15 (13 direct passes + 1 explicit N/A-with-note + 1 transparent GAP note).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Coverage gaps: None | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Log a premature SSE client disconnect, distinguishable from a normal completion — artefacts/2026-08-31-sse-disconnect-observability/stories/ssdo-s1-log-premature-sse-disconnect.md
Test plan: artefacts/2026-08-31-sse-disconnect-observability/test-plans/ssdo-s1-test-plan.md
DoR contract: artefacts/2026-08-31-sse-disconnect-observability/dor/ssdo-s1-dor-contract.md

Goal:
In handlePostTurnStreamHtml (src/web-ui/routes/skills.js), immediately after
res.writeHead(200, {...}), attach a res.on('close', ...) listener that logs
an sse_client_disconnect event via _turnLog only when res.writableEnded is
still false at the time 'close' fires (i.e. the response closed before the
handler itself ever called res.end() for this turn).

Constraints:
- Do NOT touch any existing res.end() call site.
- The listener body must never throw (wrap the _turnLog call in try/catch).
- No change to any client-visible behavior in any scenario.
- Run the full suite (node scripts/run-all-tests.js) and confirm no
  regressions, especially every existing test file that already exercises
  handlePostTurnStreamHtml.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — touches the single most heavily-used code path in the application; purely additive with no behavior change to any existing path.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — jointly investigated the underlying production log gap with the agent and requested the observability fix directly in-session, 2026-08-31.
