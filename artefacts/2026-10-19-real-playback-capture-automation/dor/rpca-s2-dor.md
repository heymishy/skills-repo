# Definition of Ready: Selector derivation generalises beyond one AC, with a manual fallback for ACs with no E2E coverage

**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s2-selector-derivation-from-e2e-specs.md
**Contract:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s2-dor-contract.md
**Date:** 2026-10-19

---

## Contract review

No mismatches between the Contract Proposal and the story's own ACs/test plan — all 4 ACs map 1:1 to the test plan's own unit/integration tests, same shape as the contract describes. ✅ **Contract review passed.**

---

## Checklist — Hard blocks

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| H1 | User story As/Want/So, named persona | ✅ | "operator / engineer" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test in test plan | ✅ | AC1/AC2/AC3 unit, AC4 integration |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | M1, M2 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | No uncovered ACs | ✅ | No gaps — test plan's own Coverage gaps section: "None" |
| H8-ext | Cross-story schema dependency check | ✅ | No data-schema dependency on `rpca-s1` — reuses its CLI/auth plumbing at the code level only, no shared schema object between the two stories |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 2 constraints (ADR-026 reuse, manual-fallback-is-fallback); review Category E scored 5 |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ (N/A) | No CSS-layout-dependent AC — confirmed in both review and test plan ("All 4 ACs are pure local file-parsing logic") |
| H-NFR | NFR profile exists | ✅ | `artefacts/.../nfr-profile.md` exists; no new rows apply to `rpca-s2` — all existing rows scoped to `rpca-s1` only |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | No compliance NFR |
| H-NFR3 | Data classification populated | ✅ | "Internal" (feature-level, inherited) |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | "Hamish King — Platform Owner — 2026-10-19" |
| H-ADAPTER | D37 adapter wiring | ✅ (N/A) | No injectable adapter introduced — pure functions, no `let _x = defaultFn; setX()` pattern |
| H-INF / H-MIG / H-DESIGN | — | ✅ (N/A) | Track flags not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | ✅ No warning — story's own NFR section explicitly states no new NFR beyond `rpca-s1` |
| W2 | Scope stability declared | ✅ No warning — "Stable" |
| W3 | MEDIUM review findings acknowledged | ✅ No warning — 0 MEDIUM findings, nothing to acknowledge |
| W4 | Verification script reviewed by a domain expert | ✅ No warning — all 4 ACs are automated tests with no manual scenario required, unlike `rpca-s1`; no verification script needed beyond the test plan itself |
| W5 | No UNCERTAIN gap-table items | ✅ No warning — all 4 ACs marked 🟢 in the test plan's own gap table |

---

## Standards injection

**Domain tags:** None identified (story's own header: "reuses rpca-s1's own auth/CLI plumbing, no new domain surface")
**Matched standards files:** None new — `rpca-s1`'s own `auth-patterns.md` injection stands for the feature as a whole; this story introduces no new domain surface requiring its own standards lookup.

---

## Oversight level

**Oversight:** High (solo-operator repo-wide posture, per `architecture-guardrails.md`).

---

## Coding Agent Instructions

**Story:** Selector derivation generalises beyond one AC, with a manual fallback for ACs with no E2E coverage
**Contract:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s2-dor-contract.md
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s2-test-plan.md

**Touch points (locked — do not exceed without a DoR contract amendment):**
- `scripts/playback-capture.js` (modify — add new functions only, do not alter existing exported function signatures)
- `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` (new)

**Goal:**
Make every test in the test plan pass. All 4 ACs are fully automatable — no manual scenario, no real secret or network dependency, unlike `rpca-s1`.

**Constraints:**
- No new npm dependencies.
- Do not modify `rpca-s1`'s own existing `authenticateStagingSession`, `runCaptureForFeature`, `runCli`, or `buildScreenshotPath` function signatures — this story adds new, separate functions.
- `deriveSelectorFromSpec` and `loadManualFallback` must not throw on a non-matching input — only `buildCaptureList`'s own per-AC warning path handles the "no match" case; a missing `selectors-manual.json` file is a normal, expected case, not an error.
- Read `.github/standards/web-ui/web-ui-patterns.md`'s own existing path-traversal guard convention before writing `loadManualFallback` — it reads a file path built from `featureSlug`/`storySlug`, so it should follow the same guard pattern `buildScreenshotPath` already uses (post `rpca-s1-hotfix1`), even though this isn't a named AC — treat it as an implicit NFR carried over from the fix already made in this same file.
- Open a draft PR when all tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing it and do not mark ready for review.

**Implementation order:**
1. `deriveSelectorFromSpec` + its unit test (AC1) — lowest-risk, pure string/regex parsing, no file I/O
2. `loadManualFallback` + its unit test (AC2) — file I/O, applies the path-traversal guard convention noted above
3. `buildCaptureList`'s own "neither source" warning path + its unit test (AC3)
4. `buildCaptureList`'s own full multi-AC integration test + summary-count logic (AC4)

- Full regression suite must stay green throughout (`node scripts/run-all-tests.js`).
- No manual verification step required at `/verify-completion` for this story — all 4 ACs are automated.

Oversight level: High (solo-operator repo-wide posture)

---

## Sign-off

**Oversight level:** High — per `architecture-guardrails.md`'s solo-operator posture.
**Sign-off required:** Yes.
**Signed off by:** Hamish King (Platform Owner) — 2026-10-19.

**Proceed: Yes.**
