# Definition of Ready: Viewer renders the actual screenshot gallery and plays video per AC

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s4-viewer-media-playback.md
**Test plan reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s4-test-plan.md
**Contract reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s4-dor-contract.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-10-15

---

## Contract review

Contract Proposal checked against all 5 ACs and the test plan's AC coverage table — no mismatches. ✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | Matches `fpd-s3`'s own persona |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1–AC5 all covered |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ | M1, M2 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | `review/fpd-s4-review-1.md` PASS, 0 findings (1 MEDIUM found and fixed inline) |
| H8 | Test plan has no uncovered ACs | ✅ | AC3's real-playback portion RISK-ACCEPTed, not silently gapped |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: []` declared with rationale |
| H9 | Architecture Constraints populated; no Cat. E HIGH | ✅ | Populated (ADR-026 native video, ADR-028 shared traversal — the exact fix from `/review` run 1); Category E score 5 post-fix |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ (different gap category) | AC3's gap is real-playback-dependent; E2E tooling configured, spec written, execution RISK-ACCEPTed |
| H-NFR | NFR profile or `NFRs: None` | ✅ | Exists |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | None named |
| H-NFR3 | Data classification populated | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence | ✅ | Exists |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | Clean pass |
| H-ADAPTER | D37 adapter wiring | ✅ (N/A) | No injectable adapter — serves existing files directly |
| H-INF / H-MIG / H-DESIGN | — | ✅ (N/A) | Flags not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | N/A |
| W2 | Scope stability declared | ✅ | — | N/A — "Stable" |
| W3 | MEDIUM findings acknowledged | ✅ | — | N/A — the one MEDIUM from `/review` run 1 was fixed inline before the report was finalised, 0 remain |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No second reviewer — solo-operator repo | Repo-wide W4 RISK-ACCEPT posture, logged in `decisions.md` 2026-10-15 |
| W5 | No UNCERTAIN gap-table items | ✅ | — | N/A |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Viewer renders the actual screenshot gallery and plays video per AC — artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s4-viewer-media-playback.md
Test plan: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s4-test-plan.md
Contract: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s4-dor-contract.md

Goal:
Make every test in the test plan pass. Render media (screenshots,
video) into fpd-s3's own existing per-AC sections -- do not build a
second traversal or a parallel rendering path.

Constraints:
- Native <video> element only -- no third-party player library.
- Wire fpd-s2's own caption file to the video's <track> element.
- The standalone transcript must be reachable without pressing play
  (AC4) -- do not make it conditional on video playback state.
- A no-evidence AC must show explicit empty-state text, never a
  broken <img> or a silently empty section (AC5).
- Open a draft PR when tests pass -- do not mark ready for review.

Oversight level: High (solo-operator repo-wide posture)
```

---

## Sign-off

**Oversight level:** High — per `architecture-guardrails.md`'s solo-operator posture.
**Sign-off required:** Yes.
**Signed off by:** Hamish King (Platform Owner) — 2026-10-15, via direct `AskUserQuestion` reply ("Proceed, all 4").
