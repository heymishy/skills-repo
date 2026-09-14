# Definition of Ready Checklist

## Definition of Ready: Eliminate stale-socket LLM call failures caused by Fly machine suspend/resume during a discovery session

**Story reference:** artefacts/2026-09-14-llm-agent-suspend-resume-fix/stories/lasr-s1-disable-keepalive-on-llm-agents.md
**Test plan reference:** artefacts/2026-09-14-llm-agent-suspend-resume-fix/test-plans/lasr-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator working through a /discovery (or any skill) chat session in the live web app" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 6/6, AC1/AC2 each get 2 tests (source + runtime) |
| H4 | Out-of-scope section is populated | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track reliability bug fix — directly closes a gap the operator found first-hand this session, evidenced by real production logs |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — the cross-tenant blast-radius risk of a selective-invalidation alternative was identified and explicitly rejected before choosing the safer `keepAlive: false` fix |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No rendered UI change — backend HTTP agent configuration only |
| H-NFR | NFR profile or explicit "None" field | ✅ | Performance, Security, Availability all addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter introduced — a configuration-value change to two existing, already-private module-level singletons |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set — this story deliberately does NOT touch `fly.toml` |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Source-inspection + runtime property checks — no live network calls needed to verify a configuration flag | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Eliminate stale-socket LLM call failures caused by Fly machine suspend/resume during a discovery session -- artefacts/2026-09-14-llm-agent-suspend-resume-fix/stories/lasr-s1-disable-keepalive-on-llm-agents.md
Test plan: artefacts/2026-09-14-llm-agent-suspend-resume-fix/test-plans/lasr-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- In src/modules/skill-turn-executor.js, change both
  `_anthropicAgent` and `_copilotAgent` from `keepAlive: true` to
  `keepAlive: false`. Keep `maxSockets: 4` unchanged on both.
- Update the comment above the two agent declarations (currently
  lines 24-27) to explain the real reason: a shared, process-wide
  keep-alive agent can hold a TCP socket across a Fly machine
  suspend/resume cycle; the remote end silently drops it, and
  reusing it on the next request hangs until the request-level
  timeout (skill-turn-executor.js's own DEFAULT_TIMEOUT_MS) fires --
  observed live in production as an ETIMEDOUT + 90-second stall.
  keepAlive: false trades a small per-call handshake cost for
  removing this failure mode entirely.
- Do NOT touch fly.toml, DEFAULT_TIMEOUT_MS, or the existing
  sse_retry_attempt retry logic in skills.js.
- Do NOT add any socket-pool invalidation/destroy logic -- the fix
  is exactly the keepAlive flag flip, nothing else.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — a small, well-evidenced reliability fix backed by real production log correlation; operator explicitly requested a short-track investigation and fix)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-14

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
