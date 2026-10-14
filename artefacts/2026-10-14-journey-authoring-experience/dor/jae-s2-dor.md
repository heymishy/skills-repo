# Definition of Ready Checklist

## Definition of Ready: Collapse stage creation into one guided action — the edit panel opens automatically after naming a new stage

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s2.md
**Test plan reference:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s2-test-plan.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-14

---

## Contract Proposal

See `artefacts/2026-10-14-journey-authoring-experience/dor/jae-s2-dor-contract.md` for the full proposal.

**Summary:** One new call (`openPanel(resp.id)`) added to the existing stage-add success handler; `openPanel` itself gains a save-indicator reset at the start of every call (closing review finding 1-H1). No new route, no new markup beyond what already exists.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs and the test plan's own coverage table, including AC5's own regression test for the review-found defect.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | Confirmed against `jae-s2-test-plan.md`'s own AC coverage table |
| H4 | Out-of-scope section populated | ✅ | 4 items, each with a stated reason |
| H5 | Benefit linkage references a named metric | ✅ | M1 (primary), M3 (secondary) |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/jae-review-2.md` — PASS, run 1's 1-H1 resolved before run 2, 0 HIGH/MEDIUM remaining |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `dodStatus` — dependencies `jcx-hotfix4` and `jcx-s7` both show `dodStatus: "complete"` — satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 5 bullets, citing ADR-026 explicitly, including the review-found `openPanel` reset fix |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC in this story is CSS-layout-dependent — AC2's focus check is a real DOM-focus assertion, not a visual/layout one |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-14-journey-authoring-experience/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — "Hamish King — Platform Owner — 2026-10-14" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No MEDIUM findings remain | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet reviewed; same established pattern as every other story this session | Hamish King (acknowledged, proceeding) |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps at all | — |

---

## Standards injection

**Domain tags:** `[web-ui, ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/ui/ui-standards.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

- **"Client-side DOM patch vs. full page reload after a POST action"** — AC4 directly re-verifies this story does not regress `jcx-s7`'s own closure of this exact standard.

### .github/standards/ui/ui-standards.md (matched domain: ui)

⚠️ Same status as every prior UI story this session: unpopulated template boilerplate.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Collapse stage creation into one guided action -- artefacts/2026-10-14-journey-authoring-experience/stories/jae-s2.md
Test plan: artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s2-test-plan.md
Contract: artefacts/2026-10-14-journey-authoring-experience/dor/jae-s2-dor-contract.md

Goal:
Make every test in the test plan pass (5 tests, all unit). Do not add
scope beyond what the tests and ACs specify.

Constraints:
- Add exactly one new call -- openPanel(resp.id) -- to the END of the
  existing stage-add success handler's .then() block, after its own
  existing DOM-patch logic. Do not restructure that handler otherwise.
- Inside openPanel itself, add the save-indicator reset (clear
  panelSaved.textContent, remove sw-stage-panel-saved--error, remove
  sw-stage-panel-saved--visible) as the FIRST thing the function does,
  before populating fields. This is review finding 1-H1's fix -- AC5's
  own test is the exact regression test for it; do not consider this
  story done until AC5 passes, not just AC1-AC4.
- Do not touch any of the panel's own 8 fields, their save mechanism,
  or any other part of the save-indicator's own state machine (Saving.../
  Saved/Failed-to-save text and classes) -- jcx-s7 already built that
  correctly; this story only adds the reset-on-open behaviour to it.
- Do NOT implement anything from the Out of Scope section (auto-open for
  template-seeded stages, forced field completion, any change to the
  Add-stage button's own visibility).
- Open a draft PR when all tests pass -- do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — tech lead awareness only.
**Signed off by:** Not required. Shared with Hamish King — Platform Owner — 2026-10-14.
