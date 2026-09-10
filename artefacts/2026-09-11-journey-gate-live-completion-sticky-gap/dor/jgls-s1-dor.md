# Definition of Ready Checklist

## Definition of Ready: The journey-gate "Continue to next stage" control is not sticky when it appears via a live turn completion

**Story reference:** artefacts/2026-09-11-journey-gate-live-completion-sticky-gap/stories/jgls-s1-fix-live-completion-gate-not-sticky.md
**Test plan reference:** artefacts/2026-09-11-journey-gate-live-completion-sticky-gap/test-plans/jgls-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-11

---

## Contract Proposal

See `artefacts/2026-09-11-journey-gate-live-completion-sticky-gap/dor/jgls-s1-dor-contract.md`.

## Contract Review

✅ **Contract review passed** — the proposed implementation (copy the identical, already-proven sticky properties from `journeyPanel`'s style string to `showCommitLink()`'s) directly satisfies AC1 and AC3; AC2's regression coverage requires no implementation change, only the added test assertion. No mismatches between the contract and the stated ACs or test plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "operator resuming a feature from `/journey` and completing a stage's turn live" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 3 unit tests, one per AC |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | M2 — Next-stage-action findability (`2026-08-31-web-ui-navigation-legibility`), found live during that story's own post-merge verification |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | All 3 ACs covered, no gaps beyond the logged RISK-ACCEPT |
| H8-ext | Cross-story schema dependency check | ✅ | Story's Dependencies block names an upstream story (`wnl-s2`) that is already DoD-complete — no incomplete-upstream block |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated — exact fix location and copied properties named precisely. No review ran (short-track), so no Category E findings exist to check. |
| H-E2E | CSS-layout-dependent gap check | ✅ | AC1 is CSS-layout-dependent; RISK-ACCEPT logged in `decisions.md` per B2 (E2E tooling exists in this repo generally, but a new live-turn-driven spec was assessed as disproportionate given the mechanism is already proven by `wnl-s2`'s own E2E suite) |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-11-journey-gate-live-completion-sticky-gap/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as every prior short-track story in this repo** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction ("yes fix now pls"), following live Chrome reproduction of the bug shown to the operator before this story was written. Recorded transparently, matching the identical, already-logged H-GOV gap pattern used by every prior short-track story (e.g. `jasb-s1`, `daga-s1`). |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced by this story |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 14/14 (9 direct passes + 5 explicit N/A), with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script not yet reviewed by a separate person before implementation begins | **Acknowledged — proceed.** RISK-ACCEPT logged in `artefacts/2026-09-11-journey-gate-live-completion-sticky-gap/decisions.md` — root cause confirmed via live reproduction before the story was written; fix mirrors an already-shipped, already-verified change. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan's one gap-table entry (no live-turn E2E spec) is an explained, RISK-ACCEPTed design choice with stated mitigation, not an unresolved uncertainty | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: The journey-gate "Continue to next stage" control is not sticky when it appears via a live turn completion — artefacts/2026-09-11-journey-gate-live-completion-sticky-gap/stories/jgls-s1-fix-live-completion-gate-not-sticky.md
Test plan: artefacts/2026-09-11-journey-gate-live-completion-sticky-gap/test-plans/jgls-s1-test-plan.md
DoR contract: artefacts/2026-09-11-journey-gate-live-completion-sticky-gap/dor/jgls-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

(1) src/web-ui/routes/skills.js (~line 3845): showCommitLink()'s
wrap.style.cssText currently reads:
  wrap.style.cssText = "padding:10px 12px 2px;display:flex;align-items:center;gap:10px;flex-wrap:wrap";
Append the sticky positioning properties so it reads:
  wrap.style.cssText = "padding:10px 12px 2px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--line);z-index:500";
Do NOT change any other property, and do NOT touch journeyPanel's own
.sw-journey-gate construction (~line 4593) -- it is already correct.

(2) Add a new unit test file (e.g. tests/check-jgls-s1-live-gate-sticky.js)
covering all 3 ACs per the test plan:
  - AC1: render a chat page for a session with done:false and journeyId
    set (via _setHtmlSession), extract the embedded <script> content,
    find the wrap.style.cssText assignment inside showCommitLink's
    source, assert it contains position:sticky, bottom:0,
    background:var(--bg), border-top:1px solid var(--line), z-index:500.
  - AC2: same extraction, assert the pre-existing padding/display/
    align-items/gap/flex-wrap properties are still present unchanged.
  - AC3: read src/web-ui/routes/skills.js from disk directly, extract
    both the journeyPanel .sw-journey-gate style string and
    showCommitLink's wrap.style.cssText string, assert both contain the
    identical substring "position:sticky;bottom:0;background:var(--bg);
    border-top:1px solid var(--line);z-index:500".

Constraints:
- Do NOT refactor the two gate-rendering paths into one shared function
  -- explicitly out of scope for this story.
- Do NOT change showCommitLink()'s trigger conditions, form content, or
  CSRF handling.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — single-line, low-blast-radius fix copying an already-shipped, already-verified CSS change to a second location; root cause confirmed via live reproduction, not guessed.
**Sign-off required:** No
**Signed off by:** Not required (Low oversight)
