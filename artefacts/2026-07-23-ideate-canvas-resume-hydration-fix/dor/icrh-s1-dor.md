# Definition of Ready Checklist

## Definition of Ready: Hydrate the ideate canvas from restored session.canvasBlocks on page load/session-resume

**Story reference:** artefacts/2026-07-23-ideate-canvas-resume-hydration-fix/stories/icrh-s1.md
**Test plan reference:** artefacts/2026-07-23-ideate-canvas-resume-hydration-fix/test-plans/icrh-s1-test-plan.md
**Assessed by:** Claude (agent, autonomous, short-track)
**Date:** 2026-07-23

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | `2026-07-23-e2e-core-journey-coverage`'s m1 (real, staging-verified E2E coverage), stated explicitly as reuse of the parent feature's metric rather than a fabricated new one |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No schema change; pure render/hydration fix in one route handler's HTML output |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Confirmed additive-only via direct code inspection; existing `__SW_INITIAL_ARTEFACT__`/`updateDraftPanel` precedent in the same file cited as the exact shape this fix mirrors |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No new CSS/layout; reuses the existing `.canvas-block` DOM structure and `appendCanvasBlock` renderer unmodified |
| H-NFR | NFR profile exists | ⚠️ RISK-ACCEPT | No dedicated `nfr-profile.md` — NFRs stated inline in story, same precedent as `mgfd-s1`/`cuf-s1`/`scsf-s1`/`pcr-s1`/`srmw-s1` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal (session-internal fields already trusted elsewhere in the same handler — `session.canvasBlocks` is server-populated only, never from unvalidated request input) |
| H-NFR-profile | NFR profile presence | ⚠️ RISK-ACCEPT | Same as H-NFR |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md precedent** | No discovery artefact — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No new injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | No infrastructure/deployment config change — pure application-code fix |
| H-MIG | Migration-review gate | ✅ N/A | No schema migration |

**All hard blocks pass — with the H-NFR, H-NFR-profile, and H-GOV notes recorded transparently as RISK-ACCEPTs.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track skips /review | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed test script may miss an edge case | **Acknowledged — proceed.** Root cause independently confirmed by direct code inspection (comparing `_renderChatPage`'s existing, working `__SW_INITIAL_ARTEFACT__` hydration pattern against ideate's canvas, which had no equivalent) before writing the fix and test; the test was additionally run RED-then-GREEN (confirmed failing against unmodified code, then passing after the fix) per TDD discipline. Same rationale as prior short-track precedent (`mgfd-s1`, `cuf-s1`, `scsf-s1`, `pcr-s1`, `srmw-s1`). |
| W5 | No UNCERTAIN items in test plan gap table | ⚠️ | AC6 (real-staging confirmation) is deploy-dependent and shares `wuce-staging` with other concurrent agents | **Acknowledged — proceed.** UT1-UT4 + IT1 (all deterministic, no staging dependency) fully verify AC1-AC5 independent of deploy outcome; AC6 explicitly requires checking for concurrent deploy activity before redeploying, and reports honestly if it cannot complete. |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Hydrate the ideate canvas from restored session.canvasBlocks on page load/session-resume — artefacts/2026-07-23-ideate-canvas-resume-hydration-fix/stories/icrh-s1.md
Test plan: artefacts/2026-07-23-ideate-canvas-resume-hydration-fix/test-plans/icrh-s1-test-plan.md
DoR contract: artefacts/2026-07-23-ideate-canvas-resume-hydration-fix/dor/icrh-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- In src/web-ui/routes/skills.js's _renderChatPage, add a
  canvasBlocksInitScript variable (mirroring artefactInitScript's
  existing shape exactly): when isIdeate is true and
  session.canvasBlocks is a non-empty array, serialize it into
  window.__SW_INITIAL_CANVAS_BLOCKS__ using the same HTML-entity
  escaping artefactInitScript/phaseModelInitScript already use. Include
  it in bodyContent's composition.
- In the inline client <script>, add a hydration block immediately
  after the existing
  "if(!IS_IDEATE && typeof __SW_INITIAL_ARTEFACT__ ...)" block: when
  IS_IDEATE is true and window.__SW_INITIAL_CANVAS_BLOCKS__ is defined
  and non-empty, call appendCanvasBlock(block) once per entry, in
  array order, using the EXISTING appendCanvasBlock function (do not
  duplicate or reimplement its rendering logic).
- Do NOT modify mergeRedisSessionData() (proven correct, out of
  scope).
- Do NOT modify renderCanvasBlock, appendCanvasBlock's own internals,
  the canvasBlock SSE event, or handlePostTurnStreamHtml's
  marker-scanning logic.
- Write a failing test first (TDD): tests/check-icrh-s1-ideate-canvas-resume-hydration.js
  covering AC1-AC4 via handleGetChatHtml/_setHtmlSession. Confirm RED
  against current code, then implement, then confirm GREEN.
- Run npm test in full; confirm no new regressions vs
  tests/known-baseline-failures.json.
- Before any real staging deploy, check flyctl releases --app
  wuce-staging for very recent deploy activity from another concurrent
  agent and avoid clobbering in-flight work.
- If flyctl is available and authenticated, deploy and re-run
  tests/e2e/a4-ideate-session-resume.spec.js against real staging to
  confirm it now genuinely passes; report honestly if this cannot
  complete this session.
- Open a draft PR based on master (not PR #568's branch) — do not mark
  ready for review.
- Never merge or self-merge any PR. Never push directly to
  origin/master.
- Reference CI run 29996127983 (job 89170114731) and PR #568 in the PR
  body.
- Update .github/pipeline-state.json for this story (flat
  feature.stories[] entry).
- Add a workspace/capture-log.md entry (source: agent-auto).

Oversight level: High
```

---

## Sign-off

**Oversight level:** High — this repo's default posture per its solo-operator Operating Posture in `.github/architecture-guardrails.md`.
**Sign-off required:** No — matches established short-track precedent for a well-evidenced, narrowly-scoped bug fix (`mgfd-s1`, `cuf-s1`, `scsf-s1`, `pcr-s1`, `srmw-s1`).
**Signed off by:** Claude (agent, autonomous, short-track) — 2026-07-23, dispatched to investigate and fix a real, live-verified production defect found by `tests/e2e/a4-ideate-session-resume.spec.js`'s AC2 & AC3 test against real `wuce-staging` (CI run 29996127983, job 89170114731, PR #568).
