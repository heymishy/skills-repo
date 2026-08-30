# Definition of Ready Checklist

## Definition of Ready: Retry an LLM stream call once when it fails before any content has streamed

**Story reference:** artefacts/2026-08-31-sse-timeout-retry-resilience/stories/sstr-s1-retry-on-pre-first-chunk-failure.md
**Test plan reference:** artefacts/2026-08-31-sse-timeout-retry-resilience/test-plans/sstr-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-31

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: operator running a skill session |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 concrete exclusions, each with its own reason |
| H5 | Benefit linkage field references a named metric | ✅ | Direct resilience fix, short-track (no formal benefit-metric artefact) |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 findings |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Unusually thorough given blast radius — exact safety invariant named and traced through `skill-turn-executor.js` |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-08-31-sse-timeout-retry-resilience/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See note** — same recurring short-track gap noted across this session's other short-track stories | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction, made after reviewing the proposed retry design and its accepted latency trade-off. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No new injectable adapter — reuses the existing `setSkillTurnExecutorStreamAdapter` test seam already in place |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 18/18 (16 direct passes + 1 explicit N/A + 1 transparent GAP note).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Every AC is automated via the real-render harness; no manual verification script needed | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan's Coverage gaps section is "None"; Out of Scope names the one real untestable thing (a genuine live Anthropic timeout) with a justified substitute | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Retry an LLM stream call once when it fails before any content has streamed — artefacts/2026-08-31-sse-timeout-retry-resilience/stories/sstr-s1-retry-on-pre-first-chunk-failure.md
Test plan: artefacts/2026-08-31-sse-timeout-retry-resilience/test-plans/sstr-s1-test-plan.md
DoR contract: artefacts/2026-08-31-sse-timeout-retry-resilience/dor/sstr-s1-dor-contract.md

Goal:
Wrap the existing streaming try/catch in skills.js (~line 4778-5086) in a
for(;;) loop. On a pre-first-chunk failure (_ttfbMs === null) on the first
attempt, retry once (continue the loop). On a second failure, or any failure
after content has streamed (_ttfbMs !== null), fall through to the existing
error handling -- but first pop the dangling user turn from session.turns.
Emit an sse_retry_succeeded log event when a retry recovers.

Constraints:
- Do NOT retry more than once, ever.
- Do NOT retry once _ttfbMs is non-null (content already streamed) -- this
  is the critical safety boundary, not a style preference.
- Do NOT extract the try body into a separate function -- wrap it in place
  to keep the diff minimal against this large, deeply-coupled block.
- Do NOT change DEFAULT_TIMEOUT_MS or any timeout/backoff configuration.
- Reuse the existing setSkillTurnExecutorStreamAdapter test seam -- do not
  add a new adapter.
- Run the full suite (node scripts/run-all-tests.js) and confirm no
  regressions -- this touches a heavily-used, critical-path function.
- Open a draft PR when tests pass -- do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — touches the single most heavily-used code path in the application (the core turn-streaming SSE handler); low behavioral surface area per-change, but high usage volume means any regression would be immediately and broadly felt.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — reviewed the proposed retry design, the safety invariant it relies on, and the accepted worst-case latency trade-off directly in-session, 2026-08-31.
