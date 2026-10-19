# Definition of Ready: Wire the real CLI into skills/feature-playback/SKILL.md's own documented steps

**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s4-wire-cli-into-feature-playback-skill.md
**Contract:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s4-dor-contract.md
**Date:** 2026-10-19

---

## Contract review

**A real finding changed the contract between its first draft and this sign-off.** Tracing the actual code (`runCaptureForFeature` vs. `captureAcScreenshots`/`generateWalkthroughMarkdown`) found the literal CLI entrypoint and `/feature-playback`'s own existing walkthrough/screenshot functions are currently disconnected — the contract was rewritten to describe a real orchestration recipe connecting them, not prose alone, and `decisions.md` now carries a dedicated DESIGN entry (2026-10-19) recording this. No mismatch remains between the (corrected) contract and the story's own ACs/test plan — AC1's own real-invocation-syntax assertion, AC2's own scoping assertion, and AC3's own `decisions.md`-entry assertion are all still satisfiable by the corrected contract. ✅ **Contract review passed, after one correction.**

---

## Checklist — Hard blocks

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| H1 | User story As/Want/So, named persona | ✅ | "platform maintainer" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test in test plan | ✅ | All 3 unit (real-file content assertions) |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | M1 (indirectly — closes the audit-trail gap, doesn't move M1 by itself, stated explicitly) |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0 HIGH, 0 MEDIUM, 1 LOW (acknowledged, non-blocking) |
| H8 | No uncovered ACs | ✅ | Test plan: "Coverage gaps: None" |
| H8-ext | Cross-story schema dependency check | ✅ | No data-schema dependency on `rpca-s1`-`rpca-s3` — references their own real functions by name in documentation text, not a shared schema object |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 2 constraints (Platform change policy, audit-trail preservation); review Category E scored 5 |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ (N/A) | No CSS-layout-dependent AC — documentation-only change, confirmed in both review and test plan |
| H-NFR | NFR profile exists | ✅ | `artefacts/.../nfr-profile.md` exists; no rows apply to `rpca-s4` — documentation-only, no new NFR surface |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | No compliance NFR |
| H-NFR3 | Data classification populated | ✅ | "Internal" (feature-level, inherited) |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | "Hamish King — Platform Owner — 2026-10-19" |
| H-ADAPTER | D37 adapter wiring | ✅ (N/A) | No injectable adapter introduced; `captureAcScreenshots`'s own existing dependency-injection shape is explicitly confirmed unchanged, not a D37 adapter in the first place |
| H-INF / H-MIG / H-DESIGN | — | ✅ (N/A) | Track flags not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | ✅ No warning — "Not applicable" stated explicitly for all 4 categories |
| W2 | Scope stability declared | ✅ No warning — "Stable" |
| W3 | MEDIUM review findings acknowledged | ✅ No warning — 0 MEDIUM; the 1 LOW (1-L1) is explicitly non-blocking per the review's own verdict |
| W4 | Verification script reviewed by a domain expert | ✅ No warning — all 3 ACs are automated real-file-content assertions, same low-risk shape as `rpca-s2`'s own fully-automated story |
| W5 | No UNCERTAIN gap-table items | ✅ No warning — test plan's own gap table: "None" for all 3 ACs |

---

## Standards injection

**Domain tags:** None identified (story's own header: "documentation/SKILL.md change, not application code")
**Matched standards files:** None new.

---

## Oversight level

**Oversight:** High (solo-operator repo-wide posture, per `architecture-guardrails.md`).

---

## Coding Agent Instructions

**Story:** Wire the real CLI into `skills/feature-playback/SKILL.md`'s own documented steps
**Contract:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s4-dor-contract.md
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s4-test-plan.md
**Verification script:** artefacts/2026-10-19-real-playback-capture-automation/verification-scripts/rpca-s4-verification.md

**Touch points (locked — do not exceed without a DoR contract amendment):**
- `skills/feature-playback/SKILL.md` (modify — Step 2, Step 3, "What this skill does NOT do" only)
- `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/decisions.md` (modify — append one new entry only, no edits to the 5 original entries)
- `tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js` (new)

**Goal:**
Make every test in the test plan pass. All 3 ACs are fully automatable (real-file content assertions) — no manual scenario, no real secret or network dependency.

**Constraints:**
- Do not rewrite or delete any of the 5 original RISK-ACCEPT entries in `feature-playback-demo`'s own `decisions.md` — append one new superseding entry only.
- Step 2-3's own rewritten text must describe the real orchestration accurately (see `decisions.md`'s own DESIGN entry, 2026-10-19, for the exact sequence: auth → real browser/page → `buildCaptureList` → `captureAcScreenshots` with real input → optional `captureVideoForClip` → `embedScreenshotPaths`) — not just prose that sounds consistent without actually connecting the mechanisms.
- State the video-embedding gap (no `embedVideoPaths`-equivalent function exists) explicitly in both Step 3 and "What this skill does NOT do" — do not silently omit it or imply it's already automated.
- Open a draft PR when the automatable tests pass — do not mark ready for review (`skills/feature-playback/SKILL.md` is governed per CLAUDE.md's Platform change policy; PR required).
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing it and do not mark ready for review.

**Implementation order:**
1. Rewrite `skills/feature-playback/SKILL.md`'s Step 2-3 + "What this skill does NOT do" + its own unit test (AC1, AC2)
2. Append the new superseding `decisions.md` entry + its own unit test (AC3)

- Full regression suite must stay green throughout (`node scripts/run-all-tests.js`).
- No manual verification step required at `/verify-completion` for this story — all 3 ACs are automated.

Oversight level: High (solo-operator repo-wide posture)

---

## Sign-off

**Oversight level:** High — per `architecture-guardrails.md`'s solo-operator posture.
**Sign-off required:** Yes.
**Signed off by:** Hamish King (Platform Owner) — 2026-10-19.

**Proceed: Yes.**
