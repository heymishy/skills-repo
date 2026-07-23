# Definition of Ready Checklist

## Definition of Ready: Fix sanitiseAnswer() silently eating hyphenated user-message text before a colon

**Story reference:** artefacts/2026-07-24-chat-message-text-truncation-fix/stories/cmtt-s1.md
**Test plan reference:** artefacts/2026-07-24-chat-message-text-truncation-fix/test-plans/cmtt-s1-test-plan.md
**Assessed by:** Claude (agent, autonomous, short-track)
**Date:** 2026-07-24

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | `2026-07-23-e2e-core-journey-coverage`'s m1 (real, staging-verified E2E coverage), reuse of the parent feature's metric, not a fabricated new one |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No schema change; single-regex fix in one shared utility function |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Confirmed minimal, single-function scope via direct isolation of both false-positive candidate functions (`lightMd`, `lightMarkdown`) before committing to the real root cause |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS/layout change |
| H-NFR | NFR profile exists | ⚠️ RISK-ACCEPT | No dedicated `nfr-profile.md` — NFRs stated inline in story, same precedent as `icrh-s1`/`mgfd-s1`/`cuf-s1`/`scsf-s1`/`pcr-s1`/`srmw-s1` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | User-typed chat answer content — already the classification this function's existing security tests (NFR3, T4.3-T4.6) operate under; unchanged by this fix |
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
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed test script may miss an edge case | **Acknowledged — proceed.** Root cause independently confirmed by directly isolating both false-positive candidate functions (`lightMd`, `chat-view.js`'s `lightMarkdown`) with the exact failing input string BEFORE isolating and confirming the real culprit (`sanitiseAnswer()`'s `CLI_FLAG` regex); the test was run RED-then-GREEN (confirmed failing against unmodified code — including through the real `htmlSubmitTurn()` write path, not just the isolated function — then passing after the fix) per TDD discipline. Same rationale as prior short-track precedent (`icrh-s1`, `mgfd-s1`, `cuf-s1`, `scsf-s1`, `pcr-s1`, `srmw-s1`). |
| W5 | No UNCERTAIN items in test plan gap table | ⚠️ | AC6 (real-staging confirmation) is deploy-dependent and shares `wuce-staging` with other concurrent agents | **Acknowledged — proceed.** UT1-UT8 + IT1 (all deterministic, no staging dependency) fully verify AC1-AC5 independent of deploy outcome; AC6 explicitly requires checking for concurrent deploy activity before redeploying, and reports honestly if it cannot complete. |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix sanitiseAnswer() silently eating hyphenated user-message text before a colon — artefacts/2026-07-24-chat-message-text-truncation-fix/stories/cmtt-s1.md
Test plan: artefacts/2026-07-24-chat-message-text-truncation-fix/test-plans/cmtt-s1-test-plan.md
DoR: artefacts/2026-07-24-chat-message-text-truncation-fix/dor/cmtt-s1-dor.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- In src/answer-sanitiser.js, add a negative lookbehind (?<![\w-]) to the
  CLI_FLAG regex so a CLI-flag-like token is only recognised at a genuine
  token boundary (start of string, or preceded by a non-word/non-hyphen
  character), not in the middle of an ordinary hyphenated compound word.
- Do NOT modify lightMd (src/web-ui/routes/skills.js) or lightMarkdown
  (src/web-ui/views/chat-view.js) -- both confirmed not to reproduce the
  bug.
- Do NOT modify mergeRedisSessionData() or any session-restore/merge
  mechanism -- not implicated.
- Do NOT narrow or remove the existing shell-metacharacter/CLI-flag
  injection defence -- T4.3/T4.5/NFR3 in tests/skill-launcher.test.js
  must continue to pass unmodified.
- Write a failing test first (TDD): tests/check-cmtt-s1-chat-message-text-truncation-fix.js
  covering AC1-AC4 against the real sanitiseAnswer() function and the
  real htmlSubmitTurn() write path. Confirm RED against current code,
  then implement, then confirm GREEN.
- Run npm test in full; confirm no new regressions vs
  tests/known-baseline-failures.json.
- Before any real staging deploy, check flyctl releases --app
  wuce-staging for very recent deploy activity from another concurrent
  agent and avoid clobbering in-flight work.
- If flyctl is available and authenticated, deploy and re-run
  tests/e2e/a4-ideate-session-resume.spec.js against real staging to
  confirm it now genuinely passes; report honestly if this cannot
  complete this session.
- Open a draft PR based on master — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to
  origin/master.
- Update .github/pipeline-state.json for this story (flat
  feature.stories[] entry).
- Add a workspace/capture-log.md entry (source: agent-auto).

Oversight level: High
```

---

## Sign-off

**Oversight level:** High — this repo's default posture per its solo-operator Operating Posture in `.github/architecture-guardrails.md`.
**Sign-off required:** No — matches established short-track precedent for a well-evidenced, narrowly-scoped bug fix (`icrh-s1`, `mgfd-s1`, `cuf-s1`, `scsf-s1`, `pcr-s1`, `srmw-s1`).
**Signed off by:** Claude (agent, autonomous, short-track) — 2026-07-24, dispatched to investigate and fix a real, live-verified production defect found by `tests/e2e/a4-ideate-session-resume.spec.js`'s AC2 & AC3 test against real `wuce-staging`.
