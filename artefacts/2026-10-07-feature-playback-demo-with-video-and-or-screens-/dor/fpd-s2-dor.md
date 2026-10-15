# Definition of Ready: Add a Playwright-recorded video walkthrough with machine-generated captions and transcript

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s2-video-walkthrough-and-accessibility.md
**Test plan reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s2-test-plan.md
**Contract reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s2-dor-contract.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-10-15

---

## Contract review

Contract Proposal checked against all 6 ACs (including AC6, added after `/review` run 2) and the test plan's AC coverage table — no mismatches. ✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "a feature engineer producing a playback package" |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1–AC6 all covered |
| H4 | Out-of-scope populated | ✅ | 5 items |
| H5 | Benefit linkage references a named metric | ✅ | M1, M3 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | `review/fpd-s2-review-1.md` + `review/fpd-s2-review-2.md` (AC6 addition) both PASS, 0 findings |
| H8 | Test plan has no uncovered ACs | ✅ | AC1's real-recording portion RISK-ACCEPTed, not silently gapped |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: []` declared with rationale — dependency is on `fpd-s1`'s shipped code/files, not a schema field |
| H9 | Architecture Constraints populated; no Cat. E HIGH | ✅ | Populated (D37 pattern, `ffmpeg` correction); review Category E score 5 (both runs) |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ (different gap category) | AC1's gap is real-browser-dependent; E2E tooling configured, spec written, execution RISK-ACCEPTed |
| H-NFR | NFR profile or `NFRs: None` | ✅ | Exists |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | None named |
| H-NFR3 | Data classification populated | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence | ✅ | Exists |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | Clean pass |
| H-ADAPTER | D37 adapter wiring | ✅ | AC6 scopes production wiring; stub-throws explicitly required in Architecture Constraints; implementation plan must name wiring as a separate task from the handler task (per `CLAUDE.md`'s own D37 rule item 3) |
| H-INF / H-MIG / H-DESIGN | — | ✅ (N/A) | Flags not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | N/A |
| W2 | Scope stability declared | ✅ | — | N/A — "Stable" |
| W3 | MEDIUM findings acknowledged | ✅ | — | N/A — 0 findings |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No second reviewer — solo-operator repo | Repo-wide W4 RISK-ACCEPT posture, logged in `decisions.md` 2026-10-15 |
| W5 | No UNCERTAIN gap-table items | ✅ | — | N/A |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add a Playwright-recorded video walkthrough with machine-generated captions and transcript — artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s2-video-walkthrough-and-accessibility.md
Test plan: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s2-test-plan.md
Contract: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s2-dor-contract.md

Goal:
Make every test in the test plan pass. Extend playback-capture.js
with video recording; add the D37 caption/transcript adapter as its
own separate task from the recording logic.

Sequencing (mandatory, per CLAUDE.md's D37 rule item 3):
1. Video recording via Playwright recordVideo (AC1, AC2).
2. The D37 adapter itself: handler + injectable setter, stub throws
   (AC6's own unwired-case requirement).
3. SEPARATE task: wire the real implementation in server.js, guarded
   by NODE_ENV !== 'test'. Do not fold this into task 2.
4. Captions/transcript generation calling the (now-wired) adapter
   (AC3, AC4, AC5).

Constraints:
- ffmpeg/MP4 encoding is explicitly out of scope -- ship .webm as-is.
- The D37 wiring test (AC6) must assert behavioural correctness
  (two different inputs produce two different, correct outputs),
  not merely that a setter was called -- per CLAUDE.md's own D37
  rule and the tir-s1/tir-s7 precedent it documents.
- Open a draft PR when tests pass -- do not mark ready for review.

Oversight level: High (solo-operator repo-wide posture)
```

---

## Sign-off

**Oversight level:** High — per `architecture-guardrails.md`'s solo-operator posture.
**Sign-off required:** Yes.
**Signed off by:** Hamish King (Platform Owner) — 2026-10-15, via direct `AskUserQuestion` reply ("Proceed, all 4").
