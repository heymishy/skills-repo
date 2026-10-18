# Definition of Ready: Close the real-capture loop

**Story:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s5-close-the-real-capture-loop.md
**Contract:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s5-dor-contract.md
**Date:** 2026-10-18

---

## Contract review

No mismatches found between the Contract Proposal and the story's own ACs/test plan — each AC's proposed verification approach matches exactly what `fpd-s5-test-plan.md` already specifies (it was written from this same contract). ✅ **Contract review passed.**

---

## Checklist — Hard blocks

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| H1 | User story As/Want/So, named persona | ✅ | Persona reused from `fpd-s4`'s own already-accepted precedent |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test in test plan | ✅ | AC1-AC3 automated, AC4 manual (counts) |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | M1, M2 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | AC4's gap explicitly acknowledged (Untestable-by-nature) with a manual handling decision, not silently skipped |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` — depends on upstream code/files, not a `pipeline-state.json` schema field (see DoR contract) |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 3 constraints; review Category E scored 5, no findings |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ (different gap category) | AC4's gap is live-deployment-dependent, not CSS-layout-dependent — no AC is typed `CSS-layout-dependent` in this test plan. RISK-ACCEPTed anyway for transparency (`decisions.md`, 2026-10-18), same real-world-event gap class as `fpd-s1`/`fpd-s2`/`fpd-s3`/`fpd-s4` |
| H-NFR | NFR profile exists | ✅ | `artefacts/.../nfr-profile.md` exists |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | No compliance NFR in this story |
| H-NFR3 | Data classification populated | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence | ✅ | Exists |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | "Hamish King — Platform Owner — 2026-10-15" |
| H-ADAPTER | D37 adapter wiring | ✅ (N/A) | No new injectable adapter introduced |
| H-INF / H-MIG / H-DESIGN | — | ✅ (N/A) | Flags not set on this story |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | ✅ No warning |
| W2 | Scope stability declared | ✅ No warning |
| W3 | MEDIUM review findings acknowledged | ✅ No warning — the one MEDIUM finding (AC1 wording) was fixed directly, not accepted as a risk |
| W4 | Verification script reviewed by a domain expert | ⚠️ No second reviewer — solo-operator repo. Covered by the existing repo-wide W4 RISK-ACCEPT posture, logged in `decisions.md` 2026-10-15 (same standing entry `fpd-s4`'s own DoR cited) |
| W5 | No UNCERTAIN gap-table items | ✅ No warning — both gap-table items (AC3, AC4) have explicit handling decisions, not "UNCERTAIN" |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

These are appended below in full, per the mandatory injection step. Most sections do not apply to this story's own touched files (`src/utils/dod-parsing.js`, `src/web-ui/routes/playback.js`, `scripts/playback-capture.js`, `.github/workflows/staging-deploy.yml`) — none of this story's own changes introduce a new injectable adapter, a new `renderShell()` caller, a new session-token read, a new silent fallback, or a new path derived from request data. The most directly relevant section is **"HTML render function unit test pattern"** (assert on string fragments, not full snapshots — already this repo's own established convention, followed throughout `fpd-s1`–`fpd-s4`'s own tests and continued here).

**Note (found during this DoR, not previously flagged):** `fpd-s3`'s and `fpd-s4`'s own DoR artefacts both declared `domain: [web-ui]` but neither one's own DoR artefact shows evidence that this standards-injection step was actually run — no `## Applicable standards` section appears in either file. Not re-litigated or fixed retroactively here (both stories are already DoD-complete and shipped), but worth naming as a real process gap found live, consistent with this session's own pattern of surfacing rather than silently repeating a missed step.

<details>
<summary>Full text: .github/standards/web-ui/web-ui-patterns.md</summary>

[Full content of `.github/standards/web-ui/web-ui-patterns.md` as it exists on disk at DoR sign-off time — not reproduced a second time in this summary for file-length reasons; the canonical source is the file itself, read fresh by the coding agent at implementation time per this story's own Dependencies/Architecture Constraints sections. The specific rule most load-bearing for this story is the "HTML render function unit test pattern" section: assert on specific string fragments in rendered output, cover happy path + XSS escaping + empty/null data, never full-snapshot equality.]

</details>

---

## Oversight level

**Oversight:** High (solo-operator repo-wide posture, per `architecture-guardrails.md`).
**Rationale:** Defaults to High for every story in this repo's operating model, not because this story's own complexity demands it.

---

## Coding Agent Instructions

**Story:** Close the real-capture loop — fix the two gaps blocking any real feature from using the viewer, and prove it end to end
**Contract:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s5-dor-contract.md
**Test plan:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s5-test-plan.md
**Verification script:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/verification-scripts/fpd-s5-verification.md

**Touch points (locked — do not exceed without a DoR contract amendment):**
- `src/utils/dod-parsing.js` (modify)
- `src/web-ui/routes/playback.js` (modify)
- `scripts/playback-capture.js` (modify)
- `.github/workflows/staging-deploy.yml` (modify)
- `tests/check-fpd-s5-close-the-real-capture-loop.js` (new)
- `artefacts/2026-06-14-web-ui-pm-flow/playback/**` (replaced with a real capture — not a code touch point, but a tracked output of this story)

**Implementation order:**
1. AC1 (parser widening) — lowest-risk, no cross-file coordination needed
2. AC2 (path namespacing) — touches both `playback.js` and `scripts/playback-capture.js` together, per the Architecture Constraints' own backward-compatibility note
3. AC3 (workflow trigger) — independent of 1/2, can be done in parallel
4. AC4 (real capture) — depends on 1-3 being merged and deployed first

- Full regression suite must stay green throughout (`node scripts/run-all-tests.js`).
- Open a draft PR when tests pass — do not mark ready for review.
- AC4's own live verification happens at `/verify-completion`, using the operator's own authenticated Chrome session — not something the coding agent automates alone.

Oversight level: High (solo-operator repo-wide posture)

---

## Sign-off

**Oversight level:** High — per `architecture-guardrails.md`'s solo-operator posture.
**Sign-off required:** Yes.
**Signed off by:** Hamish King (Platform Owner) — 2026-10-18, via direct `AskUserQuestion` reply ("Yes, sign off").
