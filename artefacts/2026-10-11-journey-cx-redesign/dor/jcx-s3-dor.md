# Definition of Ready Checklist

## Definition of Ready: Connected emotion curve across stages on the Customer experience tab

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s3.md
**Test plan reference:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s3-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01QZrWGeUJn2RfzDjVPZFwLC)
**Date:** 2026-10-11

---

## Contract Proposal

**What will be built:**
An inline SVG emotion curve rendered within the existing Customer experience tab's own HTML (`handleGetJourneyCanvas` in `src/web-ui/routes/journeys.js`), reading the already-shipped `emotion` field per stage. Points positioned by emotion value (`positive` highest, `negative` lowest, `neutral`/`mixed` in between), connected by a line, with an explicit empty-state marker for stages with no `emotion` set, and a full empty state when no stage has any emotion data. Each point carries a text label (reusing the existing emotion-chip text convention). No new npm dependency.

**What will NOT be built:**
A charting library (unless a direct comparison later justifies one — not expected). Inline emotion-editing from the curve itself (the existing side-panel select remains the only editing path). Per-stage illustration.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Real Playwright browser, measure each point's own computed Y-position | E2E |
| AC2 | Real Playwright browser, assert a distinct empty-state marker renders for the unset stage | E2E |
| AC3 | Real Playwright browser, assert the whole-curve empty state renders | E2E |
| AC4 | Rendered-DOM text-label assertion per point | unit |
| AC5 | Rendered-DOM ARIA/structure assertion | unit |

**Assumptions:**
None beyond what's already stated in the story's own Assumptions-adjacent NFRs.

**Estimated touch points:**
Files: `src/web-ui/routes/journeys.js` (emotion curve rendering added to `handleGetJourneyCanvas`'s own output), `tests/e2e/jcx-s3-emotion-curve.spec.js` (new)
Services: None
APIs: None new — pure rendering addition to the existing canvas route's own response.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs and the test plan's own coverage table, including the `CSS-layout-dependent` classification for AC1–AC3. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | Confirmed against `jcx-s3-test-plan.md`'s own AC coverage table |
| H4 | Out-of-scope section populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | M1, M3 |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/jcx-s3-review-1.md` — PASS, 0 HIGH/MEDIUM, 1 LOW (retrospective-only, no action) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies: "None — reuses the already-shipped `emotion` field" |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites "no new npm dependency" precedent (`ic-s1` spike), MC-A11Y-02 |
| H-E2E | CSS-layout-dependent AC gate | ✅ | AC1–AC3 typed `CSS-layout-dependent`; E2E tooling IS configured (Playwright, ADR-018) and a real spec is named (`tests/e2e/jcx-s3-emotion-curve.spec.js`) — gate passes without needing a RISK-ACCEPT |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-11-journey-cx-redesign/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — "Hamish King — Platform Owner — 2026-10-11" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema change |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | None (0 MEDIUM) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet reviewed; same established pattern as every prior story | Hamish King (acknowledged, proceeding) |
| W5 | No UNCERTAIN items in gap table | ✅ | Gap table entries are real E2E tests, not uncertain | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- No sections directly load-bearing beyond the already-noted no-new-npm-dependency precedent and MC-A11Y-02 colour-plus-label convention, both already cited in Architecture Constraints.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Connected emotion curve across stages on the Customer experience tab -- artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s3.md
Test plan: artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s3-test-plan.md

Goal:
Make every test in the test plan pass (5 tests: 2 unit, 3 E2E). Do
not add scope, behaviour, or structure beyond what the tests and ACs
specify.

Constraints:
- Inline SVG only -- do NOT add a charting library (npm dependency)
  without first running a direct comparison and logging it in
  decisions.md, matching ic-s1's own established precedent.
- MC-A11Y-02: every curve point MUST carry a text label alongside
  its colour -- never colour alone. Reuse the existing emotion-chip
  text convention (confirmed in journeys.js line ~608), do not
  invent a new one.
- Write the E2E spec (tests/e2e/jcx-s3-emotion-curve.spec.js)
  following ep1-s3/ic-s2/ic-s3/ic-s4's own established structure and
  seeding helpers (seedJourneyWithStages). It will SKIP locally
  without DATABASE_URL set -- expected, matches established
  precedent.
- Empty-state handling (AC2, AC3) is NOT optional/nice-to-have --
  existing journeys' emotion data is mostly empty today (confirmed
  via /clarify), so this is the common case most operators will see
  first, not an edge case.
- Architecture standards: read .github/architecture-guardrails.md
  before implementing.
- Open a draft PR when all tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for
  review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness only.
**Signed off by:** Not required. Shared with Hamish King — Platform Owner (acting tech lead for this feature) — 2026-10-11.
