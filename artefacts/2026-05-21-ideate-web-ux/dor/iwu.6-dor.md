# Definition of Ready: Add assumption card marker emission instructions to ideate/SKILL.md

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.6.md
**Test plan reference:** artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.6-test-plan.md
**Review reference:** artefacts/2026-05-21-ideate-web-ux/review/iwu.6-review-1.md
**Emission verification stub:** artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md
**Assessed by:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-06-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator (primary) / I want the ideate SKILL.md to instruct the model to emit an assumption card marker whenever an assumption is stated in the session / So that markers are consistently present in model output and the UX components have real data to render" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 1 unit test (marker format in instruction text). AC2: probabilistic — 1 synthetic unit test (documented as confidence check only; not binding CI gate). AC3: human-in-loop DoD gate (real session, ≥6 turns, ≥70% emission rate; emission verification stub at artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md). AC4: 1 unit test (assumptionCardsEnabled: true default). All gaps documented with gap type and risk. |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Out of Scope lists 4 items: testing real model behaviour in CI, tuning marker frequency or type classification, UI rendering of cards (iwu.3), confirm/flag interaction (iwu.4) |
| H5 | Benefit linkage field references a named metric | ✅ | M1 — Assumption card render reliability. M2 — Rework rate reduction. Mechanisms described. |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review: 0 HIGH, 1 MEDIUM. MEDIUM finding: "M2 not in benefit linkage" — RESOLVED by story update (commit adc6b5c). No unresolved HIGH findings. |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | AC2 probabilistic gap: documented, risk rated, acknowledged (cannot be a binding CI assertion for non-deterministic model output). AC3 human-in-loop: documented, emission verification stub exists, DoD gate recorded. All gaps acknowledged. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Architecture constraints present: governed SKILL.md (requires PR review by platform operator per platform change policy), marker format per ADR-018 (exact format required), assumptionCardsEnabled default value in session init, no new npm dependencies. GOVERNED FILE constraint confirmed. No Category E HIGH findings. |
| H-E2E | If any AC is typed CSS-layout-dependent AND no E2E tooling configured AND no RISK-ACCEPT recorded — block sign-off | ✅ | No CSS-layout-dependent ACs. H-E2E not triggered. |
| H-NFR | NFR section populated; no profile required | ✅ | NFR section declared: "None identified beyond the DoD entry condition (emission verification)." No NFR profile requirement triggered for this story. |
| H-NFR2 | No regulatory compliance clause with missing sign-off | ✅ | No regulatory clauses. Public data classification. |
| H-NFR3 | Data classification declared in NFR profile | ✅ | NFR section in story declares: Public — no PII, no sensitive data. (Feature NFR profile exists separately for other stories.) |
| H-NFR-profile | If story declares NFRs, artefacts/[feature]/nfr-profile.md must exist | ✅ | Story declares "NFRs: None beyond DoD entry condition." H-NFR-profile not triggered. |
| H-GOV | Discovery Approved By has ≥1 non-blank named entry | ✅ PASS | Hamish King — Platform operator / tech lead — 2026-06-04. M1 signal recorded. |
| H-ADAPTER | No injectable adapter introduced without stub-throws + AC + wiring task | ✅ | No injectable adapters introduced. Session init default (assumptionCardsEnabled: true) is a default value, not an injectable adapter. |

**Overall: ALL HARD BLOCKS PASS. Proceed: Yes.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | NFRs: None confirmed in story |
| W2 | Scope stability is declared | ✅ | — | Not triggered |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | MEDIUM finding (M2 benefit linkage) resolved by story update rather than decisions.md. No decisions.md for this feature. | Hamish King — 2026-06-04 — acknowledged |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script may miss edge cases | Hamish King — 2026-06-04 — acknowledged |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ⚠️ | AC2 probabilistic gap (model emission non-deterministic in CI). AC3 is a human-in-loop DoD gate — cannot be closed without a real multi-turn session. Emission verification stub exists and must be completed before DoD-complete is signed. | Hamish King — 2026-06-04 — acknowledged; emission verification stub exists at artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md |

---

## Governed file warning

**⚠️ HIGH OVERSIGHT — GOVERNED FILE**

`.github/skills/ideate/SKILL.md` is a governed file under `.github/skills/`. Per the platform change policy (copilot-instructions.md: "Platform change policy Phase 2+"), SKILL.md changes **must be merged via a PR reviewed by the platform operator**. The coding agent must:

1. Make the change on a feature branch
2. Open a **draft PR** and request review from Hamish King (platform operator)
3. **Not merge** — PR merge is a human action
4. Not mark the PR as ready for review — open as draft only

Coding agent must also check: does this SKILL.md change need to be logged in `.github/pipeline-state.json` under the skills section? If a skills-sync hash or lockfile reference exists, flag in a PR comment.

---

## DoD entry condition (human-in-loop gate)

**AC3 cannot be closed by CI.** Before `/definition-of-done` is signed off for this story:

1. A real multi-turn ideate session must be run (≥6 turns before Lens B completes)
2. The emission verification stub at `artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md` must be completed with real session data
3. `pass_fail` field must be `PASS` (emission_rate_pct ≥ 70)
4. Stub must be signed by Hamish King

If this gate is not met, DoD cannot be signed off regardless of test pass status.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes — but HIGH OVERSIGHT (governed file). Human sign-off required before PR merge.
Story: Add assumption card marker emission instructions to ideate/SKILL.md — artefacts/2026-05-21-ideate-web-ux/stories/iwu.6.md
Test plan: artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.6-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Language: JavaScript (Node.js). No TypeScript.
- GOVERNED FILE: .github/skills/ideate/SKILL.md — changes must go via PR with platform operator review. Open as draft. Do not merge.
- Add assumption card marker emission instruction to .github/skills/ideate/SKILL.md. The instruction must use the exact ADR-018 marker format: ---ASSUMPTION-JSON: {"id":"...","text":"...","type":"...","risk":"...","knowness":"..."}---
- Instruction placement: add to the output formatting section of SKILL.md. Do not restructure or remove existing instruction content.
- Set session.assumptionCardsEnabled = true as the default in the session initialisation block of src/web-ui/routes/skills.js (handleGetChatHtml or wherever the session object is initialised for the ideate skill). This enables card rendering from iwu.3 without per-session configuration.
- Write governance test at tests/check-iwu6-skillmd.js. Add to package.json test chain.
- AC2 is probabilistic — write the synthetic test as a confidence check (document in test file that it is not a binding CI gate; model output is non-deterministic).
- AC3 is a human-in-loop DoD gate — do not attempt to automate. Add a PR comment: "AC3 (real 6-turn session emission verification) is a human-in-loop DoD gate. The stub at artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md must be completed with real session data before DoD is signed off."
- Upstream dependency: iwu.3, iwu.4, iwu.5 must all be merged before real session emission can be verified in the DoD gate.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a DRAFT PR when tests pass — do not mark ready for review, do not merge.

Oversight level: High — human review required before PR merge.
DoD entry condition: emit verification stub must be completed (see above).
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Human review of governed SKILL.md change required before merge
**Signed off by:** Hamish King — Platform operator / tech lead — 2026-06-04
**Human-in-loop gate acknowledged:** DoD AC3 requires real session emission verification (≥6 turns, ≥70% emission rate). Stub must be completed before DoD-complete.
