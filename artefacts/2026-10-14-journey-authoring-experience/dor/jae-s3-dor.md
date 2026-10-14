# Definition of Ready Checklist

## Definition of Ready: Extend the discovery-artefact-scan suggestion pattern to stage-level fields

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s3.md
**Test plan reference:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s3-test-plan.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-14

---

## Contract Proposal

See `artefacts/2026-10-14-journey-authoring-experience/dor/jae-s3-dor-contract.md` for the full proposal.

**Summary:** One new sibling function in the existing `persona-scanner.js` (`extractProblemStatement`), one new route-level function mirroring `getPersonaSuggestions` exactly, 2 new suggestion buttons reusing `jcx-s4`'s own existing markup/CSS pattern. No new table, no new route.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs and the test plan's own coverage table.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | Confirmed against `jae-s3-test-plan.md`'s own AC coverage table |
| H4 | Out-of-scope section populated | ✅ | 4 items, each with a stated reason |
| H5 | Benefit linkage references a named metric | ✅ | M2 |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/jae-review-2.md` — PASS, 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `dodStatus`. Dependency is `jae-s2` (same epic, same DoR batch) — the story's own Dependencies block explicitly states this is a sequencing preference per the chosen user-journey slicing, "no hard technical dependency." `jae-s2`'s own `dodStatus` is not yet `complete` (it is proceeding through DoR in this same session), but `extractProblemStatement`/`getFieldSuggestions` do not call anything `jae-s2` introduces — confirmed by re-reading `jae-s3`'s own Architecture Constraints, which touch only `persona-scanner.js` and the panel's own suggestion-button markup, neither modified by `jae-s2`. Recorded as satisfied on technical-independence grounds, not on `dodStatus` alone. |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 4 bullets, citing ADR-026 explicitly for every new function |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC in this story is CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-14-journey-authoring-experience/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — "Hamish King — Platform Owner — 2026-10-14" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter — `_personaScanner` is an existing, already-required module reference, not a new injectable setter |
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

- **"Mock-shape verification when reusing an adapter for a new purpose"** — directly applicable and already satisfied: `getFieldSuggestions`/`extractProblemStatement` reuse `getPersonaSuggestions`/`extractWhoItAffects` for the SAME purpose (discovery-artefact text extraction), not a different one — the known failure mode this rule warns about (reusing an adapter for a purpose its real response shape doesn't support) does not apply here, since the shape (raw text under a heading) is identical by construction.

### .github/standards/ui/ui-standards.md (matched domain: ui)

⚠️ Same status as every prior UI story this session: unpopulated template boilerplate.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Extend the discovery-artefact-scan suggestion pattern to stage-level fields -- artefacts/2026-10-14-journey-authoring-experience/stories/jae-s3.md
Test plan: artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s3-test-plan.md
Contract: artefacts/2026-10-14-journey-authoring-experience/dor/jae-s3-dor-contract.md

Goal:
Make every test in the test plan pass (5 tests: 4 unit, 2 integration --
one AC has both a unit and an integration test). Do not add scope beyond
what the tests and ACs specify.

Constraints:
- extractProblemStatement must mirror extractWhoItAffects EXACTLY --
  same regex shape (just targeting "## Problem Statement" instead of
  "## Who It Affects"), same null-if-absent behaviour, zero DB access.
- getFieldSuggestions must mirror getPersonaSuggestions EXACTLY -- same
  journeys-table/feature_slug query, same early-return-[] on no
  product_id.
- Suggestion buttons reuse sw-persona-suggestion-btn's own existing CSS
  class and click-delegation pattern -- do not add a second, parallel
  button style or a second click-delegation listener.
- A suggestion button must NEVER render for a field that already has a
  real, non-empty value -- this is AC4, test it explicitly, do not
  assume "it just won't because the operator wouldn't look for it."
- Do NOT implement anything from the Out of Scope section (LLM
  generation, suggestions for other fields, any change to jcx-s4's own
  persona-suggestion mechanism).
- Open a draft PR when all tests pass -- do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — tech lead awareness only.
**Signed off by:** Not required. Shared with Hamish King — Platform Owner — 2026-10-14.
