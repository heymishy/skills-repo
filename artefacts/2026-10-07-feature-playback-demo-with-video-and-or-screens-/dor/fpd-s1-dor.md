# Definition of Ready: Produce a structured, DoD-sourced walkthrough document with AC-mapped screenshots

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s1-walkthrough-document-and-screenshots.md
**Test plan reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s1-test-plan.md
**Contract reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s1-dor-contract.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-10-15

---

## Contract review

Contract Proposal checked against all 5 ACs and the test plan's AC coverage table — no mismatches. ✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "a feature engineer who just completed a DoD-validated feature" |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1–AC5 all covered |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ | M3 primary, M1 enabling |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | `review/fpd-s1-review-1.md` PASS, 0 findings |
| H8 | Test plan has no uncovered ACs | ✅ | AC3's real-capture portion RISK-ACCEPTed, not silently gapped |
| H8-ext | Cross-story schema dependency | ✅ (N/A) | Dependencies: "None" — not triggered |
| H9 | Architecture Constraints populated; no Cat. E HIGH | ✅ | Populated; review Category E score 5 |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ (different gap category) | AC3's gap is real-browser-dependent, not CSS-layout — E2E tooling (Playwright, ADR-018) is configured, a real spec is written, execution RISK-ACCEPTed consistent with every other story this session that hit this exact sandbox limitation |
| H-NFR | NFR profile or `NFRs: None` | ✅ | `artefacts/.../nfr-profile.md` exists |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | No compliance NFR named |
| H-NFR3 | Data classification populated | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence | ✅ | Exists |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | "Hamish King — Platform Owner — 2026-10-15" — clean pass, no gap this time |
| H-ADAPTER | D37 adapter wiring | ✅ (N/A) | No injectable adapter in this story (Playwright `page` is a plain function argument, not a D37 case) |
| H-INF / H-MIG / H-DESIGN | — | ✅ (N/A) | Flags not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | N/A |
| W2 | Scope stability declared | ✅ | — | N/A — "Stable" |
| W3 | MEDIUM findings acknowledged | ✅ | — | N/A — 0 findings |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No second reviewer — solo-operator repo | Repo-wide W4 RISK-ACCEPT posture, first logged for this feature in `decisions.md` 2026-10-15 |
| W5 | No UNCERTAIN gap-table items | ✅ | — | N/A — gap is named and RISK-ACCEPTed, not uncertain |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Produce a structured, DoD-sourced walkthrough document with AC-mapped screenshots — artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s1-walkthrough-document-and-screenshots.md
Test plan: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s1-test-plan.md
Contract: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Add exactly 2 new files
(skills/feature-playback/SKILL.md, scripts/playback-capture.js) plus
a new CONTRACTS entry in .github/scripts/check-skill-contracts.js.
Do not add scope beyond what the ACs specify.

Constraints:
- New skill file follows this repo's own existing skill-authoring
  structure (entry-condition check, numbered steps, completion
  output) -- match the style of existing skills under skills/.
- The capture script receives a Playwright page object as a plain
  function argument -- do not introduce a module-level singleton or
  a D37 adapter for it; it is already testable via dependency
  injection.
- Open a draft PR when tests pass -- do not mark ready for review.

Oversight level: High (solo-operator repo-wide posture)
```

---

## Sign-off

**Oversight level:** High — per `architecture-guardrails.md`'s solo-operator posture.
**Sign-off required:** Yes.
**Signed off by:** Hamish King (Platform Owner) — 2026-10-15, via direct `AskUserQuestion` reply ("Proceed, all 4").
