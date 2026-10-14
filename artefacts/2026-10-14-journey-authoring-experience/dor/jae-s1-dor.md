# Definition of Ready Checklist

## Definition of Ready: Seed a new journey with a default starting-skeleton template

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s1.md
**Test plan reference:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-14

---

## Contract Proposal

See `artefacts/2026-10-14-journey-authoring-experience/dor/jae-s1-dor-contract.md` for the full proposal.

**Summary:** A new `seedDefaultStages` boolean on `POST /journeys`, defaulting true, loops the existing single-stage INSERT shape 5 times with a hardcoded name list; one new checkbox on the existing "+ New journey" modal. No schema change, no new route.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | Confirmed against `jae-s1-test-plan.md`'s own AC coverage table |
| H4 | Out-of-scope section populated | ✅ | 4 items, each with a stated reason |
| H5 | Benefit linkage references a named metric | ✅ | M2 (primary), M1 (secondary) |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/jae-review-2.md` — PASS, 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block states "None" — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 5 bullets, citing ADR-026 and ADR-025 explicitly |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC in this story is CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-14-journey-authoring-experience/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — "Hamish King — Platform Owner — 2026-10-14" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema change |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent — this repo has no `DESIGN.md`/token system |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No MEDIUM findings remain (run-1's 1-M1 resolved before run 2) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet reviewed; same established pattern as every other story this session | Hamish King (acknowledged, proceeding) |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps at all | — |

---

## Standards injection

**Domain tags:** `[web-ui, ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/ui/ui-standards.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

- **"Inventory every render site of a shared component before writing a DoR contract, repo-wide"** — confirmed: the "+ New journey" modal exists only in `journeys.js`; no other file renders it.

### .github/standards/ui/ui-standards.md (matched domain: ui)

⚠️ Same status as every prior UI story this session: unpopulated template boilerplate, not a real project-specific source. Its generic accessibility guidance is already reflected in AC1's native-checkbox requirement.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Seed a new journey with a default starting-skeleton template -- artefacts/2026-10-14-journey-authoring-experience/stories/jae-s1.md
Test plan: artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s1-test-plan.md
Contract: artefacts/2026-10-14-journey-authoring-experience/dor/jae-s1-dor-contract.md

Goal:
Make every test in the test plan pass (4 tests: 1 unit, 3 integration).
Do not add scope beyond what the tests and ACs specify.

Constraints:
- Add seedDefaultStages (boolean, default true when omitted -- read as
  req.body.seedDefaultStages !== false) to handlePostJourneys's existing
  POST /journeys body handling.
- The 5-name skeleton (Evaluate, Discover, Purchase, Onboard, Retain) is a
  hardcoded constant -- do not add a templates table or any selection UI.
- Reuse handlePostJourneyStage's own existing single-stage INSERT SQL
  verbatim (same columns, same tenant_id source) -- call it 5 times within
  handlePostJourneys's own existing transaction, do not invent a bulk-insert
  variant.
- Add the checkbox to the existing "+ New journey" modal markup only --
  do not create a new modal or a new route.
- Do NOT implement anything from the Out of Scope section (template
  library, pre-filling other fields, editable skeleton names, any change
  to handlePostJourneys's existing validation/response shape).
- Open a draft PR when all tests pass -- do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — tech lead awareness only.
**Signed off by:** Not required. Shared with Hamish King — Platform Owner — 2026-10-14.
