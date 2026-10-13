# Definition of Ready Checklist

## Definition of Ready: Restructure the Customer experience tab into a real timeline + swimlane grid

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s6.md
**Test plan reference:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s6-test-plan.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-13 (updated — AC7 added after operator review of a published visual mockup and a deepened spike)

**Visual mockup:** `https://claude.ai/artifact/Vn33thqFAs8heUaWDZUJNK` — before/after comparison with representative data, reviewed and approved by the operator before this sign-off.

---

## Contract Proposal

See `artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s6-dor-contract.md` for the full proposal.

**Summary:** Pure presentation-layer restructure of `handleGetJourneyCanvas`'s own Customer-experience-tab render branch in `journeys.js` — CSS grid replacing the vertical stack, emotion curve moved into its own row with stage labels and an 80%-width threshold, two new swimlane rows (customer actions, touchpoints) surfacing already-queried data, a dedicated container class distinguishing the tab from Delivery, the existing accessible-linear-structure mechanism rebuilt to cover the new grid, and (added in this update) horizontal scroll with pinned row labels for journeys with more stages than fit the viewport. No query, route, or data-model change. Repo-wide grep confirmed `journeys.js` is the only render site touching this markup (per the `web-ui-patterns.md` "inventory every render site" standard).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 7 ACs and the test plan's own coverage table. No mismatches found. The AC3/AC6 soft-language concern the `/review` run 1 (1-M1) raised is resolved by the contract's own concrete 80%-width threshold and `sw-cx-swimlane-grid` class marker. AC7's own relative threshold concern (`/review` run 2, 2-L1) is resolved by pinning the test fixture (1280×800 viewport, 8-stage journey).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" — consistent with every other story in this epic |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 7 ACs (AC7 added this update) |
| H3 | Every AC has ≥1 test | ✅ | Confirmed against `jcx-s6-test-plan.md`'s own AC coverage table |
| H4 | Out-of-scope section populated | ✅ | 4 items, each with a stated reason |
| H5 | Benefit linkage references a named metric | ✅ | M1 |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/jcx-s6-review-2.md` — PASS, 0 HIGH across both runs; run 1: 1 MEDIUM (resolved at test-plan), 2 LOW; run 2: 1 LOW (resolved at test-plan, see note below) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps — AC1–AC3/AC7's CSS-layout-dependent status is covered by real E2E tests, not left as an unaddressed gap |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `dodStatus` — dependencies `jcx-s3` and `jcx-s4` both show `dodStatus: "complete"` — satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 4 bullets: no data-model change, no new chart dependency, Delivery/Canvas both explicitly out of scope |
| H-E2E | CSS-layout-dependent AC gate | ✅ | AC1–AC3, AC7 are CSS-layout-dependent; E2E tooling (Playwright) is already configured (ADR-018) and real E2E tests are assigned — not a tooling gap, no RISK-ACCEPT needed |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-11-journey-cx-redesign/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — "Hamish King — Platform Owner — 2026-10-11" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter — pure rendering change |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema change |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent — this repo has no `DESIGN.md`/token system; every prior UI story in this codebase (`jcx-s1`, `jcx-s3`, `jcx-s4`) used literal CSS values with no token layer, unchanged here (review finding 1-L2) |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | 1-M1 resolved directly in the test plan (concrete 80%-width threshold, `sw-cx-swimlane-grid` class check); 2-L1 resolved directly in the test plan (pinned 1280×800/8-stage fixture) — neither deferred | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet reviewed; same established pattern as every other story this session | Hamish King (acknowledged, proceeding) |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps at all | — |

---

## Standards injection

**Domain tags:** `[web-ui, ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/ui/ui-standards.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- **"Inventory every render site of a shared component before writing a DoR contract, repo-wide"** — directly applied above: `grep -rn "sw-emotion-curve|sw-journey-stage|sw-persona-card" src/` confirmed `journeys.js` is the only render site, so the contract's single-file touch-point list is complete, not file-scoped guesswork.
- **"Every `renderShell()` caller MUST supply the Products-nav sidebar data"** — not applicable; this story doesn't touch `renderShell()` call sites, only the canvas body content within an existing shell.

### .github/standards/ui/ui-standards.md (matched domain: ui)

⚠️ **This file is unpopulated template boilerplate** (`[e.g. ...]` placeholder content — component library/Redux/React Query examples that do not reflect this repo's actual stack: raw `http.createServer` + server-rendered HTML strings, no frontend framework). Its generic "Accessibility: WCAG 2.1 AA, colour never the only signal" guidance is still directly relevant and already reflected in AC4's own text-label requirement (carried over from `jcx-s3`'s own established MC-A11Y-02 convention) and AC5's accessible-linear-structure requirement — but the file itself is not a real, project-specific source to cite further. No other sections of this file apply.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Restructure the Customer experience tab into a real timeline + swimlane grid -- artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s6.md
Test plan: artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s6-test-plan.md
Contract: artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s6-dor-contract.md

Goal:
Make every test in the test plan pass (9 tests: 2 unit, 2 integration,
4 E2E, 1 NFR). Do not add scope, behaviour, or structure beyond what the
tests and ACs specify.

Reference: a visual mockup of the intended result (approved by the
operator) is published at https://claude.ai/artifact/Vn33thqFAs8heUaWDZUJNK
-- read it for the intended look/structure before starting, especially
the swimlane row layout and the persona-header placement.

Constraints:
- This is a presentation-layer restructure ONLY -- do not change any
  query in handleGetJourneyCanvas. The stage SELECT already returns
  customer_actions/touchpoints/channel; this story surfaces fields
  already fetched, it does not fetch anything new.
- Do NOT touch the Delivery tab's own render branch or the Canvas
  (ic-s1-ic-s4) view -- both explicitly out of scope.
- Do NOT split the emotion curve into positive/negative rows, and do
  NOT reframe the persona card with first-person "I want/I need"
  language -- both are real, reference-grounded ideas but are logged as
  deferred follow-ups in decisions.md precisely because they touch the
  data model; building them here is out-of-process scope creep, not a
  bonus.
- AC3's 80%-width threshold and AC6's sw-cx-swimlane-grid class check
  are the EXACT test assertions -- do not substitute a different
  threshold or a different class name without updating the test plan
  first.
- AC7: each row's own content area (not the row label) becomes
  horizontally scrollable once stage count exceeds the viewport --
  overflow-x: auto, tabindex="0" for keyboard reachability. The label
  column must sit OUTSIDE that scrollable region (its own grid column,
  not scrolled) so it never moves. Test fixture is fixed: 1280x800
  viewport, 8-stage journey -- do not substitute a different stage
  count or viewport without updating the test plan first.
- Rebuild (don't lose) jcx-s3's own existing accessible-linear-structure
  mechanism (the visually-hidden <ul> listing every stage) -- extend it
  to cover the full new row set (actions, touchpoints now included),
  don't replace it with something that regresses AC5's own screen-reader
  coverage.
- Before finalizing any touch-point list change mid-implementation,
  repeat the repo-wide grep check (web-ui-patterns.md's own "inventory
  every render site" standard) if you discover the markup renders
  anywhere you didn't expect.
- Open a draft PR when all tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a
  PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — tech lead awareness only.
**Signed off by:** Not required. Shared with Hamish King — Platform Owner (acting tech lead for this feature) — 2026-10-13.
