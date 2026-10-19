# Definition of Ready: Video capture wired for real, reusing the existing caption/transcript adapter

**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s3-video-capture-wired-for-real.md
**Contract:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s3-dor-contract.md
**Date:** 2026-10-19

---

## Contract review

No mismatches between the Contract Proposal and the story's own ACs/test plan — AC1's manual scenario, AC2/AC3's unit tests, and the touch points all match the test plan exactly. ✅ **Contract review passed.**

---

## Checklist — Hard blocks

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| H1 | User story As/Want/So, named persona | ✅ | "operator/engineer" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test in test plan | ✅ | AC1 manual, AC2/AC3 unit |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | M1, M2 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0 HIGH, 1 MEDIUM (carried forward, acknowledged below) |
| H8 | No uncovered ACs | ✅ | AC1's gap acknowledged with explicit handling (manual + RISK-ACCEPT) |
| H8-ext | Cross-story schema dependency check | ✅ | No data-schema dependency on `rpca-s1`/`rpca-s2` — reuses the auth function and `fpd-s2`'s own video functions at the code level only |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 3 constraints (ADR-026 reuse, D37 adapter preserved, shared auth); review Category E scored 5 |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ (different gap category) | AC1's gap is external-dependency (same root cause as `rpca-s1` AC1/AC2), not CSS-layout-dependent — RISK-ACCEPTed under the existing `rpca-s1`/`rpca-s3` entry in `decisions.md` (2026-10-19) |
| H-NFR | NFR profile exists | ✅ | `artefacts/.../nfr-profile.md` exists; no new rows apply to `rpca-s3` — story's own NFR section states none beyond `rpca-s1` |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | No compliance NFR |
| H-NFR3 | Data classification populated | ✅ | "Internal" (feature-level, inherited) |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | "Hamish King — Platform Owner — 2026-10-19" |
| H-ADAPTER | D37 adapter wiring | ✅ | `generateCaptionsForVideo` is an existing D37 adapter whose stub already throws correctly (confirmed in current `scripts/playback-capture.js`); this story adds a new caller, does not rewire it — no new adapter introduced, so D37's 4 mandatory items apply to the existing adapter, not a new one |
| H-INF / H-MIG / H-DESIGN | — | ✅ (N/A) | Track flags not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | ✅ No warning |
| W2 | Scope stability declared | ✅ No warning — "Stable" |
| W3 | MEDIUM review findings acknowledged | ✅ No warning — 1-M1 (carried forward from `rpca-s1`'s own 1-M1) already covered by the existing `decisions.md` RISK-ACCEPT entry dated 2026-10-19, which explicitly names `rpca-s3` AC1 |
| W4 | Verification script reviewed by a domain expert | ⚠️ Covered by the standing W4 RISK-ACCEPT posture already logged for this feature's own prior stories |
| W5 | No UNCERTAIN gap-table items | ✅ No warning — AC1's gap type is "External-dependency" with explicit handling, not "UNCERTAIN" |

---

## Standards injection

**Domain tags:** None identified (story's own header: "reuses rpca-s1's own auth/CLI plumbing, no new domain surface")
**Matched standards files:** None new — `rpca-s1`'s own `auth-patterns.md` injection stands for the feature as a whole.

---

## Oversight level

**Oversight:** High (solo-operator repo-wide posture, per `architecture-guardrails.md`).

---

## Coding Agent Instructions

**Story:** Video capture wired for real, reusing the existing caption/transcript adapter
**Contract:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s3-dor-contract.md
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s3-test-plan.md
**Verification script:** artefacts/2026-10-19-real-playback-capture-automation/verification-scripts/rpca-s3-verification.md

**Touch points (locked — do not exceed without a DoR contract amendment):**
- `scripts/playback-capture.js` (modify — add `captureVideoForClip` only)
- `tests/check-rpca-s3-video-capture-wired-for-real.js` (new)

**Goal:**
Make every automatable test in the test plan pass (AC2, AC3). AC1's own real-world claim is RISK-ACCEPTed for automated execution — do not attempt to retrieve or fabricate a secret value; the operator runs that scenario manually.

**Constraints:**
- Do not modify `captureVideoRecording`, `generateCaptionsForVideo`, or `authenticateStagingSession`'s own existing signatures or logic.
- The failure-cleanup path must actually delete any partial file Playwright wrote — not just catch and rethrow the error without checking the filesystem.
- Read `.github/architecture-guardrails.md`'s own D37 adapter rule before implementing — confirm `generateCaptionsForVideo`'s stub default still throws correctly; this story must not weaken it.
- Open a draft PR when the automatable tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing it and do not mark ready for review.

**Implementation order:**
1. `captureVideoForClip`'s own success path (reuses `captureVideoRecording`-style context setup inline, calls `generateCaptionsForVideo`) + AC2's own unit test
2. The failure-cleanup wrapper + AC3's own unit test

- Full regression suite must stay green throughout (`node scripts/run-all-tests.js`).
- AC1's own manual scenario happens at `/verify-completion`, run by the operator with the real secret — not something the coding agent automates.

Oversight level: High (solo-operator repo-wide posture)

---

## Sign-off

**Oversight level:** High — per `architecture-guardrails.md`'s solo-operator posture.
**Sign-off required:** Yes.
**Signed off by:** Hamish King (Platform Owner) — 2026-10-19.

**Proceed: Yes.**
