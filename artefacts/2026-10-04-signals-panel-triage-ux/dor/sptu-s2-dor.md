# Definition of Ready Checklist

## Definition of Ready: Type/source filter for the signals panel

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s2.md
**Test plan reference:** artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s2-test-plan.md
**Contract proposal:** artefacts/2026-10-04-signals-panel-triage-ux/dor/sptu-s2-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Solo operator (you, today)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | 6 ACs, 12 tests (post-correction), full coverage |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ | Metric 2 — Page-1 signal-to-noise ratio |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | review run 1: 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `ep2-s1`/`ep2-s3` as `[External: ...]`, confirmed merged and DoD-complete in a sibling feature — no `pipeline-state.schema.json` field dependency is declared or required (this is a cross-feature artefact dependency, not a schema-field dependency), so no `schemaDepends` declaration applies. |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with real integration-point and value-universe evidence; **corrected during this DoR run** (query-param mechanism); review Category E: no findings |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-04-signals-panel-triage-ux/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed present above |
| H-GOV | Discovery `## Approved By` non-blank, non-engineer-only | ✅ | "Hamish King — Operator / Product Owner — 2026-10-04" (read live) — Product Owner counts as non-engineering, positive M1 signal |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | `filter-signals.js` is a pure function, no I/O/model call — not an adapter under D37's own definition |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS.** One real contract mismatch was found and corrected during Step 2/3 (Contract Proposal/Review) — see Architecture Constraints note above and `decisions.md`'s 2026-10-04 correction entry — not a blocking finding once fixed.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No MEDIUM findings on this story | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists | RISK-ACCEPT logged in `decisions.md`, 2026-10-04 entry (covers `sptu-s1`–`sptu-s4`) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "None" | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- **Stack constraints:** No new npm dependency — `filter-signals.js` is pure arithmetic/string logic, no library needed. No Express — unaffected.
- **Session token access:** N/A — this story touches no session/auth code.
- **HTML render function unit test pattern:** Assert specific string fragments (filter-toggle link hrefs, the "no signals match" empty-state message) — not full-HTML snapshot equality. Applied directly in the test plan.
- **Client-side DOM patch vs. full reload:** N/A — filter toggles are plain navigational `<a>` links (a GET, not a POST), so there is no in-progress client state at risk; a full server-rendered response is the correct, existing pattern for this page (matches `ep2-s3`'s own Previous/Next precedent).
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read in full before implementing.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Type/source filter for the signals panel — artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s2.md
Test plan: artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s2-test-plan.md
Contract: artefacts/2026-10-04-signals-panel-triage-ux/dor/sptu-s2-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS, raw http.createServer — no Express, no new npm dependencies
- hideType/hideSource query values are SINGLE comma-separated strings, not
  repeated keys — req.query.hideType.split(',') is the correct read. Do NOT
  implement array-shaped query parsing; server.js's parseQuery does not support it.
- filterSignals() must run on the FULL signals array before paginateSignals() —
  never filter a page slice after pagination
- Do not modify server.js's shared parseQuery function
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
