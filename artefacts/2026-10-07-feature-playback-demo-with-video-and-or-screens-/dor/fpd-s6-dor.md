# Definition of Ready: Add an at-a-glance coverage summary to the top of the playback review page

**Story:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s6-review-page-status-summary.md
**Contract:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s6-dor-contract.md
**Date:** 2026-10-18

---

## Contract review

No mismatches found between the Contract Proposal and the story's own ACs/test plan — each AC's proposed verification approach matches exactly what `fpd-s6-test-plan.md` already specifies. ✅ **Contract review passed.**

---

## Checklist — Hard blocks

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| H1 | User story As/Want/So, named persona | ✅ | Persona reused from `fpd-s5`'s own already-accepted precedent |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test in test plan | ✅ | 3 unit + 2 integration + 1 NFR, no gaps |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | M1, M2 |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | "None" in gap table |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` — depends on upstream code/files (`fpd-s3`, `fpd-s4`), not a `pipeline-state.json` schema field, same precedent as `fpd-s5` |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 3 constraints incl. `MC-A11Y-02`; review Category E scored 3 (one MEDIUM, resolved same session), no HIGH |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ (N/A) | No AC typed `CSS-layout-dependent` — all 4 ACs are pure server-side string-rendering logic |
| H-NFR | NFR profile exists | ✅ | `artefacts/.../nfr-profile.md` exists |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | No compliance NFR in this story |
| H-NFR3 | Data classification populated | ✅ | "Internal" (feature-level NFR profile) |
| H-NFR-profile | NFR profile presence | ✅ | Exists |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | "Hamish King — Platform Owner — 2026-10-15" |
| H-ADAPTER | D37 adapter wiring | ✅ (N/A) | No new injectable adapter introduced |
| H-INF / H-MIG / H-DESIGN | — | ✅ (N/A) | Track flags not set on this feature |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | ✅ No warning |
| W2 | Scope stability declared | ✅ No warning |
| W3 | MEDIUM review findings acknowledged | ✅ No warning — 1-M1 logged as a SCOPE decision in `decisions.md`; 1-M2 fixed directly in the story (not risk-accepted, actually resolved) |
| W4 | Verification script reviewed by a domain expert | ⚠️ No line-by-line read-through this session — covered by the existing standing W4 RISK-ACCEPT posture logged in `decisions.md`, 2026-10-15 (first logged for `fpd-s1`–`fpd-s4`, cited again by `fpd-s5`'s own DoR, cited here for `fpd-s6`) |
| W5 | No UNCERTAIN gap-table items | ✅ No warning — test plan gap table states "None" |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

Most sections do not apply to this story's own single touched file (`src/web-ui/routes/playback.js`) — this story introduces no new injectable adapter, no new `renderShell()` caller, no new session-token read, no new silent fallback, and no new path derived from request data. The directly relevant section is **"HTML render function unit test pattern"** (assert on string fragments, not full snapshots — already this repo's own established convention, followed throughout `fpd-s1`–`fpd-s5`'s own tests and continued here).

<details>
<summary>Full text: .github/standards/web-ui/web-ui-patterns.md</summary>

[Full content of `.github/standards/web-ui/web-ui-patterns.md` as it exists on disk at DoR sign-off time — not reproduced a second time here for file-length reasons; the canonical source is the file itself, read fresh by the coding agent at implementation time. The load-bearing rule for this story is the "HTML render function unit test pattern" section: assert on specific string fragments in rendered output, cover happy path + XSS escaping + empty/null data, never full-snapshot equality.]

</details>

---

## Oversight level

**Oversight:** High (solo-operator repo-wide posture, per `architecture-guardrails.md`).
**Rationale:** Defaults to High for every story in this repo's operating model, not because this story's own complexity demands it.

---

## Coding Agent Instructions

**Story:** Add an at-a-glance coverage summary to the top of the playback review page
**Contract:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/dor/fpd-s6-dor-contract.md
**Test plan:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s6-test-plan.md
**Verification script:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/verification-scripts/fpd-s6-verification.md

**Touch points (locked — do not exceed without a DoR contract amendment):**
- `src/web-ui/routes/playback.js` (modify)
- `tests/check-fpd-s6-review-page-coverage-summary.js` (new)

**Goal:**
Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

**Constraints:**
- No new npm dependencies — Node.js built-ins only.
- No Express — raw `http.createServer` conventions already used in `playback.js`.
- `escHtml()` reuse is not required for the summary's own dynamic values (integer counts only, no user-supplied or model-supplied strings) — but do not introduce any new string interpolation into the summary without routing it through `escHtml()` first, per `html-shell.js`'s own convention.
- `MC-A11Y-02`: the full-coverage vs. partial-coverage distinction (AC3) MUST be carried by differing text, not a CSS class/colour alone.
- Architecture standards: read `.github/architecture-guardrails.md` and `.github/standards/web-ui/web-ui-patterns.md` before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

**Implementation order:**
1. `computeAcCoverageSummary` (pure function, no rendering) — lowest-risk, independently unit-testable first
2. `renderCoverageSummaryHtml` (pure rendering function, consumes step 1's output)
3. Wire both into `renderPlaybackReviewHtml`, inserted between the existing Scope/Benefit card and the epic/story sections
4. Integration tests (AC1 placement, AC4 regression) last, once the wiring is in place

- Full regression suite must stay green throughout (`node scripts/run-all-tests.js`).

Oversight level: High (solo-operator repo-wide posture)

---

## Sign-off

**Oversight level:** High — per `architecture-guardrails.md`'s solo-operator posture.
**Sign-off required:** Yes.
**Signed off by:** Hamish King (Platform Owner) — 2026-10-18.
