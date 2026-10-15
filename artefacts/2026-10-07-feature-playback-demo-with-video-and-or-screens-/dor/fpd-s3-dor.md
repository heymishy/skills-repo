# Definition of Ready: Viewer route lists a DoD-validated feature and navigates its scope/benefit/per-story AC structure

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s3-viewer-route-and-traceability-structure.md
**Test plan reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s3-test-plan.md
**Contract reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s3-dor-contract.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-10-15

---

## Contract review

Contract Proposal checked against all 5 ACs and the test plan's AC coverage table — no mismatches. ✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "a feature sponsor / business owner reviewing a delivered feature" |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1–AC5 all covered |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ | M1, M2 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | `review/fpd-s3-review-1.md` PASS, 0 findings |
| H8 | Test plan has no uncovered ACs | ✅ | "No gaps" |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: []` declared with rationale |
| H9 | Architecture Constraints populated; no Cat. E HIGH | ✅ | Populated (ADR-027, ADR-028); review Category E score 5 |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ (N/A) | No gaps — pure DOM/structure, no layout or real-browser dependency |
| H-NFR | NFR profile or `NFRs: None` | ✅ | Exists |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | None named |
| H-NFR3 | Data classification populated | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence | ✅ | Exists |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | Clean pass |
| H-ADAPTER | D37 adapter wiring | ✅ (N/A) | No injectable adapter — reads existing files/state directly |
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
| W5 | No UNCERTAIN gap-table items | ✅ | — | N/A — "No gaps" |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Viewer route lists a DoD-validated feature and navigates its scope/benefit/per-story AC structure — artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s3-viewer-route-and-traceability-structure.md
Test plan: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s3-test-plan.md
Contract: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s3-dor-contract.md

Goal:
Make every test in the test plan pass. Add a new read-only route
listing DoD-validated features with a playback package, and a
per-feature review page with the scope/benefit/per-story AC
structure. Do not add scope beyond what the ACs specify.

First task, mandatory, before writing any new traversal logic:
search /trace's own implementation and dashboards/pipeline-viz.html's
own feature-card rendering for an existing, reusable feature/epic/
story/AC traversal (ADR-028). Reuse it if found. Only build a new
one if neither covers this shape -- and if you do, make it the one
canonical builder fpd-s4 will also call, not a second derivation.

Constraints:
- Read-only. No new route, field, or mechanism for mutating data.
- Match this repo's existing route-handler conventions in
  src/web-ui/routes/ (string-concatenation HTML, escHtml on all
  interpolated values, existing session-auth pattern).
- Open a draft PR when tests pass -- do not mark ready for review.

Oversight level: High (solo-operator repo-wide posture)
```

---

## Sign-off

**Oversight level:** High — per `architecture-guardrails.md`'s solo-operator posture.
**Sign-off required:** Yes.
**Signed off by:** Hamish King (Platform Owner) — 2026-10-15, via direct `AskUserQuestion` reply ("Proceed, all 4").
