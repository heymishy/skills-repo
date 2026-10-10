# Definition of Ready Checklist

## Definition of Ready: Canvas pan and zoom

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s3.md
**Test plan reference:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s3-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

---

## Contract review

✅ **Contract review passed** — the proposed implementation (confirm/configure drawflow's own built-in pan/zoom, contain it within the canvas viewport) aligns with all 4 ACs and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | All 4 covered, 0 gaps |
| H4 | Out-of-scope section populated | ✅ | 2 items |
| H5 | Benefit linkage references a named metric | ✅ | M2 |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/ic-s3-review-2.md` — PASS, 0 HIGH/MEDIUM/LOW open |
| H8 | Test plan has no uncovered ACs | ✅ | Gap table: None |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `dorStatus` — dependency `ic-s1` shows `dorStatus: "signed-off"` — satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites `decisions.md` ADR-001 (disambiguated) |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | Gap table: None — all 4 ACs reclassified to unit-testable at `/test-plan` time (documented, not silent) |
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
| W5 | No UNCERTAIN items in gap table | ✅ | Gap table: None | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- No sections directly load-bearing for this story — it's pure client-side interaction configuration, no new route, no new persisted data, no adapter. Checked and confirmed none apply beyond the general injectable-adapter N/A already noted.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Canvas pan and zoom -- artefacts/2026-10-10-infinite-canvas/stories/ic-s3.md
Test plan: artefacts/2026-10-10-infinite-canvas/test-plans/ic-s3-test-plan.md

Goal:
Make every test in the test plan pass (4 unit tests). Do not add
scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Pure client-side change -- no new route, no new persisted data.
- Confirm drawflow's own default Ctrl+scroll zoom and drag-to-pan
  behaviour works once the editor is correctly initialized -- this is
  largely a configuration check, not new logic to write from scratch.
  Confirmed working in this feature's own spike
  (spikes/zero-build-canvas-library-outcome.md).
- CRITICAL -- ensure wheel/drag events over the canvas do not bubble
  to the page's own outer scroll container (AC4). Test this explicitly,
  not just assume drawflow handles it by default.
- Pan/zoom state must NOT be persisted anywhere -- no API call, no
  localStorage. Default view on every fresh page load (AC3).
- Keyboard-based pan/zoom is explicitly out of scope (RISK-ACCEPTed,
  decisions.md) -- do not build it even if it seems easy to add.
- Architecture standards: read .github/architecture-guardrails.md
  before implementing. No constraints beyond those already named.
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
