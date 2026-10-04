# Definition of Ready Checklist

## Definition of Ready: Add `/signals` to the main navigation

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s1.md
**Test plan reference:** artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s1-test-plan.md
**Contract proposal:** artefacts/2026-10-04-signals-panel-triage-ux/dor/sptu-s1-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Solo operator (you, today)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4 ACs, 4 tests, 1:1 |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | Metric 1 — Time-to-triage |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | review run 1: 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block states "None" — no upstream story declared, schema check not required. (Note: review finding 1-L1 observed this is slightly inconsistent given AC2's real reliance on `ep2-s1`'s shipped wiring — non-blocking, logged for retrospective, does not change this literal check's PASS.) |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with real line numbers and precedent citations; review Category E: no findings |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent (confirmed at /test-plan Step 3a) |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-04-signals-panel-triage-ux/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply (nfr-profile.md Compliance section) |
| H-NFR3 | Data classification not blank | ✅ | Internal — non-public but low sensitivity |
| H-NFR-profile | NFR profile presence (story declares NFRs) | ✅ | Story NFRs populated; profile confirmed present above |
| H-GOV | Discovery `## Approved By` non-blank, non-engineer-only | ✅ | "Hamish King — Operator / Product Owner — 2026-10-04" (read live from discovery.md). Product Owner counts as non-engineering per H-GOV's own AC4 example list — record positive M1 signal. |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No adapter introduced by this story |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No MEDIUM findings on this story | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context; script may miss edge cases a second reviewer would catch | RISK-ACCEPT logged in `decisions.md`, 2026-10-04 entry (covers `sptu-s1`–`sptu-s4`) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "None" | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- **Shared shell module — canonical source for `renderShell()`/`escHtml()`:** "If a new nav entry or shell layout change is needed, modify `html-shell.js` — not individual route files." This story is exactly that case: the new entry belongs in `NAV_ITEMS` inside `html-shell.js`, never duplicated into `signals-panel.js` or any other route file.
- **Stack constraints:** No new npm dependency — N/A risk, this story is a static array edit. No Express — N/A, unaffected.
- **Session token access:** N/A — this story touches no session/auth code.
- **HTML render function unit test pattern:** Assert specific string fragments (`href="/signals"`, visible "Signals" text, `sw-nav-item--active` class) — not full-HTML snapshot equality. Applied directly in the test plan's unit tests above.
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read in full before implementing; the excerpt above covers only what's directly applicable to this story.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add /signals to the main navigation — artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s1.md
Test plan: artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s1-test-plan.md
Contract: artefacts/2026-10-04-signals-panel-triage-ux/dor/sptu-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS, raw http.createServer — no Express, no new npm dependencies
- Modify ONLY src/web-ui/utils/html-shell.js's NAV_ITEMS array — do not touch
  handleGetSignalsPanelHtml or any other route file
- Do not re-implement renderShell()/escHtml() anywhere — they already exist in html-shell.js
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
