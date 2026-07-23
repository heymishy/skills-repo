# Definition of Ready Checklist

## Definition of Ready: Wire {stage, scenarioName} into handlePostTurnStreamHtml so MOCK_LLM_GATEWAY actually activates for the real chat UI's streaming turn endpoint

**Story reference:** artefacts/2026-07-23-streaming-route-mock-gateway-wiring/stories/srmw-s1.md
**Test plan reference:** artefacts/2026-07-23-streaming-route-mock-gateway-wiring/test-plans/srmw-s1-test-plan.md
**Assessed by:** Claude (agent, autonomous, short-track)
**Date:** 2026-07-23

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | `2026-07-23-e2e-core-journey-coverage`'s m1 (real, staging-verified E2E coverage), stated explicitly as reuse of the parent feature's metric rather than a fabricated new one |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No schema change; pure options-wiring fix in one route handler |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Confirmed additive-only via direct code inspection; existing `tenantId`/`sessionId` (s6.1) precedent in the same function cited as the exact shape this fix mirrors |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI/layout-dependent ACs |
| H-NFR | NFR profile exists | ⚠️ RISK-ACCEPT | No dedicated `nfr-profile.md` — NFRs stated inline in story, same precedent as `mgfd-s1`/`cuf-s1`/`scsf-s1`/`pcr-s1` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal (session-internal fields already trusted elsewhere in the same handler) |
| H-NFR-profile | NFR profile presence | ⚠️ RISK-ACCEPT | Same as H-NFR |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md precedent** | No discovery artefact — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No new injectable adapter introduced — this fix threads existing fields into an already-wired adapter's existing options contract |
| H-INF | Infra-plan gate | ✅ N/A | No infrastructure/deployment config change (unlike `mgfd-s1`) — pure application-code fix |
| H-MIG | Migration-review gate | ✅ N/A | No schema migration |

**All hard blocks pass — with the H-NFR, H-NFR-profile, and H-GOV notes recorded transparently as RISK-ACCEPTs.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track skips /review | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed test script may miss an edge case | **Acknowledged — proceed.** Root cause independently confirmed by direct code inspection (comparing `handlePostTurnStreamHtml`'s `_turnOptions` construction against `htmlSubmitTurn`'s `_turnMeta` line-by-line) before writing the fix; the test's IT1 additionally cross-checks against the REAL `skill-turn-executor.js` + REAL `mock-llm-gateway.js` (not a fake), with `https.request` monkey-patched only to detect an unwanted real call. Same rationale as prior short-track precedent (`mgfd-s1`, `cuf-s1`, `scsf-s1`, `pcr-s1`). |
| W5 | No UNCERTAIN items in test plan gap table | ⚠️ | AC5 (real-staging confirmation) is deploy-dependent and shares `wuce-staging` with other concurrent agents | **Acknowledged — proceed.** UT1/UT2/IT1 (all deterministic, no staging dependency) fully verify AC1-AC3 independent of deploy outcome; AC5 explicitly requires checking for concurrent deploy activity before redeploying, and reports honestly if it cannot complete. |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Wire {stage, scenarioName} into handlePostTurnStreamHtml so MOCK_LLM_GATEWAY actually activates for the real chat UI's streaming turn endpoint — artefacts/2026-07-23-streaming-route-mock-gateway-wiring/stories/srmw-s1.md
Test plan: artefacts/2026-07-23-streaming-route-mock-gateway-wiring/test-plans/srmw-s1-test-plan.md
DoR contract: artefacts/2026-07-23-streaming-route-mock-gateway-wiring/dor/srmw-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- In src/web-ui/routes/skills.js's handlePostTurnStreamHtml, add exactly
  two _turnOptions assignments (stage = session.skillName;
  scenarioName = session.mockScenarioName || 'success') immediately
  after the existing tenantId/sessionId assignments, mirroring
  htmlSubmitTurn's _turnMeta construction exactly.
- Do not change SSE streaming behaviour, event framing, or any other
  part of handlePostTurnStreamHtml.
- Do not modify mock-llm-gateway.js, skill-turn-executor.js, server.js,
  fly.staging.toml, or any Fly secret.
- Write a failing test first (TDD): a real streaming turn request with
  MOCK_LLM_GATEWAY=true active must route through the mock gateway and
  receive fixture content, not attempt a real model call. Confirm RED
  against current code, then implement, then confirm GREEN.
- New test file tests/check-srmw-s1-streaming-mock-gateway-wiring.js
  covering UT1/UT2/IT1 from the test plan.
- Run npm test in full; confirm no new regressions vs
  tests/known-baseline-failures.json.
- Before any real staging deploy, check flyctl releases --app
  wuce-staging for very recent deploy activity from another concurrent
  agent and avoid clobbering in-flight work.
- If flyctl is available and authenticated, deploy and drive a real
  turn through the actual streaming endpoint to confirm it now returns
  fixture content; report honestly if this cannot complete this
  session.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- Reference the a4 FINDING in
  artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md and PR
  #559's description in the PR body.
- Update .github/pipeline-state.json for this story (flat
  feature.stories[] entry).
- Add a workspace/capture-log.md entry (source: agent-auto).

Oversight level: High
```

---

## Sign-off

**Oversight level:** High — this repo's default posture per its solo-operator Operating Posture in `.github/architecture-guardrails.md`.
**Sign-off required:** No — matches established short-track precedent for a well-evidenced, narrowly-scoped bug fix (`mgfd-s1`, `cuf-s1`, `scsf-s1`, `pcr-s1`).
**Signed off by:** Claude (agent, autonomous, short-track) — 2026-07-23, dispatched to fix a real, live-verified defect documented in `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md`'s a4 FINDING entry and PR #559's description.
