# Definition of Ready Checklist

## Definition of Ready: LLM-generated fallback suggestion for `customer_actions`/`pain_points` when the deterministic scan finds nothing

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s4.md
**Test plan reference:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s4-test-plan.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-14

---

## Contract Proposal

See `artefacts/2026-10-14-journey-authoring-experience/dor/jae-s4-dor-contract.md` for the full proposal.

**Summary:** One new D37 injectable adapter (`field-suggestion-ai.js`) wrapping the existing, unmodified `skillTurnExecutor` from `skill-turn-executor.js`; one new on-demand route (`GET /journeys/stages/:stageId/ai-suggestion`); client-side fetch-on-panel-open for fields the deterministic scan left empty; new D37 wiring block in `server.js`.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 7 ACs (AC1, AC1a, AC2–AC6) and the test plan's own coverage table.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 7 ACs (AC1, AC1a, AC2–AC6) |
| H3 | Every AC has ≥1 test | ✅ | Confirmed against `jae-s4-test-plan.md`'s own AC coverage table |
| H4 | Out-of-scope section populated | ✅ | 5 items, each with a stated reason |
| H5 | Benefit linkage references a named metric | ✅ | M2 |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/jae-s4-review-2.md` — PASS, 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** none new. Reads `jae-s3`'s `getFieldSuggestions` result only to decide whether to call the new endpoint — no shared schema field, no write dependency. `jae-s3` is merged and DoD-complete. |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 6 bullets, review run 1's own Category-E/architecture finding (1-H1, trigger-point gap) resolved and verified in run 2 |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC in this story is CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-14-journey-authoring-experience/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — "Hamish King — Platform Owner — 2026-10-14" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ | **Applies — new adapter.** (1) Stub default throws, not silently empty — `dor-contract.md`'s exact error string, tested by AC6. (2) DoR AC for production wiring present — AC4 names the real-wired-adapter behavioural check explicitly. (3) Implementation plan must name wiring as a task separate from the handler/adapter task — see Coding Agent Instructions below, Task 4 is dedicated to the `server.js` wiring line, distinct from Task 1–3 (adapter, route, client). (4) Wiring test asserts behavioural correctness, not just reference assignment — AC4's own test requires two different stage inputs to produce two different, individually-traceable outputs, directly modelled on the `tir-s1`/`tir-s7` precedent CLAUDE.md names. |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No MEDIUM findings remain | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet reviewed; same established pattern as every other story this session | Hamish King (acknowledged, proceeding) |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps at all | — |
| W6 | Real external API cost/dependency introduced | ⚠️ | This story makes a genuinely new kind of call in this app (a customer-facing real-time Anthropic API call, not a pipeline-skill turn) — real per-call cost, real latency, real failure-mode surface (AC5 covers degrade-silently, but operational cost monitoring is explicitly Out of Scope). Accepted per the operator's own explicit "Grant DB permission + override AI-gen gate" decision and `decisions.md`'s SCOPE entry. | Hamish King (Platform Owner), via `AskUserQuestion`, 2026-10-14 |

---

## Standards injection

**Domain tags:** `[web-ui, ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/ui/ui-standards.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

- **"Mock-shape verification when reusing an adapter for a new purpose"** — directly applicable. `skillTurnExecutor` is being reused for a NEW purpose (a customer-facing one-off completion, not a pipeline-skill turn). The test plan's own AC4 test explicitly mocks `skillTurnExecutor` at the boundary this story actually calls it (not a higher-level mock of the whole adapter), and confirms the mock's shape (plain string response) matches what `skillTurnExecutor`'s own real non-streaming return type already is (`Promise<string>`, per its own JSDoc) — not assumed compatible because the call signature happens to fit.
- **"Client-side DOM patch vs. full page reload after a POST action"** — N/A to this story's own new GET endpoint (no POST/mutation introduced), but the suggestion-button click-to-fill behaviour (AC3) correctly reuses the existing DOM-patch convention already established by `jae-s3`.

### .github/standards/ui/ui-standards.md (matched domain: ui)

⚠️ Same status as every prior UI story this session: unpopulated template boilerplate.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: LLM-generated fallback suggestion for customer_actions/pain_points -- artefacts/2026-10-14-journey-authoring-experience/stories/jae-s4.md
Test plan: artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s4-test-plan.md
Contract: artefacts/2026-10-14-journey-authoring-experience/dor/jae-s4-dor-contract.md

Goal:
Make every test in the test plan pass (7 tests: 6 unit, 1 integration).
Do not add scope beyond what the tests and ACs specify.

Tasks (wiring is its own task, per D37 -- do not fold it into Task 1):
1. Write src/web-ui/adapters/field-suggestion-ai.js: generateAiFieldSuggestion/
   setGenerateAiFieldSuggestion/getGenerateAiFieldSuggestion, unwired default
   throws the exact D37 stub message, plus realGenerateAiFieldSuggestion
   (builds a tight system prompt, calls skillTurnExecutor from
   src/modules/skill-turn-executor.js UNMODIFIED, small fixed maxTokens,
   catches any error/empty response and returns null rather than throwing).
2. Add the new GET /journeys/stages/:stageId/ai-suggestion route to
   journeys.js, reusing the existing tenant-scoped stage-lookup query
   pattern handlePatchJourneyStage already uses. handleGetJourneyCanvas
   itself must NOT be touched -- AC1a tests this directly.
3. Add client-side fetch-on-panel-open logic (only for a field with
   neither a real value nor a jae-s3 deterministic suggestion) and the
   new sw-field-suggestion-btn--ai button variant with a distinguishing
   label, reusing jae-s3's own click-delegation listener (extend it,
   do not add a second listener).
4. [SEPARATE TASK] Wire setGenerateAiFieldSuggestion(realGenerateAiFieldSuggestion)
   in server.js, guarded by NODE_ENV !== 'test', matching the exact
   style of the existing wugs-s1/pr-s2 wiring block. Write the AC4
   wiring test as its own test, asserting behavioural difference
   between two distinct stage inputs -- NOT just that a function
   reference was assigned.

Constraints:
- Do NOT call generateAiFieldSuggestion or the new endpoint from inside
  handleGetJourneyCanvas -- this is AC1a, a HIGH finding from review
  run 1, test it explicitly.
- The deterministic (jae-s3) suggestion always wins when both exist --
  AC2, test explicitly, do not assume ordering is naturally correct.
- Any adapter error or empty response must resolve to no suggestion
  button and no visible error -- never throw up to the operator -- AC5.
- Do NOT implement streaming, rate-limiting, or suggestion caching --
  all explicitly Out of Scope.
- Open a draft PR when all tests pass -- do not mark ready for review.

Oversight level: Medium -- this story makes a real external API call
with real cost for the first time in this epic; review the implemented
prompt text and maxTokens bound before merge, not just the test results.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Yes — tech lead (Platform Owner) reviews the implemented prompt text and `maxTokens` bound before merge, per the epic's own Human Oversight Level rationale.
**Signed off by:** Hamish King — Platform Owner — 2026-10-14 (via explicit "Grant DB permission + override AI-gen gate" authorization covering both the gate override and proceeding through this governed pipeline to build it).
