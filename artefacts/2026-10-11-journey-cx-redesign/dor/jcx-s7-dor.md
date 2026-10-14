# Definition of Ready Checklist

## Definition of Ready: Fix the misleading save-error color, the view-reset-on-save standards violation, and empty-state/entry-point/spacing polish

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s7.md
**Test plan reference:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s7-test-plan.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-14

---

## Contract Proposal

See `artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s7-dor-contract.md` for the full proposal.

**Summary:** Pure presentation/interaction-layer fixes, all within `journeys.js`'s own existing stage-panel/stage-add/swimlane-grid markup and script — a real correctness bug (error state rendered in the success color), a confirmed violation of this repo's own `web-ui-patterns.md` reload-vs-DOM-patch rule, a bigger single-click entry point into the existing edit panel, and empty-state/spacing CSS polish. No query, route, or data-model change. Repo-wide grep confirmed every touched class/pattern exists only in `journeys.js`.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs and the test plan's own coverage table. Both MEDIUM findings from `/review` run 1 (1-M1 save-indicator timer race, 1-M2 click-target double-fire) are resolved by dedicated test-plan scenarios (AC1c, AC3b) and named directly in the contract's own file-touch descriptions above — not deferred, not left implicit.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" — consistent with every other story in this epic |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | Confirmed against `jcx-s7-test-plan.md`'s own AC coverage table (9 tests total: 8 unit, 1 E2E) |
| H4 | Out-of-scope section populated | ✅ | 4 items, each with a stated reason (deferred-not-dropped) |
| H5 | Benefit linkage references a named metric | ✅ | M1 |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/jcx-s7-review-1.md` — PASS, 0 HIGH; 2 MEDIUM (both resolved at test-plan, see Contract Review above), 1 LOW (resolved directly — `benefit-metric.md`'s own coverage matrix updated alongside this review) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 unaddressed gaps — AC3's visual/size portion is CSS-layout-dependent and covered by a real E2E test, not left as a gap |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `dodStatus` — dependencies `jcx-s6` and `jcx-hotfix4` both show `dodStatus: "complete"` — satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 4 bullets: no data-model change, no new route, reuse of the page's own existing danger-color convention, `jcx-s6`'s own grid structure unchanged |
| H-E2E | CSS-layout-dependent AC gate | ✅ | AC3's visual/size portion is CSS-layout-dependent; E2E tooling (Playwright) already configured (ADR-018), real E2E test assigned — not a tooling gap |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-11-journey-cx-redesign/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — "Hamish King — Platform Owner — 2026-10-11" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter — pure rendering/interaction change |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema change |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent — this repo has no `DESIGN.md`/token system; unchanged here, consistent with every prior UI story in this codebase |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | 1-M1 and 1-M2 both resolved directly in the test plan (dedicated AC1c/AC3b scenarios) — neither deferred | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet reviewed; same established pattern as every other story this session | Hamish King (acknowledged, proceeding) |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps beyond the already-classified AC3 visual portion | — |

---

## Standards injection

**Domain tags:** `[web-ui, ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/ui/ui-standards.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- **"Client-side DOM patch vs. full page reload after a POST action"** — this is the standard AC2 directly closes a violation of. The journey canvas is NOT one of the 3 named reload-is-correct pages (`products.js`, `settings.js`, `kanban-view.js`); it has live, in-progress client state (the open edit panel, typed-but-unsaved field text), so it must patch the DOM in place per this rule — exactly what AC2 requires.
- **"Inventory every render site of a shared component before writing a DoR contract, repo-wide"** — directly applied above: confirmed every touched class/pattern (`sw-stage-panel-saved`, `sw-stage-edit`, `sw-cx-grid-row*`, the reload call) exists only in `journeys.js`.

### .github/standards/ui/ui-standards.md (matched domain: ui)

⚠️ Same status as `jcx-s6-dor.md` noted: unpopulated template boilerplate not reflecting this repo's actual stack. Its generic "Accessibility: WCAG 2.1 AA, colour never the only signal" guidance is directly relevant to AC1 (the error state must not rely on color alone either — text content `"Failed to save — Retry"` already carries the meaning independent of color) and is already reflected in the story's own NFR section.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Fix the misleading save-error color, the view-reset-on-save standards
violation, and empty-state/entry-point/spacing polish -- artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s7.md
Test plan: artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s7-test-plan.md
Contract: artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s7-dor-contract.md

Goal:
Make every test in the test plan pass (9 tests: 8 unit, 1 E2E). Do not
add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- This is a presentation/interaction-layer fix ONLY, all within
  src/web-ui/routes/journeys.js -- do not touch handlePostJourneyStage,
  handlePatchJourneyStage, handleGetJourneyCanvas's own query, the
  Delivery tab's own render branch, the Canvas/drawflow init logic, or
  jcx-s6's own grid column/row structure (grid-template-columns,
  minmax(200px,1fr)).
- AC1: give the error state ITS OWN distinct class, reusing this page's
  existing sw-stage-reorder-error/sw-feature-mapping-warning danger-color
  convention -- do not invent a new color token. Track a per-indicator
  save-sequence token so a stale success-clear setTimeout from an earlier
  save can never clear a later save's state (this is review finding
  1-M1 -- test AC1c is the exact regression test for it).
- AC2: patch the DOM using the stage-add POST response's own returned
  {id, name, position} fields -- do not change handlePostJourneyStage's
  response shape. Remove window.location.reload() from this one success
  path only; do not touch any other reload call in this file if one
  exists elsewhere for an unrelated action.
- AC3: add the new click listener on the header cell/drawflow node
  itself, not by replacing the existing .sw-stage-edit link's own
  listener -- both must coexist. Test AC3b (clicking the link itself
  must still produce exactly ONE open, not a double-fire) is the exact
  regression test for review finding 1-M2 -- do not consider this AC
  done until that test passes, not just AC3a.
- AC4: use the SAME muted-treatment class for both empty field values
  and an empty/default stage name -- one shared CSS rule, not two
  separate ones, matching the spike's own "same root cause, same fix"
  framing. A field with only whitespace must still count as empty
  (.trim() check), matching this codebase's own existing convention.
- AC5: change padding/column-gap values only -- do not touch
  grid-template-columns or any other rule in the same selector block.
- Do NOT implement anything from the story's own Out of Scope section
  (field-chunking, row-label font-size, curve height, mid-sequence
  stage insertion) -- all 4 are real findings from the same spike but
  explicitly deferred; building them here is scope creep, not a bonus.
- If AC3's E2E scenario hits the already-tracked dashboard CSRF gap
  (the same one jcx-s3/jcx-s6 both hit), follow their own established
  RISK-ACCEPT pattern at /verify-completion rather than treating it as
  a blocker to fix here.
- Open a draft PR when all tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a
  PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — tech lead awareness only.
**Signed off by:** Not required. Shared with Hamish King — Platform Owner (acting tech lead for this feature) — 2026-10-14.
