# Definition of Ready Checklist

## Definition of Ready: Client-side reconnect-on-resume for a dropped SSE turn, with idempotent server-side replay

**Story reference:** artefacts/2026-09-01-sse-reconnect-on-resume/stories/srar-s1-idempotent-turn-reconnect.md
**Test plan reference:** artefacts/2026-09-01-sse-reconnect-on-resume/test-plans/srar-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-09-01

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 8 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: operator whose SSE turn is interrupted by Fly auto-suspend |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 8 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC6/AC7 via source-inspection (declared, not silently skipped) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Direct incident traceability, short-track |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None; does not overlap lpmf-s1/wsap-s1 |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Explicit no-replay-of-mid-stream-content constraint, 60s staleness window, and file-touch boundary stated |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ N/A | Security/performance covered inline in story |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See note** — same recurring short-track gap already logged this session for rssp-s1/sstr-s1/ssdo-s1/lpmf-s1/wsap-s1 | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction, choosing the reconnect-on-resume design over the lower-scope alternative. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter involved |
| H-INF | Infra-plan gate | ✅ N/A | fly.toml explicitly untouched per Out of Scope |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass — 15/15 (13 direct passes + 1 explicit N/A-with-note + 1 transparent GAP note).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W5 | No UNCERTAIN items in test plan gap table | ⚠️ | AC6/AC7 marked UNCERTAIN (source-inspection substitute, no DOM harness exists in this codebase for the embedded client script) | Operator — accepted given AC1-AC5's full server-side behavioural coverage of the contract the client relies on, and the client change reusing two simple, already-proven browser primitives |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Client-side reconnect-on-resume for a dropped SSE turn, with idempotent server-side replay — artefacts/2026-09-01-sse-reconnect-on-resume/stories/srar-s1-idempotent-turn-reconnect.md
Test plan: artefacts/2026-09-01-sse-reconnect-on-resume/test-plans/srar-s1-test-plan.md
DoR contract: artefacts/2026-09-01-sse-reconnect-on-resume/dor/srar-s1-dor-contract.md

Goal:
In src/web-ui/routes/skills.js's handlePostTurnStreamHtml: add an
attemptId-based idempotency guard (session._lastAttempt = {attemptId,
status, startedAt}) checked immediately after session lookup/SSE headers,
before existing turn-processing logic. A duplicate attemptId against a
'complete' status short-circuits to {done:true, resumed:true} with no LLM
call, no credit deduction, no duplicate turn push. A duplicate against an
'in-flight' status less than 60s old returns a distinct wait error. An
in-flight status older than 60s is treated as stale and proceeds as fresh.
No attemptId in the request body skips the guard entirely (backward
compatible). Mark 'complete' at exactly the two genuine success points
(ssp.1 precompute early-return, and the main end-of-function completion) --
do not touch any error/early-return exit path.

In the same file's embedded client sendTurn script: generate one
attemptId per logical turn (crypto.randomUUID(), with a fallback), send it
in the POST body, auto-retry exactly once on a stream failure that is not
"session-expired" (reusing the same attemptId, short fixed delay), and on
receiving evt.resumed, call window.location.reload() instead of trying to
render stream content.

Constraints:
- Do NOT touch htmlSubmitTurn (non-streaming handler) or fly.toml.
- Do NOT attempt to replay chunks/canvasBlock/assumptionCard content for a
  short-circuited duplicate -- the reload path handles reconstruction.
- Do NOT modify sstr-s1's pre-first-chunk retry logic or ssdo-s1's
  disconnect-logging listener -- both must keep passing their existing
  test files unmodified.
- Add tests/check-srar-s1-idempotent-turn-reconnect.js covering AC1-AC8.
- Run the full suite (node scripts/run-all-tests.js) and confirm no
  regressions.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — touches the same most-heavily-used streaming code path as sstr-s1/ssdo-s1, with genuine financial-correctness stakes (credit deduction) if the idempotency guard were wrong, but the design was deliberately narrowed to 3 small, well-isolated insertion points after ruling out a much larger full-replay approach, and AC1/AC5 give explicit regression coverage for every caller that doesn't opt into the new behaviour.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — requested directly in-session, 2026-09-01 (2026-08-31 in this session's earlier local time references), as the third and most complex of 3 findings blocking continued dogfooding; explicitly chose the fuller "client-side reconnect-on-resume" design over the lower-scope "recoverable-failure UX only" alternative after being shown the tradeoff.
