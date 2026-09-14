# Definition of Ready Checklist

## Definition of Ready: Detect max_tokens truncation explicitly instead of relying on a heuristic, and raise the output ceiling

**Story reference:** artefacts/2026-09-14-llm-truncation-detection/stories/ltd-s1-detect-and-surface-truncation.md
**Test plan reference:** artefacts/2026-09-14-llm-truncation-detection/test-plans/ltd-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator running real skill turns against production" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs |
| H3 | Every AC has at least one test/verification method | ✅ | T1-T13 map 1:1 or more onto AC1-AC7 (see test plan) |
| H4 | Out-of-scope section is populated | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track reliability/observability fix — directly follows from the PostHog AI-observability review conducted in this same operator session on 2026-09-14 |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | All 7 ACs covered, several by 2 tests (behavioural + regression) |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — provider scope, cap value, client heuristic relationship all stated explicitly |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Not a UI/layout change |
| H-NFR | NFR profile or explicit "None" field | ✅ | Performance, Cost, Observability addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter introduced — reuses existing `setSkillTurnExecutorAdapter`/`setSkillTurnExecutorStreamAdapter`/`_setPinoLogger` test seams already present in `skills.js` |
| H-INF | Infra-plan gate | ✅ N/A | Pure application code change, no infra/deploy-config change |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | Unverified assumption flagged explicitly | ✅ | `DEFAULT_MAX_TOKENS = 32768` is not independently verified against a live upper bound for the `claude-haiku-4-5`/`claude-sonnet-4-6` model IDs configured in this app. Risk: a real API rejection (HTTP 4xx citing an invalid `max_tokens` value) on first production use. Mitigation: the existing non-200 rejection path in `_callAnthropic`/`_callAnthropicStream` already surfaces this loudly as an `sse_error` log line — no silent failure mode. Documented in `decisions.md` as a RISK-ACCEPT. | Claude Sonnet 5 (orchestrating agent), operator informed in conversation |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Test plan follows three already-established, already-reviewed test patterns from this repo (`check-s6.1-*`, `check-pla-s2-*`, `check-ssdo-s1-*`) — no new testing technique introduced | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | No gap table — all ACs directly covered | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Detect max_tokens truncation explicitly instead of relying on a heuristic, and raise the output ceiling
       -- artefacts/2026-09-14-llm-truncation-detection/stories/ltd-s1-detect-and-surface-truncation.md
Test plan: artefacts/2026-09-14-llm-truncation-detection/test-plans/ltd-s1-test-plan.md

Goal:
Thread the Anthropic API's own stop_reason through the existing usage
object in src/modules/skill-turn-executor.js, surface it in production
logs and PostHog captures in src/web-ui/routes/skills.js, use it as an
authoritative (additional, not replacement) trigger for the client's
existing auto-continue heuristic, and raise DEFAULT_MAX_TOKENS.

Constraints:
- src/modules/skill-turn-executor.js:
  - _callAnthropic: add `stop_reason: parsed.stop_reason || null` to
    the resolved usage object (top-level field on the Anthropic
    non-streaming response).
  - _callAnthropicStream: initialise `_usage.stop_reason = null`
    alongside the existing usage fields; inside the existing
    `if (parsed.type === 'message_delta' ...)` handling, also read
    `parsed.delta && parsed.delta.stop_reason` into
    `_usage.stop_reason` when present -- do not remove or restructure
    the existing usage-token capture in that same block.
  - DEFAULT_MAX_TOKENS: 16384 -> 32768. Do not touch DEFAULT_TIMEOUT_MS,
    DEFAULT_MODEL, DEFAULT_ANTHROPIC_MODEL, or any other constant.
  - Do NOT touch _callCopilot/_callCopilotStream -- out of scope per
    the story's Architecture Constraints (pre-existing, unrelated
    return-shape issue there; do not fix incidentally).
- src/web-ui/routes/skills.js:
  - The `llm_complete` _turnLog.info(...) call (~line 5287): add a
    `stop_reason: _tu.stop_reason || null` field to the logged object.
  - The streaming `_genProps` PostHog capture object (~line 5645): add
    a plain `stop_reason: _tu2.stop_reason || null` field; when
    `_tu2.stop_reason === 'max_tokens'`, also add
    `$ai_is_error: true` and
    `$ai_error: 'max_tokens - response truncated'` to the same object
    (omit both keys entirely when not truncated -- do not set
    $ai_is_error: false).
  - The non-streaming `_nsProps` PostHog capture object (~line 4790):
    same three-field addition, symmetric with the streaming site,
    using `_nsUsage.stop_reason`.
  - The final streaming SSE `done` event (~line 5693):
    `res.write('data: ' + JSON.stringify({ done: done, artefactContent: ..., truncated: _tu.stop_reason === 'max_tokens' }) + '\n\n');`
    -- add the `truncated` field without changing existing `done`/
    `artefactContent` behaviour.
  - The client-side chat-page JS string (~line 3991), the existing
    condition `!IS_IDEATE && streamText && streamText.indexOf("?") === -1`
    becomes
    `!IS_IDEATE && streamText && (evt.truncated || streamText.indexOf("?") === -1)`
    -- purely additive OR condition; the existing heuristic stays as
    a fallback trigger, not replaced.
- Do not modify the non-streaming path's client consumption (no
  equivalent auto-continue loop exists there -- out of scope, see
  story).
- Follow the test plan's three established mocking precedents exactly
  (check-s6.1-*, check-pla-s2-*, check-ssdo-s1-*) -- do not introduce
  a new mocking library or pattern.
- This is a governed src/ change (CLAUDE.md Artefact-first rule) --
  route through the normal worktree -> PR -> merge path, open a draft
  PR, then mark it ready immediately per this session's established
  practice.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No further sign-off — the operator explicitly asked to "address all above findings with appropriate design and intent" directly in conversation on 2026-09-14, following the operator-requested PostHog data review that surfaced this gap.
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-14 — operator approval: heymishy, 2026-09-14 (in-conversation)

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
