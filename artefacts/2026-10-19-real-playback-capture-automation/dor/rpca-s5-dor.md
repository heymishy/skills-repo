# Definition of Ready: Playback capture triggers automatically when a feature reaches Definition of Done

**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s5-automatic-capture-trigger-at-definition-of-done.md
**Contract:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s5-dor-contract.md
**Date:** 2026-10-19

---

## Contract review

No mismatches between the Contract Proposal and the story's own ACs/test plan — all 5 ACs map 1:1 to the test plan's own unit tests (2 real-function, 3 real-file content assertions), matching the contract exactly. ✅ **Contract review passed.**

---

## Checklist — Hard blocks

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| H1 | User story As/Want/So, named persona | ✅ | "platform operator" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test in test plan | ✅ | All 5, unit |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references named metric | ✅ | M1, M2 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0 HIGH, 0 MEDIUM, 2 LOW (both fixed inline at review time) |
| H8 | No uncovered ACs | ✅ | Test plan's own Coverage gaps section: "None" |
| H8-ext | Cross-story schema dependency check | ✅ | No data-schema dependency on `rpca-s1`-`rpca-s4` — reuses the same story-level `dodStatus` evidence field ADR-002 already names |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 4 constraints (Platform change policy, Step 4 preservation, non-blocking-failure principle, ADR-002 gate fix); review Category E scored 5 |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ (N/A) | No CSS-layout-dependent AC — confirmed in both review and test plan |
| H-NFR | NFR profile exists | ✅ | `artefacts/.../nfr-profile.md` exists; no new rows apply — story's own NFR section states none beyond `rpca-s1` |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | No compliance NFR |
| H-NFR3 | Data classification populated | ✅ | "Internal" (feature-level, inherited) |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | "Hamish King — Platform Owner — 2026-10-19" |
| H-ADAPTER | D37 adapter wiring | ✅ (N/A) | No injectable adapter introduced |
| H-INF / H-MIG / H-DESIGN | — | ✅ (N/A) | Track flags not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | ✅ No warning — story's own NFR section explicitly states none beyond `rpca-s1` |
| W2 | Scope stability declared | ✅ No warning — "Stable" |
| W3 | MEDIUM review findings acknowledged | ✅ No warning — 0 MEDIUM; the 2 LOW findings were fixed inline during review, not deferred |
| W4 | Verification script reviewed by a domain expert | ✅ No warning — all 5 ACs are automated, same low-risk shape as `rpca-s2`/`rpca-s4` |
| W5 | No UNCERTAIN gap-table items | ✅ No warning — test plan's own gap table: "None" |

---

## Standards injection

**Domain tags:** None identified (story's own header: "skill-process wiring... not new application code")
**Matched standards files:** None new.

---

## Oversight level

**Oversight:** High (solo-operator repo-wide posture, per `architecture-guardrails.md`).

---

## Coding Agent Instructions

**Story:** Playback capture triggers automatically when a feature reaches Definition of Done
**Contract:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s5-dor-contract.md
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s5-test-plan.md
**Verification script:** artefacts/2026-10-19-real-playback-capture-automation/verification-scripts/rpca-s5-verification.md

**Touch points (locked — do not exceed without a DoR contract amendment):**
- `scripts/playback-capture.js` (modify — `checkDodGate` only)
- `skills/definition-of-done/SKILL.md` (modify — "Feature-completion trace check" section only)
- `tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js` (new)

**Goal:**
Make every test in the test plan pass. All 5 ACs are fully automatable — no manual scenario, no real secret or network dependency.

**Constraints:**
- Do not modify `skills/feature-playback/SKILL.md` — AC5 only verifies it's unchanged.
- Do not touch `/feature-playback`'s own Step 4 (editorial review) description — must remain a mandatory human gate, unedited.
- The non-blocking-failure language added to `/definition-of-done`'s own SKILL.md must be unambiguous that a capture failure never downgrades the DoD verdict.
- Open a draft PR when all tests pass — do not mark ready for review (`SKILL.md` changes are governed per CLAUDE.md's Platform change policy; PR required).
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing it and do not mark ready for review.

**Implementation order:**
1. `checkDodGate`'s own fix + AC1/AC2's own unit tests (pure function logic, no SKILL.md dependency)
2. `skills/definition-of-done/SKILL.md`'s own rewrite + AC3/AC4's own unit tests
3. AC5's own regression test against the unchanged `feature-playback/SKILL.md`

- Full regression suite must stay green throughout (`node scripts/run-all-tests.js`).
- No manual verification step required at `/verify-completion` for this story — all 5 ACs are automated.

Oversight level: High (solo-operator repo-wide posture)

---

## Sign-off

**Oversight level:** High — per `architecture-guardrails.md`'s solo-operator posture.
**Sign-off required:** Yes.
**Signed off by:** Hamish King (Platform Owner) — 2026-10-19.

**Proceed: Yes.**
