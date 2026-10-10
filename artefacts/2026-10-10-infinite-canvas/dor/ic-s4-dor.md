# Definition of Ready Checklist

## Definition of Ready: Keyboard-accessible node movement (WCAG 2.1 AA)

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s4.md
**Test plan reference:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s4-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

---

## Contract review

✅ **Contract review passed** — the proposed implementation (tabindex + focus style, arrow-key handler reusing `ic-s2`'s own route, Tab-order confirmation) aligns with all 6 ACs (AC1a/AC1b split during `/review`) and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner... who cannot or does not want to use a mouse" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs (AC1a/AC1b split from original AC1 during /review fix-up) |
| H3 | Every AC has ≥1 test | ✅ | All 6 covered, 0 gaps |
| H4 | Out-of-scope section populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | M1 |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/ic-s4-review-2.md` — PASS, 0 HIGH/MEDIUM/LOW open |
| H8 | Test plan has no uncovered ACs | ✅ | Gap table: 1 entry (AC1a style/AC2/AC3, combined E2E spec), not a HIGH-risk gap |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `dorStatus` — dependency `ic-s2` shows `dorStatus: "signed-off"` — satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites `decisions.md` ASSUMPTION entry (snap-to-grid model), `product/constraints.md` #9, and the new explicit tabindex/focus requirement added during /review |
| H-E2E | CSS-layout-dependent AC gate | ✅ | 3 ACs typed `DOM-behaviour`; E2E tooling (Playwright) IS configured and a real spec is named, matching `ep1-s3`'s own precedent — gate passes without needing a RISK-ACCEPT |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-10-infinite-canvas/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Platform Owner — 2026-10-10 |
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
| W3 | MEDIUM review findings acknowledged | ✅ | None remain (Run 2: 0 MEDIUM) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | RISK-ACCEPTed, see `decisions.md` | Hamish King |
| W5 | No UNCERTAIN items in gap table | ✅ | Gap table entry is a confirmed E2E test, not UNCERTAIN | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- No sections directly load-bearing beyond the already-noted injectable-adapter N/A. This story's own accessibility requirement (WCAG 2.1 AA) is covered by `product/constraints.md` #9 and this feature's own `/clarify` decision, both already cited in Architecture Constraints.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Keyboard-accessible node movement (WCAG 2.1 AA) -- artefacts/2026-10-10-infinite-canvas/stories/ic-s4.md
Test plan: artefacts/2026-10-10-infinite-canvas/test-plans/ic-s4-test-plan.md

Goal:
Make every test in the test plan pass (7 tests: 4 unit, 3 E2E). Do not
add scope, behaviour, or structure beyond what the tests and ACs
specify.

Constraints:
- CRITICAL -- drawflow's own node elements are plain divs, NOT
  natively keyboard-focusable. You must explicitly add tabindex="0"
  to each node and a visible :focus CSS style. Do not assume
  focusability "just happens" -- this exact gap was caught at /review
  time (ic-s4-review-1.md, finding 1-M1) specifically because it's
  easy to miss.
- Arrow-key movement must call the EXACT SAME position-update route
  ic-s2 already built -- same fields, same mechanism as a mouse drag.
  Do not build a second, parallel persistence path.
- Movement step is a single hardcoded value -- do not make it
  configurable.
- Write the E2E spec (tests/e2e/ic-s4-keyboard-node-movement.spec.js)
  following ep1-s3-stage-panel-focus-management.spec.js's own
  established structure and seeding helpers. It will SKIP locally
  without DATABASE_URL set -- expected, matches established precedent.
- Verify AC3 (full no-mouse walkthrough) literally without touching
  the mouse during that specific test -- this is the direct WCAG 2.1
  AA conformance check for this story's entire purpose.
- Architecture standards: read .github/architecture-guardrails.md
  before implementing. product/constraints.md #9 (WCAG 2.1 AA) applies
  directly.
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
**Signed off by:** Not required. Shared with Hamish King — Platform Owner (acting tech lead for this feature) — 2026-10-10.
