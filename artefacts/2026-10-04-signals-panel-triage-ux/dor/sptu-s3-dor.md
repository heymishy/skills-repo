# Definition of Ready Checklist

## Definition of Ready: Make the signals panel's existing sort order visible and explicit

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s3.md
**Test plan reference:** artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s3-test-plan.md
**Contract proposal:** artefacts/2026-10-04-signals-panel-triage-ux/dor/sptu-s3-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Solo operator (you, today)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1-3 have dedicated unit tests; AC4 is regression-verified (named explicitly, not silently skipped) |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | Metric 1 — Time-to-triage |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | review run 1: 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete; AC4's regression-only handling explicitly recorded, not a silent gap |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `ep2-s1`/`ep1-s1` as `[External: ...]`, cross-feature artefact dependency, no `pipeline-state.schema.json` field dependency applies |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with the real commit reference and measured data split; review Category E: no findings |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-04-signals-panel-triage-ux/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed present above |
| H-GOV | Discovery `## Approved By` non-blank, non-engineer-only | ✅ | "Hamish King — Operator / Product Owner — 2026-10-04" — positive M1 signal |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No MEDIUM findings on this story | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists | RISK-ACCEPT logged in `decisions.md`, 2026-10-04 entry (covers `sptu-s1`–`sptu-s4`) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table item is explained/mitigated, not "UNCERTAIN" | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- **Stack constraints:** No new npm dependency, no Express — N/A, this story is a presentation-only change.
- **HTML render function unit test pattern:** Assert specific string fragments (the sort-order label text, the "no date" marker) — not full-HTML snapshot equality. Applied directly in the test plan.
- **Session token access, Client-side DOM patch vs. reload:** N/A — no auth or POST-action logic in this story.
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read in full before implementing.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Make the signals panel's existing sort order visible and explicit — artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s3.md
Test plan: artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s3-test-plan.md
Contract: artefacts/2026-10-04-signals-panel-triage-ux/dor/sptu-s3-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS, raw http.createServer — no Express, no new npm dependencies
- Do NOT modify signals-aggregator.js's _sortSignals() or getSignals()'s own
  output order — this story is presentation-only
- Do NOT introduce a user-selectable sort order — out of scope
- Re-run ep2-s1's and ep2-s3's own existing test suites unmodified as part of
  this story's own verification (AC4) — do not write a duplicate new test for it
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, DoR PROCEED: Yes)
